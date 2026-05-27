/**
 * Chess Board UI
 * Handles board display and piece rendering
 */

class ChessBoard {
    constructor(containerId = 'chessboard') {
        this.container = document.getElementById(containerId);
        this.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        this.selectedSquare = null;
        this.validMoves = [];
        this.flipped = false;
        
        // Piece unicode symbols
        this.pieces = {
            'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔',
            'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚'
        };
        
        this.render();
    }

    /**
     * Set FEN and re-render board
     */
    setFEN(fen) {
        this.fen = fen;
        this.selectedSquare = null;
        this.validMoves = [];
        this.render();
    }

    /**
     * Get current FEN
     */
    getFEN() {
        return this.fen;
    }

    /**
     * Render the chessboard
     */
    render() {
        this.container.innerHTML = '';
        
        const rows = this.fen.split(' ')[0].split('/');
        const squares = [];
        
        // Create square elements
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const squareIndex = i * 8 + j;
                const square = document.createElement('div');
                square.className = 'square';
                square.dataset.index = squareIndex;
                square.dataset.row = i;
                square.dataset.col = j;
                
                // Checkerboard colors
                if ((i + j) % 2 === 0) {
                    square.classList.add('white');
                } else {
                    square.classList.add('black');
                }
                
                // Add file and rank labels
                if (j === 0 && i !== 0) {
                    square.dataset.rank = String.fromCharCode(56 - i); // 8-a
                }
                if (i === 7) {
                    square.dataset.file = String.fromCharCode(97 + j); // a-h
                }
                
                squares.push(square);
                this.container.appendChild(square);
            }
        }
        
        this.renderPieces();
    }

    /**
     * Render pieces on board
     */
    renderPieces() {
        const board = this.parseFEN();
        
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = board[i][j];
                if (piece !== '.') {
                    const squareIndex = i * 8 + j;
                    const square = document.querySelector(`[data-index="${squareIndex}"]`);
                    square.textContent = this.pieces[piece];
                }
            }
        }
    }

    /**
     * Parse FEN to 2D board array
     */
    parseFEN() {
        const fen = this.fen.split(' ')[0];
        const rows = fen.split('/');
        const board = [];
        
        for (let i = 0; i < 8; i++) {
            const row = [];
            for (let char of rows[i]) {
                if (isNaN(char)) {
                    row.push(char);
                } else {
                    for (let j = 0; j < parseInt(char); j++) {
                        row.push('.');
                    }
                }
            }
            board.push(row);
        }
        
        return board;
    }

    /**
     * Convert square index to algebraic notation
     */
    indexToSquare(index) {
        const row = Math.floor(index / 8);
        const col = index % 8;
        return String.fromCharCode(97 + col) + String(8 - row);
    }

    /**
     * Convert algebraic notation to square index
     */
    squareToIndex(square) {
        const col = square.charCodeAt(0) - 97;
        const row = 8 - parseInt(square[1]);
        return row * 8 + col;
    }

    /**
     * Highlight squares
     */
    highlightSquares(squares, type = 'highlight') {
        squares.forEach(square => {
            const element = document.querySelector(`[data-index="${square}"]`);
            if (element) {
                element.classList.add(type);
            }
        });
    }

    /**
     * Clear highlights
     */
    clearHighlights() {
        document.querySelectorAll('[data-index]').forEach(el => {
            el.classList.remove('highlight', 'attack', 'selected');
        });
    }

    /**
     * Flip the board
     */
    flip() {
        this.flipped = !this.flipped;
        this.container.style.transform = this.flipped ? 'rotate(180deg)' : 'rotate(0deg)';
    }

    /**
     * Clear board
     */
    clear() {
        this.setFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    }
}

// Create global board instance
const board = new ChessBoard();
