from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from .service import ChatbotService


router = APIRouter(prefix="/chatbot", tags=["Sahayak"])


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=20)


@router.post("/chat")
def chat(request: ChatRequest):
    try:
        service = ChatbotService()
        result = service.chat(
            [message.model_dump() for message in request.messages]
        )
        return {
            "ok": True,
            **result,
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception:
        raise HTTPException(
            status_code=502,
            detail=(
                "Sahayak could not verify the requested information right now."
            ),
        )
