from fastapi import FastAPI
from mira import Claim

app = FastAPI(title="Kalepi")


@app.get("/claim", response_model=Claim)
def example_claim() -> Claim:
    return Claim(content="Funded research addressed question X.")
