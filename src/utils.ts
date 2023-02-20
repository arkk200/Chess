import * as THREE from 'three';
import { pieceInfo } from "./types";

const getModelName = (pieceInfo: pieceInfo) => {
    switch (pieceInfo.role) {
        case 'P1':
        case 'P2':
        case 'P3':
        case 'P4':
        case 'P5':
        case 'P6':
        case 'P7':
        case 'P8':
            return `${pieceInfo.color === 'W' ? 'White' : 'Black'}-Pawn`;
        case 'R1':
        case 'R2':
            return `${pieceInfo.color === 'W' ? 'White' : 'Black'}-Rook`;
        case 'N1':
        case 'N2':
            return `${pieceInfo.color === 'W' ? 'White' : 'Black'}-Knight`;
        case 'B1':
        case 'B2':
            return `${pieceInfo.color === 'W' ? 'White' : 'Black'}-Bishop`;
        case 'Q':
            return `${pieceInfo.color === 'W' ? 'White' : 'Black'}-Queen`;
        case 'K':
            return `${pieceInfo.color === 'W' ? 'White' : 'Black'}-King`;
        default:
            return ''
    }
}
const getNameFromInfo = (pieceInfo: pieceInfo) => `${pieceInfo.color}${pieceInfo.role}`

const getMatFromPos = (position: THREE.Vector3) => ({ x: Math.floor((position.z + 14) / 4), y: Math.floor((position.x + 14) / 4) })
const getPosFromMat = (mat: { x: number, y: number }) => new THREE.Vector3(-14 + mat.y * 4, 0.5, -14 + mat.x * 4)

export { getModelName, getNameFromInfo, getMatFromPos, getPosFromMat };