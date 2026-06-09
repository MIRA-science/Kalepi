SCHEMA := $(abspath ../MIRA-schema/mira.yaml)

backend:
	cd backend && uv run kalepi

generate: generate-python generate-typescript

generate-python:
	uv run gen-pydantic $(SCHEMA) \
		> backend/mira/src/mira/_generated.py

generate-typescript:
	uv run gen-typescript $(SCHEMA) \
		> frontend/packages/mira/src/index.ts
