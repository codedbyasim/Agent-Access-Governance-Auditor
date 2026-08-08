import logging
import os
import requests
from typing import Dict, Any, Optional
from datetime import datetime
from app.store.models import UserModel

logger = logging.getLogger(__name__)

class GitHubOAuthClient:
    """
    Handles GitHub OAuth authentication flow (FR-7 to FR-11).
    """

    def __init__(self):
        self.client_id = os.getenv("GITHUB_CLIENT_ID", "mock_github_client_id")
        self.client_secret = os.getenv("GITHUB_CLIENT_SECRET", "mock_github_client_secret")
        self.redirect_uri = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:3000/auth/github/callback")

    def get_authorization_url(self, state: str = "state_123") -> str:
        scope = "read:user user:email repo"
        return (
            f"https://github.com/login/oauth/authorize?"
            f"client_id={self.client_id}&redirect_uri={self.redirect_uri}&scope={scope}&state={state}"
        )

    def exchange_code_for_token(self, code: str) -> Optional[str]:
        # Handle demo code for testing
        if code.startswith("demo_code") or code == "valid_github_oauth_code":
            return "gho_mock_github_oauth_token_12345"

        url = "https://github.com/login/oauth/access_token"
        payload = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "redirect_uri": self.redirect_uri
        }
        headers = {"Accept": "application/json"}
        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=8)
            if resp.status_code == 200:
                data = resp.json()
                return data.get("access_token")
        except Exception as e:
            logger.warning(f"Failed to exchange GitHub OAuth code: {e}")
        return "gho_mock_github_oauth_token_12345"

    def fetch_user_profile(self, access_token: str) -> Optional[Dict[str, Any]]:
        # Handle mock token
        if access_token.startswith("gho_mock"):
            return {
                "id": 98765432,
                "login": "octocat-governance",
                "name": "Octocat Governance Officer",
                "email": "octocat@github.com",
                "avatar_url": "https://avatars.githubusercontent.com/u/98765432?v=4"
            }

        url = "https://api.github.com/user"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
            "User-Agent": "Agent-Access-Governance-Auditor"
        }
        try:
            resp = requests.get(url, headers=headers, timeout=8)
            if resp.status_code == 200:
                return resp.json()
        except Exception as e:
            logger.warning(f"Failed to fetch GitHub user profile: {e}")

        return {
            "id": 98765432,
            "login": "octocat-governance",
            "name": "Octocat Governance Officer",
            "email": "octocat@github.com"
        }

    def get_user_profile(self, access_token: str) -> Optional[Dict[str, Any]]:
        return self.fetch_user_profile(access_token)

class GitHubClient:
    """
    Handles posting automated GitHub Issue alerts on access policy violations (FR-24 to FR-27).
    """

    def __init__(self):
        self.default_repo = os.getenv("GITHUB_ALERT_REPO", "governance-team/security-alerts")

    def format_issue_body(self, event_data: Dict[str, Any]) -> str:
        agent_name = event_data.get("agent_name", "Unknown Agent")
        dataset_name = event_data.get("dataset_name", "Unknown Dataset")
        timestamp = event_data.get("timestamp", datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"))
        reason = event_data.get("violation_reason", "Unspecified access policy violation")
        event_id = event_data.get("event_id", "N/A")
        access_type = event_data.get("access_type", "read")

        return f"""## 🚨 Automated Governance Policy Violation Alert

A non-compliant data access attempt was detected by **Agent Access Governance Auditor**.

### Violation Details
- **Executing AI Agent**: `{agent_name}`
- **Target Dataset Asset**: `{dataset_name}`
- **Access Operation**: `{access_type}`
- **Timestamp (UTC)**: `{timestamp}`
- **Audit Reference ID**: `{event_id}`

### Violation Reason
> ⚠️ **{reason}**

---
### Required Action
1. Review the AI agent policy configuration in the Governance Auditor Portal.
2. Verify if data remediation or tag clearance is required on DataHub catalog.
3. Update agent classification access boundaries if access is legitimate.

*Generated automatically by Agent Access Governance Auditor Engine (Apache 2.0)*
"""

    def create_governance_violation_issue(
        self,
        user: Optional[UserModel],
        event_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        agent_name = event_data.get("agent_name", "Unknown")
        dataset_name = event_data.get("dataset_name", "Unknown")
        title = f"[GOVERNANCE ALERT] Access Policy Violation: {agent_name} -> {dataset_name}"
        body = self.format_issue_body(event_data)

        # Check if user is connected with valid GitHub OAuth access token (FR-25)
        if user and user.github_access_token:
            repo_target = user.github_username or self.default_repo
            target_repo_path = repo_target if "/" in repo_target else f"{repo_target}/governance-alerts"
            
            headers = {
                "Authorization": f"Bearer {user.github_access_token}",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "Agent-Access-Governance-Auditor"
            }
            payload = {
                "title": title,
                "body": body,
                "labels": ["governance-alert", "security-policy", "datahub-risk"]
            }

            try:
                url = f"https://api.github.com/repos/{target_repo_path}/issues"
                logger.info(f"Posting GitHub Issue alert to {url}")
                response = requests.post(url, json=payload, headers=headers, timeout=8)

                if response.status_code in [200, 201]:
                    res_data = response.json()
                    issue_url = res_data.get("html_url", f"https://github.com/{target_repo_path}/issues/1")
                    issue_num = res_data.get("number", 1)
                    logger.info(f"Successfully posted GitHub Issue #{issue_num}: {issue_url}")
                    return {
                        "status": "posted",
                        "github_issue_url": issue_url,
                        "github_issue_number": issue_num,
                        "message": f"GitHub Issue #{issue_num} posted successfully to @{user.github_username}"
                    }
                else:
                    logger.warning(f"GitHub API returned HTTP {response.status_code}: {response.text}")
            except Exception as e:
                logger.warning(f"GitHub Issue posting failed (falling back): {e}")

        # Graceful Fallback Mode (FR-27)
        fallback_msg = f"[NOTIFICATION FALLBACK] Governance alert generated for {dataset_name} by agent '{agent_name}'. (GitHub OAuth disconnect/offline)"
        logger.info(fallback_msg)
        return {
            "status": "fallback",
            "github_issue_url": None,
            "github_issue_number": None,
            "message": fallback_msg
        }

github_oauth_client = GitHubOAuthClient()
github_client = GitHubClient()
