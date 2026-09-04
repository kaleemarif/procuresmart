# ProcureSmart ML

This directory contains the machine-learning pipeline for ProcureSmart.

## Objective

Predict the expected waiting time at a procurement centre.

The current prototype uses a synthetic training dataset.

## Model

Current model:

- Random Forest Regressor
- 200 estimators
- Random state: 42

## Features

### Numeric

- quantity_quintals
- queue_length
- active_counters
- avg_processing_time
- capacity_used_pct
- hour
- day_of_week

### Categorical

- centre_id
- crop
- weather

### Target

- waiting_time

## Training

The training script accepts a CSV file.

Example:

```bash
python -m ml.train --data /path/to/synthetic_training_records_import.csv
