import Piece from "./Piece"
import { Color, PieceType } from "./enums"
import { Driections } from "./types"

export default class King extends Piece {
    #kingDirections: Driections = [[0, 1], [0, -1], [1, 0], [1, 1], [1, -1], [-1, 0], [-1, 1], [-1, -1]]
    #hasMoved = false

    constructor(color: Color, x: number, y: number) {
        super(color, x, y, PieceType.KING)
        this.setDirections(this.#kingDirections)
    }

    get hasMoved(): boolean {
        return this.#hasMoved
    }

    set hasMoved(_) {
        this.#hasMoved = true
    }
}