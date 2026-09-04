"""Deterministic recommendation engine for ProcureSmart."""

from __future__ import annotations

from typing import Any

from ml.predict import predict_waiting_time


WAIT_WEIGHT = 0.45
DISTANCE_WEIGHT = 0.25
QUEUE_WEIGHT = 0.20
CAPACITY_WEIGHT = 0.10


DEMO_CENTRES = [
    {
        "centre_id": "C001",
        "centre_name": "ProcureSmart Demo Centre 1",
        "distance_km": 4.2,
        "queue_length": 18,
        "active_counters": 3,
        "avg_processing_time": 8,
        "capacity_used_pct": 55,
    },
    {
        "centre_id": "C002",
        "centre_name": "ProcureSmart Demo Centre 2",
        "distance_km": 6.8,
        "queue_length": 12,
        "active_counters": 4,
        "avg_processing_time": 7,
        "capacity_used_pct": 48,
    },
    {
        "centre_id": "C003",
        "centre_name": "ProcureSmart Demo Centre 3",
        "distance_km": 8.5,
        "queue_length": 8,
        "active_counters": 4,
        "avg_processing_time": 6,
        "capacity_used_pct": 40,
    },
    {
        "centre_id": "C004",
        "centre_name": "ProcureSmart Demo Centre 4",
        "distance_km": 3.1,
        "queue_length": 27,
        "active_counters": 2,
        "avg_processing_time": 10,
        "capacity_used_pct": 72,
    },
    {
        "centre_id": "C005",
        "centre_name": "ProcureSmart Demo Centre 5",
        "distance_km": 11.2,
        "queue_length": 10,
        "active_counters": 3,
        "avg_processing_time": 7,
        "capacity_used_pct": 45,
    },
    {
        "centre_id": "C006",
        "centre_name": "ProcureSmart Demo Centre 6",
        "distance_km": 5.6,
        "queue_length": 21,
        "active_counters": 3,
        "avg_processing_time": 8,
        "capacity_used_pct": 62,
    },
    {
        "centre_id": "C007",
        "centre_name": "ProcureSmart Demo Centre 7",
        "distance_km": 9.4,
        "queue_length": 15,
        "active_counters": 4,
        "avg_processing_time": 7,
        "capacity_used_pct": 52,
    },
    {
        "centre_id": "C008",
        "centre_name": "ProcureSmart Demo Centre 8",
        "distance_km": 7.1,
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


def recommend_centres(
    crop: str,
    quantity_quintals: float,
    hour: int = 11,
    day_of_week: int = 2,
    weather: str = "Clear",
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

        predictions.append(
            {
                **centre,
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

        distance_score = 1 - normalize(
            item["distance_km"],
            min_distance,
            max_distance,
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
