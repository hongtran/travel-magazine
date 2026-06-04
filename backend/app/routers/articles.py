from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user_id
from app.db import get_supabase
from app.models.article import ArticleUpdate

router = APIRouter(prefix="/articles", tags=["articles"])
PAGE_SIZE = 20

@router.get("")
def list_articles(page: int = 0, user_id: str = Depends(get_current_user_id)):
    sb = get_supabase()
    data = (
        sb.table("articles")
        .select("id,title,status,created_at,updated_at,regeneration_count")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        .execute()
    )
    return {"articles": data.data, "page": page}

@router.get("/{article_id}")
def get_article(article_id: str, user_id: str = Depends(get_current_user_id)):
    sb = get_supabase()
    data = (
        sb.table("articles").select("*")
        .eq("id", article_id).eq("user_id", user_id)
        .single().execute()
    )
    if not data.data:
        raise HTTPException(status_code=404, detail="Article not found")
    return data.data

@router.patch("/{article_id}")
def update_article(article_id: str, body: ArticleUpdate, user_id: str = Depends(get_current_user_id)):
    sb = get_supabase()
    exists = (
        sb.table("articles").select("id")
        .eq("id", article_id).eq("user_id", user_id)
        .single().execute()
    )
    if not exists.data:
        raise HTTPException(status_code=404, detail="Article not found")
    updates = body.model_dump(exclude_none=True)
    data = sb.table("articles").update(updates).eq("id", article_id).execute()
    return data.data[0]

@router.delete("/{article_id}", status_code=204)
def delete_article(article_id: str, user_id: str = Depends(get_current_user_id)):
    sb = get_supabase()
    exists = (
        sb.table("articles").select("id")
        .eq("id", article_id).eq("user_id", user_id)
        .single().execute()
    )
    if not exists.data:
        raise HTTPException(status_code=404, detail="Article not found")
    sb.table("articles").delete().eq("id", article_id).execute()
