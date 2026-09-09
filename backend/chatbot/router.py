from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from .service import ChatbotService


router = APIRouter(
    prefix="/chatbot",
    tags=["Sahayak"],
)


class ChatMessage(BaseModel):
    role: str = Field(
        pattern="^(user|assistant)$"
    )
    content: str = Field(
        min_length=1,
        max_length=4000,
    )


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(
        min_length=1,
        max_length=20,
    )

    farmer_context: dict[str, Any] | None = None


@router.post("/chat")
def chat(request: ChatRequest):
    try:
        service = ChatbotService()

        result = service.chat(
            [
                message.model_dump()
                for message in request.messages
            ],
            farmer_context=request.farmer_context,
        )

        return {
            "ok": True,
            **result,
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception:
        raise HTTPException(
            status_code=502,
            detail=(
                "Sahayak could not verify the requested "
                "information right now."
            ),
        )
