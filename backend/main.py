import os

import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel


app = FastAPI(
    title="ProcureSmart API",
    description="Backend API for the ProcureSmart farmer procurement guidance platform.",
    version="0.4.0",
)


class CEDAQuantitiesRequest(BaseModel):
    commodity_id: int
    state_id: int
    district_id: list[int]
    market_id: list[int]
    from_date: str
    to_date: str


def get_ceda_api_key():
    api_key = os.getenv("CEDA_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="CEDA_API_KEY is not configured",
        )

    return api_key


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/ceda/commodities")
def ceda_commodities():
    api_key = get_ceda_api_key()

    url = "https://api.ceda.ashoka.edu.in/v1/agmarknet/commodities"

    try:
        response = requests.get(
            url,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=20,
        )
        response.raise_for_status()
        return response.json()

    except requests.HTTPError as exc:
        status_code = exc.response.status_code if exc.response is not None else 502
        detail = exc.response.text if exc.response is not None else str(exc)
        raise HTTPException(status_code=status_code, detail=detail)

    except (requests.RequestException, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"CEDA request failed: {str(exc)}",
        )


@app.get("/ceda/geographies")
def ceda_geographies():
    api_key = get_ceda_api_key()

    url = "https://api.ceda.ashoka.edu.in/v1/agmarknet/geographies"

    try:
        response = requests.get(
            url,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=20,
        )
        response.raise_for_status()
        return response.json()

    except requests.HTTPError as exc:
        status_code = exc.response.status_code if exc.response is not None else 502
        detail = exc.response.text if exc.response is not None else str(exc)
        raise HTTPException(status_code=status_code, detail=detail)

    except (requests.RequestException, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"CEDA request failed: {str(exc)}",
        )


@app.post("/ceda/markets")
def ceda_markets(payload: dict):
    api_key = get_ceda_api_key()

    url = "https://api.ceda.ashoka.edu.in/v1/agmarknet/markets"

    try:
        response = requests.post(
            url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=20,
        )
        response.raise_for_status()
        return response.json()

    except requests.HTTPError as exc:
        status_code = exc.response.status_code if exc.response is not None else 502
        detail = exc.response.text if exc.response is not None else str(exc)
        raise HTTPException(status_code=status_code, detail=detail)

    except (requests.RequestException, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"CEDA request failed: {str(exc)}",
        )


@app.post("/ceda/quantities")
def ceda_quantities(payload: CEDAQuantitiesRequest):
    api_key = get_ceda_api_key()

    url = "https://api.ceda.ashoka.edu.in/v1/agmarknet/quantities"

    try:
        response = requests.post(
            url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload.model_dump(),
            timeout=30,
        )
        response.raise_for_status()
        return response.json()

    except requests.HTTPError as exc:
        status_code = exc.response.status_code if exc.response is not None else 502
        detail = exc.response.text if exc.response is not None else str(exc)
        raise HTTPException(status_code=status_code, detail=detail)

    except (requests.RequestException, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"CEDA request failed: {str(exc)}",
        )
