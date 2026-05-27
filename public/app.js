/**
 * Main Application
 * Initializes and handles UI interactions
 */

class ChessAnalyzerApp {
    constructor() {
        this.init();
    }

    /**
     * Initialize application
     */
    async init() {
        this.setupEventListeners();
        await this.checkEngine();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Board controls
        document.getElementById('resetBtn')?.addEventListener('click', () => this.resetBoard());
        document.getElementById('flipBtn')?.addEventListener('click', () => this.flipBoard());
        document.getElementById('analyzeBtn')?.addEventListener('click', () => this.analyzePosition());

        // Input controls
        document.getElementById('loadFenBtn')?.addEventListener('click', () => this.loadFEN());
        document.getElementById('analyzePgnBtn')?.addEventListener('click', () => this.analyzePGN());

        // FEN input - analyze on Enter
        document.getElementById('fenInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.loadFEN();
        });
    }

    /**
     * Check engine status
     */
    async checkEngine() {
        try {
            const health = await api.checkHealth();
            
            if (health.engine_ready) {
                analyzer.updateStatus('ready');
            } else {
                analyzer.updateStatus('error', 'Engine not available');
            }
        } catch (error) {
            console.error('Engine check failed:', error);
            analyzer.updateStatus('error', 'Cannot connect to backend');
        }
    }

    /**
     * Reset board to starting position
     */
    resetBoard() {
        board.clear();
        analyzer.clear();
    }

    /**
     * Flip the board
     */
    flipBoard() {
        board.flip();
    }

    /**
     * Analyze current position
     */
    async analyzePosition() {
        const fen = board.getFEN();
        await analyzer.analyze(fen, 20);
    }

    /**
     * Load FEN from input
     */
    loadFEN() {
        const fenInput = document.getElementById('fenInput');
        const fen = fenInput.value.trim();
        
        if (!fen) {
            alert('Please enter a FEN position');
            return;
        }
        
        try {
            board.setFEN(fen);
            analyzer.clear();
            this.analyzePosition();
        } catch (error) {
            alert('Invalid FEN: ' + error.message);
        }
    }

    /**
     * Analyze PGN game
     */
    async analyzePGN() {
        const pgnInput = document.getElementById('pgnInput');
        const pgn = pgnInput.value.trim();
        
        if (!pgn) {
            alert('Please paste a PGN');
            return;
        }
        
        analyzer.updateStatus('analyzing', 'Analyzing game...');
        
        try {
            const result = await api.analyzeGame(pgn, 20);
            
            if (result.error) {
                alert('Error: ' + result.error);
                analyzer.updateStatus('error', result.error);
                return;
            }
            
            console.log('Game analysis complete:', result);
            
            // Display summary
            alert(`Analysis complete!\nTotal moves: ${result.total_moves}`);
            analyzer.updateStatus('ready');
        } catch (error) {
            console.error('PGN analysis error:', error);
            alert('Analysis failed: ' + error.message);
            analyzer.updateStatus('error', error.message);
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ChessAnalyzerApp();
    });
} else {
    new ChessAnalyzerApp();
}
