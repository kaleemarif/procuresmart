import os

import requests
from fastapi import FastAPI, HTTPException

app = FastAPI(
    title="ProcureSmart API",
    description="Backend API for the ProcureSmart farmer procurement guidance platform.",
    version="0.3.0",
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/ceda/commodities")
def ceda_commodities():
    api_key = os.getenv("CEDA_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="CEDA_API_KEY is not configured",
        )

    url = "https://api.ceda.ashoka.edu.in/v1/agmarknet/commodities"

    try:
        response = requests.get(
            url,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=20,
        )
        response.raise_for_status()

        try:
            return response.json()
        except ValueError:
            raise HTTPException(
                status_code=502,
                detail="CEDA returned an invalid JSON response",
            )

    except requests.HTTPError as exc:
        status_code = exc.response.status_code if exc.response is not None else 502
        detail = exc.response.text if exc.response is not None else str(exc)
        raise HTTPException(status_code=status_code, detail=detail)

    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=f"CEDA request failed: {str(exc)}",
        )

@app.get("/ceda/geographies")
def ceda_geographies():
    api_key = os.getenv("CEDA_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="CEDA_API_KEY is not configured",
        )

    url = "https://api.ceda.ashoka.edu.in/v1/agmarknet/geographies"

    try:
        response = requests.get(
            url,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=20,
        )
        response.raise_for_status()

        try:
            return response.json()
        except ValueError:
            raise HTTPException(
                status_code=502,
                detail="CEDA returned an invalid JSON response",
            )

    except requests.HTTPError as exc:
        status_code = (
            exc.response.status_code
            if exc.response is not None
            else 502
        )
        detail = (
            exc.response.text
            if exc.response is not None
            else str(exc)
        )
        raise HTTPException(
            status_code=status_code,
            detail=detail,
        )

    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=f"CEDA request failed: {str(exc)}",
        )
