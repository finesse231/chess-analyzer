/**
 * Chess Analyzer Logic
 * Handles analysis updates and UI interactions
 */

class Analyzer {
    constructor() {
        this.currentAnalysis = null;
        this.isAnalyzing = false;
        this.analysisHistory = [];
    }

    /**
     * Analyze current position
     */
    async analyze(fen, depth = 20) {
        if (this.isAnalyzing) return;
        
        this.isAnalyzing = true;
        this.updateStatus('analyzing');
        
        try {
            const result = await api.analyzePosition(fen, depth);
            
            if (result.error) {
                this.updateStatus('error', result.error);
                return null;
            }
            
            this.currentAnalysis = result;
            this.analysisHistory.push(result);
            this.displayAnalysis(result);
            this.updateStatus('ready');
            
            return result;
        } catch (error) {
            console.error('Analysis error:', error);
            this.updateStatus('error', error.message);
            return null;
        } finally {
            this.isAnalyzing = false;
        }
    }

    /**
     * Display analysis results
     */
    displayAnalysis(analysis) {
        // Update evaluation
        this.updateEvaluation(analysis.evaluation);
        
        // Update best move
        this.displayBestMove(analysis.best_move);
        
        // Update variations
        this.displayVariations(analysis.pv);
        
        // Update stats
        this.displayStats(analysis);
    }

    /**
     * Update evaluation bar
     */
    updateEvaluation(evaluation) {
        const evalScore = document.getElementById('evalScore');
        const evalBar = document.getElementById('evalBar');
        
        if (evalScore) {
            // Handle mate scores
            if (typeof evaluation === 'string' && evaluation.includes('#')) {
                evalScore.textContent = evaluation;
                evalBar.style.width = evaluation.includes('-') ? '0%' : '100%';
            } else {
                const score = parseFloat(evaluation) || 0;
                evalScore.textContent = score.toFixed(2);
                
                // Calculate bar width (assuming -5 to +5 scale)
                const width = Math.max(0, Math.min(100, 50 + (score / 5) * 50));
                evalBar.style.width = width + '%';
            }
        }
    }

    /**
     * Display best move
     */
    displayBestMove(move) {
        const bestMoveEl = document.getElementById('bestMove');
        if (bestMoveEl) {
            bestMoveEl.textContent = move ? move.toUpperCase() : '--';
        }
    }

    /**
     * Display variations
     */
    displayVariations(pv) {
        const variationsEl = document.getElementById('variations');
        if (!variationsEl) return;
        
        variationsEl.innerHTML = '';
        
        if (!pv || pv.length === 0) {
            variationsEl.innerHTML = '<p class="placeholder">No variations</p>';
            return;
        }
        
        // Display top 3 variations
        pv.slice(0, 3).forEach((move, index) => {
            const div = document.createElement('div');
            div.className = 'variation-item';
            div.textContent = `${index + 1}. ${move}`;
            variationsEl.appendChild(div);
        });
    }

    /**
     * Display engine stats
     */
    displayStats(analysis) {
        const depthEl = document.getElementById('depth');
        const nodesEl = document.getElementById('nodes');
        const timeEl = document.getElementById('time');
        
        if (depthEl) depthEl.textContent = analysis.depth || '--';
        if (nodesEl) nodesEl.textContent = this.formatNumber(analysis.nodes) || '--';
        if (timeEl) timeEl.textContent = analysis.time ? (analysis.time * 1000).toFixed(0) + 'ms' : '--';
    }

    /**
     * Format large numbers
     */
    formatNumber(num) {
        if (!num) return '--';
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
        return num.toString();
    }

    /**
     * Update engine status
     */
    updateStatus(status, message = '') {
        const statusEl = document.getElementById('engineStatus');
        if (!statusEl) return;
        
        statusEl.className = `status-indicator ${status}`;
        
        const statusTexts = {
            'ready': 'Engine Ready',
            'analyzing': 'Analyzing Position...',
            'error': `Error: ${message}`,
            'waiting': 'Connecting to Engine...'
        };
        
        const textEl = statusEl.querySelector('.status-text');
        if (textEl) {
            textEl.textContent = statusTexts[status] || status;
        }
    }

    /**
     * Clear analysis
     */
    clear() {
        this.currentAnalysis = null;
        this.analysisHistory = [];
        
        document.getElementById('evalScore').textContent = '0.0';
        document.getElementById('evalBar').style.width = '50%';
        document.getElementById('bestMove').textContent = '--';
        document.getElementById('variations').innerHTML = '<p class="placeholder">Analyze to see variations</p>';
        document.getElementById('depth').textContent = '--';
        document.getElementById('nodes').textContent = '--';
        document.getElementById('time').textContent = '--';
    }
}

// Create global analyzer instance
const analyzer = new Analyzer();
