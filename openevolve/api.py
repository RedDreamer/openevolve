"""
API server for OpenEvolve
"""

import json
import uuid
import asyncio
import logging
import multiprocessing
import shutil
from pathlib import Path
from typing import Dict, Any, List
import os
import glob

from flask import Flask, request, jsonify
from flask_cors import CORS

from openevolve.controller import OpenEvolve
from openevolve.config import load_config
from openevolve.utils.metrics_utils import get_fitness_score

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Store for running evolutions
evolutions: Dict[str, multiprocessing.Process] = {}
# Track output paths for each run
evolution_paths: Dict[str, str] = {}


class EvolutionRequest:
    def __init__(self, data: Dict[str, Any]):
        self.code = data.get("code", "")
        self.evaluator = data.get("evaluator", "")
        self.metrics = data.get("metrics", [])
        self.context = data.get("context", {})
        self.run_id = str(uuid.uuid4())


def run_evolution_process(
    seed_file: str,
    evaluator_file: str,
    config_path: str,
    output_path: str,
    run_id: str,
    context: Dict[str, Any],
):
    """Run OpenEvolve in a separate process"""
    try:
        openevolve = OpenEvolve(
            initial_program_path=seed_file,
            evaluation_file=evaluator_file,
            config_path=config_path,
            output_dir=output_path,
            user_context=context,
        )
        asyncio.run(openevolve.run())
    except Exception as e:
        logger.error(f"Error in evolution {run_id}: {e}")


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy"}), 200


@app.route("/prompt-defaults", methods=["GET"])
def prompt_defaults():
    """Return default prompt contents for customization"""
    defaults_dir = Path(__file__).parent / "prompts" / "defaults"
    prompt_names = ["diff_user", "system_message", "full_rewrite_user", "evaluation"]
    prompts: Dict[str, str] = {}
    for name in prompt_names:
        try:
            with open(defaults_dir / f"{name}.txt", "r") as f:
                prompts[name] = f.read()
        except FileNotFoundError:
            prompts[name] = ""
    return jsonify(prompts), 200


@app.route("/start-evolution", methods=["POST"])
def start_evolution():
    """Start a new evolution process"""
    try:
        if request.is_json:
            data = request.get_json() or {}
            code = data.get("code", "")
            evaluator = data.get("evaluator", "")
            metrics = data.get("metrics", [])
            context = data.get("context", {})
            config_content = data.get("config")
            config_file_obj = None
            prompts = data.get("prompts", {})
            diff_user_prompt = prompts.get("diff_user")
            system_prompt = prompts.get("system_message")
            full_rewrite_prompt = prompts.get("full_rewrite_user")
            evaluation_prompt = prompts.get("evaluation")
        elif request.mimetype == "multipart/form-data":
            form = request.form
            code = form.get("code", "")
            evaluator = form.get("evaluator", "")
            metrics_raw = form.get("metrics", "[]")
            context_raw = form.get("context", "{}")
            try:
                metrics = json.loads(metrics_raw)
            except json.JSONDecodeError:
                return jsonify({"error": "Invalid metrics format; expected JSON array."}), 400
            try:
                context = json.loads(context_raw)
            except json.JSONDecodeError:
                return jsonify({"error": "Invalid context format; expected JSON object."}), 400
            config_file_obj = request.files.get("config_file")
            config_content = None
            prompts = {}
            diff_user_prompt = system_prompt = full_rewrite_prompt = evaluation_prompt = None
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
                "context": context,
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

        # Prepare prompt templates
        defaults_dir = Path(__file__).parent / "prompts" / "defaults"
        custom_prompt_dir = temp_dir / "prompts"
        shutil.copytree(defaults_dir, custom_prompt_dir)
        if diff_user_prompt:
            with open(custom_prompt_dir / "diff_user.txt", "w") as f:
                f.write(diff_user_prompt)
        if system_prompt:
            with open(custom_prompt_dir / "system_message.txt", "w") as f:
                f.write(system_prompt)
        if full_rewrite_prompt:
            with open(custom_prompt_dir / "full_rewrite_user.txt", "w") as f:
                f.write(full_rewrite_prompt)
        if evaluation_prompt:
            with open(custom_prompt_dir / "evaluation.txt", "w") as f:
                f.write(evaluation_prompt)

        # Handle configuration
        config_path_tmp = None
        if config_file_obj:
            config_filename = config_file_obj.filename or "config.yaml"
            config_file_path = temp_dir / config_filename
            config_file_obj.save(config_file_path)
            config_path_tmp = str(config_file_path)
        elif config_content:
            config_file_path = temp_dir / "config.yaml"
            with open(config_file_path, "w") as f:
                f.write(config_content)
            config_path_tmp = str(config_file_path)

        config_obj = load_config(config_path_tmp)
        config_obj.prompt.template_dir = str(custom_prompt_dir)
        config_file_path = temp_dir / "config.yaml"
        config_obj.to_yaml(config_file_path)
        config_path = str(config_file_path)

        # Initialize output path
        output_path = str(temp_dir / "output")

        # Start evolution in background process
        process = multiprocessing.Process(
            target=run_evolution_process,
            args=(str(seed_file), str(evaluator_file), config_path, output_path, evolution_request.run_id, evolution_request.context),
        )
        process.daemon = True
        process.start()

        # Store process handle and output path
        evolutions[evolution_request.run_id] = process
        evolution_paths[evolution_request.run_id] = output_path

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


@app.route("/monitor-data/<run_id>", methods=["GET"])
def monitor_data(run_id: str):
    """Return monitoring data for the latest checkpoint"""
    output_path = evolution_paths.get(run_id)
    if not output_path:
        return jsonify({"error": "Run ID not found"}), 404

    checkpoints_dir = os.path.join(output_path, "checkpoints")
    if not os.path.exists(checkpoints_dir):
        return jsonify({"error": "No checkpoints"}), 404

    checkpoint_dirs = glob.glob(os.path.join(checkpoints_dir, "checkpoint_*"))
    if not checkpoint_dirs:
        return jsonify({"error": "No checkpoints"}), 404

    checkpoint_dirs.sort(key=lambda p: int(os.path.basename(p).split("_")[-1]))
    latest = checkpoint_dirs[-1]

    metadata_path = os.path.join(latest, "metadata.json")
    if not os.path.exists(metadata_path):
        return jsonify({"error": "No metadata"}), 404

    with open(metadata_path, "r") as f:
        metadata = json.load(f)

    # Determine number of islands from latest metadata
    num_islands = len(metadata.get("islands", []))
    history: List[float] = []
    island_histories: List[List[float]] = [[] for _ in range(num_islands)]

    # Build overall and per-island history across checkpoints
    for ckpt in checkpoint_dirs:
        info_path = os.path.join(ckpt, "best_program_info.json")
        if os.path.exists(info_path):
            with open(info_path, "r") as f:
                info = json.load(f)
            history.append(get_fitness_score(info.get("metrics", {})))

        meta_path_ckpt = os.path.join(ckpt, "metadata.json")
        programs_dir_ckpt = os.path.join(ckpt, "programs")
        if os.path.exists(meta_path_ckpt):
            with open(meta_path_ckpt, "r") as mf:
                m = json.load(mf)
            pids = m.get("island_best_programs", [])
            for idx in range(num_islands):
                pid = pids[idx] if idx < len(pids) else None
                score = 0.0
                if pid:
                    prog_path = os.path.join(programs_dir_ckpt, f"{pid}.json")
                    if os.path.exists(prog_path):
                        with open(prog_path, "r") as pf:
                            prog = json.load(pf)
                        score = get_fitness_score(prog.get("metrics", {}))
                island_histories[idx].append(score)

    programs_dir = os.path.join(latest, "programs")

    def load_program(pid: str):
        prog_path = os.path.join(programs_dir, f"{pid}.json")
        if os.path.exists(prog_path):
            with open(prog_path, "r") as pf:
                prog = json.load(pf)
            score = get_fitness_score(prog.get("metrics", {}))
            return {"id": pid, "code": prog.get("code", ""), "metrics": prog.get("metrics", {}), "fitness": score}
        return {"id": pid}

    best = None
    best_id = metadata.get("best_program_id")
    if best_id:
        best = load_program(best_id)

    islands = []
    for idx, pid in enumerate(metadata.get("island_best_programs", [])):
        island = {"id": idx, "history": island_histories[idx] if idx < len(island_histories) else []}
        if pid:
            island["best"] = load_program(pid)
        islands.append(island)

    return jsonify(
        {
            "iteration": metadata.get("last_iteration"),
            "best": best,
            "islands": islands,
            "history": history,
        }
    )


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
    evolution_paths.pop(run_id, None)

    return jsonify({"status": "stopped", "runId": run_id}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)
