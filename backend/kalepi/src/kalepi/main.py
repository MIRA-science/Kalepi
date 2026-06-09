from fastapi import FastAPI
from mira import Claim

from kalepi.funder_lens import router as funder_lens_router

app = FastAPI(title="Kalepi")

app.include_router(funder_lens_router)


@app.get("/claim", response_model=Claim)
def example_claim() -> Claim:
    return Claim(content="Funded research addressed question X.")
