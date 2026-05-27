from pathlib import Path
from flask import Flask, render_template, request, jsonify
import atexit
import io
import math
import chess
import chess.pgn
import chess.engine

app = Flask(__name__)

ENGINE_PATH = Path(__file__).with_name("stockfish.exe")
ENGINE_DEPTH = 8
MATE_SCORE = 100000

engine = None


def close_engine():
    global engine
    if engine is not None:
        try:
            engine.quit()
        except chess.engine.EngineError:
            pass
        finally:
            engine = None


atexit.register(close_engine)


def get_engine():
    global engine
    if engine is None:
        if not ENGINE_PATH.exists():
            raise RuntimeError(f"Stockfish was not found at {ENGINE_PATH}")
        engine = chess.engine.SimpleEngine.popen_uci(str(ENGINE_PATH))
    return engine


def analyze_position(board):
    info = get_engine().analyse(board, chess.engine.Limit(depth=ENGINE_DEPTH))
    score = info["score"]
    mover_score = score.pov(board.turn).score(mate_score=MATE_SCORE)

    best_move = None
    pv = []
    if "pv" in info and len(info["pv"]) > 0:
        pv = info["pv"]
        best_move = info["pv"][0]

    return best_move, mover_score, pv


def score_to_text(score, turn):
    pov_score = score.pov(turn)
    if pov_score.is_mate():
        mate = pov_score.mate()
        sign = "" if mate > 0 else "-"
        return f"{sign}M{abs(mate)}"

    centipawns = pov_score.score(mate_score=MATE_SCORE) or 0
    pawns = centipawns / 100
    return f"{pawns:+.1f}"


def pv_to_san(board, pv, limit=5):
    board_copy = board.copy()
    san_moves = []

    for move in pv[:limit]:
        if move not in board_copy.legal_moves:
            break
        san_moves.append(board_copy.san(move))
        board_copy.push(move)

    return san_moves


def classify(cpl, best_played):
    if best_played:
        return "Best"
    elif cpl >= 600:
        return "Blunder"
    elif cpl >= 300:
        return "Mistake"
    elif cpl >= 100:
        return "Inaccuracy"
    elif cpl <= 15:
        return "Excellent"
    else:
        return "Good"


def accuracy_from_cpl(cpl):
    return round(max(0, min(100, 100 * math.exp(-cpl / 250))), 1)


def empty_player_stats():
    return {
        "moves": 0,
        "totalCpl": 0,
        "totalAccuracy": 0,
    }


def finalize_player_stats(stats):
    moves = stats["moves"]
    if moves == 0:
        return {
            "moves": 0,
            "averageCpl": 0,
            "accuracy": 0,
        }

    return {
        "moves": moves,
        "averageCpl": round(stats["totalCpl"] / moves, 1),
        "accuracy": round(stats["totalAccuracy"] / moves, 1),
    }


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        payload = request.get_json(silent=True) or {}
        pgn_text = payload.get("pgn", "").strip()

        if not pgn_text:
            return jsonify({"error": "Paste a PGN or move list first."}), 400

        game = chess.pgn.read_game(io.StringIO(pgn_text))

        if game is None:
            return jsonify({"error": "Invalid PGN"}), 400

        board = game.board()
        results = []

        summary = {
            "Best": 0,
            "Excellent": 0,
            "Good": 0,
            "Inaccuracy": 0,
            "Mistake": 0,
            "Blunder": 0,
        }
        player_stats = {
            "white": empty_player_stats(),
            "black": empty_player_stats(),
        }

        for ply, move in enumerate(game.mainline_moves(), start=1):

            # Evaluate the position from the player about to move.
            mover = "white" if board.turn == chess.WHITE else "black"
            move_number = board.fullmove_number
            best_move, best_score, best_pv = analyze_position(board)

            played_move = move
            played_san = board.san(played_move)
            best_san = board.san(best_move) if best_move else None
            best_line = pv_to_san(board, best_pv)

            before_fen = board.fen()
            board.push(played_move)
            after_fen = board.fen()

            played_info = get_engine().analyse(board, chess.engine.Limit(depth=ENGINE_DEPTH))
            played_score_obj = played_info["score"]
            played_score = played_score_obj.pov(not board.turn).score(mate_score=MATE_SCORE)
            white_score = played_score_obj.pov(chess.WHITE).score(mate_score=MATE_SCORE)

            raw_cpl = max(0, best_score - played_score) if best_score is not None else 0
            cpl = min(raw_cpl, 1000)

            best_played = (best_move is not None and best_move == played_move)
            classification = classify(raw_cpl, best_played)
            move_accuracy = accuracy_from_cpl(cpl)
            summary[classification] += 1
            player_stats[mover]["moves"] += 1
            player_stats[mover]["totalCpl"] += cpl
            player_stats[mover]["totalAccuracy"] += move_accuracy

            results.append({
                "ply": ply,
                "moveNumber": move_number,
                "side": mover,
                "played": played_san,
                "best": best_san,
                "playedUci": played_move.uci(),
                "bestUci": best_move.uci() if best_move else None,
                "bestLine": best_line,
                "classification": classification,
                "centipawnLoss": cpl,
                "accuracy": move_accuracy,
                "isReviewMove": classification in ("Inaccuracy", "Mistake", "Blunder"),
                "score": played_score,
                "evalWhite": white_score,
                "evalText": score_to_text(played_score_obj, chess.WHITE),
                "beforeFen": before_fen,
                "fen": after_fen,
            })

        return jsonify({
            "initialFen": game.board().fen(),
            "moves": results,
            "summary": summary,
            "players": {
                "white": finalize_player_stats(player_stats["white"]),
                "black": finalize_player_stats(player_stats["black"]),
            },
        })

    except (RuntimeError, chess.engine.EngineError) as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)
