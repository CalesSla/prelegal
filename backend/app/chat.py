"""Chat endpoints with AI-powered NDA field extraction."""

import json
from fastapi import APIRouter
from pydantic import BaseModel
from litellm import completion

router = APIRouter(prefix="/api/chat", tags=["chat"])

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

NDA_FIELDS = [
    ("disclosing_party_name", "Disclosing Party Name", "text"),
    ("disclosing_party_address", "Disclosing Party Address", "text"),
    ("receiving_party_name", "Receiving Party Name", "text"),
    ("receiving_party_address", "Receiving Party Address", "text"),
    ("effective_date", "Effective Date", "date (YYYY-MM-DD format)"),
    ("confidentiality_period_years", "Confidentiality Period in Years", "number"),
    ("governing_law_state", "Governing Law State/Jurisdiction", "text"),
    ("nda_type", "NDA Type", "select: mutual or one-way"),
]


class ChatMessageItem(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessageItem]
    current_fields: dict[str, str]


class ExtractedFields(BaseModel):
    disclosing_party_name: str | None = None
    disclosing_party_address: str | None = None
    receiving_party_name: str | None = None
    receiving_party_address: str | None = None
    effective_date: str | None = None
    confidentiality_period_years: str | None = None
    governing_law_state: str | None = None
    nda_type: str | None = None


class ChatResponse(BaseModel):
    reply: str
    extracted_fields: ExtractedFields


def _build_system_prompt(current_fields: dict[str, str]) -> str:
    field_status_lines = []
    for key, label, field_type in NDA_FIELDS:
        value = current_fields.get(key, "")
        status = f'"{value}"' if value else "EMPTY"
        field_status_lines.append(f"  - {key} ({label}, {field_type}): {status}")
    field_status = "\n".join(field_status_lines)

    return f"""You are a friendly legal document assistant helping draft a Non-Disclosure Agreement (NDA).

Your job:
1. Have a natural conversation to gather the information needed for the NDA fields below.
2. Extract field values from the user's messages whenever they provide relevant information.
3. Proactively ask about unfilled fields, one or two at a time. Don't overwhelm the user.
4. Confirm values you extract so the user can correct if needed.

Current field status:
{field_status}

Rules for extracted_fields:
- Set a field value ONLY when the user clearly provides that information.
- For effective_date, use YYYY-MM-DD format.
- For confidentiality_period_years, use just the number as a string.
- For nda_type, use exactly "mutual" or "one-way".
- Set fields to null if the user did not mention them in this message.
- Do not re-extract fields that already have values unless the user is correcting them.

When all fields are filled, let the user know their NDA is ready and they can download it as PDF."""


@router.get("/greeting")
async def greeting():
    return {
        "message": "Hello! I'm your legal document assistant. "
        "I'll help you draft a Non-Disclosure Agreement. "
        "Let's start -- who are the parties involved in this NDA?"
    }


@router.post("/message", response_model=ChatResponse)
async def message(body: ChatRequest):
    system_prompt = _build_system_prompt(body.current_fields)
    messages = [{"role": "system", "content": system_prompt}]
    for msg in body.messages:
        messages.append({"role": msg.role, "content": msg.content})

    response = completion(
        model=MODEL,
        messages=messages,
        response_format=ChatResponse,
        reasoning_effort="low",
        extra_body=EXTRA_BODY,
    )

    result = response.choices[0].message.content
    parsed = ChatResponse.model_validate_json(result)
    return parsed
