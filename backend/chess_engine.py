"""
Chess Engine Integration
Handles communication with Stockfish engine using UCI protocol
"""

import chess
import chess.engine
import chess.pgn
from io import StringIO
import os
import logging

logger = logging.getLogger(__name__)


class ChessEngine:
    def __init__(self, engine_path=None):
        """
        Initialize chess engine
        
        Args:
            engine_path: Path to Stockfish binary. If None, searches system PATH
        """
        self.engine = None
        self.engine_path = engine_path or self._find_stockfish()
        
        if self.engine_path:
            self._init_engine()
        else:
            logger.warning("Stockfish engine not found")
    
    def _find_stockfish(self):
        """Find Stockfish in common locations"""
        possible_paths = [
            'stockfish',
            '/usr/games/stockfish',
            '/opt/homebrew/bin/stockfish',
            'C:\\Program Files\\stockfish\\stockfish.exe'
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                return path
        
        return None
    
    def _init_engine(self):
        """Initialize the UCI engine"""
        try:
            self.engine = chess.engine.SimpleEngine.popen_uci(self.engine_path)
            logger.info(f"Engine initialized: {self.engine_path}")
        except Exception as e:
            logger.error(f"Failed to initialize engine: {e}")
            self.engine = None
    
    def is_ready(self):
        """Check if engine is ready"""
        return self.engine is not None
    
    def analyze_position(self, fen, depth=20):
        """
        Analyze a chess position
        
        Args:
            fen: FEN string of the position
            depth: Search depth for the engine
        
        Returns:
            dict with evaluation, best move, variations
        """
        if not self.is_ready():
            return {'error': 'Engine not initialized'}
        
        try:
            board = chess.Board(fen)
            
            # Analyze the position
            info = self.engine.analyse(board, chess.engine.Limit(depth=depth))
            
            return {
                'fen': fen,
                'depth': depth,
                'evaluation': self._format_evaluation(info.get('score')),
                'best_move': info.get('pv', [None])[0].uci() if info.get('pv') else None,
                'pv': [move.uci() for move in info.get('pv', [])],
                'mate': info.get('score', {}).mate() if hasattr(info.get('score'), 'mate') else None,
                'nodes': info.get('nodes'),
                'time': info.get('time')
            }
        
        except Exception as e:
            logger.error(f"Analysis error: {e}")
            return {'error': str(e)}
    
    def analyze_game(self, pgn_text, depth=20):
        """
        Analyze a complete game from PGN
        
        Args:
            pgn_text: PGN string of the game
            depth: Search depth for each position
        
        Returns:
            list of analysis for each move
        """
        if not self.is_ready():
            return {'error': 'Engine not initialized'}
        
        try:
            pgn = chess.pgn.read_game(StringIO(pgn_text))
            
            if not pgn:
                return {'error': 'Invalid PGN'}
            
            analysis = []
            board = chess.Board()
            
            for move in pgn.mainline_moves():
                # Analyze position before move
                fen = board.fen()
                pos_analysis = self.analyze_position(fen, depth)
                
                # Add move info
                pos_analysis['move'] = move.uci()
                pos_analysis['san'] = board.san(move)
                analysis.append(pos_analysis)
                
                board.push(move)
            
            return {
                'game': str(pgn.headers),
                'analysis': analysis,
                'total_moves': len(analysis)
            }
        
        except Exception as e:
            logger.error(f"Game analysis error: {e}")
            return {'error': str(e)}
    
    def get_best_move(self, fen, depth=20, time_limit=5000):
        """
        Get the best move for a position
        
        Args:
            fen: FEN string
            depth: Search depth
            time_limit: Time limit in milliseconds
        
        Returns:
            dict with best move and evaluation
        """
        if not self.is_ready():
            return {'error': 'Engine not initialized'}
        
        try:
            board = chess.Board(fen)
            
            # Analyze with time limit
            info = self.engine.analyse(
                board,
                chess.engine.Limit(depth=depth, time=time_limit/1000.0)
            )
            
            best_move = info.get('pv', [None])[0]
            
            return {
                'fen': fen,
                'best_move': best_move.uci() if best_move else None,
                'evaluation': self._format_evaluation(info.get('score')),
                'depth': info.get('depth'),
                'nodes': info.get('nodes')
            }
        
        except Exception as e:
            logger.error(f"Best move error: {e}")
            return {'error': str(e)}
    
    def get_engine_name(self):
        """Get engine name"""
        if self.engine:
            return self.engine.id.get('name', 'Unknown')
        return 'No engine'
    
    def get_version(self):
        """Get engine version"""
        if self.engine:
            return self.engine.id.get('author', 'Unknown')
        return 'Unknown'
    
    def _format_evaluation(self, score):
        """Format engine score for display"""
        if score is None:
            return None
        
        if score.is_mate():
            return f"#{score.mate()}"
        else:
            # Convert to pawns (centipawns / 100)
            return score.relative.cp / 100.0
    
    def quit(self):
        """Quit the engine"""
        if self.engine:
            self.engine.quit()
            logger.info("Engine quit")
