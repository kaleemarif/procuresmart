from main import app
from chatbot.router import router as chatbot_router
from procurement.router import router as procurement_router

app.include_router(chatbot_router)
app.include_router(procurement_router)
