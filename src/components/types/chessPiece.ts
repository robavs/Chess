import Piece from "../Piece";

export type chessPiece = Piece | null

type row = [chessPiece, chessPiece, chessPiece, chessPiece, chessPiece, chessPiece, chessPiece, chessPiece]

export type chessBoard = [row, row, row, row, row, row, row, row]