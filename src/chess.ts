import * as THREE from 'three';
import gsap from 'gsap';
import { remove, update } from 'firebase/database';
import { ridref } from './main';
import { pieceMeshInfo } from './types';
import { getNameFromInfo, getMatFromPos, getPosFromMat } from './utils';
import ChessSetup from './chessSetup';

export class App extends ChessSetup {
  prevClickedChessPiece!: THREE.Object3D | null;
  guidemesh!: THREE.Mesh;
  tl!: GSAPTimeline;
  turn: string;

  constructor() {
    super();
    this.turn = "W";
  }

  setChess() {
    this.setupDefault();
    this.setupLights();
    this.setupModels();
    this.setupEvents();
    this.setupRendering();
  }
  setupEvents() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('dblclick', this.onDblClick);
  }
  onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.composer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.effectFXAA.uniforms.resolution.value.set(0, 0);
  }
  onMouseMove = (event: MouseEvent) => {
    if (this.tl?.isActive()) return;

    let intersectObject = this.getIntesectObject(event);
    if (!intersectObject) return;
    if (!this.prevClickedChessPiece) return; // 말이 선택되어야 함

    if (intersectObject.name.startsWith("Cube")) {
      intersectObject = intersectObject.parent;
    }

    intersectObject && this.showGuide(intersectObject);
  }
  showGuide(intersectObject: THREE.Object3D) {
    this.guidemesh && this.scene.remove(this.guidemesh);

    this.guidemesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 4),
      new THREE.MeshStandardMaterial({ color: "red" })
    );

    this.guidemesh.position.set(intersectObject.position.x, 0.505, intersectObject.position.z)
    this.guidemesh.rotateX(Math.PI / -2);
    this.guidemesh.name = "Guide";
    this.scene.add(this.guidemesh);
  }
  onMouseUp = (event: MouseEvent) => {
    if (this.tl?.isActive()) return;

    let piece = <pieceMeshInfo>this.getIntesectObject(event);

    if (!piece) return;

    if (piece.color === this.playerColor && this.turn === this.playerColor) { // 체스 말을 클릭했다면
      if (piece === this.prevClickedChessPiece) { // 같은 말을 한번 더 눌렀다면
        this.guidemesh && this.scene.remove(this.guidemesh);
        this.outlinePass.selectedObjects = [];
        this.prevClickedChessPiece = null;
      }
      else {
        this.outlinePass.selectedObjects = Array.from([piece]);
        this.prevClickedChessPiece = piece;
      }
    }
  }
  onDblClick = (event: MouseEvent) => {
    if (this.tl?.isActive()) return;

    let piece = this.getIntesectObject(event);

    if (!piece || !this.prevClickedChessPiece) return;

    if (piece.name === "Guide" || (<pieceMeshInfo>piece).color !== (this.turn)) {
      this.outlinePass.selectedObjects = [];
      this.tl = gsap.timeline();
      const currentMat = getMatFromPos(this.prevClickedChessPiece.position);
      const targetMat = getMatFromPos(piece.position);

      console.log(this.piecesNameMat);
      update(ridref, { turn: this.turn, board: JSON.stringify(this.piecesNameMat), prevMov: JSON.stringify([currentMat, targetMat]) });

      this.guidemesh && this.scene.remove(this.guidemesh);
      this.prevClickedChessPiece = null;
    }
  }
  getIntesectObject(event: MouseEvent) {
    const mouse = {
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: -(event.clientY / window.innerHeight) * 2 + 1
    }
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    const intersects = raycaster.intersectObjects(this.scene.children);
    if (intersects.length === 0) return null;
    return intersects[0].object;
  }

  movChessPiece(prevMovMats: [{ x: number, y: number }, { x: number, y: number }]) {
    console.log(prevMovMats);
    if (!prevMovMats) return;

    const [currentMat, targetMat] = prevMovMats;
    const curPieceInfo = this.piecesNameMat[currentMat.x][currentMat.y];
    const targetPieceInfo = this.piecesNameMat[targetMat.x][targetMat.y];

    if (curPieceInfo === 0) return;

    if (targetPieceInfo !== 0 && curPieceInfo.color === targetPieceInfo.color) return; // 만약 이동하려는 칸에 같은 색의 체스말이 있다면
    this.tl = gsap.timeline();

    const targetPos = getPosFromMat(targetMat);

    this.tl.to(this.scene.getObjectByName(getNameFromInfo(curPieceInfo))!.position, { x: targetPos.x, z: targetPos.z, duration: 1, ease: "power2.inOut" });

    this.piecesNameMat[targetMat.x][targetMat.y] = this.piecesNameMat[currentMat.x][currentMat.y];
    this.piecesNameMat[currentMat.x][currentMat.y] = 0;
    this.turn = this.turn === "W" ? "B" : "W";

    if (targetPieceInfo === 0) return;
    this.tl.to({}, {
      onUpdate: () => {
        this.scene.remove(this.scene.getObjectByName(getNameFromInfo(targetPieceInfo)) as THREE.Object3D);

        if (targetPieceInfo.role === 'K') {
          setTimeout(() => {
            if (targetPieceInfo.color === this.playerColor) alert('당신이 졌습니다.');
            else alert('당신이 이겼습니다.')
            remove(ridref);
            window.location.reload();
          }, 100);
        }
      }, duration: 0
    });
  }

  setupRendering() {
    const animate = () => {
      requestAnimationFrame(animate);

      this.controls.update();
      this.composer.render();
    }
    animate();
  }
}