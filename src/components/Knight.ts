import Piece from "./Piece";
import { Color, PieceType } from "./enums";
import { Driections } from "./types";

export default class Knight extends Piece {
    #knightDirections: Driections = [[1, 2], [1, -2], [-1, 2], [-1, -2], [2, 1], [2, -1], [-2, 1], [-2, -1]]

    constructor(color: Color, x: number, y: number) {
        super(color, x, y, PieceType.KNIGHT)
        this.setDirections(this.#knightDirections)
    }
}