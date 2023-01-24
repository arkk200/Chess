import './style.css'
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import gsap from 'gsap';
import { remove, update } from 'firebase/database';
import { ridref } from './main';

export class App {
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGLRenderer;
  models!: THREE.Object3D;
  controls!: OrbitControls;
  pointLight!: THREE.PointLight;
  composer!: EffectComposer;
  outlinePass!: OutlinePass;
  effectFXAA!: ShaderPass;
  chessPiecesName: string[];
  prevIntersectChessPiece!: THREE.Object3D | null;
  guidemesh!: THREE.Mesh;
  tl!: GSAPTimeline;
  playerColor: string;
  turn: string;
  chessMeshNameMat: (string | 0)[][];
  isEnd: boolean;
  RUWinner: boolean;

  constructor() {
    this.playerColor = "";
    this.turn = "W";
    this.isEnd = false;
    this.RUWinner = false;
    this.chessMeshNameMat = [
      ["BR1", "BN1", "BB1", "BQ", "BK", "BB2", "BN2", "BR2"],
      ["BP1", "BP2", "BP3", "BP4", "BP5", "BP6", "BP7", "BP8"],
      new Array(8).fill(0),
      new Array(8).fill(0),
      new Array(8).fill(0),
      new Array(8).fill(0),
      ["WP1", "WP2", "WP3", "WP4", "WP5", "WP6", "WP7", "WP8"],
      ["WR1", "WN1", "WB1", "WQ", "WK", "WB2", "WN2", "WR2"]
    ];

    this.chessPiecesName = ["BR1", "BR2", "BN1", "BN2", "BB1", "BB2", "BQ", "BK", "BP1", "BP2", "BP3", "BP4", "BP5", "BP6", "BP7", "BP8", "WR1", "WR2", "WN1", "WN2", "WB1", "WB2", "WQ", "WK", "WP1", "WP2", "WP3", "WP4", "WP5", "WP6", "WP7", "WP8"];
  }

  setChess() {
    this.setupDefault();
    this.setupLights();
    this.setupModels();
    this.setEvents();
    this.setupRendering();
    this.setupDomControls();
  }

  setupDefault() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("gray");

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 30, 30 * (this.playerColor === "B" ? -1 : 1));

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.querySelector('.game-screen')?.appendChild(this.renderer.domElement);

    const renderTarget = new THREE.WebGLRenderTarget(1024, 1024, { stencilBuffer: true });



    this.composer = new EffectComposer(this.renderer, renderTarget);
    this.composer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), this.scene, this.camera);
    this.outlinePass.edgeStrength = 10;
    this.outlinePass.edgeGlow = 1;
    this.outlinePass.edgeThickness = 4;
    this.outlinePass.visibleEdgeColor.set("white");
    this.outlinePass.hiddenEdgeColor.set("white");
    this.composer.addPass(this.outlinePass);

    this.effectFXAA = new ShaderPass(FXAAShader);
    this.effectFXAA.uniforms['resolution'].value.set(0, 0);
    this.effectFXAA.renderToScreen = true;
    this.composer.addPass(this.effectFXAA);



    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.minDistance = 40;
    this.controls.maxDistance = 100;
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.zoomSpeed = 0.5;
  }

  setupLights() {
    const light = new THREE.AmbientLight("white", 0.5);
    this.scene.add(light);

    for (let i = 0; i < 4; i++) {
      this.pointLight = new THREE.PointLight("white", 1);
      this.pointLight.position.set(200 * (Math.floor(i / 2) > 0 ? -1 : 1), 40, 200 * (i % 2 === 0 ? -1 : 1));
      this.scene.add(this.pointLight);
    }
  }

  setupModels() {
    new GLTFLoader().load("/chess.glb", gltf => {
      this.models = gltf.scene
      this.createBoard();
      this.createPieces();
    });
  }
  createBoard() {
    const board = this.models.getObjectByName("Board");
    if(!board) return;

    this.scene.add(board);
  }
  createPieces() {
    for(let i = 0; i < 8; i++) {
      for(let j = 0; j < 8; j++) {
        if(this.chessMeshNameMat[i][j] !== 0) {
          this.createPiece(this.getConvertedPosFromMat({ x: i, y: j }), this.getNameFromMeshName(<string>this.chessMeshNameMat[i][j]), this.chessMeshNameMat[i][j] as string)
        }
      }
    }
  }
  getNameFromMeshName(meshName: string) {
    switch(meshName) {
      case 'BP1':
      case 'BP2':
      case 'BP3':
      case 'BP4':
      case 'BP5':
      case 'BP6':
      case 'BP7':
      case 'BP8':
        return 'Black-Pawn';
      case 'BR1': 
      case 'BR2':
        return 'Black-Rook';
      case 'BN1':
      case 'BN2':
        return 'Black-Knight';
      case 'BB1':
      case 'BB2':
        return 'Black-Bishop';
      case 'BQ':
        return 'Black-Queen';
      case 'BK':
        return 'Black-King';
      case 'WP1':
      case 'WP2':
      case 'WP3':
      case 'WP4':
      case 'WP5':
      case 'WP6':
      case 'WP7':
      case 'WP8':
        return 'White-Pawn';
      case 'WR1': 
      case 'WR2':
        return 'White-Rook';
      case 'WN1':
      case 'WN2':
        return 'White-Knight';
      case 'WB1':
      case 'WB2':
        return 'White-Bishop';
      case 'WQ':
        return 'White-Queen';
      case 'WK':
        return 'White-King';
      default:
        return "";
    }
  }
  createPawn() {
    for (let i = 0; i < 8; i++) {
      this.chessMeshNameMat[1][i] = this.createPiece({ x: -14 + i * 4, y: 0.5, z: -10 }, "Black-Pawn", `BP${i+1}`);
      this.chessMeshNameMat[6][i] = this.createPiece({ x: -14 + i * 4, y: 0.5, z: 10 }, "White-Pawn", `WP${i+1}`);
    }
  }
  createPiece(boardPos: { x: number, y: number, z: number }, name: string, meshName: string) {
    const piece = this.models.getObjectByName(name)?.clone();
    piece?.position.set(boardPos.x, boardPos.y, boardPos.z);
    if (piece) piece.name = meshName;
    piece && this.scene.add(piece);
    return piece!.name;
  }

  setEvents() {
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

    this.composer.setSize( window.innerWidth, window.innerHeight );
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.effectFXAA.uniforms.resolution.value.set(0, 0);
  }
  getIntesectObject(e: MouseEvent) {
    const mouse = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1
    }
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    const intersects = raycaster.intersectObjects(this.scene.children);
    if (intersects.length === 0) return null;
    return intersects[0].object;
  }
  onMouseMove = (e: MouseEvent) => {
    if(this.tl && this.tl.isActive()) return;

    let intersectObject = this.getIntesectObject(e);
    if (!intersectObject) return;
    if(!this.prevIntersectChessPiece) return; // 말이 선택되어야 함

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
  onMouseUp = (e: MouseEvent) => {
    if(this.tl && this.tl.isActive()) return;

    let intersectObject = this.getIntesectObject(e);
    if (!intersectObject) return;

    if (this.chessPiecesName.includes(intersectObject.name) && intersectObject.name.startsWith(this.turn) && this.turn === this.playerColor) { // 체스 말을 클릭했다면
      if(intersectObject === this.prevIntersectChessPiece) { // 같은 말을 한번 더 눌렀다면
        this.guidemesh && this.scene.remove(this.guidemesh);
        this.outlinePass.selectedObjects = [];
        this.prevIntersectChessPiece = null;
      }
      else {
        this.outlinePass.selectedObjects = Array.from([intersectObject]);
        this.prevIntersectChessPiece = intersectObject;
      }
    }
  }
  onDblClick = (e: MouseEvent) => {
    if(this.tl && this.tl.isActive()) return;

    let intersectObject = this.getIntesectObject(e);
    if (!intersectObject) return;
    if(!this.prevIntersectChessPiece) return;

    if (intersectObject.name === "Guide" || !intersectObject.name.startsWith(this.turn)) { // 가이브 메쉬(빨간 판대기)를 클릭하거나 상대말을 클릭했다면
      this.outlinePass.selectedObjects = [];
      this.tl = gsap.timeline();
      const curMat = this.getConvertedMatFromPos(this.prevIntersectChessPiece.position);
      const movMat = this.getConvertedMatFromPos(intersectObject.position);
      
      this.tl.to({}, { onUpdate: () => {
        update(ridref, { turn: this.turn, board: JSON.stringify(this.chessMeshNameMat), prevMov: JSON.stringify([curMat, movMat]) });
        
        this.guidemesh && this.scene.remove(this.guidemesh);
        this.prevIntersectChessPiece = null;
      }, duration: 0});
    }
  }
  getConvertedMatFromPos(position: THREE.Vector3) {
    const x = Math.floor((position.z + 14) / 4);
    const y = Math.floor((position.x + 14) / 4);
    return { x, y };
  }
  getConvertedPosFromMat(mat: { x: number, y: number }) {
    return new THREE.Vector3(-14 + mat.y * 4, 0.5, -14 + mat.x * 4);
  }

  movChessPiece(mat: [{ x: number, y: number }, { x: number, y: number }]) {
    if(!mat) return;

    const [curMat, movMat] = mat;
    const movPos = this.getConvertedPosFromMat(movMat);
    const curChessName = this.chessMeshNameMat[curMat.x][curMat.y];
    const movChessName = this.chessMeshNameMat[movMat.x][movMat.y];
    if(curChessName !== 0 && movChessName !== 0) {
      if(curChessName[0] === movChessName[0]) {
        console.log("Do not teamkill!");
        return;
      }
    }
    this.tl = gsap.timeline();
    
    curChessName !== 0 && this.tl.to(this.scene.getObjectByName(curChessName)!.position, { x: movPos.x, z: movPos.z, duration: 1, ease: "power2.inOut" });
    this.tl.to({}, { onUpdate: () => {
      this.chessMeshNameMat[movMat.x][movMat.y] = this.chessMeshNameMat[curMat.x][curMat.y];
      this.chessMeshNameMat[curMat.x][curMat.y] = 0;
      this.turn = this.turn === "W" ? "B" : "W";
      if(movChessName !== 0) {
        this.scene.remove(this.scene.getObjectByName(movChessName) as THREE.Object3D);
        if(movChessName === "BK" || movChessName === "WK") {
          // 잡힌 말이 무슨 색으로 시작하는가
          setTimeout(() => { // 왕이 사라지는 것까지 보이게 함
            if(movChessName.startsWith(this.playerColor)) alert('당신이 졌습니다.');
            else alert('당신이 이겼습니다.')
            remove(ridref);
            window.location.reload();
          }, 100);
        }
      }
    }, duration: 0});
  }

  setupDomControls() {
    const $GGBtn = document.querySelector('.GG-btn');
    $GGBtn?.addEventListener('click', () => {
      const ok = confirm("포기하시겠습니까?");
      if(ok) {
        update(ridref, { winner: this.playerColor === "W" ? "B" : "W" });
      }
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