import Piece from "../Piece"

export interface ILastMove {
    piece: Piece // ili mozda treba chessPiece
    xPositionChanged: number
    yPositionChanged: number
}