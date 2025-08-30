"""
API server for OpenEvolve
"""

import json
import uuid
import asyncio
import logging
import multiprocessing
from pathlib import Path
from typing import Dict, Any
from flask import Flask, request, jsonify
from flask_cors import CORS

from openevolve.controller import OpenEvolve

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Store for running evolutions
evolutions: Dict[str, multiprocessing.Process] = {}


class EvolutionRequest:
    def __init__(self, data: Dict[str, Any]):
        self.code = data.get("code", "")
        self.evaluator = data.get("evaluator", "")
        self.metrics = data.get("metrics", [])
        self.run_id = str(uuid.uuid4())


def run_evolution_process(
    seed_file: str, evaluator_file: str, config_path: str, output_path: str, run_id: str
):
    """Run OpenEvolve in a separate process"""
    try:
        openevolve = OpenEvolve(
            initial_program_path=seed_file,
            evaluation_file=evaluator_file,
            config_path=config_path,
            output_dir=output_path,
        )
        asyncio.run(openevolve.run())
    except Exception as e:
        logger.error(f"Error in evolution {run_id}: {e}")


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy"}), 200


@app.route("/start-evolution", methods=["POST"])
def start_evolution():
    """Start a new evolution process"""
    try:
        if request.is_json:
            data = request.get_json() or {}
            code = data.get("code", "")
            evaluator = data.get("evaluator", "")
            metrics = data.get("metrics", [])
            config_content = data.get("config")
            config_file_obj = None
        elif request.mimetype == "multipart/form-data":
            form = request.form
            code = form.get("code", "")
            evaluator = form.get("evaluator", "")
            metrics_raw = form.get("metrics", "[]")
            try:
                metrics = json.loads(metrics_raw)
            except json.JSONDecodeError:
                return jsonify({"error": "Invalid metrics format; expected JSON array."}), 400
            config_file_obj = request.files.get("config_file")
            config_content = None
        else:
            return (
                jsonify({"error": "Unsupported media type. Use application/json or multipart/form-data."}),
                415,
            )

        # Create evolution request
        evolution_request = EvolutionRequest(
            {
                "code": code,
                "evaluator": evaluator,
                "metrics": metrics,
            }
        )

        # Create temporary files for code and evaluator
        temp_dir = Path(f"/tmp/openevolve_{evolution_request.run_id}")
        temp_dir.mkdir(parents=True, exist_ok=True)

        # Save seed code
        seed_file = temp_dir / "seed.py"
        with open(seed_file, "w") as f:
            f.write(evolution_request.code)

        # Save evaluator
        evaluator_file = temp_dir / "evaluator.py"
        with open(evaluator_file, "w") as f:
            f.write(evolution_request.evaluator)

        # Handle configuration
        config_path = None
        if config_file_obj:
            config_filename = config_file_obj.filename or "config.yaml"
            config_file_path = temp_dir / config_filename
            config_file_obj.save(config_file_path)
            config_path = str(config_file_path)
        elif config_content:
            config_file_path = temp_dir / "config.yaml"
            with open(config_file_path, "w") as f:
                f.write(config_content)
            config_path = str(config_file_path)

        # Initialize output path
        output_path = str(temp_dir / "output")

        # Start evolution in background process
        process = multiprocessing.Process(
            target=run_evolution_process,
            args=(str(seed_file), str(evaluator_file), config_path, output_path, evolution_request.run_id),
        )
        process.daemon = True
        process.start()

        # Store process handle
        evolutions[evolution_request.run_id] = process

        return (
            jsonify(
                {
                    "status": "started",
                    "runId": evolution_request.run_id,
                    "path": output_path,
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Error starting evolution: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/evolution-status/<run_id>", methods=["GET"])
def evolution_status(run_id: str):
    """Get the status of an evolution process"""
    process = evolutions.get(run_id)
    if not process:
        return jsonify({"error": "Evolution not found"}), 404

    status = "running" if process.is_alive() else "completed"
    if not process.is_alive():
        evolutions.pop(run_id, None)

    return jsonify({"status": status, "runId": run_id}), 200


@app.route("/stop-evolution/<run_id>", methods=["POST"])
def stop_evolution(run_id: str):
    """Stop an evolution process"""
    process = evolutions.get(run_id)
    if not process:
        return jsonify({"error": "Evolution not found"}), 404

    if process.is_alive():
        process.terminate()
        process.join()

    evolutions.pop(run_id, None)

    return jsonify({"status": "stopped", "runId": run_id}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)
