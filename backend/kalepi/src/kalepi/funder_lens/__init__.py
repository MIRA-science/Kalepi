"""Retrospective Funder Lens — Kalepi-local DTOs, fixture, and routes.

Layered on top of MIRA by addition only (AGENTS.md R6); references MIRA nodes by
id as pointers (R3). See ``models`` for the hand-synced data contract.
"""

from .router import router

__all__ = ["router"]
