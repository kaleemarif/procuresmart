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
    version="0.7.0",
)


# -------------------------------------------------------------------
# CORS
# -------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Production / main Vercel deployment
        "https://procuresmart-kaleemarif7610-2693s-projects.vercel.app",

        # Existing production alias
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
# SUPABASE CONFIGURATION
# -------------------------------------------------------------------

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")


def supabase_headers():
    if not SUPABASE_KEY:
        return {}

    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }


def supabase_enabled():
    return bool(
        SUPABASE_URL
        and SUPABASE_KEY
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


def create_demo_state(centre):
    return {
        "status": "open",
        "active_counters": centre["active_counters"],
        "queue_length": centre["queue_length"],
        "capacity_used_pct": centre["capacity_used_pct"],
        "updated_at": datetime.now(
            timezone.utc
        ).isoformat(),
    }


def load_centre_states_from_supabase():
    """
    Load operator state from Supabase.

    The application uses external centre IDs such as C001, C002...
    while Supabase centre_state references procurement_centres by UUID.
    Therefore we first load procurement_centres and build:

        UUID -> C001

    Then we load centre_state and convert it into the structure
    expected by the recommendation engine.
    """

    # Start with demo defaults so the API remains usable even if
    # Supabase is temporarily unavailable.
    centre_states.clear()

    for centre in DEMO_CENTRES:
        centre_states[centre["centre_id"]] = create_demo_state(
            centre
        )

    if not supabase_enabled():
        print(
            "WARNING: SUPABASE_URL/SUPABASE_KEY not configured. "
            "Using in-memory demo centre state."
        )
        return

    try:
        centres_url = (
            f"{SUPABASE_URL}/rest/v1/"
            "procurement_centres"
        )

        centres_response = requests.get(
            centres_url,
            headers=supabase_headers(),
            params={
                "select": "id,external_centre_id",
            },
            timeout=15,
        )

        centres_response.raise_for_status()

        centre_rows = centres_response.json()

        uuid_to_external_id = {}

        for row in centre_rows:
            external_id = row.get(
                "external_centre_id"
            )

            centre_uuid = row.get("id")

            if external_id and centre_uuid:
                uuid_to_external_id[centre_uuid] = (
                    external_id
                )

        state_url = (
            f"{SUPABASE_URL}/rest/v1/"
            "centre_state"
        )

        state_response = requests.get(
            state_url,
            headers=supabase_headers(),
            params={
                "select": (
                    "id,"
                    "centre_id,"
                    "queue_length,"
                    "active_counters,"
                    "avg_processing_time,"
                    "capacity_used_pct,"
                    "centre_status,"
                    "last_updated_at"
                ),
            },
            timeout=15,
        )

        state_response.raise_for_status()

        state_rows = state_response.json()

        loaded_count = 0

        for row in state_rows:
            centre_uuid = row.get("centre_id")

            external_id = uuid_to_external_id.get(
                centre_uuid
            )

            if not external_id:
                continue

            if external_id not in centre_states:
                continue

            db_status = row.get(
                "centre_status",
                "Open",
            )

            status = str(
                db_status
            ).strip().lower()

            if status not in VALID_STATUSES:
                status = "open"

            current = centre_states[
                external_id
            ]

            current["status"] = status

            if row.get("active_counters") is not None:
                current["active_counters"] = int(
                    row["active_counters"]
                )

            if row.get("queue_length") is not None:
                current["queue_length"] = int(
                    row["queue_length"]
                )

            if row.get("capacity_used_pct") is not None:
                current["capacity_used_pct"] = float(
                    row["capacity_used_pct"]
                )

            if row.get("last_updated_at"):
                current["updated_at"] = (
                    row["last_updated_at"]
                )

            loaded_count += 1

        print(
            f"Loaded {loaded_count} centre states "
            "from Supabase."
        )

    except requests.RequestException as exc:
        print(
            "WARNING: Failed to load centre state "
            f"from Supabase: {exc}"
        )

    except (ValueError, TypeError) as exc:
        print(
            "WARNING: Invalid Supabase centre state "
            f"data: {exc}"
        )


def get_supabase_centre_uuid(
    external_centre_id: str,
):
    """
    Find the Supabase procurement_centres UUID
    corresponding to C001, C002, etc.
    """

    if not supabase_enabled():
        return None

    url = (
        f"{SUPABASE_URL}/rest/v1/"
        "procurement_centres"
    )

    try:
        response = requests.get(
            url,
            headers=supabase_headers(),
            params={
                "select": "id",
                "external_centre_id": (
                    f"eq.{external_centre_id}"
                ),
                "limit": "1",
            },
            timeout=15,
        )

        response.raise_for_status()

        rows = response.json()

        if not rows:
            return None

        return rows[0].get("id")

    except requests.RequestException as exc:
        print(
            "Failed to find Supabase centre UUID "
            f"for {external_centre_id}: {exc}"
        )

        return None


def persist_centre_state(
    centre_id: str,
    state: dict,
):
    """
    Persist the operator state to Supabase.

    Database centre_state uses:
        centre_id
        queue_length
        active_counters
        capacity_used_pct
        centre_status
        last_updated_at
    """

    if not supabase_enabled():
        return {
            "persisted": False,
            "reason": "supabase_not_configured",
        }

    centre_uuid = get_supabase_centre_uuid(
        centre_id
    )

    if not centre_uuid:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Supabase procurement centre "
                f"{centre_id} was not found"
            ),
        )

    url = (
        f"{SUPABASE_URL}/rest/v1/"
        "centre_state"
    )

    status_map = {
        "open": "Open",
        "paused": "Paused",
        "closed": "Closed",
    }

    payload = {
        "queue_length": state["queue_length"],
        "active_counters": state[
            "active_counters"
        ],
        "capacity_used_pct": state[
            "capacity_used_pct"
        ],
        "centre_status": status_map.get(
            state["status"],
            "Open",
        ),
        "last_updated_at": state[
            "updated_at"
        ],
    }

    try:
        response = requests.patch(
            url,
            headers={
                **supabase_headers(),
                "Prefer": "return=representation",
            },
            params={
                "centre_id": (
                    f"eq.{centre_uuid}"
                ),
            },
            json=payload,
            timeout=15,
        )

        response.raise_for_status()

        updated_rows = response.json()

        if not updated_rows:
            raise HTTPException(
                status_code=500,
                detail=(
                    f"Supabase centre_state row "
                    f"for {centre_id} was not found"
                ),
            )

        return {
            "persisted": True,
            "row": updated_rows[0],
        }

    except requests.HTTPError as exc:
        detail = (
            exc.response.text
            if exc.response is not None
            else str(exc)
        )

        raise HTTPException(
            status_code=502,
            detail=(
                "Failed to persist centre state "
                f"to Supabase: {detail}"
            ),
        )

    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                "Supabase request failed: "
                f"{str(exc)}"
            ),
        )


# -------------------------------------------------------------------
# LOAD INITIAL OPERATOR STATE
# -------------------------------------------------------------------

load_centre_states_from_supabase()


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
        "data_mode": (
            "supabase_persistent"
            if supabase_enabled()
            else "synthetic_prototype"
        ),
        "updated_at": datetime.now(
            timezone.utc
        ).isoformat(),
    }


@app.get("/operator/centre-state")
def get_centre_states():

    return {
        "centre_states": centre_states,
        "data_mode": (
            "supabase_persistent"
            if supabase_enabled()
            else "synthetic_prototype"
        ),
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

    status = request.status.strip().lower()

    if status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Status must be one of: "
                "open, paused, closed"
            ),
        )

    current_state = centre_states[
        centre_id
    ]

    current_state["status"] = status

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

    persistence = persist_centre_state(
        centre_id,
        current_state,
    )

    return {
        "message": (
            "Centre state updated successfully"
        ),
        "centre_id": centre_id,
        "state": current_state,
        "persistence": persistence,
    }


# -------------------------------------------------------------------
# GENERAL
# -------------------------------------------------------------------

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "procuresmart-api",
        "version": "0.7.0",
        "supabase_enabled": supabase_enabled(),
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
        "data_mode": (
            "supabase_persistent"
            if supabase_enabled()
            else "synthetic_prototype"
        ),
            }
