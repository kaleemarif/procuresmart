from __future__ import annotations

from typing import Any

from .adapter import GeminiAdapter
from .prompts import SYSTEM_PROMPT
from .tools import TOOL_DEFINITIONS, execute_tool


class ChatbotService:
    def __init__(self) -> None:
        self.adapter = GeminiAdapter()

    def chat(
        self,
        messages: list[dict[str, str]],
        farmer_context: dict[str, Any] | None = None,
    ) -> dict:
        return self.adapter.chat(
            messages=messages,
            system_instruction=SYSTEM_PROMPT,
            tools=TOOL_DEFINITIONS,
            execute_tool=execute_tool,
            farmer_context=farmer_context,
        )
