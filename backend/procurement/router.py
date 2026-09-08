from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/procurement", tags=["Procurement Workflow"])

STATUSES = [
    "Booked",
    "Arrived",
    "Verification",
    "Weighing",
    "Procured",
    "Payment Initiated",
    "Payment Completed",
]

PAYMENT_BY_STATUS = {
    "Booked": "Not Initiated",
    "Arrived": "Not Initiated",
    "Verification": "Not Initiated",
    "Weighing": "Not Initiated",
    "Procured": "Not Initiated",
    "Payment Initiated": "Initiated",
    "Payment Completed": "Completed",
}

SLOT_TEMPLATES = [
    ("08:00", "10:00"),
    ("10:00", "12:00"),
    ("12:00", "14:00"),
    ("14:00", "16:00"),
]


def _main():
    import main
    return main


def _supabase_config():
    main = _main()
    return main.SUPABASE_URL, main.SUPABASE_KEY


def _headers(prefer: str | None = None) -> dict[str, str]:
    main = _main()
    headers = main.supabase_headers()
    if prefer:
        headers["Prefer"] = prefer
    return headers


def _require_supabase() -> str:
    url, key = _supabase_config()
    if not url or not key:
        raise HTTPException(
            status_code=503,
            detail="Persistent procurement storage is not configured.",
        )
    return url


def _rest_get(table: str, params: dict[str, str]) -> list[dict[str, Any]]:
    url = _require_supabase()
    response = requests.get(
        f"{url}/rest/v1/{table}",
        headers=_headers(),
        params=params,
        timeout=15,
    )
    response.raise_for_status()
    return response.json()


def _rest_post(table: str, payload: dict[str, Any]) -> list[dict[str, Any]]:
    url = _require_supabase()
    response = requests.post(
        f"{url}/rest/v1/{table}",
        headers=_headers("return=representation"),
        json=payload,
        timeout=15,
    )
    response.raise_for_status()
    return response.json()


def _rest_patch(table: str, filters: dict[str, str], payload: dict[str, Any]) -> list[dict[str, Any]]:
    url = _require_supabase()
    response = requests.patch(
        f"{url}/rest/v1/{table}",
        headers=_headers("return=representation"),
        params=filters,
        json=payload,
        timeout=15,
    )
    response.raise_for_status()
    return response.json()


def _create_notification(farmer_id: str, kind: str, title: str, message: str) -> None:
    try:
        _rest_post(
            "notifications",
            {
                "notification_id": f"N-{uuid4().hex[:10].upper()}",
                "farmer_id": farmer_id,
                "notification_type": kind,
                "title": title,
                "message": message,
            },
        )
    except Exception as exc:
        print(f"Notification persistence failed: {exc}")


def _centre(centre_id: str) -> dict[str, Any]:
    main = _main()
    centre_id = centre_id.upper()
    centre = next(
        (item for item in main.DEMO_CENTRES if item["centre_id"] == centre_id),
        None,
    )
    if not centre:
        raise HTTPException(status_code=404, detail=f"Centre {centre_id} not found")
    return centre


class FarmerRegistrationRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    mobile: str = Field(default="", max_length=20)
    village: str = Field(default="", max_length=100)
    state: str = Field(default="Madhya Pradesh", max_length=100)
    district: str = Field(default="Jabalpur", max_length=100)
    preferred_language: str = Field(default="Hindi", max_length=30)
    crop: str = Field(default="", max_length=50)
    latitude: float | None = None
    longitude: float | None = None


class BookingRequest(BaseModel):
    farmer_id: str = Field(min_length=1, max_length=100)
    centre_id: str = Field(min_length=1, max_length=20)
    crop: str = Field(min_length=1, max_length=50)
    quantity_quintals: float = Field(gt=0, le=10000)
    slot_date: date
    slot_start: str
    slot_end: str


class StatusUpdateRequest(BaseModel):
    status: str


@router.post("/register")
def register_farmer(request: FarmerRegistrationRequest):
    farmer_id = str(uuid4())
    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "id": farmer_id,
        "name": request.name.strip(),
        "mobile": request.mobile.strip(),
        "village": request.village.strip(),
        "state": request.state.strip(),
        "district": request.district.strip(),
        "preferred_language": request.preferred_language.strip(),
        "crop": request.crop.strip(),
        "latitude": request.latitude,
        "longitude": request.longitude,
        "updated_at": now,
    }
    try:
        rows = _rest_post("farmers", payload)
    except requests.HTTPError as exc:
        detail = exc.response.text[:800] if exc.response is not None else str(exc)
        raise HTTPException(status_code=502, detail=f"Farmer registration failed: {detail}")
    return {"ok": True, "farmer_id": farmer_id, "farmer_code": f"F-{farmer_id.split('-')[0].upper()}", "farmer": rows[0] if rows else payload}


@router.get("/slots")
def get_slots(centre_id: str, slot_date: date):
    centre = _centre(centre_id)
    main = _main()
    state = main.centre_states.get(centre["centre_id"], {})
    if state.get("status", "open") == "closed":
        return {"centre_id": centre["centre_id"], "date": slot_date, "slots": []}

    try:
        existing = _rest_get(
            "bookings",
            {
                "select": "slot_start,slot_end,booking_status",
                "centre_id": f"eq.{centre['centre_id']}",
                "slot_date": f"eq.{slot_date.isoformat()}",
            },
        )
    except requests.HTTPError as exc:
        detail = exc.response.text[:800] if exc.response is not None else str(exc)
        raise HTTPException(status_code=502, detail=f"Slot lookup failed: {detail}")

    slots = []
    base_capacity = max(4, int(state.get("active_counters", centre["active_counters"])) * 5)
    for start, end in SLOT_TEMPLATES:
        booked = sum(
            1
            for row in existing
            if row.get("slot_start") == f"{start}:00"
            and row.get("slot_end") == f"{end}:00"
            and row.get("booking_status") not in {"Procured", "Payment Completed"}
        )
        slots.append(
            {
                "slot_id": f"{centre['centre_id']}-{slot_date.isoformat()}-{start.replace(':', '')}",
                "start": start,
                "end": end,
                "capacity": base_capacity,
                "booked": booked,
                "remaining": max(0, base_capacity - booked),
                "recommended": start == "10:00" and state.get("queue_length", 0) <= 20,
            }
        )
    return {
        "centre_id": centre["centre_id"],
        "centre_name": centre["centre_name"],
        "date": slot_date,
        "slots": slots,
        "data_mode": "synthetic_prototype",
    }


@router.post("/book")
def create_booking(request: BookingRequest):
    centre = _centre(request.centre_id)
    main = _main()
    state = main.centre_states.get(centre["centre_id"], {})
    if state.get("status", "open") == "closed":
        raise HTTPException(status_code=409, detail="Selected centre is currently closed.")

    slot_rows = get_slots(request.centre_id, request.slot_date)["slots"]
    slot = next(
        (item for item in slot_rows if item["start"] == request.slot_start and item["end"] == request.slot_end),
        None,
    )
    if not slot:
        raise HTTPException(status_code=400, detail="Selected slot is invalid.")
    if slot["remaining"] <= 0:
        raise HTTPException(status_code=409, detail="Selected slot is full.")

    booking_id = f"BKG-{uuid4().hex[:10].upper()}"
    token = f"B-{datetime.now().strftime('%H%M')}-{uuid4().hex[:3].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "booking_id": booking_id,
        "token": token,
        "farmer_id": request.farmer_id,
        "centre_id": centre["centre_id"],
        "crop": request.crop.strip(),
        "quantity_quintals": request.quantity_quintals,
        "slot_date": request.slot_date.isoformat(),
        "slot_start": f"{request.slot_start}:00",
        "slot_end": f"{request.slot_end}:00",
        "booking_status": "Booked",
        "payment_status": "Not Initiated",
        "created_at": now,
        "updated_at": now,
    }
    try:
        rows = _rest_post("bookings", payload)
    except requests.HTTPError as exc:
        detail = exc.response.text[:800] if exc.response is not None else str(exc)
        raise HTTPException(status_code=502, detail=f"Booking failed: {detail}")

    current = main.centre_states[centre["centre_id"]]
    current["queue_length"] = int(current.get("queue_length", 0)) + 1
    current["updated_at"] = now
    try:
        main.persist_centre_state(centre["centre_id"], current)
    except Exception as exc:
        print(f"Queue persistence warning after booking: {exc}")

    _create_notification(
        request.farmer_id,
        "booking_confirmation",
        "Slot confirmed",
        f"Token {token} confirmed at {centre['centre_name']} for {request.slot_start}-{request.slot_end}.",
    )
    return {
        "ok": True,
        "booking": rows[0] if rows else payload,
        "token": token,
        "queue_position": current["queue_length"],
        "message": "Your procurement slot is confirmed.",
    }


@router.get("/booking/{booking_id}")
def get_booking(booking_id: str):
    try:
        rows = _rest_get("bookings", {"select": "*", "booking_id": f"eq.{booking_id}", "limit": "1"})
    except requests.HTTPError as exc:
        detail = exc.response.text[:800] if exc.response is not None else str(exc)
        raise HTTPException(status_code=502, detail=f"Booking lookup failed: {detail}")
    if not rows:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = rows[0]
    main = _main()
    state = main.centre_states.get(booking["centre_id"], {})
    booking["centre_state"] = {
        "status": state.get("status", "open"),
        "queue_length": state.get("queue_length", 0),
        "capacity_used_pct": state.get("capacity_used_pct", 0),
    }
    booking["timeline"] = [
        {"label": status, "done": STATUSES.index(status) <= STATUSES.index(booking["booking_status"])}
        for status in STATUSES
    ]
    return {"booking": booking}


@router.get("/notifications/{farmer_id}")
def get_notifications(farmer_id: str):
    try:
        rows = _rest_get(
            "notifications",
            {
                "select": "*",
                "farmer_id": f"eq.{farmer_id}",
                "order": "created_at.desc",
                "limit": "20",
            },
        )
    except requests.HTTPError as exc:
        detail = exc.response.text[:800] if exc.response is not None else str(exc)
        raise HTTPException(status_code=502, detail=f"Notification lookup failed: {detail}")
    return {"notifications": rows}


@router.get("/operator/bookings")
def operator_bookings():
    try:
        rows = _rest_get(
            "bookings",
            {"select": "*", "order": "created_at.desc", "limit": "50"},
        )
    except requests.HTTPError as exc:
        detail = exc.response.text[:800] if exc.response is not None else str(exc)
        raise HTTPException(status_code=502, detail=f"Booking list failed: {detail}")
    return {"bookings": rows}


@router.patch("/operator/bookings/{booking_id}")
def update_booking_status(booking_id: str, request: StatusUpdateRequest):
    status = request.status.strip()
    if status not in STATUSES:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {', '.join(STATUSES)}")

    try:
        existing = _rest_get("bookings", {"select": "*", "booking_id": f"eq.{booking_id}", "limit": "1"})
    except requests.HTTPError as exc:
        detail = exc.response.text[:800] if exc.response is not None else str(exc)
        raise HTTPException(status_code=502, detail=f"Booking lookup failed: {detail}")
    if not existing:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = existing[0]
    old_status = booking["booking_status"]
    if old_status == status:
        return {"booking": booking, "message": "No status change."}

    now = datetime.now(timezone.utc).isoformat()
    payment_status = PAYMENT_BY_STATUS[status]
    try:
        rows = _rest_patch(
            "bookings",
            {"booking_id": f"eq.{booking_id}"},
            {
                "booking_status": status,
                "payment_status": payment_status,
                "updated_at": now,
            },
        )
    except requests.HTTPError as exc:
        detail = exc.response.text[:800] if exc.response is not None else str(exc)
        raise HTTPException(status_code=502, detail=f"Status update failed: {detail}")

    if status in {"Payment Initiated", "Payment Completed"}:
        title = "Payment update"
        message = f"Your procurement payment status is now {payment_status}."
        kind = "payment_update"
    else:
        title = "Procurement update"
        message = f"Your procurement status is now {status}."
        kind = "procurement_update"

    _create_notification(booking["farmer_id"], kind, title, message)

    if status == "Procured" and old_status != "Procured":
        main = _main()
        centre_state = main.centre_states.get(booking["centre_id"])
        if centre_state:
            centre_state["queue_length"] = max(0, int(centre_state.get("queue_length", 0)) - 1)
            centre_state["updated_at"] = now
            try:
                main.persist_centre_state(booking["centre_id"], centre_state)
            except Exception as exc:
                print(f"Queue persistence warning after procurement: {exc}")

    return {
        "ok": True,
        "booking": rows[0] if rows else {**booking, "booking_status": status, "payment_status": payment_status},
        "message": message,
    }
