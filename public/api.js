/**
 * API Client
 * Handles communication with the backend
 */

class ChessAnalyzerAPI {
    constructor(baseURL = 'http://localhost:5000') {
        this.baseURL = baseURL;
        this.defaultDepth = 20;
    }

    /**
     * Check engine health
     */
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseURL}/api/health`);
            return await response.json();
        } catch (error) {
            console.error('Health check failed:', error);
            return { status: 'error', engine_ready: false };
        }
    }

    /**
     * Analyze a chess position
     * @param {string} fen - FEN string
     * @param {number} depth - Analysis depth
     */
    async analyzePosition(fen, depth = this.defaultDepth) {
        try {
            const response = await fetch(`${this.baseURL}/api/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fen, depth })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Analysis failed:', error);
            return { error: error.message };
        }
    }

    /**
     * Get best move for a position
     * @param {string} fen - FEN string
     * @param {number} depth - Analysis depth
     * @param {number} timeLimit - Time limit in ms
     */
    async getBestMove(fen, depth = this.defaultDepth, timeLimit = 5000) {
        try {
            const response = await fetch(`${this.baseURL}/api/best-move`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fen, depth, time_limit: timeLimit })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Best move request failed:', error);
            return { error: error.message };
        }
    }

    /**
     * Analyze complete game
     * @param {string} pgn - PGN string
     * @param {number} depth - Analysis depth
     */
    async analyzeGame(pgn, depth = this.defaultDepth) {
        try {
            const response = await fetch(`${this.baseURL}/api/game-analysis`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pgn, depth })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Game analysis failed:', error);
            return { error: error.message };
        }
    }

    /**
     * Get engine statistics
     */
    async getEngineStats() {
        try {
            const response = await fetch(`${this.baseURL}/api/engine-stats`);
            return await response.json();
        } catch (error) {
            console.error('Engine stats request failed:', error);
            return { error: error.message };
        }
    }
}

// Create global API instance
const api = new ChessAnalyzerAPI();
