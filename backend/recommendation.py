"""Deterministic recommendation engine for ProcureSmart."""

from __future__ import annotations

import math
from typing import Any

from ml.predict import predict_waiting_time


WAIT_WEIGHT = 0.45
DISTANCE_WEIGHT = 0.25
QUEUE_WEIGHT = 0.20
CAPACITY_WEIGHT = 0.10


# Synthetic/demo centres only.
# These coordinates are for prototype testing and are NOT real government centre locations.
DEMO_CENTRES = [
    {
        "centre_id": "C001",
        "centre_name": "ProcureSmart Demo Centre 1",
        "latitude": 23.1815,
        "longitude": 79.9864,
        "queue_length": 18,
        "active_counters": 3,
        "avg_processing_time": 8,
        "capacity_used_pct": 55,
    },
    {
        "centre_id": "C002",
        "centre_name": "ProcureSmart Demo Centre 2",
        "latitude": 23.1768,
        "longitude": 79.9932,
        "queue_length": 12,
        "active_counters": 4,
        "avg_processing_time": 7,
        "capacity_used_pct": 48,
    },
    {
        "centre_id": "C003",
        "centre_name": "ProcureSmart Demo Centre 3",
        "latitude": 23.1889,
        "longitude": 79.9785,
        "queue_length": 8,
        "active_counters": 4,
        "avg_processing_time": 6,
        "capacity_used_pct": 40,
    },
    {
        "centre_id": "C004",
        "centre_name": "ProcureSmart Demo Centre 4",
        "latitude": 23.1694,
        "longitude": 79.9821,
        "queue_length": 27,
        "active_counters": 2,
        "avg_processing_time": 10,
        "capacity_used_pct": 72,
    },
    {
        "centre_id": "C005",
        "centre_name": "ProcureSmart Demo Centre 5",
        "latitude": 23.1942,
        "longitude": 80.0015,
        "queue_length": 10,
        "active_counters": 3,
        "avg_processing_time": 7,
        "capacity_used_pct": 45,
    },
    {
        "centre_id": "C006",
        "centre_name": "ProcureSmart Demo Centre 6",
        "latitude": 23.1726,
        "longitude": 79.9718,
        "queue_length": 21,
        "active_counters": 3,
        "avg_processing_time": 8,
        "capacity_used_pct": 62,
    },
    {
        "centre_id": "C007",
        "centre_name": "ProcureSmart Demo Centre 7",
        "latitude": 23.1917,
        "longitude": 79.9911,
        "queue_length": 15,
        "active_counters": 4,
        "avg_processing_time": 7,
        "capacity_used_pct": 52,
    },
    {
        "centre_id": "C008",
        "centre_name": "ProcureSmart Demo Centre 8",
        "latitude": 23.1658,
        "longitude": 79.9974,
        "queue_length": 24,
        "active_counters": 2,
        "avg_processing_time": 9,
        "capacity_used_pct": 68,
    },
]


def normalize(value: float, minimum: float, maximum: float) -> float:
    if maximum == minimum:
        return 1.0

    return (value - minimum) / (maximum - minimum)


def haversine_distance(
    latitude_1: float,
    longitude_1: float,
    latitude_2: float,
    longitude_2: float,
) -> float:
    """Calculate distance between two coordinates in kilometres."""

    earth_radius_km = 6371.0

    lat1 = math.radians(latitude_1)
    lat2 = math.radians(latitude_2)

    delta_lat = math.radians(latitude_2 - latitude_1)
    delta_lon = math.radians(longitude_2 - longitude_1)

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(delta_lon / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return earth_radius_km * c


def recommend_centres(
    crop: str,
    quantity_quintals: float,
    hour: int = 11,
    day_of_week: int = 2,
    weather: str = "Clear",
    farmer_latitude: float | None = None,
    farmer_longitude: float | None = None,
) -> list[dict[str, Any]]:
    predictions = []

    for centre in DEMO_CENTRES:
        prediction = predict_waiting_time(
            {
                "quantity_quintals": quantity_quintals,
                "queue_length": centre["queue_length"],
                "active_counters": centre["active_counters"],
                "avg_processing_time": centre["avg_processing_time"],
                "capacity_used_pct": centre["capacity_used_pct"],
                "hour": hour,
                "day_of_week": day_of_week,
                "centre_id": centre["centre_id"],
                "crop": crop,
                "weather": weather,
            }
        )

        if farmer_latitude is not None and farmer_longitude is not None:
            distance_km = haversine_distance(
                farmer_latitude,
                farmer_longitude,
                centre["latitude"],
                centre["longitude"],
            )
        else:
            distance_km = 0.0

        predictions.append(
            {
                **centre,
                "distance_km": round(distance_km, 2),
                "predicted_waiting_time_minutes": prediction,
            }
        )

    waits = [item["predicted_waiting_time_minutes"] for item in predictions]
    distances = [item["distance_km"] for item in predictions]
    queues = [item["queue_length"] for item in predictions]
    capacities = [item["capacity_used_pct"] for item in predictions]

    min_wait, max_wait = min(waits), max(waits)
    min_distance, max_distance = min(distances), max(distances)
    min_queue, max_queue = min(queues), max(queues)
    min_capacity, max_capacity = min(capacities), max(capacities)

    for item in predictions:
        wait_score = 1 - normalize(
            item["predicted_waiting_time_minutes"],
            min_wait,
            max_wait,
        )

        distance_score = (
            1 - normalize(
                item["distance_km"],
                min_distance,
                max_distance,
            )
            if max_distance != min_distance
            else 1.0
        )

        queue_score = 1 - normalize(
            item["queue_length"],
            min_queue,
            max_queue,
        )

        capacity_score = 1 - normalize(
            item["capacity_used_pct"],
            min_capacity,
            max_capacity,
        )

        score = (
            WAIT_WEIGHT * wait_score
            + DISTANCE_WEIGHT * distance_score
            + QUEUE_WEIGHT * queue_score
            + CAPACITY_WEIGHT * capacity_score
        )

        item["score"] = round(score * 100, 2)

    predictions.sort(key=lambda item: item["score"], reverse=True)

    for rank, item in enumerate(predictions, start=1):
        item["rank"] = rank

        if rank == 1:
            item["reason"] = (
                "Best overall balance of predicted waiting time, "
                "distance, queue and capacity."
            )
        else:
            item["reason"] = (
                "Alternative option based on the same "
                "explainable ranking criteria."
            )

    return predictions
