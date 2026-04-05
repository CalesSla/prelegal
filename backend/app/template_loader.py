"""Shared template loading utilities."""

import json
from pathlib import Path

TEMPLATES_DIR = Path(__file__).parent.parent / "data" / "templates"


def load_index() -> dict:
    with open(TEMPLATES_DIR / "index.json") as f:
        return json.load(f)


def load_template(template_id: str) -> dict | None:
    """Load a template by ID. Returns None if not found."""
    index = load_index()
    for t in index["templates"]:
        if t["id"] == template_id:
            file_path = (TEMPLATES_DIR / t["file"]).resolve()
            if not str(file_path).startswith(str(TEMPLATES_DIR.resolve())):
                return None
            with open(file_path) as f:
                return json.load(f)
    return None
