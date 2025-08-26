"""
API server for OpenEvolve
"""

import json
import uuid
import asyncio
import logging
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
evolutions: Dict[str, OpenEvolve] = {}
evolution_tasks: Dict[str, asyncio.Task] = {}

class EvolutionRequest:
    def __init__(self, data: Dict[str, Any]):
        self.code = data.get('code', '')
        self.evaluator = data.get('evaluator', '')
        self.metrics = data.get('metrics', [])
        self.run_id = str(uuid.uuid4())

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200

@app.route('/start-evolution', methods=['POST'])
def start_evolution():
    """Start a new evolution process"""
    try:
        # Support both JSON and multipart form data
        if request.files:
            form = request.form
            code = form.get('code', '')
            evaluator = form.get('evaluator', '')
            metrics = json.loads(form.get('metrics', '[]'))
            config_file_obj = request.files.get('config_file')
        else:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            code = data.get('code', '')
            evaluator = data.get('evaluator', '')
            metrics = data.get('metrics', [])
            config_file_obj = None

        # Create evolution request
        evolution_request = EvolutionRequest({
            'code': code,
            'evaluator': evaluator,
            'metrics': metrics,
        })
        
        # Create temporary files for code and evaluator
        temp_dir = Path(f'/tmp/openevolve_{evolution_request.run_id}')
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        # Save seed code
        seed_file = temp_dir / 'seed.py'
        with open(seed_file, 'w') as f:
            f.write(evolution_request.code)
        
        # Save evaluator
        evaluator_file = temp_dir / 'evaluator.py'
        with open(evaluator_file, 'w') as f:
            f.write(evolution_request.evaluator)

        # Handle configuration
        config_path = None
        if config_file_obj:
            config_filename = config_file_obj.filename or 'config.yaml'
            config_file_path = temp_dir / config_filename
            config_file_obj.save(config_file_path)
            config_path = str(config_file_path)

        # Initialize OpenEvolve
        openevolve = OpenEvolve(
            initial_program_path=str(seed_file),
            evaluation_file=str(evaluator_file),
            config_path=config_path,
            output_dir=str(temp_dir / 'output')
        )
        
        # Store evolution
        evolutions[evolution_request.run_id] = openevolve
        
        # Run evolution in background
        def run_evolution():
            try:
                # Create new event loop for this thread
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(openevolve.run())
            except Exception as e:
                logger.error(f"Error in evolution {evolution_request.run_id}: {e}")
            finally:
                # Clean up
                if evolution_request.run_id in evolutions:
                    del evolutions[evolution_request.run_id]
        
        # Start evolution in background thread
        import threading
        thread = threading.Thread(target=run_evolution)
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'status': 'started',
            'runId': evolution_request.run_id
        }), 200
        
    except Exception as e:
        logger.error(f"Error starting evolution: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/evolution-status/<run_id>', methods=['GET'])
def evolution_status(run_id: str):
    """Get the status of an evolution process"""
    if run_id not in evolutions:
        return jsonify({'error': 'Evolution not found'}), 404
    
    # For now, just return that it's running
    # In a more complete implementation, we would track progress
    return jsonify({
        'status': 'running',
        'runId': run_id
    }), 200

@app.route('/stop-evolution/<run_id>', methods=['POST'])
def stop_evolution(run_id: str):
    """Stop an evolution process"""
    if run_id not in evolutions:
        return jsonify({'error': 'Evolution not found'}), 404
    
    # In a more complete implementation, we would signal the evolution to stop
    # For now, we'll just remove it from tracking
    del evolutions[run_id]
    
    return jsonify({
        'status': 'stopped',
        'runId': run_id
    }), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=False)