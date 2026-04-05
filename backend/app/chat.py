"""Chat endpoints with AI-powered document field extraction."""

from fastapi import APIRouter
from pydantic import BaseModel
from litellm import completion

from app.template_loader import load_template

router = APIRouter(prefix="/api/chat", tags=["chat"])

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}


class ChatMessageItem(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessageItem]
    current_fields: dict[str, str]
    template_id: str


class ChatResponse(BaseModel):
    reply: str
    extracted_fields: dict[str, str | None]


def _build_system_prompt(template: dict, current_fields: dict[str, str]) -> str:
    field_status_lines = []
    for var in template["variables"]:
        key = var["key"]
        label = var["label"]
        var_type = var["type"]
        type_hint = var_type
        if var_type == "select" and "options" in var:
            type_hint = f"select: {' or '.join(var['options'])}"
        elif var_type == "date":
            type_hint = "date (YYYY-MM-DD format)"

        value = current_fields.get(key, "")
        status = f'"{value}"' if value else "EMPTY"
        field_status_lines.append(f"  - {key} ({label}, {type_hint}): {status}")
    field_status = "\n".join(field_status_lines)

    template_name = template["name"]

    return f"""You are a friendly legal document assistant helping draft a {template_name}.

Your job:
1. Have a natural conversation to gather the information needed for the fields below.
2. Extract field values from the user's messages whenever they provide relevant information.
3. Proactively ask about unfilled fields, one or two at a time. Don't overwhelm the user.
4. Confirm values you extract so the user can correct if needed.

Current field status:
{field_status}

Rules for extracted_fields:
- Set a field value ONLY when the user clearly provides that information.
- For date fields, use YYYY-MM-DD format.
- For number fields, use just the number as a string.
- For select fields, use exactly one of the allowed options.
- Set fields to null if the user did not mention them in this message.
- Do not re-extract fields that already have values unless the user is correcting them.
- Only use the field keys listed above. Do not invent new keys.

When all fields are filled, let the user know their {template_name} is ready and they can download it as PDF.

If the user asks about a different type of document, let them know they can go back to the template selection page to choose a different document type."""


@router.get("/greeting")
async def greeting(template_id: str = "nda"):
    template = load_template(template_id)
    name = template["name"] if template else "legal document"
    return {
        "message": f"Hello! I'm your legal document assistant. "
        f"I'll help you draft a {name}. "
        f"Let's start -- what information do you have for this document?"
    }


@router.post("/message", response_model=ChatResponse)
async def message(body: ChatRequest):
    template = load_template(body.template_id)
    if not template:
        return ChatResponse(
            reply="I couldn't find that template. Please go back and select a valid document type.",
            extracted_fields={},
        )

    system_prompt = _build_system_prompt(template, body.current_fields)
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
