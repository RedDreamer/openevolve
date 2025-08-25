"""
API server for OpenEvolve
"""

import os
import json
import uuid
import asyncio
import logging
from pathlib import Path
from typing import Dict, Any
from flask import Flask, request, jsonify
from flask_cors import CORS

from openevolve.controller import OpenEvolve
from openevolve.config import Config, load_config
from typing import Dict, Any
from flask import Flask, request, jsonify
from flask_cors import CORS

from openevolve.controller import OpenEvolve
from openevolve.config import Config, load_config

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
        self.config = data.get('config', {})
        self.run_id = str(uuid.uuid4())

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200

@app.route('/start-evolution', methods=['POST'])
def start_evolution():
    """Start a new evolution process"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Create evolution request
        evolution_request = EvolutionRequest(data)
        
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
        
        # Create config
        config_dict = evolution_request.config
        config = Config()
        
        # Map frontend config to backend config
        if 'generations' in config_dict:
            config.max_iterations = config_dict['generations']
        if 'population' in config_dict:
            config.database.population_size = config_dict['population']
        if 'mutation' in config_dict:
            # Mutation rate is not directly mapped in current config
            pass
        if 'seed' in config_dict:
            config.random_seed = config_dict['seed']
        if 'model' in config_dict:
            # Update model in LLM config
            if config.llm.models:
                config.llm.models[0].name = config_dict['model']
        
        # Initialize OpenEvolve
        openevolve = OpenEvolve(
            initial_program_path=str(seed_file),
            evaluation_file=str(evaluator_file),
            config=config,
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