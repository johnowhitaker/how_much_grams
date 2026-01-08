from __future__ import annotations

import os
from pathlib import Path
from flask import Flask, jsonify, render_template, request

APP_ROOT = Path(__file__).parent
DATA_DIR = APP_ROOT / "data"

app = Flask(__name__)


def ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def sanitize_step(step: str) -> str:
    allowed = {"object", "scale", "scale_reading"}
    if step not in allowed:
        raise ValueError("Invalid step")
    return step


@app.route("/")
def index():
    return render_template("index.html")


@app.post("/save")
def save_image():
    ensure_data_dir()

    observation_id = request.form.get("observation_id", "").strip()
    step = request.form.get("step", "").strip()
    image = request.files.get("image")

    if not observation_id or not step or image is None:
        return jsonify({"ok": False, "error": "Missing data"}), 400

    try:
        safe_step = sanitize_step(step)
    except ValueError:
        return jsonify({"ok": False, "error": "Invalid step"}), 400

    filename = f"{observation_id}_{safe_step}.jpg"
    filepath = DATA_DIR / filename
    image.save(filepath)

    return jsonify({"ok": True, "filename": filename})


@app.post("/cancel")
def cancel_observation():
    ensure_data_dir()

    observation_id = request.form.get("observation_id", "").strip()
    if not observation_id:
        return jsonify({"ok": False, "error": "Missing observation id"}), 400

    deleted = []
    for step in ("object", "scale", "scale_reading"):
        candidate = DATA_DIR / f"{observation_id}_{step}.jpg"
        if candidate.exists():
            candidate.unlink()
            deleted.append(candidate.name)

    return jsonify({"ok": True, "deleted": deleted})


@app.get("/health")
def health():
    return jsonify({"ok": True})


if __name__ == "__main__":
    ensure_data_dir()
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)
