"""Base agent class with Bedrock integration and fallback."""
import json
import os
import boto3
from app.db.pool import get_db

BEDROCK_MODEL = os.getenv("BEDROCK_SONNET_MODEL", "us.anthropic.claude-3-5-sonnet-20241022-v2:0")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")


def call_bedrock(prompt: str, max_tokens: int = 2000) -> str:
    """Call Bedrock Claude and return the response text. Returns None on failure."""
    try:
        client = boto3.client("bedrock-runtime", region_name=AWS_REGION)
        response = client.invoke_model(
            modelId=BEDROCK_MODEL,
            contentType="application/json",
            accept="application/json",
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": max_tokens,
                "messages": [{"role": "user", "content": prompt}]
            })
        )
        result = json.loads(response["body"].read())
        return result["content"][0]["text"]
    except Exception as e:
        print(f"[Bedrock] Error: {e}")
        return None


def store_stage_output(claim_id: str, stage_number: int, stage_name: str, agent_name: str,
                       input_data: dict, output_data: dict, outcome: str, confidence: str, reasoning: str,
                       prompt_text: str = None):
    """Store a stage output in the agent_stage_outputs table."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO agent_stage_outputs (claim_id, stage_number, stage_name, agent_name, input_data, prompt_text, output_data, outcome, confidence, reasoning)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (claim_id, stage_number) DO UPDATE SET
            input_data = %s, prompt_text = %s, output_data = %s, outcome = %s, confidence = %s, reasoning = %s, executed_at = NOW()
    """, (claim_id, stage_number, stage_name, agent_name, json.dumps(input_data), prompt_text, json.dumps(output_data), outcome, confidence, reasoning,
          json.dumps(input_data), prompt_text, json.dumps(output_data), outcome, confidence, reasoning))
    conn.commit()
    cur.close()
    conn.close()


def parse_bedrock_json(text: str) -> dict:
    """Try to parse JSON from Bedrock response, handling markdown code blocks."""
    if not text:
        return None
    # Strip markdown code fences if present
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None
