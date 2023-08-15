import Piece from "./Piece";
import { Color, PieceType } from "./enums";
import { Driections } from "./types";

export default class Bishop extends Piece {
    #bishopDirections: Driections = [[1, 1], [1, -1], [-1, 1], [-1, -1]]

    constructor(color: Color, x: number, y: number) {
        super(color, x, y, PieceType.BISHOP)
        this.setDirections(this.#bishopDirections)
    }
}