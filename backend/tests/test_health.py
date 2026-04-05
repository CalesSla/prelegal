"""Tests for health and chat endpoints."""

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


@pytest.mark.asyncio
async def test_chat_message(client):
    resp = await client.post("/api/chat/message", json={"message": "hello"})
    assert resp.status_code == 200
    assert "message" in resp.json()
