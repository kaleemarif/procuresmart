import os

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ml.predict import predict_waiting_time
from recommendation import recommend_centres


app = FastAPI(
    title="ProcureSmart API",
    description="Backend API for the ProcureSmart farmer procurement guidance platform.",
    version="0.5.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://procuresmart-rho.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CEDAQuantitiesRequest(BaseModel):
    commodity_id: int
    state_id: int
    district_id: list[int]
    market_id: list[int]
    from_date: str
    to_date: str


class WaitingTimeRequest(BaseModel):
    quantity_quintals: float
    queue_length: int
    active_counters: int
    avg_processing_time: float
    capacity_used_pct: float
    hour: int
    day_of_week: int
    centre_id: str
    crop: str
    weather: str


class RecommendationRequest(BaseModel):
    crop: str
    quantity_quintals: float
    hour: int = 11
    day_of_week: int = 2
    weather: str = "Clear"


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

    except (requests.RequestException, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"CEDA request failed: {str(exc)}",
        )


@app.post("/ml/predict-waiting-time")
def predict_waiting_time_api(request: WaitingTimeRequest):
    prediction = predict_waiting_time(request.model_dump())

    return {
        "predicted_waiting_time_minutes": prediction
    }


@app.post("/recommend")
def recommendation_api(request: RecommendationRequest):
    if request.quantity_quintals <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than zero",
        )

    recommendations = recommend_centres(
        crop=request.crop,
        quantity_quintals=request.quantity_quintals,
        hour=request.hour,
        day_of_week=request.day_of_week,
        weather=request.weather,
    )

    if not recommendations:
        raise HTTPException(
            status_code=404,
            detail="No procurement centres available",
        )

    return {
        "recommended_centre": recommendations[0],
        "alternatives": recommendations[1:],
        "weights": {
            "waiting_time": 0.45,
            "distance": 0.25,
            "queue": 0.20,
            "capacity": 0.10,
        },
        "data_mode": "synthetic_prototype",
    }
