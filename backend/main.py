import os
from datetime import datetime, timezone

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ml.predict import predict_waiting_time
from recommendation import DEMO_CENTRES, recommend_centres


app = FastAPI(
    title="ProcureSmart API",
    description="Backend API for the ProcureSmart farmer procurement guidance platform.",
    version="0.6.0",
)


# -------------------------------------------------------------------
# CORS
# -------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Production
        "https://procuresmart-rho.vercel.app",

        # ui-refinement branch preview
        "https://procuresmart-git-ui-refinement-kaleemarif7610-2693s-projects.vercel.app",

        # Local development
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------------------------
# REQUEST MODELS
# -------------------------------------------------------------------

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
    farmer_latitude: float | None = None
    farmer_longitude: float | None = None


class CentreStateUpdateRequest(BaseModel):
    status: str = Field(default="open")
    active_counters: int = Field(default=1, ge=0, le=20)
    queue_length: int | None = Field(default=None, ge=0)
    capacity_used_pct: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )


# -------------------------------------------------------------------
# CEDA API KEY
# -------------------------------------------------------------------

def get_ceda_api_key():
    api_key = os.getenv("CEDA_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="CEDA_API_KEY is not configured",
        )

    return api_key


# -------------------------------------------------------------------
# OPERATOR STATE
# -------------------------------------------------------------------

VALID_STATUSES = {
    "open",
    "paused",
    "closed",
}

centre_states = {}


for centre in DEMO_CENTRES:
    centre_states[centre["centre_id"]] = {
        "status": "open",
        "active_counters": centre["active_counters"],
        "queue_length": centre["queue_length"],
        "capacity_used_pct": centre["capacity_used_pct"],
        "updated_at": datetime.now(
            timezone.utc
        ).isoformat(),
    }


def get_centre_with_live_state(centre):
    state = centre_states.get(
        centre["centre_id"],
        {},
    )

    return {
        **centre,

        "status": state.get(
            "status",
            "open",
        ),

        "active_counters": state.get(
            "active_counters",
            centre["active_counters"],
        ),

        "queue_length": state.get(
            "queue_length",
            centre["queue_length"],
        ),

        "capacity_used_pct": state.get(
            "capacity_used_pct",
            centre["capacity_used_pct"],
        ),

        "updated_at": state.get(
            "updated_at"
        ),
    }


@app.get("/operator/centres")
def get_operator_centres():

    centres = [
        get_centre_with_live_state(centre)
        for centre in DEMO_CENTRES
    ]

    return {
        "centres": centres,
        "data_mode": "synthetic_prototype",
        "updated_at": datetime.now(
            timezone.utc
        ).isoformat(),
    }


@app.get("/operator/centre-state")
def get_centre_states():

    return {
        "centre_states": centre_states,
        "data_mode": "synthetic_prototype",
        "updated_at": datetime.now(
            timezone.utc
        ).isoformat(),
    }


@app.post("/operator/centre-state/{centre_id}")
def update_centre_state(
    centre_id: str,
    request: CentreStateUpdateRequest,
):

    centre_id = centre_id.upper()

    if centre_id not in centre_states:
        raise HTTPException(
            status_code=404,
            detail=f"Centre {centre_id} not found",
        )

    if request.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Status must be one of: "
                "open, paused, closed"
            ),
        )

    current_state = centre_states[centre_id]

    current_state["status"] = request.status

    current_state["active_counters"] = (
        request.active_counters
    )

    if request.queue_length is not None:
        current_state["queue_length"] = (
            request.queue_length
        )

    if request.capacity_used_pct is not None:
        current_state["capacity_used_pct"] = (
            request.capacity_used_pct
        )

    current_state["updated_at"] = datetime.now(
        timezone.utc
    ).isoformat()

    return {
        "message": "Centre state updated successfully",
        "centre_id": centre_id,
        "state": current_state,
    }


# -------------------------------------------------------------------
# GENERAL
# -------------------------------------------------------------------

@app.get("/health")
def health_check():
    return {
        "status": "ok"
    }


# -------------------------------------------------------------------
# CEDA
# -------------------------------------------------------------------

@app.get("/ceda/commodities")
def ceda_commodities():

    api_key = get_ceda_api_key()

    url = (
        "https://api.ceda.ashoka.edu.in/"
        "v1/agmarknet/commodities"
    )

    try:

        response = requests.get(
            url,
            headers={
                "Authorization": f"Bearer {api_key}"
            },
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

    except (
        requests.RequestException,
        ValueError,
    ) as exc:

        raise HTTPException(
            status_code=502,
            detail=f"CEDA request failed: {str(exc)}",
        )


@app.get("/ceda/geographies")
def ceda_geographies():

    api_key = get_ceda_api_key()

    url = (
        "https://api.ceda.ashoka.edu.in/"
        "v1/agmarknet/geographies"
    )

    try:

        response = requests.get(
            url,
            headers={
                "Authorization": f"Bearer {api_key}"
            },
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

    except (
        requests.RequestException,
        ValueError,
    ) as exc:

        raise HTTPException(
            status_code=502,
            detail=f"CEDA request failed: {str(exc)}",
        )


@app.post("/ceda/markets")
def ceda_markets(payload: dict):

    api_key = get_ceda_api_key()

    url = (
        "https://api.ceda.ashoka.edu.in/"
        "v1/agmarknet/markets"
    )

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

    except (
        requests.RequestException,
        ValueError,
    ) as exc:

        raise HTTPException(
            status_code=502,
            detail=f"CEDA request failed: {str(exc)}",
        )


@app.post("/ceda/quantities")
def ceda_quantities(
    payload: CEDAQuantitiesRequest,
):

    api_key = get_ceda_api_key()

    url = (
        "https://api.ceda.ashoka.edu.in/"
        "v1/agmarknet/quantities"
    )

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
            status_code=502,
            detail=detail,
        )

    except (
        requests.RequestException,
        ValueError,
    ) as exc:

        raise HTTPException(
            status_code=502,
            detail=f"CEDA request failed: {str(exc)}",
        )


# -------------------------------------------------------------------
# ML
# -------------------------------------------------------------------

@app.post("/ml/predict-waiting-time")
def predict_waiting_time_api(
    request: WaitingTimeRequest,
):

    prediction = predict_waiting_time(
        request.model_dump()
    )

    return {
        "predicted_waiting_time_minutes": prediction
    }


# -------------------------------------------------------------------
# RECOMMENDATION
# -------------------------------------------------------------------

@app.post("/recommend")
def recommendation_api(
    request: RecommendationRequest,
):

    if request.quantity_quintals <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than zero",
        )

    if (
        (request.farmer_latitude is None)
        != (request.farmer_longitude is None)
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Both farmer latitude and "
                "farmer longitude are required together"
            ),
        )

    recommendations = recommend_centres(
        crop=request.crop,
        quantity_quintals=request.quantity_quintals,
        hour=request.hour,
        day_of_week=request.day_of_week,
        weather=request.weather,
        farmer_latitude=request.farmer_latitude,
        farmer_longitude=request.farmer_longitude,
        centre_states=centre_states,
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
