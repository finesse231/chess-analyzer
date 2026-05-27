"""
Chess Analyzer Backend API
Provides chess analysis using Stockfish engine
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from chess_engine import ChessEngine
import logging

app = Flask(__name__)
CORS(app)

# Initialize chess engine
engine = ChessEngine()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'engine_ready': engine.is_ready()
    })


@app.route('/api/analyze', methods=['POST'])
def analyze():
    """
    Analyze a chess position
    
    Request JSON:
    {
        "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        "depth": 20
    }
    """
    try:
        data = request.json
        fen = data.get('fen')
        depth = data.get('depth', 20)
        
        if not fen:
            return jsonify({'error': 'FEN position required'}), 400
        
        analysis = engine.analyze_position(fen, depth)
        return jsonify(analysis)
    
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/game-analysis', methods=['POST'])
def game_analysis():
    """
    Analyze a complete game from PGN
    
    Request JSON:
    {
        "pgn": "1. e4 e5 2. Nf3 Nc6 ...",
        "depth": 20
    }
    """
    try:
        data = request.json
        pgn = data.get('pgn')
        depth = data.get('depth', 20)
        
        if not pgn:
            return jsonify({'error': 'PGN required'}), 400
        
        analysis = engine.analyze_game(pgn, depth)
        return jsonify(analysis)
    
    except Exception as e:
        logger.error(f"Game analysis error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/best-move', methods=['POST'])
def best_move():
    """
    Get best move for a position
    
    Request JSON:
    {
        "fen": "...",
        "depth": 20,
        "time_limit": 5000
    }
    """
    try:
        data = request.json
        fen = data.get('fen')
        depth = data.get('depth', 20)
        time_limit = data.get('time_limit', 5000)
        
        if not fen:
            return jsonify({'error': 'FEN position required'}), 400
        
        best = engine.get_best_move(fen, depth, time_limit)
        return jsonify(best)
    
    except Exception as e:
        logger.error(f"Best move error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/engine-stats', methods=['GET'])
def engine_stats():
    """Get engine statistics and capabilities"""
    return jsonify({
        'name': engine.get_engine_name(),
        'ready': engine.is_ready(),
        'version': engine.get_version()
    })


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def server_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
