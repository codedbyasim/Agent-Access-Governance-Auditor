import time
import logging
from datahub.emitter.rest_emitter import DatahubRestEmitter
from datahub.metadata.schema_classes import TagPropertiesClass
from datahub.emitter.mcp import MetadataChangeProposalWrapper

logging.basicConfig(level=logging.INFO)

mcp_tag = MetadataChangeProposalWrapper(
    entityUrn="urn:li:tag:governance-risk",
    aspect=TagPropertiesClass(name="governance-risk", description="test")
)

print("--- Testing DatahubRestEmitter with timeout_sec=3.0, connect_timeout_sec=3.0, read_timeout_sec=3.0, retry_max_times=0 ---")
emitter = DatahubRestEmitter(
    gms_server="http://127.0.0.1:59999",
    timeout_sec=3.0,
    connect_timeout_sec=3.0,
    read_timeout_sec=3.0,
    retry_max_times=0
)

start = time.time()
try:
    emitter.emit(mcp_tag)
except Exception as e:
    print(f"Emit failed fast in {time.time() - start:.2f}s: {type(e).__name__} - {e}")
