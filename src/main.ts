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

class App {
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
  turn: string;
  boardMat: (THREE.Object3D | undefined)[][];

  constructor() {
    this.turn = "W";
    this.boardMat = [[], [], [], [], [], [], [], []];

    this.chessPiecesName = ['BP1', 'BP2', 'BP3', 'BP4', 'BP5', 'BP6', 'BP7', 'BP8', 'BR1', 'BR2', 'BN1', 'BN2', 'BB1', 'BB2', 'BQ', 'BK', 'WP1', 'WP2', 'WP3', 'WP4', 'WP5', 'WP6', 'WP7', 'WP8', 'WR1', 'WR2', 'WN1', 'WN2', 'WB1', 'WB2', 'WQ', 'WK'];
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

    this.createPawn();
    this.boardMat[0][0] = this.createPiece({ x: -14, y: 0.5, z: -14 }, "Black-Rook", 'BR1'); this.boardMat[0][7] = this.createPiece({ x: 14, y: 0.5, z: -14 }, "Black-Rook", 'BR2');
    this.boardMat[0][1] = this.createPiece({ x: -10, y: 0.5, z: -14 }, "Black-Knight", 'BN1'); this.boardMat[0][6] = this.createPiece({ x: 10, y: 0.5, z: -14 }, "Black-Knight", 'BN2');
    this.boardMat[0][2] = this.createPiece({ x: -6, y: 0.5, z: -14 }, "Black-Bishop", 'BB1'); this.boardMat[0][5] = this.createPiece({ x: 6, y: 0.5, z: -14 }, "Black-Bishop", 'BB2');
    this.boardMat[0][3] = this.createPiece({ x: -2, y: 0.5, z: -14 }, "Black-Queen", 'BQ'); this.boardMat[0][4] = this.createPiece({ x: 2, y: 0.5, z: -14 }, "Black-King", 'BK');
    this.boardMat[7][0] = this.createPiece({ x: -14, y: 0.5, z: 14 }, "White-Rook", 'WR1'); this.boardMat[7][7] = this.createPiece({ x: 14, y: 0.5, z: 14 }, "White-Rook", 'WR2');
    this.boardMat[7][1] = this.createPiece({ x: -10, y: 0.5, z: 14 }, "White-Knight", 'WN1'); this.boardMat[7][6] = this.createPiece({ x: 10, y: 0.5, z: 14 }, "White-Knight", 'WN2');
    this.boardMat[7][2] = this.createPiece({ x: -6, y: 0.5, z: 14 }, "White-Bishop", 'WB1'); this.boardMat[7][5] = this.createPiece({ x: 6, y: 0.5, z: 14 }, "White-Bishop", 'WB2');
    this.boardMat[7][3] = this.createPiece({ x: -2, y: 0.5, z: 14 }, "White-Queen", 'WQ'); this.boardMat[7][4] = this.createPiece({ x: 2, y: 0.5, z: 14 }, "White-King", 'WK');
  }
  createPawn() {
    for (let i = 0; i < 8; i++) {
      this.boardMat[1][i] = this.createPiece({ x: -14 + i * 4, y: 0.5, z: -10 }, "Black-Pawn", `BP${i+1}`);
      this.boardMat[6][i] = this.createPiece({ x: -14 + i * 4, y: 0.5, z: 10 }, "White-Pawn", `WP${i+1}`);
    }
  }
  createPiece(boardPos: { x: number, y: number, z: number }, name: string, meshName: string) {
    const piece = this.models.getObjectByName(name)?.clone();
    piece?.position.set(boardPos.x, boardPos.y, boardPos.z);
    if (piece) piece.name = meshName;
    piece && this.scene.add(piece);
    return piece;
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

    // console.log(intersectObject);
  }
  onMouseUp = (e: MouseEvent) => {
    if(this.tl && this.tl.isActive()) return;

    let intersectObject = this.getIntesectObject(e);
    if (!intersectObject) return;

    if (this.chessPiecesName.includes(intersectObject.name) && intersectObject.name.startsWith(this.turn)) { // 체스 말을 클릭했다면
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
      const curMat = this.getConvertedMat(this.prevIntersectChessPiece.position);
      const movMat = this.getConvertedMat(intersectObject.position);
      this.tl.to(this.prevIntersectChessPiece.position, { x: intersectObject?.position.x, z: intersectObject?.position.z, duration: 1, ease: "power2.inOut" });
      
      this.tl.to({}, { onUpdate: () => {
        const matrix = this.getConvertedMat((intersectObject as THREE.Object3D).position);
        if(this.boardMat[matrix.x][matrix.y]) {
          this.scene.remove(this.boardMat[matrix.x][matrix.y] as THREE.Object3D);
        }
        this.boardMat[movMat.x][movMat.y] = this.boardMat[curMat.x][curMat.y];
        
        this.guidemesh && this.scene.remove(this.guidemesh);
        this.prevIntersectChessPiece = null;
        console.log(this.boardMat, this.scene);
      }, duration: 0});
      this.turn = this.turn === "W" ? "B" : "W";
    }
  }
  getConvertedMat(position: THREE.Vector3) {
    const x = Math.floor((position.z + 14) / 4);
    const y = Math.floor((position.x + 14) / 4);
    return { x, y };
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

window.onload = () => {
  new App();
}