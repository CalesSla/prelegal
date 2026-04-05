"""Template listing and retrieval endpoints."""

from fastapi import APIRouter, HTTPException

from app.template_loader import load_index, load_template

router = APIRouter(prefix="/api/templates", tags=["templates"])


@router.get("")
async def list_templates():
    index = load_index()
    categories = index["categories"]
    templates = [
        {"id": t["id"], "name": t["name"], "category": t["category"]}
        for t in index["templates"]
    ]
    return {"categories": categories, "templates": templates}


@router.get("/{template_id}")
async def get_template(template_id: str):
    template = load_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail=f"Template '{template_id}' not found")
    return template
