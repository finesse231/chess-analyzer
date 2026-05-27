import { Chess } from "chess.js";

const game = new Chess();

game.move("e4");
game.move("e5");

console.log(game.fen());
console.log(game.ascii());