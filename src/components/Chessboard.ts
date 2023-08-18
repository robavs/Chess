import Pawn from './Pawn'
import Bishop from './Bishop'
import Knight from './Knight'
import Rook from './Rook'
import Queen from './Queen'
import King from './King'
import Piece from './Piece'
import { Color, PieceType } from './enums'
import { chessPiece, chessBoard, ListOfAllAvailableSquares } from './types'
import { ISquare, ILastMove, IPromotedPiece } from './interfaces'

import { Observable, BehaviorSubject, from, fromEvent, combineLatest, zip, forkJoin, of, Subscription } from 'rxjs';
import { combineLatestAll, filter, map, mergeMap, switchMap, tap, withLatestFrom } from 'rxjs/operators';
// null oznacava da je polje trenutno prazno

export default class ChessBoard {
    // observable koji prati promene sahovske table
    #boardState$: BehaviorSubject<chessBoard>
    #boardPosition: chessBoard
    // mislim da mi je ovaj boardElements potpuno nepotrebna stvar!!!
    #boardElements: HTMLTableCellElement[][] = Array(8).fill(0).map(() => Array(8).fill(0))
    #previousSelectedSquare: ISquare | null = null
    #currentSelectedSquare: ISquare | null = null
    #availableSquares: HTMLTableCellElement[] = []
    #isWhiteMove$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true)
    #playerColor$: BehaviorSubject<Color> = new BehaviorSubject<Color>(Color.WHITE)
    #lastMove: ILastMove | null = null

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
        this.#boardState$ = new BehaviorSubject<chessBoard>(this.#boardPosition)
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
                square.classList.add(!(i % 2) && !(j % 2) || i % 2 && j % 2 ? "light" : "dark")
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
        whoIsPlaying.innerText = "White's move"
        whoIsPlaying.classList.add("whoIsPlaying")
        document.body.appendChild(whoIsPlaying)
        document.body.appendChild(chessTable)
    }

    isSquareValid(x: number, y: number): boolean {
        return x >= 0 && y >= 0 && x < 8 && y < 8
    }

    // sada rxjs dolazi do svog izrazaja

    startGame(): void {
        const squares = [...document.querySelectorAll("th")] as HTMLTableCellElement[]
        const square$: Observable<Event> = fromEvent(squares, "click")

        const enablePlacingPiece$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true)

        const safeMoves$: BehaviorSubject<ListOfAllAvailableSquares> = new BehaviorSubject<ListOfAllAvailableSquares>
            (this.findAvailableSquares(Color.WHITE))

        this.#isWhiteMove$.subscribe({
            next: (isWhiteMove: boolean) => {
                this.#playerColor$.next(isWhiteMove ? Color.WHITE : Color.BLACK)
            }
        })

        this.#playerColor$.subscribe({
            next: (playerColor: Color) => {
                // da proverim da li ovo radi ako radi svakako mi se ne svidja ovako nego cu da stavim da je subjekat
                // pa da emituje vrednost, bukvalno besmisleno ispada da pozivam funkciju a sto posto je lakse preko subjecta
                safeMoves$.next(this.findAvailableSquares(playerColor))
            }
        })

        // na safeMoves treba da nadovezem specijalne poteze kao sto su rokada i
        // en passant, tako da cu ovde to da pozovem sa neki contact posle da bi ih spojio
        // u jedinitven observable

        // takodje treba da postavim da se ovaj safe moves, zapravo menja kako se menja player color
        // i treba da postavim da mi se this.#pieces postavi u neki state koji se takodje menja
        // pa da ovi budu u mogucnosti daosluskuju promene

        // ovo je firstKlik, odnosno klik kada zelimo da slektujemo figuru
        const selectPiece$: Observable<HTMLTableCellElement> = square$
            .pipe(
                map(event => event.currentTarget),
                filter((square: HTMLTableCellElement) => square.childNodes.length > 0),
                // sad ovde treba da se prosiri logika da se zna kad je prvi klik
                // kad je drugi klik
                // kad se jede figura i tako to
                filter((square: HTMLTableCellElement) => {
                    const piece = square.childNodes[0] as HTMLImageElement
                    return piece.getAttribute("color") === this.#playerColor$.value
                })
            )

        // a ovo treba da bude klik u kome postavljamo figuru
        const placePiece$: Observable<HTMLTableCellElement> = square$.
            pipe(
                map(event => event.currentTarget),
                filter((square: HTMLTableCellElement) => square.style.outlineColor === "red"),
                // ovo je bitno jer nam omogucuje da stavimo figuru po drugi put, nakon sto smo "prekinuli supskripciju"
                tap(() => enablePlacingPiece$.next(true)),
            )

        // prikazi dostupna polja
        combineLatest([safeMoves$, selectPiece$]).subscribe({
            next([safeMoves, clickedSquare]) {
                // dva puta smokliknuli na isto polje, znaci hocu da ponistim klik
                // medjutim definisem iako kliknem da je square red cisto da bih tako napravio razliku izmedju
                // dostunih i nedostupnih polja
                // console.log(safeMoves)

                // Treunutni bag mi je da ne mogu da jedem figure

                if (clickedSquare.style.outlineColor === "blue") {
                    clickedSquare.style.outline = ""
                    // i za ovo ce mozda moci neki subject da se postavi
                    squares.forEach(square => square.style.outline = "")
                }
                else {
                    squares.forEach(square => square.style.outline = "")
                    clickedSquare.style.outline = "5px solid blue"

                    const squarePositionX: number = Number(clickedSquare.getAttribute("x"))
                    const squarePositionY: number = Number(clickedSquare.getAttribute("y"))
                    const key: string = squarePositionX + "," + squarePositionY
                    const dostupnaPoljaZaDatuFiguru = safeMoves[key]
                    dostupnaPoljaZaDatuFiguru?.forEach(square => square.style.outline = "5px solid red")
                }

            }

        })

        // postavi figuru na kliknuto polje
        combineLatest([selectPiece$, placePiece$])
            .subscribe({
                next: ([prevSquare, nextSquare]) => {
                    if (enablePlacingPiece$.value) {
                        // kad izvrsim postavljanje figure treba nekako da rimovujem placePiece$
                        // jer mi ga onda automatski postavim na to polje
                        nextSquare.appendChild(prevSquare.childNodes[0])
                        squares.forEach(square => square.style.outline = "")
                        enablePlacingPiece$.next(false)

                        const pieceToPlace: Piece = this.#boardPosition[Number(prevSquare.getAttribute("x"))][Number(prevSquare.getAttribute("y"))] as Piece
                        this.#boardPosition[Number(prevSquare.getAttribute("x"))][Number(prevSquare.getAttribute("y"))] = null
                        this.#boardPosition[Number(nextSquare.getAttribute("x"))][Number(nextSquare.getAttribute("y"))] = pieceToPlace

                        // updejtuju se koordinate nakon pomeranja, mozda i ovo cak moze u neki subject da se stavi
                        pieceToPlace.x = Number(nextSquare.getAttribute("x"))
                        pieceToPlace.y = Number(nextSquare.getAttribute("y"))

                        console.log(this.#boardPosition)
                        // mozda ce treba i board state da se ukljuci
                        this.#boardState$.next(this.#boardPosition)
                        this.#isWhiteMove$.next(!this.#isWhiteMove$.value)
                        squares.forEach(square => square.style.outline = "")
                        console.log("Postavio sam figuru na zadato mesto")
                        // sad cak mislim da treba da imam neki observable koji ce bukvalno da mi prati ova stanja
                        // pa ce automatski da azuira stanja
                    }
                    else {

                    }
                }
            })

    }




    isSquareSafe(prevX: number, prevY: number, newX: number, newY: number): boolean {
        // proverava da li ce biti u šahu ako se figura stavi na to mesto
        const oldPiece: Piece = this.#boardPosition[prevX][prevY] as Piece
        const newPiece: chessPiece = this.#boardPosition[newX][newY]

        // ne mozes da stavis figuru na mesto gde se nalazi figura iste boje
        if (newPiece && newPiece.color === oldPiece.color) return false

        // boolean da proveri da li je u toj poziciji sah
        this.#boardPosition[newX][newY] = oldPiece
        this.#boardPosition[prevX][prevY] = null

        // vrsimo proveru da igrac ne sme da bude u sahu nakon svog sledeceg poteza, tj ne sme da otkrije sah
        const oppositeColorPlayer = this.#playerColor$.value === Color.WHITE ? Color.BLACK : Color.WHITE
        const isCheck: boolean = this.isCheck(true, oppositeColorPlayer)
        this.#boardPosition[prevX][prevY] = oldPiece
        this.#boardPosition[newX][newY] = newPiece

        return !isCheck
    }


    isCheck(checkingNextPosition: boolean = false, colorToCheck: Color): boolean {

        // checkingNextPosition nam sluzi samo da ne markiramo polje koje je crveno ukoliko je pozicija koju proveravamo
        // test pozicija da bi utvridli da se ne oktricva sah ti potezom i da je to polje zapravo slobodno
        for (const row of this.#boardPosition) {
            for (const piece of row) {
                if (!piece || piece.color !== colorToCheck) continue

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

    // ajde sad ovde da razmislim kako mogu da upotrebim koncepte
    // rxjs operatora poput take until i tako to uz filtere
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
        return listOfAllAvailableSquares
    }
}


