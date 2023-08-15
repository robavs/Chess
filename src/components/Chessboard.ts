import Pawn from './Pawn'
import Bishop from './Bishop'
import Knight from './Knight'
import Rook from './Rook'
import Queen from './Queen'
import King from './King'
import Piece from './Piece'
import { Color, PieceType } from './enums'
import { BehaviorSubject, Observable, fromEvent, tap } from 'rxjs'
import { chessPiece, chessBoard, ListOfAllAvailableSquares } from './types'
import { ISquare, ILastMove, IPromotedPiece } from './interfaces'
// null oznacava da je polje trenutno prazno

export default class ChessBoard {
    #boardState$: BehaviorSubject<chessBoard>
    #boardPosition: chessBoard
    #boardElements: HTMLTableCellElement[][] = Array(8).fill(0).map(() => Array(8).fill(0))
    #previousSelectedSquare: ISquare | null = null
    #currentSelectedSquare: ISquare | null = null
    #availableSquares: HTMLTableCellElement[] = []
    #isWhiteMove = true
    #playerColor = Color.WHITE
    #lastMove: ILastMove | null = null

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
                    piece.alt = currentPiece.color + " " + currentPiece.constructor.name.toLowerCase()
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

    changePlayer(): void {
        this.#boardElements.forEach(row => {
            row.forEach((square: HTMLTableCellElement) => {

                // ovo znaci da se na trenutnom polju nalazi figura i ona predstastavlja childNode koji je slika
                if (square.childNodes.length === 1) {
                    // ukoliko je boja figure ista kao boja protivnickog igraca, onda uklanjamo pointere i mogucnost da bude kliknuta
                    const oppositePlayerColor: Color = this.#isWhiteMove ? Color.BLACK : Color.WHITE
                    const pieceColorSameAsOppositePlayer: boolean = (square.childNodes[0] as HTMLImageElement).src
                        .includes(oppositePlayerColor)

                    square.style.pointerEvents = pieceColorSameAsOppositePlayer ? "none" : "auto"
                    square.style.cursor = pieceColorSameAsOppositePlayer ? "arrow" : "pointer"
                }
            })
        })
    }

    removeCursorsFromUnavailableSquares(): void {
        this.#availableSquares.forEach(square => {
            square.style.cursor = "arrow"
            square.style.pointerEvents = "none"
            square.style.outline = ""
        })
    }

    startGame() {
        this.changePlayer()
        this.#boardElements.forEach(row => {
            row.forEach(square => {
                square.addEventListener("click", () => {
                    move(square)
                })
            })
        })

        const move = (square: HTMLTableCellElement): void => {
            // koordinate trenutno kliknute figure
            const currentX: number = Number(square.getAttribute("x"))
            const currentY: number = Number(square.getAttribute("y"))
            // ukazuje boju trenutnog igraca da bi stavili da su dovoljena polja
            this.#playerColor = this.#isWhiteMove ? Color.WHITE : Color.BLACK

            // znaci da smo kliknuli na figuru

            // treba da napravim da mi ovu funkciju racuna samo jednom, znaci da se ne ponavlja izvrsenje svaki cas
            // vec ono kad je neciji potez on prosto da registruje da l ovaj igrac menja izmejdu svojih figura
            // pa je onda to racunanje redudadno

            const listOfAllAvailableSquares: ListOfAllAvailableSquares = this.findAvailableSquares(this.#playerColor)
            console.log("clicked", listOfAllAvailableSquares)

            if (square.childNodes.length === 1 &&
                (square.childNodes[0] as HTMLImageElement).src.includes(this.#playerColor)) {
                this.#previousSelectedSquare = this.#currentSelectedSquare !== null ? { ...this.#currentSelectedSquare } : null
                this.#currentSelectedSquare = { square, x: currentX, y: currentY }
                this.#currentSelectedSquare.square.style.outline = "5px solid red"

                // ovde vrismo ponistavanje prethodno selektovanog elementa i njegovih mogucih polja
                if (this.#previousSelectedSquare !== null) {
                    this.#previousSelectedSquare.square.style.outline = ""
                    this.removeCursorsFromUnavailableSquares()
                    this.#availableSquares = []
                }

                // ako smo kliknuli na isti figuru da ponistimo njeno selektovanje
                if (this.#previousSelectedSquare?.square === this.#currentSelectedSquare?.square) {
                    this.#currentSelectedSquare.square.style.outline = ""
                    this.#currentSelectedSquare = this.#previousSelectedSquare = null
                    this.removeCursorsFromUnavailableSquares()
                    this.#availableSquares = []
                }
                // ovde se vec prikazuje spisak opcija koje imamo u smislu mogucih narednih poteza
                else {

                    // razmisli da ovu liniju prebacim gore, da ne bih uvek pozivao istu funkciju
                    // vec da se ona pozove samo jednom da pocetku svakog poteza

                    this.#availableSquares = listOfAllAvailableSquares[currentX + "," + currentY] || []
                    let currentPiece: chessPiece = this.#boardPosition[currentX][currentY]

                    // upravo nam ova boja igraca sluzi da utvrdimo jel nastupio otkirveni sah
                    const oppositeColorCheck = this.#playerColor === Color.WHITE ? Color.BLACK : Color.WHITE

                    // vrsimo proveru da li moze da se odigra en Passant
                    if (
                        this.#lastMove !== null &&
                        Object.keys(this.#lastMove).length > 0 &&
                        currentPiece instanceof Pawn &&
                        this.#lastMove.piece instanceof Pawn &&
                        this.#lastMove.xPositionChanged === 2 &&
                        currentPiece.x === this.#lastMove.piece.x &&
                        Math.abs(currentY - this.#lastMove.piece.y) === 1) {

                        const oppositeColorPawnPosX: number = this.#lastMove.piece.x
                        const oppositeColorPawnPosY: number = this.#lastMove.piece.y
                        const enPassantXPos: number = currentX + (this.#playerColor === "white" ? 1 : -1)
                        const enPassantYPos: number = oppositeColorPawnPosY
                        const pawnOfCurrentPlayer: Pawn = currentPiece
                        const pawnOfNextPlayer: Pawn = this.#lastMove.piece

                        // vrsimo simulaciju pozicije ukoliko usledi enPassant, da vidimo da li onda igrac ostavlja poziciju
                        // takva da je on u sahu
                        currentPiece = null
                        this.#boardPosition[oppositeColorPawnPosX][oppositeColorPawnPosY] = null
                        this.#boardPosition[enPassantXPos][enPassantYPos] = pawnOfCurrentPlayer

                        const isCheck = this.isCheck(true, oppositeColorCheck)

                        if (!isCheck) {
                            this.#availableSquares.push(this.#boardElements[enPassantXPos][enPassantYPos])
                        }

                        currentPiece = pawnOfCurrentPlayer
                        this.#boardPosition[oppositeColorPawnPosX][this.#lastMove.piece.y] = pawnOfNextPlayer
                        this.#boardPosition[enPassantXPos][enPassantYPos] = null
                    }

                    if (currentPiece instanceof King && !currentPiece.hasMoved) {
                        const rookXPos = this.#playerColor === "white" ? 0 : 7
                        const kingXPos = currentPiece.x
                        const kingYPos = currentPiece.y

                        const canKingCastle = (smallCastle: boolean): boolean => {

                            // ne moze da se izvrsi rokada ako se top ne nalazi na inicijalnoj poziciji
                            const rook: Rook = this.#boardPosition[rookXPos][smallCastle ? 7 : 0] as Rook
                            if (!(rook instanceof Rook)) {
                                return false
                            }

                            if (smallCastle) {
                                if (this.#boardPosition[kingXPos][kingYPos + 1] !== null ||
                                    this.#boardPosition[kingXPos][kingYPos + 2] !== null) {
                                    return false
                                }
                            }
                            else {
                                if (this.#boardPosition[kingXPos][kingYPos - 1] !== null ||
                                    this.#boardPosition[kingXPos][kingYPos - 2] !== null ||
                                    this.#boardPosition[kingXPos][kingYPos - 3] !== null) {
                                    return false
                                }
                            }

                            // kod rokade moramo da proveravamo da su sva polja kroz koja prolazi kralj
                            // nisu u sahu, tako da proveravamo po dva polja sa leve odnosno desne strane od kralja
                            // u zavisnosti koju rokadu vrsi

                            const newkingYPos = kingYPos + (smallCastle ? 1 : -1)
                            const newkingYPos1 = kingYPos + (smallCastle ? 2 : -2)
                            const isKingSafe =
                                this.isSquareSafe(kingXPos, kingYPos, kingXPos, newkingYPos) &&
                                this.isSquareSafe(kingXPos, kingYPos, kingXPos, newkingYPos1)

                            return isKingSafe && !rook.hasMoved
                        }

                        const isCheck: boolean = this.isCheck(true, oppositeColorCheck)

                        if (!isCheck) {
                            // provera male rokade
                            if (canKingCastle(true)) {
                                this.#availableSquares.push(this.#boardElements[kingXPos][kingYPos + 2])
                            }
                            // provera velike roakde
                            if (canKingCastle(false)) {
                                this.#availableSquares.push(this.#boardElements[kingXPos][kingYPos - 2])
                            }
                        }
                    }
                    this.#availableSquares.forEach(sq => {
                        sq.style.outline = "5px solid blue"
                        // const dot = document.createElement("div")
                        // dot.classList.add("dot")
                        // sq.appendChild(dot)
                        sq.style.cursor = "pointer"
                        sq.style.pointerEvents = "auto"
                    })
                }
            }
            // ovde registrujemo onaj drugi klik odnosno tamo gde posavljamo figuru
            else {
                if (this.#currentSelectedSquare !== null) {

                    // proveravamo da li se kliknuto polje nalazi u nizu dostupnih polja
                    // ako se nalazi onda figuru stavljamo na to mesto
                    if (this.#availableSquares.some(square => square.contains(this.#boardElements[currentX][currentY]))) {

                        const prevX: number = this.#currentSelectedSquare.x
                        const prevY: number = this.#currentSelectedSquare.y
                        // setujemo da se pešak pomerio što ukida mogucnost da se u sledecem potezu pomeri za dva polja
                        // odnosno da su se kralj i top pomerili, pa je mogucnost rokade nemoguca

                        // ovde moze da se izvrsi cast u Piece odmah jer su u pitanju koordinate prevX i prevY a na njima se sigurno nalazi figura
                        // jer ovde registrujemo drugi klik sto znaci da smo vec selektovali figuru
                        const piece: Piece = (this.#boardPosition[prevX][prevY]) as Piece

                        // ukoliko je polje bilo creveno usled saha treba ga vratiti da ne bude
                        // mozda ima neki nacin da upamtim poziciju kralja
                        // pa de ne idem za dzabe kroz 64 polja iako to nije zahtevno
                        this.#boardElements.forEach(row => {
                            row.forEach(square => square.style.backgroundColor = "")
                        })

                        if (piece instanceof Pawn || piece instanceof Rook || piece instanceof King) {
                            piece.hasMoved = true
                        }

                        // enPassant
                        if (piece instanceof Pawn &&
                            Math.abs(currentX - prevX) === 1 && Math.abs(currentY - prevY) === 1 &&
                            this.#boardPosition[currentX][currentY] === null) {
                            const oppositeColorPawnPosX: number = currentX + (this.#playerColor === "white" ? -1 : 1)
                            const oppositeColorPawnPosY: number = currentY;

                            (this.#boardElements[oppositeColorPawnPosX][oppositeColorPawnPosY] as HTMLTableCellElement).innerHTML = ""
                            this.#boardPosition[oppositeColorPawnPosX][oppositeColorPawnPosY] = null
                            updatePosition(currentX, currentY)
                        }

                        // roakda, jer kralj jedino moze da se pomeri dva polja prilikom vrsenja rokade
                        else if (piece instanceof King && Math.abs(currentY - prevY) === 2) {

                            // currentY === 6 znaci da je u pitanju mala rokada
                            const rookNewPosY = currentY === 6 ? currentY - 1 : currentY + 1
                            const rookPrevPosY = currentY === 6 ? 7 : 0

                            this.#boardPosition[currentX][rookNewPosY] = this.#boardPosition[currentX][rookPrevPosY]
                            this.#boardElements[currentX][rookNewPosY].appendChild(this.#boardElements[currentX][rookPrevPosY].childNodes[0])
                            this.#boardPosition[currentX][rookNewPosY]!.y = rookNewPosY;
                            (this.#boardPosition[currentX][rookNewPosY] as Rook).hasMoved = true
                            this.#boardPosition[currentX][rookPrevPosY] = null

                            updatePosition(currentX, currentY)
                        }

                        else if (piece instanceof Pawn && (currentX === 0 || currentX === 7)) {
                            this.showPawnPromotionDialog(currentX, currentY, updatePosition)
                        }

                        // sve ostale kombinacije postavljanja figure na drugo polje
                        else {
                            updatePosition(currentX, currentY)
                        }
                    }
                }
            }
        }


        const updatePosition = (X: number, Y: number, promotedPiece = { element: null, img: null }): void => {
            // promotedPiece je viša figura u koju promovisemo pesaka
            // koordinate figure koju smo prethodno kliknuli, i koordinate mesta gde zelimo da je postavimo
            // sigurni smo da nije null jer je null samo inicijalno i sigurni smo da je u pitanju figura
            const prevX: number = this.#currentSelectedSquare!.x
            const prevY: number = this.#currentSelectedSquare!.y
            const currentX: number = X
            const currentY: number = Y
            this.#lastMove = { piece: this.#boardPosition[prevX][prevY] as Piece, xPositionChanged: Math.abs(prevX - currentX), yPositionChanged: Math.abs(prevY - currentY) }


            // ako je izvrsena promocija onda na koordinate od polja odakle dolazi pesak koji vrsi promociju
            // postavljamo da je prazno, jer smo zapravo ubacili poptuno novu figuru (sliku) umesto tog pesaka
            if (promotedPiece.element !== null) {
                this.#boardElements[prevX][prevY].innerHTML = ""
            }

            // ukoliko uzimamo protivnicku figuru koja se nalazi na toj poziciji onda je sklanjamo
            if (this.#boardElements[currentX][currentY].childNodes.length === 1) {
                this.#boardElements[currentX][currentY].innerHTML = ""
            }

            this.#boardPosition[currentX][currentY] = promotedPiece.element || this.#boardPosition[prevX][prevY]
            this.#boardPosition[prevX][prevY] = null

            // updejtujemo koordinatne ukoliko se na polju kojem zelimo da postavimo figuru nalazi portivnicka figura
            const nextPiece: chessPiece = this.#boardPosition[currentX][currentY]
            if (nextPiece instanceof Piece) {
                nextPiece.x = currentX
                nextPiece.y = currentY
            }

            // explicitno stavljam da objekti nisu null priliko promovisanja figure jer su tad sigurno definisani
            this.#boardElements[currentX][currentY].appendChild(
                promotedPiece.element !== null ?
                    promotedPiece.img! : this.#currentSelectedSquare!.square.childNodes[0]
            )

            this.#currentSelectedSquare!.square.style.pointerEvents = "none"
            this.#currentSelectedSquare!.square.style.cursor = "arrow"
            this.#currentSelectedSquare!.square.style.outline = ""

            this.#currentSelectedSquare = this.#previousSelectedSquare = null
            this.removeCursorsFromUnavailableSquares()
            this.#availableSquares = []
            this.#isWhiteMove = !this.#isWhiteMove
            this.changePlayer();
            (document.querySelector(".whoIsPlaying") as HTMLDivElement).innerText = this.#isWhiteMove ? "White's move" : "Black's move"


            // provera da li je nastupio šah
            const isCheck: boolean = this.isCheck(false, this.#playerColor)
            this.#playerColor = this.#isWhiteMove ? Color.WHITE : Color.BLACK
            const listOfAllAvailableSquares: ListOfAllAvailableSquares = this.findAvailableSquares(this.#playerColor)

            if (!Object.keys(listOfAllAvailableSquares).length) {
                if (isCheck) {
                    const winner: string = (this.#playerColor === Color.WHITE ? Color.BLACK : Color.WHITE).toUpperCase();
                    (document.querySelector(".whoIsPlaying") as HTMLDivElement).innerText = winner + " win by checkmate";
                }
                else {
                    (document.querySelector(".whoIsPlaying") as HTMLDivElement).innerText = "Stalemate"
                }
                this.#boardElements.forEach(row => {
                    row.forEach(square => {
                        square.style.pointerEvents = "none"
                    })
                })
            }
        }
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
        const oppositeColorPlayer = this.#playerColor === Color.WHITE ? Color.BLACK : Color.WHITE
        const isCheck: boolean = this.isCheck(true, oppositeColorPlayer)
        this.#boardPosition[prevX][prevY] = oldPiece
        this.#boardPosition[newX][newY] = newPiece

        return !isCheck
    }

    // dakle ova funkija mi vraća niz svih dosupnih polja
    findAvailableSquares(colorToCheck: Color): ListOfAllAvailableSquares {

        // objekat koji za kljuc ima koordinate figure koje mogu da odigraju potez, a vrednost su polja na koja moze da stane
        const listOfAllAvailableSquares: ListOfAllAvailableSquares = {}

        for (const row of this.#boardPosition) {
            for (const piece of row) {
                if (!piece || piece.color !== colorToCheck) continue

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
                        if (nextPiece === null || nextPiece.color !== this.#playerColor) {
                            if (this.isSquareSafe(X, Y, newX, newY)) {
                                safeSquares.push(this.#boardElements[newX][newY])
                            }
                        }
                    }
                    else {
                        while (this.isSquareValid(newX, newY)) {
                            nextPiece = this.#boardPosition[newX][newY]
                            if (nextPiece === null || nextPiece.color !== this.#playerColor) {
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

    showPawnPromotionDialog(currentX: number, currentY: number, updatePosition: Function): void {
        const pieceImages: string[] = ["bishop", "knight", "rook", "queen"]
        const pawnPromoitionPopUp = document.createElement("div") as HTMLDivElement
        pawnPromoitionPopUp.classList.add("pawn-promotion-popup")
        document.body.appendChild(pawnPromoitionPopUp)

        const btnClose = document.createElement("div") as HTMLDivElement
        btnClose.classList.add("btn-close")
        pawnPromoitionPopUp.appendChild(btnClose)

        const btnClose$: Observable<Event> = fromEvent(btnClose, "click")
        btnClose$.pipe(
            tap(() => {
                pawnPromoitionPopUp.style.display = "none"
            })
        )

        for (const pieceImage of pieceImages) {
            const figureOption = document.createElement("div") as HTMLDivElement
            figureOption.classList.add("figure-option")
            const figureImage = document.createElement("img") as HTMLImageElement
            figureImage.src = `src/assets/${this.#playerColor} ${pieceImage}.png`
            figureImage.alt = this.#playerColor + " " + pieceImage

            figureImage.addEventListener("click", () => {
                let newPiece: Piece
                switch (pieceImage) {
                    case PieceType.QUEEN:
                        newPiece = new Queen(this.#playerColor, currentX, currentY)
                        break
                    case PieceType.ROOK:
                        newPiece = new Rook(this.#playerColor, currentX, currentY)
                        break
                    case PieceType.BISHOP:
                        newPiece = new Bishop(this.#playerColor, currentX, currentY)
                        break
                    case PieceType.KNIGHT:
                    default:
                        newPiece = new Knight(this.#playerColor, currentX, currentY)
                }

                // moramo da onemogucimo klik na figuru koja se promovisala
                figureImage.style.pointerEvents = "none"
                const promotedPiece: IPromotedPiece = { element: newPiece, img: figureImage }
                updatePosition(currentX, currentY, promotedPiece)
                pawnPromoitionPopUp.style.display = "none"
            })

            figureOption.appendChild(figureImage)
            pawnPromoitionPopUp.appendChild(figureOption)
        }
    }
}


