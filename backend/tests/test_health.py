"""Tests for health and chat endpoints."""

import json
from unittest.mock import patch, MagicMock
import pytest


@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_chat_greeting(client):
    resp = await client.get("/api/chat/greeting")
    assert resp.status_code == 200
    assert "message" in resp.json()


def _mock_completion_response(reply: str, extracted_fields: dict):
    """Build a mock litellm completion response."""
    response_json = json.dumps({
        "reply": reply,
        "extracted_fields": extracted_fields,
    })
    choice = MagicMock()
    choice.message.content = response_json
    result = MagicMock()
    result.choices = [choice]
    return result


@pytest.mark.asyncio
async def test_chat_message(client):
    mock_response = _mock_completion_response(
        reply="Got it, Acme Corp. What is their address?",
        extracted_fields={"disclosing_party_name": "Acme Corp"},
    )
    with patch("app.chat.completion", return_value=mock_response):
        resp = await client.post("/api/chat/message", json={
            "messages": [{"role": "user", "content": "The disclosing party is Acme Corp"}],
            "current_fields": {
                "disclosing_party_name": "",
                "disclosing_party_address": "",
                "receiving_party_name": "",
                "receiving_party_address": "",
                "effective_date": "",
                "confidentiality_period_years": "2",
                "governing_law_state": "",
                "nda_type": "mutual",
            },
            "template_id": "nda",
        })
    assert resp.status_code == 200
    data = resp.json()
    assert data["reply"] == "Got it, Acme Corp. What is their address?"
    assert data["extracted_fields"]["disclosing_party_name"] == "Acme Corp"


@pytest.mark.asyncio
async def test_chat_message_no_extraction(client):
    mock_response = _mock_completion_response(
        reply="Sure, I can help with an NDA. Who are the parties?",
        extracted_fields={},
    )
    with patch("app.chat.completion", return_value=mock_response):
        resp = await client.post("/api/chat/message", json={
            "messages": [{"role": "user", "content": "I need an NDA"}],
            "current_fields": {},
            "template_id": "nda",
        })
    assert resp.status_code == 200
    assert resp.json()["extracted_fields"] == {}


@pytest.mark.asyncio
async def test_chat_message_invalid_body(client):
    resp = await client.post("/api/chat/message", json={"message": "hello"})
    assert resp.status_code == 422
