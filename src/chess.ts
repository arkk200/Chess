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
import { update } from 'firebase/database';
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
  chessNameMat: (string | 0)[][];

  constructor() {
    this.playerColor = "";
    this.turn = "W";
    this.chessNameMat = [
      ["Black-Rook", "Black-Knight", "Black-Bishop", "Black-Queen", "Black-King", "Black-Bishop", "Black-Knight", "Black-Rook"],
      new Array(8).fill("Black-Pawn"),
      new Array(8).fill(0),
      new Array(8).fill(0),
      new Array(8).fill(0),
      new Array(8).fill(0),
      new Array(8).fill("White-Pawn"),
      ["White-Rook", "White-Knight", "White-Bishop", "White-Queen", "White-King", "White-Bishop", "White-Knight", "White-Rook"]
    ];

    this.chessPiecesName = ["Black-Rook", "Black-Knight", "Black-Bishop", "Black-Queen", "Black-King", "Black-Pawn", "White-Rook", "White-Knight", "White-Bishop", "White-Queen", "White-King", "White-Pawn"];
  }

  setChess() {
    this.setupDefault();
    this.setupLights();
    this.setupModels();
    this.setEvents();
    this.setupRendering();
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
    this.camera.position.set(0, 30, 30);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(this.renderer.domElement);

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
        if(this.chessNameMat[i][j] !== 0) {
          this.createPiece(this.getConvertedPosFromMat({ x: i, y: j }), this.chessNameMat[i][j] as string);
        }
      }
    }
  }
  createPiece(boardPos: THREE.Vector3, name: string) {
    const piece = this.models.getObjectByName(name)?.clone();
    piece?.position.set(boardPos.x, boardPos.y, boardPos.z);
    if (piece) piece.name = name;
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

    if (intersectObject.name === "Guide" || !intersectObject.name.startsWith(this.turn)) { // 가이브 메쉬를 클릭했다면
      if(!this.prevIntersectChessPiece) return;
      this.outlinePass.selectedObjects = [];
      this.tl = gsap.timeline();
      const curMat = this.getConvertedMatFromPos(this.prevIntersectChessPiece.position);
      const movMat = this.getConvertedMatFromPos(intersectObject.position);
      this.tl.to(this.prevIntersectChessPiece.position, { x: intersectObject?.position.x, z: intersectObject?.position.z, duration: 1, ease: "power2.inOut" });
      
      this.tl.to({}, { onUpdate: () => {
        const matrix = this.getConvertedMatFromPos((intersectObject as THREE.Object3D).position);
        if(this.chessNameMat[matrix.x][matrix.y] !== 0) {
          this.scene.remove(this.scene.getObjectByName(this.chessNameMat[matrix.x][matrix.y] as string) as THREE.Object3D);
        }
        this.chessNameMat[movMat.x][movMat.y] = this.chessNameMat[curMat.x][curMat.y];
        this.chessNameMat[curMat.x][curMat.y] = 0;
        this.turn = this.turn === "W" ? "B" : "W";
        update(ridref, { turn: this.turn, board: JSON.stringify(this.chessNameMat) });
        
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
  

  setupRendering() {
    const animate = () => {
      requestAnimationFrame(animate);

      this.controls.update();
      this.composer.render();
    }
    animate();
  }
}