from fastapi import FastAPI

app = FastAPI(
    title="ProcureSmart API",
    description="Backend API for the ProcureSmart farmer procurement guidance platform.",
    version="0.1.0",
)


@app.get("/health")
def health_check():
    return {"status": "ok"}
