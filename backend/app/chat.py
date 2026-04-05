"""Chat stub endpoints. AI integration to be added in a future ticket."""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatMessage(BaseModel):
    message: str


@router.get("/greeting")
async def greeting():
    return {
        "message": "Hello! I'm your legal document assistant. "
        "Tell me what kind of document you need and I'll help you draft it."
    }


@router.post("/message")
async def message(body: ChatMessage):
    return {
        "message": "AI chat is not yet available. "
        "This feature will be implemented in a future update."
    }
