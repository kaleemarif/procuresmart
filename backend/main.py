import os

import requests
from fastapi import FastAPI, HTTPException

app = FastAPI(
    title="ProcureSmart API",
    description="Backend API for the ProcureSmart farmer procurement guidance platform.",
    version="0.2.0",
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/ceda/test")
def ceda_test():
    api_key = os.getenv("CEDA_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="CEDA_API_KEY is not configured",
        )

    url="https://api.ceda.ashoka.edu.in/v1/agmarknet/commodities"

    try:
        response = requests.get(
    url,
    headers={"Authorization": f"Bearer {api_key}"},
    timeout=20,
        )

        return {
    "status_code": response.status_code,
    "success": response.ok,
    "content_type": response.headers.get("content-type"),
    "response": response.text,
        }

    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=f"CEDA request failed: {str(exc)}",
        )
