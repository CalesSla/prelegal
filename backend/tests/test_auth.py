"""Tests for authentication endpoints."""

import pytest


@pytest.mark.asyncio
async def test_signup(client):
    resp = await client.post("/api/auth/signup", json={"email": "a@b.com", "password": "pass123"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "a@b.com"
    assert "id" in data
    assert "access_token" in resp.cookies


@pytest.mark.asyncio
async def test_signup_duplicate(client):
    await client.post("/api/auth/signup", json={"email": "a@b.com", "password": "pass123"})
    resp = await client.post("/api/auth/signup", json={"email": "a@b.com", "password": "pass456"})
    assert resp.status_code == 400
    assert "already registered" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_signin(client):
    await client.post("/api/auth/signup", json={"email": "a@b.com", "password": "pass123"})
    resp = await client.post("/api/auth/signin", json={"email": "a@b.com", "password": "pass123"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "a@b.com"
    assert "access_token" in resp.cookies


@pytest.mark.asyncio
async def test_signin_wrong_password(client):
    await client.post("/api/auth/signup", json={"email": "a@b.com", "password": "pass123"})
    resp = await client.post("/api/auth/signin", json={"email": "a@b.com", "password": "wrong"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me(client):
    resp = await client.post("/api/auth/signup", json={"email": "a@b.com", "password": "pass123"})
    cookies = resp.cookies
    client.cookies.set("access_token", cookies["access_token"])
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 200
    assert resp.json()["email"] == "a@b.com"


@pytest.mark.asyncio
async def test_me_unauthenticated(client):
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_signout(client):
    resp = await client.post("/api/auth/signup", json={"email": "a@b.com", "password": "pass123"})
    client.cookies.set("access_token", resp.cookies["access_token"])
    resp = await client.post("/api/auth/signout")
    assert resp.status_code == 200
    assert resp.json()["message"] == "Signed out"
    # Verify subsequent /me call is unauthorized
    client.cookies.clear()
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 401
