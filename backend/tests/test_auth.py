def test_missing_token_returns_401(client):
    resp = client.get("/me")
    assert resp.status_code == 401


def test_invalid_token_returns_401(client):
    resp = client.get("/me", headers={"Authorization": "Bearer bad-token"})
    assert resp.status_code == 401


def test_valid_token_returns_200(client, auth_headers):
    resp = client.get("/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["user_id"] == "user-123"
