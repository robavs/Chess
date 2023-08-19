import Piece from "../Piece"

// ovo nam trenutno sluzi samo kako bismo uhvatili poslednji potez
// prilikom provere za enPassant
export interface ILastMove {
    piece: Piece
    xPositionChanged: number
}