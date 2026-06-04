from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import httpx
from app.config import settings

bearer = HTTPBearer()
_jwks_cache: dict | None = None


def _get_jwks_key() -> dict:
    global _jwks_cache
    if _jwks_cache is None:
        resp = httpx.get(f"{settings.supabase_url}/auth/v1/.well-known/jwks.json")
        resp.raise_for_status()
        _jwks_cache = resp.json()["keys"][0]
    return _jwks_cache


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> str:
    try:
        key = _get_jwks_key()
        payload = jwt.decode(
            credentials.credentials,
            key,
            algorithms=["ES256"],
            options={"verify_aud": False},
        )
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
