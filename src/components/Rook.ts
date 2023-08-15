import Piece from "./Piece";
import { Color, PieceType } from "./enums";
import { Driections } from "./types";

export default class Rook extends Piece {
    #rookDirections: Driections = [[1, 0], [-1, -0], [0, 1], [0, -1]]
    #hasMoved = false

    constructor(color: Color, x: number, y: number) {
        super(color, x, y, PieceType.ROOK)
        this.setDirections(this.#rookDirections)
    }

    get hasMoved(): boolean {
        return this.#hasMoved
    }

    set hasMoved(_) {
        this.#hasMoved = true
    }
}