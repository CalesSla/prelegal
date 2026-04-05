"""Tests for document CRUD endpoints."""

import pytest


async def signup_and_auth(client, email="a@b.com"):
    resp = await client.post("/api/auth/signup", json={"email": email, "password": "pass123"})
    client.cookies.set("access_token", resp.cookies["access_token"])


@pytest.mark.asyncio
async def test_create_document(client):
    await signup_and_auth(client)
    resp = await client.post("/api/documents", json={
        "template_id": "nda", "title": "My NDA", "values": {"party": "Acme"}
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["template_id"] == "nda"
    assert data["title"] == "My NDA"
    assert data["values"] == {"party": "Acme"}


@pytest.mark.asyncio
async def test_list_documents(client):
    await signup_and_auth(client)
    await client.post("/api/documents", json={"template_id": "nda", "title": "NDA 1", "values": {}})
    await client.post("/api/documents", json={"template_id": "lease", "title": "Lease 1", "values": {}})
    resp = await client.get("/api/documents")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_get_document(client):
    await signup_and_auth(client)
    create_resp = await client.post("/api/documents", json={"template_id": "nda", "title": "NDA", "values": {}})
    doc_id = create_resp.json()["id"]
    resp = await client.get(f"/api/documents/{doc_id}")
    assert resp.status_code == 200
    assert resp.json()["title"] == "NDA"


@pytest.mark.asyncio
async def test_update_document(client):
    await signup_and_auth(client)
    create_resp = await client.post("/api/documents", json={"template_id": "nda", "title": "NDA", "values": {}})
    doc_id = create_resp.json()["id"]
    resp = await client.put(f"/api/documents/{doc_id}", json={"title": "Updated"})
    assert resp.status_code == 200
    assert resp.json()["title"] == "Updated"


@pytest.mark.asyncio
async def test_delete_document(client):
    await signup_and_auth(client)
    create_resp = await client.post("/api/documents", json={"template_id": "nda", "title": "NDA", "values": {}})
    doc_id = create_resp.json()["id"]
    resp = await client.delete(f"/api/documents/{doc_id}")
    assert resp.status_code == 200
    resp = await client.get(f"/api/documents/{doc_id}")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_document_not_found(client):
    await signup_and_auth(client)
    resp = await client.get("/api/documents/999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_documents_require_auth(client):
    resp = await client.get("/api/documents")
    assert resp.status_code == 401
    resp = await client.post("/api/documents", json={"template_id": "nda", "title": "X", "values": {}})
    assert resp.status_code == 401
    resp = await client.put("/api/documents/1", json={"title": "X"})
    assert resp.status_code == 401
    resp = await client.delete("/api/documents/1")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_cross_user_access_denied(client):
    """User B cannot access User A's documents."""
    await signup_and_auth(client, "usera@test.com")
    create_resp = await client.post("/api/documents", json={"template_id": "nda", "title": "A's doc", "values": {}})
    doc_id = create_resp.json()["id"]
    # Switch to User B
    client.cookies.clear()
    await signup_and_auth(client, "userb@test.com")
    assert (await client.get(f"/api/documents/{doc_id}")).status_code == 404
    assert (await client.put(f"/api/documents/{doc_id}", json={"title": "Hacked"})).status_code == 404
    assert (await client.delete(f"/api/documents/{doc_id}")).status_code == 404
