# Chess Analyzer

A chess.com-like analysis tool that provides move evaluations, best move suggestions, and game analysis using chess engines.

## Features

- ♟️ Real-time move analysis
- 🎯 Best move recommendations
- 📊 Position evaluation scores
- 🔍 Blunder detection
- 📈 Game statistics
- 📝 PGN upload and analysis

## Architecture

```
chess-analyzer/
├── frontend/          # JavaScript/HTML/CSS UI
├── backend/           # Python Flask API
├── engine/            # Chess engine integration
└── public/            # Static assets
```

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Python (Flask)
- **Chess Engine**: Stockfish (UCI protocol)
- **Chess Library**: python-chess

## Getting Started

### Prerequisites
- Node.js 14+
- Python 3.8+
- Stockfish chess engine

### Installation

1. Clone the repository
2. Install backend dependencies: `pip install -r requirements.txt`
3. Install frontend dependencies: `npm install`
4. Download Stockfish engine

### Running

```bash
# Start backend API
python app.py

# Start frontend dev server
npm start
```

## API Endpoints

- `POST /api/analyze` - Analyze a position
- `POST /api/game-analysis` - Analyze complete game
- `GET /api/engine-stats` - Get engine statistics
