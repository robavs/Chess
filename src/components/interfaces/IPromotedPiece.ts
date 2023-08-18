import Piece from "../Piece"

// izmenicu da mi ne bude ovako sa null jer je ruzno, ali onda moram da izmenim metodu updatePosition
export interface IPromotedPiece {
    element: Piece | null
    img: HTMLImageElement | null
}