"""Document CRUD routes."""

import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User, Document
from app.auth import get_current_user

router = APIRouter(prefix="/api/documents", tags=["documents"])


class DocumentCreate(BaseModel):
    template_id: str
    title: str
    values: dict = {}


class DocumentUpdate(BaseModel):
    title: str | None = None
    values: dict | None = None


class DocumentResponse(BaseModel):
    id: int
    template_id: str
    title: str
    values: dict
    created_at: str
    updated_at: str


def _to_response(doc: Document) -> DocumentResponse:
    return DocumentResponse(
        id=doc.id,
        template_id=doc.template_id,
        title=doc.title,
        values=json.loads(doc.values),
        created_at=doc.created_at.isoformat(),
        updated_at=doc.updated_at.isoformat(),
    )


@router.get("", response_model=list[DocumentResponse])
async def list_documents(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(Document.user_id == user.id).order_by(Document.updated_at.desc())
    )
    return [_to_response(doc) for doc in result.scalars()]


@router.post("", response_model=DocumentResponse, status_code=201)
async def create_document(
    body: DocumentCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doc = Document(
        user_id=user.id,
        template_id=body.template_id,
        title=body.title,
        values=json.dumps(body.values),
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return _to_response(doc)


async def _get_owned_doc(document_id: int, user: User, db: AsyncSession) -> Document:
    doc = await db.get(Document, document_id)
    if not doc or doc.user_id != user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doc = await _get_owned_doc(document_id, user, db)
    return _to_response(doc)


@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: int,
    body: DocumentUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doc = await _get_owned_doc(document_id, user, db)
    if body.title is not None:
        doc.title = body.title
    if body.values is not None:
        doc.values = json.dumps(body.values)
    await db.commit()
    await db.refresh(doc)
    return _to_response(doc)


@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doc = await _get_owned_doc(document_id, user, db)
    await db.delete(doc)
    await db.commit()
    return {"message": "Document deleted"}
