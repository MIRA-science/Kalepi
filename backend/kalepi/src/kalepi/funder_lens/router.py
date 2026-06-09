"""Funder-lens API routes (UI System Architecture §3)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from .fixture import GRANTS, grant_summaries
from .models import Grant, GrantSummary

router = APIRouter(tags=["funder-lens"])


@router.get("/grants", response_model=list[GrantSummary])
def list_grants() -> list[GrantSummary]:
    """Grant index — coverage-first summaries of grants under review."""
    return grant_summaries()


@router.get("/grants/{grant_id}", response_model=Grant)
def get_grant(grant_id: str) -> Grant:
    """The full grant cell (View A reads the whole thing). 404 on unknown id."""
    grant = GRANTS.get(grant_id)
    if grant is None:
        raise HTTPException(status_code=404, detail=f"No grant {grant_id!r}")
    return grant
