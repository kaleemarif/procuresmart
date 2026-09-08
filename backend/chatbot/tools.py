from __future__ import annotations

from typing import Any

from ml.predict import predict_waiting_time
from recommendation import DEMO_CENTRES, recommend_centres


def _live_centres() -> list[dict[str, Any]]:
    # Import at call time to avoid circular imports during app startup.
    import main

    result = []
    for centre in DEMO_CENTRES:
        state = main.centre_states.get(centre["centre_id"], {})
        result.append(
            {
                "centre_id": centre["centre_id"],
                "centre_name": centre["centre_name"],
                "status": state.get("status", "open"),
                "queue_length": state.get("queue_length", centre["queue_length"]),
                "active_counters": state.get(
                    "active_counters", centre["active_counters"]
                ),
                "capacity_used_pct": state.get(
                    "capacity_used_pct", centre["capacity_used_pct"]
                ),
                "latitude": centre["latitude"],
                "longitude": centre["longitude"],
                "demo_data": True,
            }
        )
    return result


TOOL_DEFINITIONS = [
    {
        "type": "function",
        "name": "discover_procurement_centres",
        "description": (
            "Returns verified live state for the available ProcureSmart demo "
            "procurement centres. Use this for centre availability, queues, "
            "capacity and status. These are synthetic prototype centres."
        ),
        "parameters": {
            "type": "object",
            "properties": {},
        },
    },
    {
        "type": "function",
        "name": "recommend_procurement_centre",
        "description": (
            "Runs the existing ProcureSmart recommendation engine using the "
            "current operator centre state. Use only when crop, quantity and "
            "farmer latitude/longitude are available."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "crop": {"type": "string"},
                "quantity_quintals": {
                    "type": "number",
                    "description": "Produce quantity in quintals.",
                },
                "farmer_latitude": {"type": "number"},
                "farmer_longitude": {"type": "number"},
                "hour": {"type": "integer", "minimum": 0, "maximum": 23},
                "day_of_week": {"type": "integer", "minimum": 0, "maximum": 6},
                "weather": {"type": "string"},
            },
            "required": [
                "crop",
                "quantity_quintals",
                "farmer_latitude",
                "farmer_longitude",
            ],
        },
    },
    {
        "type": "function",
        "name": "predict_centre_waiting_time",
        "description": (
            "Runs the existing ML waiting-time predictor for one procurement "
            "centre using verified live centre state."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "centre_id": {"type": "string"},
                "crop": {"type": "string"},
                "quantity_quintals": {"type": "number"},
                "hour": {"type": "integer", "minimum": 0, "maximum": 23},
                "day_of_week": {"type": "integer", "minimum": 0, "maximum": 6},
                "weather": {"type": "string"},
            },
            "required": [
                "centre_id",
                "crop",
                "quantity_quintals",
            ],
        },
    },
]


def execute_tool(name: str, arguments: dict[str, Any]) -> dict[str, Any]:
    import main

    if name == "discover_procurement_centres":
        return {
            "data_mode": "synthetic_prototype",
            "verified": True,
            "centres": _live_centres(),
        }

    if name == "recommend_procurement_centre":
        crop = str(arguments["crop"]).strip()
        quantity = float(arguments["quantity_quintals"])
        lat = float(arguments["farmer_latitude"])
        lon = float(arguments["farmer_longitude"])

        if quantity <= 0:
            return {"verified": False, "error": "Quantity must be greater than zero."}

        recommendations = recommend_centres(
            crop=crop,
            quantity_quintals=quantity,
            hour=int(arguments.get("hour", 11)),
            day_of_week=int(arguments.get("day_of_week", 2)),
            weather=str(arguments.get("weather", "Clear")),
            farmer_latitude=lat,
            farmer_longitude=lon,
            centre_states=main.centre_states,
        )

        return {
            "verified": True,
            "data_mode": "synthetic_prototype",
            "crop": crop,
            "quantity_quintals": quantity,
            "recommendations": recommendations[:3],
        }

    if name == "predict_centre_waiting_time":
        centre_id = str(arguments["centre_id"]).upper()
        centre = next(
            (item for item in DEMO_CENTRES if item["centre_id"] == centre_id),
            None,
        )
        if not centre:
            return {"verified": False, "error": f"Centre {centre_id} was not found."}

        state = main.centre_states.get(centre_id, {})
        if state.get("status", "open") == "closed":
            return {
                "verified": True,
                "centre_id": centre_id,
                "status": "closed",
                "message": "This centre is currently closed.",
            }

        prediction = predict_waiting_time(
            {
                "quantity_quintals": float(arguments["quantity_quintals"]),
                "queue_length": state.get(
                    "queue_length", centre["queue_length"]
                ),
                "active_counters": state.get(
                    "active_counters", centre["active_counters"]
                ),
                "avg_processing_time": centre["avg_processing_time"],
                "capacity_used_pct": state.get(
                    "capacity_used_pct", centre["capacity_used_pct"]
                ),
                "hour": int(arguments.get("hour", 11)),
                "day_of_week": int(arguments.get("day_of_week", 2)),
                "centre_id": centre_id,
                "crop": str(arguments["crop"]),
                "weather": str(arguments.get("weather", "Clear")),
            }
        )

        return {
            "verified": True,
            "centre_id": centre_id,
            "centre_name": centre["centre_name"],
            "status": state.get("status", "open"),
            "predicted_waiting_time_minutes": prediction,
        }

    return {"verified": False, "error": f"Unknown tool: {name}"}
