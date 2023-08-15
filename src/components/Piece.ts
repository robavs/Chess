import { Color, PieceType } from "./enums"
import { Driections } from "./types"

export default class Piece {
    protected color: Color
    protected x: number
    protected y: number
    protected directions: Driections
    protected imageURL: string

    constructor(color: Color, x: number, y: number, pieceType: PieceType) {
        this.color = color
        this.x = x
        this.y = y
        this.imageURL = `assets/${color}/ ${pieceType}.png`
    }

    setDirections(directions: Driections): void {
        this.directions = directions
    }
}