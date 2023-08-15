import { Color, PieceType } from "./enums"
import { Driections } from "./types"

export default class Piece {
    color: Color
    x: number
    y: number
    directions: Driections
    imageURL: string

    constructor(color: Color, x: number, y: number, pieceType: PieceType) {
        this.color = color
        this.x = x
        this.y = y
        this.imageURL = `src/assets/${color} ${pieceType}.png`
    }

    setDirections(directions: Driections): void {
        this.directions = directions
    }
}