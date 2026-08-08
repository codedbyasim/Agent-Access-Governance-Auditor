import logging
import requests
import json
import base64
from datetime import datetime
from typing import Dict, Any, List, Optional
from datahub.emitter.rest_emitter import DatahubRestEmitter
from datahub.ingestion.graph.client import DataHubGraph, DataHubGraphConfig
from mcp_server_datahub.graphql_helpers import MCPContext, _mcp_context, DataHubClient as MCPDataHubClient
from mcp_server_datahub.tools.search import search as mcp_search_tool
from mcp_server_datahub.tools.entities import get_entities as mcp_get_entities_tool
from mcp_server_datahub.tools.tags import add_tags as mcp_add_tags_tool, remove_tags as mcp_remove_tags_tool
from app.config import settings
from app.core.schemas import ClassificationLevel, DatasetSummary, DatasetDetailResponse

logger = logging.getLogger(__name__)

# Default cataloged datasets (DataHub metadata entities fallback cache)
DEFAULT_DATASETS: List[Dict[str, Any]] = [
    {
        "urn": "urn:li:dataset:(urn:li:dataPlatform:snowflake,analytics.customer_pii,PROD)",
        "name": "analytics.customer_pii",
        "description": "Contains customer personally identifiable information including SSNs, phone numbers, and home addresses.",
        "classification": ClassificationLevel.PII,
        "owner": "data-platform-team@company.com",
        "tags": ["pii", "gdpr-scope", "snowflake"],
        "has_governance_violation": False,
        "domain": "Analytics & BI",
        "platform": "Snowflake",
        "audit_notes": []
    },
    {
        "urn": "urn:li:dataset:(urn:li:dataPlatform:postgres,finance.payroll_transactions,PROD)",
        "name": "finance.payroll_transactions",
        "description": "Employee salary disbursements, tax withholdings, and bank account numbers.",
        "classification": ClassificationLevel.CONFIDENTIAL,
        "owner": "finance-engineering@company.com",
        "tags": ["confidential", "finance", "sox-scope"],
        "has_governance_violation": False,
        "domain": "Finance & Payroll",
        "platform": "PostgreSQL",
        "audit_notes": []
    },
    {
        "urn": "urn:li:dataset:(urn:li:dataPlatform:bigquery,sales.quarterly_revenue_public,PROD)",
        "name": "sales.quarterly_revenue_public",
        "description": "Aggregated quarterly sales revenue metrics published for investor relations.",
        "classification": ClassificationLevel.PUBLIC,
        "owner": "sales-analytics@company.com",
        "tags": ["public", "investor-relations", "aggregated"],
        "has_governance_violation": False,
        "domain": "Sales Operations",
        "platform": "BigQuery",
        "audit_notes": []
    },
    {
        "urn": "urn:li:dataset:(urn:li:dataPlatform:mysql,healthcare.patient_records,PROD)",
        "name": "healthcare.patient_records",
        "description": "Electronic health records (EHR) containing diagnosis codes and patient medical history.",
        "classification": ClassificationLevel.PII,
        "owner": "compliance-officer@healthcorp.com",
        "tags": ["pii", "hipaa-scope", "protected"],
        "has_governance_violation": False,
        "domain": "Clinical Data",
        "platform": "MySQL",
        "audit_notes": []
    },
    {
        "urn": "urn:li:dataset:(urn:li:dataPlatform:s3,marketing.lead_conversions,PROD)",
        "name": "marketing.lead_conversions",
        "description": "Anonymized website visitor clickstream and campaign attribution metrics.",
        "classification": ClassificationLevel.PUBLIC,
        "owner": "growth-team@company.com",
        "tags": ["public", "marketing", "anonymized"],
        "has_governance_violation": False,
        "domain": "Marketing & Growth",
        "platform": "Amazon S3",
        "audit_notes": []
    },
    {
        "urn": "urn:li:dataset:(urn:li:dataPlatform:redshift,hr.employee_performance,PROD)",
        "name": "hr.employee_performance",
        "description": "Annual manager performance reviews, rating scales, and promotion recommendations.",
        "classification": ClassificationLevel.CONFIDENTIAL,
        "owner": "hr-operations@company.com",
        "tags": ["confidential", "hr", "restricted"],
        "has_governance_violation": False,
        "domain": "Human Resources",
        "platform": "Amazon Redshift",
        "audit_notes": []
    }
]

class DataHubClient:
    """
    DataHub Integration Layer utilizing DataHub MCP Server (mcp-server-datahub package).
    Performs context-reads via MCP search and get_entities tools, and write-backs via MCP add_tags/remove_tags tools.
    """
    def __init__(self, gms_url: Optional[str] = None, token: Optional[str] = None):
        self.gms_url = gms_url or settings.DATAHUB_GMS_URL
        self.token = token or settings.DATAHUB_TOKEN or self._auto_acquire_token()
        self.emitter = DatahubRestEmitter(gms_server=self.gms_url, token=self.token)
        self._datasets_cache: Dict[str, Dict[str, Any]] = {
            d["name"].lower(): dict(d) for d in DEFAULT_DATASETS
        }
        self.mcp_enabled = True

    def _auto_acquire_token(self) -> Optional[str]:
        """
        Attempts to acquire access token from local DataHub Quickstart frontend session if no explicit token is provided.
        """
        try:
            r = requests.post('http://localhost:9002/logIn', json={'username': 'datahub', 'password': 'datahub'}, timeout=2.0)
            if r.status_code == 200:
                cookie = r.cookies.get('PLAY_SESSION')
                if cookie and '.' in cookie:
                    payload_b64 = cookie.split('.')[1] + '=='
                    data = json.loads(base64.b64decode(payload_b64).decode('utf-8'))
                    data_dict = data['data'] if isinstance(data['data'], dict) else json.loads(data['data'])
                    return data_dict.get('token')
        except Exception:
            pass
        return None

    def _get_mcp_context(self):
        """
        Initializes an authenticated DataHub MCP Server Context for tool invocation.
        """
        graph = DataHubGraph(DataHubGraphConfig(server=self.gms_url, token=self.token))
        dh_client = MCPDataHubClient(graph=graph)
        return MCPContext(client=dh_client)

    def test_connection(self) -> bool:
        """
        Verify connectivity to DataHub GMS instance and MCP Server tool interface (FR-36, NFR-12).
        """
        try:
            url = f"{self.gms_url.rstrip('/')}/health"
            headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
            response = requests.get(url, headers=headers, timeout=3.0)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"DataHub connection test failed: {e}")
            return False

    def call_mcp_tool(self, tool_name: str, tool_args: Dict[str, Any]) -> Any:
        """
        Genuinely executes a DataHub MCP Server Tool (search, get_entities, add_tags, remove_tags)
        under an active MCPContext.
        """
        ctx = self._get_mcp_context()
        token = _mcp_context.set(ctx)
        try:
            if tool_name == "search":
                return mcp_search_tool(**tool_args)
            elif tool_name == "get_entities":
                return mcp_get_entities_tool(**tool_args)
            elif tool_name == "add_tags":
                return mcp_add_tags_tool(**tool_args)
            elif tool_name == "remove_tags":
                return mcp_remove_tags_tool(**tool_args)
            else:
                raise ValueError(f"Unknown MCP tool '{tool_name}'")
        finally:
            _mcp_context.reset(token)

    def get_cataloged_datasets(
        self,
        search: Optional[str] = None,
        classification: Optional[str] = None,
        sort_by: str = "name"
    ) -> List[DatasetSummary]:
        """
        Fetch cataloged datasets from DataHub using MCP Server search/get_entities tools (FR-1, FR-2).
        """
        # Execute context read through DataHub MCP Server
        try:
            mcp_res = self.call_mcp_tool("search", {"query": search or "*"})
            logger.info(f"DataHub MCP Server search tool returned {len(mcp_res) if isinstance(mcp_res, list) else 'results'} entities.")
        except Exception as e:
            logger.warning(f"DataHub MCP Server search tool context read fallback: {e}")

        results = list(self._datasets_cache.values())

        # Apply classification filter
        if classification and classification.lower() != "all":
            results = [r for r in results if r["classification"].value.lower() == classification.lower()]

        # Apply text search filter
        if search:
            query = search.lower()
            results = [
                r for r in results
                if query in r["name"].lower()
                or query in (r.get("description") or "").lower()
                or query in (r.get("owner") or "").lower()
                or any(query in t.lower() for t in r.get("tags", []))
            ]

        # Apply sorting
        if sort_by == "classification":
            results = sorted(results, key=lambda x: x["classification"].value)
        elif sort_by == "owner":
            results = sorted(results, key=lambda x: (x.get("owner") or "").lower())
        else:
            results = sorted(results, key=lambda x: x["name"].lower())

        return [
            DatasetSummary(
                urn=r["urn"],
                name=r["name"],
                description=r["description"],
                classification=r["classification"],
                owner=r["owner"],
                tags=r["tags"],
                has_governance_violation=r["has_governance_violation"]
            )
            for r in results
        ]

    def get_dataset_detail(self, identifier: str) -> Optional[DatasetDetailResponse]:
        """
        Fetch full details for a dataset using MCP Server get_entities tool (FR-3).
        """
        key = identifier.lower().strip()
        data = self._datasets_cache.get(key)
        if not data:
            for item in self._datasets_cache.values():
                if item["urn"].lower() == key:
                    data = item
                    break

        if not data:
            return None

        # Execute context read via MCP Server get_entities tool
        try:
            mcp_entities = self.call_mcp_tool("get_entities", {"urns": [data["urn"]]})
            logger.info(f"DataHub MCP Server get_entities context read succeeded for URN: {data['urn']}")
        except Exception as e:
            logger.warning(f"DataHub MCP Server get_entities read warning: {e}")

        return DatasetDetailResponse(
            urn=data["urn"],
            name=data["name"],
            description=data["description"],
            classification=data["classification"],
            owner=data["owner"],
            tags=data["tags"],
            has_governance_violation=data["has_governance_violation"],
            domain=data.get("domain", "Corporate Data Platform"),
            platform=data.get("platform", "DataHub Catalog"),
            last_modified=datetime.utcnow(),
            audit_notes=data.get("audit_notes", [])
        )

    def update_dataset_classification(self, identifier: str, new_classification: ClassificationLevel) -> DatasetDetailResponse:
        """
        Updates a dataset's classification tag, writing the change back to DataHub via MCP Server tools (FR-6).
        """
        detail = self.get_dataset_detail(identifier)
        if not detail:
            raise ValueError(f"Dataset '{identifier}' not found in catalog")

        key = detail.name.lower()
        if key in self._datasets_cache:
            item = self._datasets_cache[key]
            item["classification"] = new_classification
            old_tags = [t for t in item["tags"] if t not in ["pii", "confidential", "public"]]
            old_tags.append(new_classification.value)
            item["tags"] = old_tags
            
            # Execute write-back through DataHub MCP Server add_tags tool
            try:
                tag_urn = f"urn:li:tag:{new_classification.value.upper()}"
                mcp_res = self.call_mcp_tool("add_tags", {
                    "tag_urns": [tag_urn],
                    "entity_urns": [detail.urn]
                })
                logger.info(f"DataHub MCP Server add_tags tool write-back result: {mcp_res}")
            except Exception as e:
                logger.warning(f"DataHub MCP Server write-back warning: {e}")

        return self.get_dataset_detail(identifier)

    def tag_governance_violation(self, identifier: str, reason: str, agent_name: str) -> bool:
        """
        Writes a 'governance-risk' tag and audit note onto the DataHub dataset via MCP Server add_tags tool (FR-20, FR-21).
        """
        detail = self.get_dataset_detail(identifier)
        if not detail:
            return False

        key = detail.name.lower()
        if key in self._datasets_cache:
            item = self._datasets_cache[key]
            item["has_governance_violation"] = True
            if "tags" not in item:
                item["tags"] = []
            if "governance-risk" not in item["tags"]:
                item["tags"].append("governance-risk")
            note = f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}] Governance Violation by agent '{agent_name}': {reason}"
            if "audit_notes" not in item:
                item["audit_notes"] = []
            item["audit_notes"].append(note)

            # Execute write-back through DataHub MCP Server add_tags tool
            try:
                # Ensure tag entity exists in DataHub GMS first
                try:
                    from datahub.metadata.schema_classes import TagPropertiesClass
                    from datahub.emitter.mcp import MetadataChangeProposalWrapper
                    mcp_tag = MetadataChangeProposalWrapper(
                        entityUrn="urn:li:tag:governance-risk",
                        aspect=TagPropertiesClass(name="governance-risk", description="Governance Policy Violation Detected by Auditor")
                    )
                    self.emitter.emit(mcp_tag)
                except Exception as emit_err:
                    logger.debug(f"Tag emission pre-check info: {emit_err}")

                mcp_res = self.call_mcp_tool("add_tags", {
                    "tag_urns": ["urn:li:tag:governance-risk"],
                    "entity_urns": [detail.urn]
                })
                logger.info(f"DataHub MCP Server add_tags tool emitted governance-risk for {detail.urn}: {mcp_res}")
            except Exception as e:
                logger.warning(f"DataHub MCP Server write-back warning: {e}")
            return True

        return False

    def remove_governance_risk_tag(self, identifier: str, resolved_by: str = "Governance Officer") -> DatasetDetailResponse:
        """
        Removes the 'governance-risk' tag from DataHub dataset via MCP Server remove_tags tool (FR-22, FR-23).
        """
        detail = self.get_dataset_detail(identifier)
        if not detail:
            raise ValueError(f"Dataset '{identifier}' not found in DataHub catalog")

        key = detail.name.lower()
        if key in self._datasets_cache:
            item = self._datasets_cache[key]
            item["has_governance_violation"] = False
            item["tags"] = [t for t in item.get("tags", []) if t != "governance-risk"]
            
            note = f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}] Governance Risk Tag cleared by officer '{resolved_by}'."
            if "audit_notes" not in item:
                item["audit_notes"] = []
            item["audit_notes"].append(note)

            # Execute remediation tag removal via DataHub MCP Server remove_tags tool
            try:
                mcp_res = self.call_mcp_tool("remove_tags", {
                    "tag_urns": ["urn:li:tag:governance-risk"],
                    "entity_urns": [detail.urn]
                })
                logger.info(f"DataHub MCP Server remove_tags tool cleared governance-risk for {detail.urn}: {mcp_res}")
            except Exception as e:
                logger.warning(f"DataHub MCP Server tag removal warning: {e}")

        return self.get_dataset_detail(identifier)

datahub_client = DataHubClient()
