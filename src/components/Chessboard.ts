import Pawn from './Pawn'
import Bishop from './Bishop'
import Knight from './Knight'
import Rook from './Rook'
import Queen from './Queen'
import King from './King'
import Piece from './Piece'
import { Color, PieceType } from './enums'
import { chessPiece, chessBoard, ListOfAllAvailableSquares } from './types'
import { ILastMove } from './interfaces'
import { Observable, BehaviorSubject, fromEvent, combineLatest } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

export default class ChessBoard {
    #boardPosition: chessBoard
    // referenca na sahovska polja
    #boardElements: HTMLTableCellElement[][] = Array(8).fill(0).map(() => Array(8).fill(0))
    #isWhiteMove$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true)
    #playerColor$: BehaviorSubject<Color> = new BehaviorSubject<Color>(Color.WHITE)
    #lastMove: ILastMove

    #squares: HTMLTableCellElement[];
    #square$: Observable<Event>

    #enablePlacingPiece$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true)
    #whoIsPlaying$: BehaviorSubject<string> = new BehaviorSubject<string>("")

    #safeMoves$: BehaviorSubject<ListOfAllAvailableSquares>
    #closeBtnPawnPromotionDialog$: Observable<Event>

    // Singleton obrszac jer zelim da imam samo jednu instancu, pa onda moram da stavim da bude zapravo privatni konstruktor
    constructor() {
        this.#boardPosition = [
            [
                new Rook(Color.WHITE, 0, 0), new Knight(Color.WHITE, 0, 1), new Bishop(Color.WHITE, 0, 2), new Queen(Color.WHITE, 0, 3),
                new King(Color.WHITE, 0, 4), new Bishop(Color.WHITE, 0, 5), new Knight(Color.WHITE, 0, 6), new Rook(Color.WHITE, 0, 7)
            ],
            [
                new Pawn(Color.WHITE, 1, 0), new Pawn(Color.WHITE, 1, 1), new Pawn(Color.WHITE, 1, 2), new Pawn(Color.WHITE, 1, 3),
                new Pawn(Color.WHITE, 1, 4), new Pawn(Color.WHITE, 1, 5), new Pawn(Color.WHITE, 1, 6), new Pawn(Color.WHITE, 1, 7)
            ],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [
                new Pawn(Color.BLACK, 6, 0), new Pawn(Color.BLACK, 6, 1), new Pawn(Color.BLACK, 6, 2), new Pawn(Color.BLACK, 6, 3),
                new Pawn(Color.BLACK, 6, 4), new Pawn(Color.BLACK, 6, 5), new Pawn(Color.BLACK, 6, 6), new Pawn(Color.BLACK, 6, 7)
            ],
            [
                new Rook(Color.BLACK, 7, 0), new Knight(Color.BLACK, 7, 1), new Bishop(Color.BLACK, 7, 2), new Queen(Color.BLACK, 7, 3),
                new King(Color.BLACK, 7, 4), new Bishop(Color.BLACK, 7, 5), new Knight(Color.BLACK, 7, 6), new Rook(Color.BLACK, 7, 7)
            ],
        ]
        this.createChessBoard()
        this.startGame()
    }

    createChessBoard(): void {
        const chessTable = document.createElement("table") as HTMLTableElement
        chessTable.classList.add("chess-board")

        for (let i: number = 7; i >= 0; i--) {
            const row = document.createElement("tr") as HTMLTableRowElement

            for (let j: number = 0; j < 8; j++) {
                const square = document.createElement("th") as HTMLTableCellElement
                square.classList.add(!(i % 2) && !(j % 2) || i % 2 && j % 2 ? "dark" : "light")
                square.setAttribute("x", i.toString())
                square.setAttribute("y", j.toString())

                const currentPiece: chessPiece = this.#boardPosition[i][j]
                if (currentPiece !== null) {
                    const piece = document.createElement("img") as HTMLImageElement
                    piece.src = currentPiece.imageURL
                    piece.alt = currentPiece.color + " " + currentPiece.pieceType
                    piece.setAttribute("color", currentPiece.color)
                    square.appendChild(piece)
                }

                row.appendChild(square)
                this.#boardElements[i][j] = square
            }
            chessTable.appendChild(row)
        }

        const whoIsPlaying = document.createElement("h2") as HTMLHeadingElement
        whoIsPlaying.classList.add("whoIsPlaying")
        document.body.appendChild(whoIsPlaying)
        document.body.appendChild(chessTable)
    }

    isSquareValid(x: number, y: number): boolean {
        return x >= 0 && y >= 0 && x < 8 && y < 8
    }

    startGame(): void {
        this.#safeMoves$ = new BehaviorSubject<ListOfAllAvailableSquares>(this.findAvailableSquares(Color.WHITE))
        this.#squares = [...document.querySelectorAll("th")] as HTMLTableCellElement[]
        this.#square$ = fromEvent(this.#squares, "click")

        this.#whoIsPlaying$.subscribe({
            next: (message: string) => {
                (document.querySelector(".whoIsPlaying") as HTMLHeadingElement).innerText = message
            }
        })

        this.#safeMoves$.subscribe({
            next: (boardPostion) => {
                const oppositePlayerColor = this.#playerColor$.value === Color.WHITE ? Color.BLACK : Color.WHITE
                const isCheck: boolean = this.isCheck(false, oppositePlayerColor)

                if (!Object.keys(boardPostion).length) {
                    this.#whoIsPlaying$.next(isCheck ? oppositePlayerColor.toUpperCase() + " win by checkmate" : "Stalemate")
                    this.#squares.forEach(square => square.style.pointerEvents = "none")
                }
                else if (isCheck) {
                    this.#whoIsPlaying$.next(this.#playerColor$.value.toUpperCase() + " is playing, but is in check")
                }
                else {
                    this.#whoIsPlaying$.next(this.#playerColor$.value.toUpperCase() + " is playing")
                }
            }
        })

        this.#isWhiteMove$.subscribe({
            next: (isWhiteMove: boolean) => {
                this.#playerColor$.next(isWhiteMove ? Color.WHITE : Color.BLACK)
            }
        })

        this.#playerColor$.subscribe({
            next: (playerColor: Color) => {
                // moram da nadjem neki nacin da ne zovem ovo iz dva poziva
                this.#squares.forEach(square => {
                    square.style.background = ""
                })

                this.#safeMoves$.next(this.findAvailableSquares(playerColor))

                this.#squares.forEach(square => {
                    square.style.outline = ""
                })
            }
        })

        // ovo je firstKlik, odnosno klik kada zelimo da slektujemo figuru
        const selectPiece$: Observable<HTMLTableCellElement> = this.#square$
            .pipe(
                map(event => event.currentTarget),
                filter((square: HTMLTableCellElement) => square.childNodes.length > 0),
                filter((square: HTMLTableCellElement) => {
                    const piece = square.childNodes[0] as HTMLImageElement
                    return piece.getAttribute("color") === this.#playerColor$.value
                })
            )

        // ovo je secondClick, odnosno klik u kome postavljamo selektovanu figuru na dato mesto
        const placePiece$: Observable<HTMLTableCellElement> = this.#square$
            .pipe(
                map(event => event.currentTarget),
                filter((square: HTMLTableCellElement) => square.style.outlineColor === "red"),
                // ovo je bitno jer nam omogucuje da stavimo figuru po drugi put, nakon sto smo "prekinuli supskripciju"
                tap(() => this.#enablePlacingPiece$.next(true)),
            )

        // prikazi dostupna polja
        combineLatest([this.#safeMoves$, selectPiece$])
            .subscribe({
                next: ([safeMoves, clickedSquare]) => {
                    if (clickedSquare.style.outlineColor === "blue") {
                        clickedSquare.style.outline = ""
                        // i za ovo ce mozda moci neki subject da se postavi
                        this.#squares.forEach(square => square.style.outline = "")
                    }
                    else {
                        this.#squares.forEach(square => square.style.outline = "")
                        clickedSquare.style.outline = "5px solid blue"

                        const squarePositionX: number = Number(clickedSquare.getAttribute("x"))
                        const squarePositionY: number = Number(clickedSquare.getAttribute("y"))
                        const key: string = squarePositionX + "," + squarePositionY
                        const pieceSafeMoves: HTMLTableCellElement[] = safeMoves[key]
                        pieceSafeMoves?.forEach(square => square.style.outline = "5px solid red")
                    }
                }
            })

        // postavi figuru na kliknuto polje
        combineLatest([selectPiece$, placePiece$])
            .subscribe({
                next: ([prevSquare, nextSquare]) => {
                    if (this.#enablePlacingPiece$.value) {
                        const prevSquareX: number = Number(prevSquare.getAttribute("x"))
                        const prevSquareY: number = Number(prevSquare.getAttribute("y"))
                        const nextSquareX: number = Number(nextSquare.getAttribute("x"))
                        const nextSquareY: number = Number(nextSquare.getAttribute("y"))

                        const pieceToPlace: Piece = this.#boardPosition[prevSquareX][prevSquareY] as Piece

                        // otvara se dijalog za promovisanje pesaka
                        if (pieceToPlace instanceof Pawn && (nextSquareX === 7 || nextSquareX === 0)) {
                            this.showPawnPromotionDialog(nextSquareX, nextSquareY, prevSquareX, prevSquareY)
                        }

                        else {
                            // znaci da je usledila rokada
                            if (pieceToPlace instanceof King && Math.abs(nextSquareY - prevSquareY) === 2) {
                                const rook: Rook = this.#boardPosition[nextSquareX][nextSquareY === 6 ? 7 : 0] as Rook
                                const rookPrevY = rook.y

                                // nextSquareY === 6 znaci da je u pitanju king side rokada
                                rook.y = nextSquareY === 6 ? 5 : 3
                                this.#boardPosition[rook.x][rook.y] = rook
                                this.#boardPosition[nextSquareX][rookPrevY] = null
                                this.#boardElements[rook.x][rook.y].appendChild(this.#boardElements[nextSquareX][rookPrevY].childNodes[0])
                            }

                            // en passant jer ide pesak ukuso i jede
                            else if (pieceToPlace instanceof Pawn && this.#boardPosition[nextSquareX][nextSquareY] === null && Math.abs(nextSquareY - prevSquareY) === 1) {

                                // koordinate pesaka kojeg jedemo u prolazu
                                const enPassantPawnX = nextSquareX + (pieceToPlace.color === Color.WHITE ? -1 : 1)
                                const enPassantPawnY = nextSquareY

                                this.#boardPosition[enPassantPawnX][enPassantPawnY] = null
                                this.#boardElements[enPassantPawnX][enPassantPawnY].innerHTML = ""
                            }

                            // azuriranje pozicije
                            this.#boardPosition[prevSquareX][prevSquareY] = null
                            this.#boardPosition[nextSquareX][nextSquareY] = pieceToPlace

                            // updejtuju se koordinate nakon pomeranja figure
                            pieceToPlace.x = nextSquareX
                            pieceToPlace.y = nextSquareY

                            // azuiranje prikaza nakon sto tu stane figura kojom smo zapoceli kretanje
                            nextSquare.innerHTML = "" // u slucjau da zelimo da pojedemo figuru
                            nextSquare.appendChild(prevSquare.childNodes[0])

                            this.#lastMove = { piece: pieceToPlace, xPositionChanged: Math.abs(prevSquareX - nextSquareX) }
                            this.#isWhiteMove$.next(!this.#isWhiteMove$.value)
                            this.#enablePlacingPiece$.next(false)
                        }

                        if (pieceToPlace instanceof King || pieceToPlace instanceof Rook || pieceToPlace instanceof Pawn) {
                            pieceToPlace.hasMoved = true
                        }

                    }
                }
            })

    }

    canKingCastle(kingColor: Color, kingSideCastle: boolean): boolean {
        const kingPositionX: number = kingColor === Color.WHITE ? 0 : 7
        const kingPositionY: number = 4

        const rookPositionX: number = kingPositionX
        const rookPositionY: number = kingSideCastle ? 7 : 0

        const king: chessPiece = this.#boardPosition[kingPositionX][kingPositionY]
        const rook: chessPiece = this.#boardPosition[rookPositionX][rookPositionY]

        const oppositePlayerColor = kingColor === Color.WHITE ? Color.BLACK : Color.WHITE
        const isCheck: boolean = this.isCheck(false, oppositePlayerColor)

        if (!(king instanceof King) || king.hasMoved || isCheck) {
            return false
        }

        if (!(rook instanceof Rook) || rook.hasMoved) {
            return false
        }

        if (this.#boardPosition[kingPositionX][kingPositionY + (kingSideCastle ? 1 : -1)] ||
            this.#boardPosition[kingPositionX][kingPositionY + (kingSideCastle ? 2 : -2)]) {
            return false
        }

        if (!kingSideCastle && this.#boardPosition[kingPositionX][kingPositionY + (kingSideCastle ? 3 : -3)])
            return false

        return this.isSquareSafe(kingPositionX, kingPositionY, kingPositionX, kingPositionY + (kingSideCastle ? 1 : -1)) &&
            this.isSquareSafe(kingPositionX, kingPositionY, kingPositionX, kingPositionY + (kingSideCastle ? 2 : -2))
    }

    isSquareSafe(prevX: number, prevY: number, newX: number, newY: number): boolean {
        // proverava da li ce biti u šahu ako se figura stavi na to mesto
        const oldPiece: Piece = this.#boardPosition[prevX][prevY] as Piece
        const newPiece: chessPiece = this.#boardPosition[newX][newY]

        // ne mozes da stavis figuru na mesto gde se nalazi figura iste boje
        if (newPiece && newPiece.color === oldPiece.color) return false

        this.#boardPosition[newX][newY] = oldPiece
        this.#boardPosition[prevX][prevY] = null

        // vrsimo proveru da igrac ne sme da bude u sahu nakon svog sledeceg poteza, tj ne sme da otkrije sah
        const oppositeColorPlayer = this.#playerColor$.value === Color.WHITE ? Color.BLACK : Color.WHITE
        const isCheck: boolean = this.isCheck(true, oppositeColorPlayer)
        this.#boardPosition[prevX][prevY] = oldPiece
        this.#boardPosition[newX][newY] = newPiece

        return !isCheck
    }

    // funkcija koja proverava da li je playerColor igrac dao sah, kada zelimo da proverimo da li je dati igrac u sahu
    // moramo da posaljemo boju portivnickog igraca jer nam onda to signalizira da li je drugi igrac dao sah

    isCheck(checkingNextPosition: boolean = false, playerColor: Color): boolean {

        // checkingNextPosition nam sluzi samo da ne markiramo polje koje je crveno ukoliko je pozicija koju proveravamo
        // test pozicija da bi utvridli da se ne oktricva sah ti potezom i da je to polje zapravo slobodno
        for (const row of this.#boardPosition) {
            for (const piece of row) {
                if (!piece || piece.color !== playerColor) continue

                // pesak, kralj i skakac ne mogu da predju vise poteza unapred nego sto im je definisano u koordinatama
                // a za ostale su dati samo pravci pa 
                if (piece instanceof Pawn || piece instanceof King || piece instanceof Knight) {
                    for (const [dx, dy] of piece.directions) {
                        const newX = piece.x + dx
                        const newY = piece.y + dy

                        if (piece instanceof Pawn && dy === 0) continue // zato sto pesak ne napada upravno vec ukoso

                        if (!this.isSquareValid(newX, newY)) continue

                        const nextPiece: chessPiece = this.#boardPosition[newX][newY]

                        if (nextPiece instanceof King && piece.color !== nextPiece.color) {
                            if (!checkingNextPosition) {
                                this.#boardElements[newX][newY].style.backgroundColor = "red"
                            }
                            return true
                        }
                    }
                }
                else {
                    for (const [dx, dy] of piece.directions) {
                        let newX: number = piece.x + dx
                        let newY: number = piece.y + dy

                        while (this.isSquareValid(newX, newY)) {
                            const nextPiece: chessPiece = this.#boardPosition[newX][newY]

                            if (nextPiece instanceof King && piece.color !== nextPiece.color) {
                                if (!checkingNextPosition) {
                                    this.#boardElements[newX][newY].style.backgroundColor = "red"
                                }
                                return true
                            }
                            // ako se na putu figure nadje polje koje nije prazno znaci da ne mozemo da idemo tom putanjom
                            // i sigurno nije sah
                            else if (this.#boardPosition[newX][newY] !== null) {
                                break
                            }
                            else {
                                newX += dx
                                newY += dy
                            }
                        }
                    }
                }
            }
        }
        return false
    }

    findAvailableSquares(currentPlayerColor: Color): ListOfAllAvailableSquares {
        const listOfAllAvailableSquares: ListOfAllAvailableSquares = {}

        for (const row of this.#boardPosition) {
            for (const piece of row) {
                if (!piece || piece.color !== currentPlayerColor) continue

                const safeSquares: HTMLTableCellElement[] = []
                const X: number = piece.x
                const Y: number = piece.y

                for (const [dx, dy] of piece.directions) {
                    let newX: number = X + dx
                    let newY: number = Y + dy
                    if (!this.isSquareValid(newX, newY)) continue

                    // nextPiece je figura koja se nalazi na novim koordinatama
                    let nextPiece: chessPiece = this.#boardPosition[newX][newY]

                    // regulišemo moguća slobodna polja za pešake, otšto smo inicijalno stavili da ima sve 4 opcije kretanja
                    if (piece instanceof Pawn) {
                        // onemogucujemo da se pesak pomeri dve pozicije ukoliko se ispred njega nalazi neka figura
                        if (dx === 2 || dx === -2) {
                            if (nextPiece !== null) continue
                            if (this.#boardPosition[newX + (dx === 2 ? -1 : 1)][newY] !== null) continue
                        }
                        // onemogucujemo da se krece jedno polje unapred ukoliko se ispred nalazi figura
                        if ((dx === 1 || dx === -1) && dy === 0 && nextPiece !== null) continue

                        // onemogucujemo da jede ukuso ukoliko se ispred ne nalazi figura
                        if ((dx === 1 || dx === -1) && nextPiece === null && (dy === 1 || dy === -1)) continue
                    }

                    if (piece instanceof Pawn || piece instanceof King || piece instanceof Knight) {
                        if (nextPiece === null || nextPiece.color !== this.#playerColor$.value) {
                            if (this.isSquareSafe(X, Y, newX, newY)) {
                                safeSquares.push(this.#boardElements[newX][newY])
                            }
                        }
                    }
                    else {
                        while (this.isSquareValid(newX, newY)) {
                            nextPiece = this.#boardPosition[newX][newY]
                            if (nextPiece === null || nextPiece.color !== this.#playerColor$.value) {
                                if (this.isSquareSafe(X, Y, newX, newY)) {
                                    safeSquares.push(this.#boardElements[newX][newY])
                                }
                                // blokiramo trazenje po putanji ispred koje se nalazi figura
                                if (nextPiece !== null) break
                                newX += dx
                                newY += dy
                            }
                            else break
                        }
                    }
                    if (safeSquares.length !== 0) {
                        listOfAllAvailableSquares[X.toString() + "," + Y.toString()] = safeSquares
                    }
                }
            }
        }

        const kingPositionX = currentPlayerColor === Color.WHITE ? 0 : 7
        const kingPositionY = 4

        if (this.canKingCastle(currentPlayerColor, true)) {
            listOfAllAvailableSquares[kingPositionX + "," + kingPositionY].push(this.#boardElements[kingPositionX][6])
        }

        if (this.canKingCastle(currentPlayerColor, false)) {
            listOfAllAvailableSquares[kingPositionX + "," + kingPositionY].push(this.#boardElements[kingPositionX][2])
        }

        this.canCaptureEnPassant(currentPlayerColor, listOfAllAvailableSquares)

        return listOfAllAvailableSquares
    }

    canCaptureEnPassant(currentPlayerColor: Color, listOfAllAvailableSquares: ListOfAllAvailableSquares): void {
        for (const row of this.#boardPosition) {
            for (const piece of row) {
                if (this.#lastMove &&
                    piece instanceof Pawn &&
                    this.#lastMove.piece instanceof Pawn &&
                    piece.color === currentPlayerColor &&
                    this.#lastMove.piece.color !== piece.color &&
                    this.#lastMove.xPositionChanged === 2 &&
                    piece.x === this.#lastMove.piece.x &&
                    Math.abs(piece.y - this.#lastMove.piece.y) === 1
                ) {
                    const newPawnPositionX = piece.x + (piece.color === Color.WHITE ? 1 : -1)
                    const newPawnPositionY = this.#lastMove.piece.y

                    this.#boardPosition[this.#lastMove.piece.x][this.#lastMove.piece.y] = null
                    const isPositionSafeAfterEnPassant = this.isSquareSafe(piece.x, piece.y, newPawnPositionX, newPawnPositionY)

                    if (isPositionSafeAfterEnPassant) {
                        if (!listOfAllAvailableSquares[piece.x + "," + piece.y]) {
                            listOfAllAvailableSquares[piece.x + "," + piece.y] = []
                        }
                        listOfAllAvailableSquares[piece.x + "," + piece.y].push(this.#boardElements[newPawnPositionX][newPawnPositionY])
                    }

                    this.#boardPosition[this.#lastMove.piece.x][this.#lastMove.piece.y] = this.#lastMove.piece
                }
            }
        }
    }

    showPawnPromotionDialog(currentX: number, currentY: number, prevX: number, prevY: number): void {
        const pieceImages: string[] = ["bishop", "knight", "rook", "queen"]
        const pawnPromoitionPopUp = document.createElement("div") as HTMLDivElement
        pawnPromoitionPopUp.classList.add("pawn-promotion-popup")
        document.body.appendChild(pawnPromoitionPopUp)

        const btnClose = document.createElement("div") as HTMLDivElement
        btnClose.classList.add("btn-close")
        pawnPromoitionPopUp.appendChild(btnClose)

        this.#closeBtnPawnPromotionDialog$ = fromEvent(btnClose, "click")

        this.#closeBtnPawnPromotionDialog$.pipe(
            tap(() => {
                pawnPromoitionPopUp.style.display = "none"
                this.#enablePlacingPiece$.next(false)
            })
        ).subscribe()

        for (const pieceImage of pieceImages) {
            const figureOption = document.createElement("div") as HTMLDivElement
            figureOption.classList.add("figure-option")

            const figureImage = document.createElement("img") as HTMLImageElement
            figureImage.src = `src/assets/${this.#playerColor$.value} ${pieceImage}.png`
            figureImage.alt = this.#playerColor$.value + " " + pieceImage

            figureImage.addEventListener("click", () => {
                let newPiece: Piece
                switch (pieceImage) {
                    case PieceType.QUEEN:
                        newPiece = new Queen(this.#playerColor$.value, currentX, currentY)
                        break
                    case PieceType.ROOK:
                        newPiece = new Rook(this.#playerColor$.value, currentX, currentY)
                        break
                    case PieceType.BISHOP:
                        newPiece = new Bishop(this.#playerColor$.value, currentX, currentY)
                        break
                    case PieceType.KNIGHT:
                    default:
                        newPiece = new Knight(this.#playerColor$.value, currentX, currentY)
                }

                this.#boardPosition[currentX][currentY] = newPiece
                this.#boardPosition[prevX][prevY] = null

                // moram da napravim novi element slike, jer ako dodam figureImage element on za sebe
                // ima vezan klik event sto ce da cini da mogu odmah da kliknem novu promovisanu figuru i time da narusim ciklicnost poteza

                const promotedPieceImage = document.createElement("img") as HTMLImageElement
                promotedPieceImage.src = `src/assets/${this.#playerColor$.value} ${pieceImage}.png`
                promotedPieceImage.alt = this.#playerColor$.value + " " + pieceImage
                promotedPieceImage.setAttribute("color", this.#playerColor$.value)

                this.#boardElements[currentX][currentY].innerHTML = ""
                this.#boardElements[currentX][currentY].appendChild(promotedPieceImage)
                this.#boardElements[prevX][prevY].innerHTML = ""

                this.#isWhiteMove$.next(!this.#isWhiteMove$.value)
                this.#enablePlacingPiece$.next(false)

                pawnPromoitionPopUp.style.display = "none"
            })

            figureOption.appendChild(figureImage)
            pawnPromoitionPopUp.appendChild(figureOption)
        }
    }
}