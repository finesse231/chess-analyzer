const boardEl = document.getElementById("board");
const analyzeButton = document.getElementById("analyzeButton");
const pgnInput = document.getElementById("pgnInput");
const moveListEl = document.getElementById("moveList");
const summaryEl = document.getElementById("summary");
const statusEl = document.getElementById("status");
const positionLabel = document.getElementById("positionLabel");
const arrowLayer = document.getElementById("arrowLayer");
const blackEval = document.getElementById("blackEval");
const evalMarker = document.getElementById("evalMarker");
const bestLineEl = document.getElementById("bestLine");
const playerStatsEl = document.getElementById("playerStats");
const reviewStatusEl = document.getElementById("reviewStatus");
const coachNoteEl = document.getElementById("coachNote");
const reviewMistakesButton = document.getElementById("reviewMistakes");
const prevIssueButton = document.getElementById("prevIssue");
const nextIssueButton = document.getElementById("nextIssue");

const pieceMap = {
    p: "bP", r: "bR", n: "bN", b: "bB", q: "bQ", k: "bK",
    P: "wP", R: "wR", N: "wN", B: "wB", Q: "wQ", K: "wK",
};

const classLabels = ["Best", "Excellent", "Good", "Inaccuracy", "Mistake", "Blunder"];
const state = {
    initialFen: "start",
    moves: [],
    selectedIndex: -1,
    reviewIndices: [],
    reviewPointer: -1,
};

function renderFen(fen) {
    const boardPart = fen === "start"
        ? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
        : fen.split(" ")[0];

    boardEl.innerHTML = "";

    boardPart.split("/").forEach((rank, rankIndex) => {
        let fileIndex = 0;
        for (const char of rank) {
            if (Number.isInteger(Number(char)) && char !== "0") {
                for (let i = 0; i < Number(char); i += 1) {
                    addSquare(squareName(fileIndex, rankIndex));
                    fileIndex += 1;
                }
            } else {
                addSquare(squareName(fileIndex, rankIndex), pieceMap[char]);
                fileIndex += 1;
            }
        }
    });
}

function squareName(fileIndex, rankIndex) {
    return `${"abcdefgh"[fileIndex]}${8 - rankIndex}`;
}

function addSquare(name, pieceCode) {
    const index = boardEl.children.length;
    const square = document.createElement("div");
    square.className = `square ${(Math.floor(index / 8) + index) % 2 === 0 ? "light" : "dark"}`;
    square.dataset.square = name;
    if (pieceCode) {
        const piece = document.createElement("img");
        piece.src = `/static/img/chesspieces/wikipedia/${pieceCode}.png`;
        piece.alt = pieceCode;
        square.appendChild(piece);
    }
    boardEl.appendChild(square);
}

function squareCenter(square) {
    const fileIndex = square.charCodeAt(0) - 97;
    const rankIndex = 8 - Number(square[1]);
    return {
        x: (fileIndex + 0.5) * 12.5,
        y: (rankIndex + 0.5) * 12.5,
    };
}

function moveSquares(uci) {
    if (!uci) {
        return null;
    }
    return {
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
    };
}

function clearHighlights() {
    boardEl.querySelectorAll(".square").forEach((square) => {
        square.classList.remove("played-from", "played-to", "best-from", "best-to");
    });
}

function highlightMove(uci, fromClass, toClass) {
    const squares = moveSquares(uci);
    if (!squares) {
        return;
    }

    boardEl.querySelector(`[data-square="${squares.from}"]`)?.classList.add(fromClass);
    boardEl.querySelector(`[data-square="${squares.to}"]`)?.classList.add(toClass);
}

function drawArrow(uci, className) {
    const squares = moveSquares(uci);
    if (!squares) {
        return;
    }

    const start = squareCenter(squares.from);
    const end = squareCenter(squares.to);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", start.x);
    line.setAttribute("y1", start.y);
    line.setAttribute("x2", end.x);
    line.setAttribute("y2", end.y);
    line.setAttribute("class", `move-arrow ${className}`);
    line.setAttribute("marker-end", `url(#${className}Head)`);
    arrowLayer.appendChild(line);
}

function renderArrows(move) {
    arrowLayer.innerHTML = `
        <defs>
            <marker id="playedHead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" class="played-head"></path>
            </marker>
            <marker id="bestHead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" class="best-head"></path>
            </marker>
        </defs>
    `;

    if (!move) {
        return;
    }

    if (move.bestUci && move.bestUci !== move.playedUci) {
        drawArrow(move.bestUci, "best");
    }
    drawArrow(move.playedUci, "played");
}

function updateEval(move) {
    if (!move) {
        blackEval.style.height = "50%";
        evalMarker.textContent = "0.0";
        return;
    }

    const score = Math.max(-600, Math.min(600, move.evalWhite || 0));
    const whiteShare = 50 + (score / 12);
    blackEval.style.height = `${100 - whiteShare}%`;
    evalMarker.textContent = move.evalText || "0.0";
}

function updateBestLine(move) {
    if (!move) {
        bestLineEl.textContent = "Analyze a game to see Stockfish's preferred line.";
        return;
    }

    bestLineEl.textContent = move.bestLine?.length
        ? move.bestLine.join(" ")
        : move.best || "No line available";
}

function moveLabel(move) {
    return `${move.moveNumber}${move.side === "black" ? "..." : "."} ${move.played}`;
}

function updateCoachNote(move) {
    if (!move) {
        coachNoteEl.textContent = "Questionable moves will appear here after analysis.";
        return;
    }

    if (move.isReviewMove) {
        coachNoteEl.textContent = `On ${moveLabel(move)}, ${move.side} played ${move.played}. Stockfish preferred ${move.best || "another move"}, with the line ${move.bestLine?.join(" ") || "not available"}.`;
        return;
    }

    coachNoteEl.textContent = `${moveLabel(move)} was ${move.classification.toLowerCase()} at depth ${move.depth || 8}.`;
}

function updateReviewStatus() {
    const total = state.reviewIndices.length;
    if (!state.moves.length) {
        reviewStatusEl.textContent = "Analyze a game to review mistakes.";
    } else if (!total) {
        reviewStatusEl.textContent = "No inaccuracies, mistakes, or blunders found.";
    } else if (state.reviewPointer >= 0) {
        reviewStatusEl.textContent = `Issue ${state.reviewPointer + 1} of ${total}`;
    } else {
        reviewStatusEl.textContent = `${total} review move${total === 1 ? "" : "s"} found.`;
    }

    const disabled = total === 0;
    reviewMistakesButton.disabled = disabled;
    prevIssueButton.disabled = disabled;
    nextIssueButton.disabled = disabled;
}

function setSelectedMove(index) {
    state.selectedIndex = index;
    const selectedMove = state.moves[index];
    renderFen(selectedMove ? selectedMove.fen : state.initialFen);
    clearHighlights();
    highlightMove(selectedMove?.bestUci, "best-from", "best-to");
    highlightMove(selectedMove?.playedUci, "played-from", "played-to");
    renderArrows(selectedMove);
    updateEval(selectedMove);
    updateBestLine(selectedMove);
    updateCoachNote(selectedMove);

    positionLabel.textContent = selectedMove
        ? `${selectedMove.moveNumber}${selectedMove.side === "black" ? "..." : "."} ${selectedMove.played} | ${selectedMove.classification} | ${selectedMove.evalText}`
        : "Starting position";

    document.querySelectorAll(".move-item").forEach((button, buttonIndex) => {
        button.classList.toggle("active", buttonIndex === index);
    });

    const reviewIndex = state.reviewIndices.indexOf(index);
    state.reviewPointer = reviewIndex;
    updateReviewStatus();
}

function renderPlayerStats(players = {}) {
    const white = players.white || { accuracy: 0, averageCpl: 0, moves: 0 };
    const black = players.black || { accuracy: 0, averageCpl: 0, moves: 0 };
    playerStatsEl.innerHTML = `
        <div class="player-card white">
            <span>White</span>
            <strong>${white.accuracy || 0}%</strong>
            <small>${white.averageCpl || 0} avg cp loss</small>
        </div>
        <div class="player-card black">
            <span>Black</span>
            <strong>${black.accuracy || 0}%</strong>
            <small>${black.averageCpl || 0} avg cp loss</small>
        </div>
    `;
}

function renderSummary(summary = {}) {
    summaryEl.innerHTML = "";
    classLabels.forEach((label) => {
        const item = document.createElement("div");
        item.className = `summary-card ${label.toLowerCase()}`;
        item.innerHTML = `<span>${label}</span><strong>${summary[label] || 0}</strong>`;
        summaryEl.appendChild(item);
    });
}

function renderMoves(moves) {
    moveListEl.innerHTML = "";

    moves.forEach((move, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `move-item ${move.classification.toLowerCase()}${move.isReviewMove ? " review-move" : ""}`;
        button.innerHTML = `
            <span class="move-main">
                <span class="move-number">${move.moveNumber}${move.side === "black" ? "..." : "."}</span>
                <strong>${move.played}</strong>
            </span>
            <span class="move-meta">
                <span>${move.classification}</span>
                <span>${move.evalText}</span>
                <span>${move.accuracy}%</span>
                <span>${move.centipawnLoss} cp</span>
                <span>Best: ${move.best || "-"}</span>
            </span>
        `;
        button.addEventListener("click", () => setSelectedMove(index));
        moveListEl.appendChild(button);
    });
}

function setReviewMove(pointer) {
    if (!state.reviewIndices.length) {
        return;
    }

    const total = state.reviewIndices.length;
    state.reviewPointer = (pointer + total) % total;
    setSelectedMove(state.reviewIndices[state.reviewPointer]);
}

function setLoading(isLoading) {
    analyzeButton.disabled = isLoading;
    analyzeButton.textContent = isLoading ? "Analyzing..." : "Analyze";
}

async function analyzeGame() {
    const pgn = pgnInput.value.trim();
    if (!pgn) {
        statusEl.textContent = "Paste a PGN or move list first.";
        return;
    }

    setLoading(true);
    statusEl.textContent = "Stockfish is reviewing the game...";

    try {
        const response = await fetch("/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pgn }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Analysis failed.");
        }

        state.initialFen = data.initialFen;
        state.moves = data.moves;
        state.reviewIndices = data.moves
            .map((move, index) => move.isReviewMove ? index : -1)
            .filter((index) => index >= 0);
        state.reviewPointer = -1;
        renderPlayerStats(data.players);
        renderSummary(data.summary);
        renderMoves(data.moves);
        setSelectedMove(data.moves.length ? data.moves.length - 1 : -1);
        statusEl.textContent = `Analyzed ${data.moves.length} moves.`;
    } catch (err) {
        statusEl.textContent = err.message;
    } finally {
        setLoading(false);
    }
}

document.getElementById("firstMove").addEventListener("click", () => setSelectedMove(-1));
document.getElementById("prevMove").addEventListener("click", () => {
    setSelectedMove(Math.max(-1, state.selectedIndex - 1));
});
document.getElementById("nextMove").addEventListener("click", () => {
    setSelectedMove(Math.min(state.moves.length - 1, state.selectedIndex + 1));
});
document.getElementById("lastMove").addEventListener("click", () => {
    setSelectedMove(state.moves.length - 1);
});
reviewMistakesButton.addEventListener("click", () => setReviewMove(0));
prevIssueButton.addEventListener("click", () => setReviewMove(state.reviewPointer - 1));
nextIssueButton.addEventListener("click", () => setReviewMove(state.reviewPointer + 1));
analyzeButton.addEventListener("click", analyzeGame);

renderFen("start");
renderPlayerStats();
renderSummary();
updateEval();
updateBestLine();
updateCoachNote();
updateReviewStatus();
