from fastapi import FastAPI

from kalepi.funder_lens import router as funder_lens_router

app = FastAPI(title="Kalepi")

app.include_router(funder_lens_router)
