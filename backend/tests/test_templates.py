"""Tests for templates API."""

import pytest


@pytest.mark.asyncio
async def test_list_templates(client):
    res = await client.get("/api/templates")
    assert res.status_code == 200
    data = res.json()
    assert "categories" in data
    assert "templates" in data
    assert len(data["categories"]) > 0
    assert len(data["templates"]) == 10

    # Check template shape
    t = data["templates"][0]
    assert "id" in t
    assert "name" in t
    assert "category" in t


@pytest.mark.asyncio
async def test_list_templates_has_expected_ids(client):
    res = await client.get("/api/templates")
    data = res.json()
    ids = [t["id"] for t in data["templates"]]
    assert "nda" in ids
    assert "employment_agreement" in ids
    assert "residential_lease" in ids
    assert "privacy_policy" in ids


@pytest.mark.asyncio
async def test_get_template_nda(client):
    res = await client.get("/api/templates/nda")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "nda"
    assert data["name"] == "Non-Disclosure Agreement"
    assert "variables" in data
    assert "sections" in data
    assert len(data["variables"]) > 0
    assert len(data["sections"]) > 0


@pytest.mark.asyncio
async def test_get_template_employment(client):
    res = await client.get("/api/templates/employment_agreement")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "employment_agreement"
    assert len(data["variables"]) == 14


@pytest.mark.asyncio
async def test_get_template_not_found(client):
    res = await client.get("/api/templates/nonexistent")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_greeting_with_template_id(client):
    res = await client.get("/api/chat/greeting?template_id=nda")
    assert res.status_code == 200
    data = res.json()
    assert "Non-Disclosure Agreement" in data["message"]


@pytest.mark.asyncio
async def test_greeting_with_employment_template(client):
    res = await client.get("/api/chat/greeting?template_id=employment_agreement")
    assert res.status_code == 200
    data = res.json()
    assert "Employment Agreement" in data["message"]


@pytest.mark.asyncio
async def test_greeting_default_template(client):
    res = await client.get("/api/chat/greeting")
    assert res.status_code == 200
    data = res.json()
    assert "Non-Disclosure Agreement" in data["message"]
