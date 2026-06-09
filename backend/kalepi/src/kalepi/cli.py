import uvicorn


def cli() -> None:
    uvicorn.run("kalepi.main:app", reload=True)
