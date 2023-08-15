import Piece from "./Piece";
import { Color, PieceType } from "./enums";
import { Driections } from "./types";

export default class Knight extends Piece {
    #pawnDirections: Driections = [[1, 0], [2, 0], [1, 1], [1, -1]]
    #hasMoved: boolean = false

    constructor(color: Color, x: number, y: number) {
        super(color, x, y, PieceType.PAWN)
        if (color === Color.BLACK) {
            this.#pawnDirections = this.#pawnDirections.map(direction => [-1 * direction[0], direction[1]])
        }
        this.setDirections(this.#pawnDirections)
    }

    get hasMoved(): boolean {
        return this.#hasMoved
    }

    set hasMoved(_) {
        this.#hasMoved = true
        this.#pawnDirections = [[1, 0], [1, 1], [1, -1]]
        if (this.color === Color.BLACK) {
            this.#pawnDirections = this.blackPawnDirections(this.#pawnDirections)
        }
        this.setDirections(this.#pawnDirections)
    }

    blackPawnDirections(pawnDirections: Driections): Driections {
        return pawnDirections.map(direction => [-1 * direction[0], direction[1]])
    }
}