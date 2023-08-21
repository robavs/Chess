import { fromEvent, tap } from "rxjs";
import ChessBoard from "./components/Chessboard";

fromEvent(document, "contextmenu").pipe(
    tap(event => event.preventDefault())
).subscribe()

fromEvent(document, "dragstart").pipe(
    tap(event => event.preventDefault())
).subscribe()

ChessBoard.getInstsance().startGame()