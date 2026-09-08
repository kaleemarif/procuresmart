from __future__ import annotations

import json
import os
from typing import Any

import requests


class GeminiAdapter:
    """Provider adapter for Gemini Interactions API."""

    def __init__(self) -> None:
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model = os.getenv("GEMINI_MODEL", "gemini-3.7-flash")
        self.base_url = os.getenv(
            "GEMINI_BASE_URL",
            "https://generativelanguage.googleapis.com/v1beta/interactions",
        )

    def _headers(self) -> dict[str, str]:
        return {
            "x-goog-api-key": self.api_key or "",
            "Content-Type": "application/json",
        }

    def _post(self, payload: dict[str, Any]) -> dict[str, Any]:
        if not self.api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured on the backend.")

        response = requests.post(
            self.base_url,
            headers=self._headers(),
            json=payload,
            timeout=45,
        )
        if not response.ok:
            detail = response.text[:1000]
            raise RuntimeError(
                f"Gemini API request failed ({response.status_code}): {detail}"
            )
        return response.json()

    @staticmethod
    def _conversation_text(messages: list[dict[str, str]]) -> str:
        lines = []
        for message in messages[-20:]:
            role = message.get("role", "user").upper()
            content = str(message.get("content", "")).strip()
            if content:
                lines.append(f"{role}: {content}")
        return "\n".join(lines)

    @staticmethod
    def _extract_text(data: dict[str, Any]) -> str:
        output_text = data.get("output_text")
        if isinstance(output_text, str) and output_text.strip():
            return output_text.strip()

        texts: list[str] = []
        for step in data.get("steps", []):
            if step.get("type") != "model_output":
                continue
            for item in step.get("content", []):
                if item.get("type") == "text" and item.get("text"):
                    texts.append(str(item["text"]))
        return "\n".join(texts).strip()

    @staticmethod
    def _function_calls(data: dict[str, Any]) -> list[dict[str, Any]]:
        calls = []
        for step in data.get("steps", []):
            if step.get("type") != "function_call":
                continue
            arguments = step.get("arguments", {})
            if isinstance(arguments, str):
                try:
                    arguments = json.loads(arguments)
                except json.JSONDecodeError:
                    arguments = {}
            calls.append(
                {
                    "id": step.get("id"),
                    "name": step.get("name"),
                    "arguments": arguments or {},
                }
            )
        return calls

    def chat(
        self,
        messages: list[dict[str, str]],
        system_instruction: str,
        tools: list[dict[str, Any]],
        execute_tool,
    ) -> dict[str, Any]:
        if not messages:
            raise ValueError("At least one chat message is required.")

        payload = {
            "model": self.model,
            "store": False,
            "system_instruction": system_instruction,
            "input": self._conversation_text(messages),
            "tools": tools,
        }

        interaction = self._post(payload)
        tool_calls_total = 0

        for _ in range(4):
            calls = self._function_calls(interaction)
            if not calls:
                text = self._extract_text(interaction)
                if not text:
                    raise RuntimeError("Gemini returned no usable response.")
                return {
                    "message": text,
                    "model": self.model,
                    "tool_calls": tool_calls_total,
                }

            results = []
            for call in calls:
                tool_calls_total += 1
                if tool_calls_total > 6:
                    raise RuntimeError("Sahayak reached the tool-call safety limit.")

                try:
                    result = execute_tool(
                        call["name"],
                        call["arguments"],
                    )
                except Exception as exc:
                    result = {
                        "verified": False,
                        "error": (
                            "Backend tool failed. "
                            "Operational data could not be verified."
                        ),
                    }

                results.append(
                    {
                        "type": "function_result",
                        "name": call["name"],
                        "call_id": call["id"],
                        "result": [
                            {
                                "type": "text",
                                "text": json.dumps(
                                    result,
                                    ensure_ascii=False,
                                ),
                            }
                        ],
                    }
                )

            interaction = self._post(
                {
                    "model": self.model,
                    "store": False,
                    "previous_interaction_id": interaction.get("id"),
                    "input": results,
                    "tools": tools,
                }
            )

        raise RuntimeError("Sahayak could not complete the tool workflow safely.")
