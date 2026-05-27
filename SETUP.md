# Chess Analyzer Setup Guide

## Prerequisites

- Python 3.8+
- Node.js 14+
- Stockfish chess engine

## Installation Steps

### 1. Clone Repository
```bash
git clone <repo-url>
cd chess-analyzer
```

### 2. Install Stockfish

**macOS (Homebrew):**
```bash
brew install stockfish
```

**Ubuntu/Debian:**
```bash
sudo apt-get install stockfish
```

**Windows:**
Download from: https://stockfishchess.org/download/

**Docker:**
```bash
docker run -d --name stockfish stockfish:latest
```

### 3. Install Python Dependencies
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Install Frontend Dependencies
```bash
npm install
```

## Running the Application

### Terminal 1: Start Backend API
```bash
python backend/app.py
```
The API will be available at `http://localhost:5000`

### Terminal 2: Start Frontend Server
```bash
npm start
```
The frontend will be available at `http://localhost:8000`

### Open in Browser
Navigate to: `http://localhost:8000`

## Configuration

### Engine Path
By default, the app searches for Stockfish in common locations. To specify a custom path:

1. Edit `backend/chess_engine.py`
2. Modify the `ChessEngine` initialization:
```python
engine = ChessEngine(engine_path='/path/to/stockfish')
```

### API Settings
- Backend runs on `http://localhost:5000` by default
- Frontend connects to `http://localhost:5000` API
- To change, edit `public/api.js`:
```javascript
const api = new ChessAnalyzerAPI('http://your-api-url:port');
```

## Features

✅ Real-time position analysis
✅ Best move recommendations
✅ Evaluation visualization
✅ PGN game analysis
✅ FEN position loading
✅ Interactive chess board
✅ Engine statistics

## Troubleshooting

### Engine not found
- Ensure Stockfish is installed and in PATH
- Check `backend/chess_engine.py` for engine path

### CORS errors
- Ensure Flask-CORS is installed: `pip install Flask-CORS`
- Backend should be running on port 5000

### Port conflicts
- Change backend port in `backend/app.py`: `app.run(port=5001)`
- Update frontend API URL in `public/api.js`

## Next Steps

### Enhancements to implement:
1. **Move validation** - Validate moves on the board
2. **Move playback** - Step through games move by move
3. **Opening book** - Display opening names
4. **Endgame tables** - Show tablebase results
5. **Blunder detection** - Highlight mistakes
6. **Performance graph** - Show evaluation over time
7. **Export analysis** - Save analysis results
8. **Database support** - Store games and analysis

## API Documentation

### POST /api/analyze
Analyze a chess position

**Request:**
```json
{
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "depth": 20
}
```

**Response:**
```json
{
  "fen": "...",
  "depth": 20,
  "evaluation": 0.25,
  "best_move": "e2e4",
  "pv": ["e2e4", "c7c5", ...],
  "nodes": 1000000,
  "time": 5.23
}
```

### POST /api/best-move
Get the best move for a position

**Request:**
```json
{
  "fen": "...",
  "depth": 20,
  "time_limit": 5000
}
```

### POST /api/game-analysis
Analyze a complete game

**Request:**
```json
{
  "pgn": "1. e4 e5 2. Nf3 Nc6 ...",
  "depth": 20
}
```

### GET /api/engine-stats
Get engine information

## License

MIT License - See LICENSE file for details

## Contributing

Contributions welcome! Please submit pull requests to improve the analyzer.
