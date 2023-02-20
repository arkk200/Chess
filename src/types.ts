import { Object3D } from "three"

type pieceInfo = { role: string, color: string }
type chessBoard = (pieceInfo | 0)[][]

type pieceMeshInfo = Object3D<Event> & { role: string, color: string }

export type { pieceInfo, chessBoard, pieceMeshInfo }