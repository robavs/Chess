import Piece from "./Piece";
import { Color, PieceType } from "./enums";
import { Driections } from "./types";

export default class Queen extends Piece {
    #queenDirections: Driections = [[0, 1], [0, -1], [1, 0], [1, 1], [1, -1], [-1, 0], [-1, 1], [-1, -1]]

    constructor(color: Color, x: number, y: number) {
        super(color, x, y, PieceType.QUEEN)
        this.setDirections(this.#queenDirections)
    }
}