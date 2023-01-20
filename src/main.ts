import './style.css'
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';


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

  constructor() {
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
    this.createPiece({ x: -14, y: 0.5, z: -14 }, "Black-Rook", 'BR1'); this.createPiece({ x: 14, y: 0.5, z: -14 }, "Black-Rook", 'BR2');
    this.createPiece({ x: -10, y: 0.5, z: -14 }, "Black-Knight", 'BN1'); this.createPiece({ x: 10, y: 0.5, z: -14 }, "Black-Knight", 'BN2');
    this.createPiece({ x: -6, y: 0.5, z: -14 }, "Black-Bishop", 'BB1'); this.createPiece({ x: 6, y: 0.5, z: -14 }, "Black-Bishop", 'BB2');
    this.createPiece({ x: -2, y: 0.5, z: -14 }, "Black-Queen", 'BQ'); this.createPiece({ x: 2, y: 0.5, z: -14 }, "Black-King", 'BK');
    this.createPiece({ x: -14, y: 0.5, z: 14 }, "White-Rook", 'WR1'); this.createPiece({ x: 14, y: 0.5, z: 14 }, "White-Rook", 'WR2');
    this.createPiece({ x: -10, y: 0.5, z: 14 }, "White-Knight", 'WN1'); this.createPiece({ x: 10, y: 0.5, z: 14 }, "White-Knight", 'WN2');
    this.createPiece({ x: -6, y: 0.5, z: 14 }, "White-Bishop", 'WB1'); this.createPiece({ x: 6, y: 0.5, z: 14 }, "White-Bishop", 'WB2');
    this.createPiece({ x: -2, y: 0.5, z: 14 }, "White-Queen", 'WQ'); this.createPiece({ x: 2, y: 0.5, z: 14 }, "White-King", 'WK');

  }
  createPawn() {
    for (let i = 0; i < 8; i++) {
      this.createPiece({ x: -14 + i * 4, y: 0.5, z: -10 }, "Black-Pawn", `BP${i+1}`);
      this.createPiece({ x: -14 + i * 4, y: 0.5, z: 10 }, "White-Pawn", `WP${i+1}`);
    }
  }
  createPiece(boardPos: { x: number, y: number, z: number }, name: string, meshName: string) {
    const piece = this.models.getObjectByName(name)?.clone();
    piece?.position.set(boardPos.x, boardPos.y, boardPos.z);
    if (piece) piece.name = meshName;
    piece && this.scene.add(piece);
  }

  setEvents() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousedown', this.onMouseDown);
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
  onMouseDown = (e: MouseEvent) => {
    let intersectObject = this.getIntesectObject(e);
    if (!intersectObject) return;

    if (intersectObject.name.startsWith("Cube")) { // 보드를 클릭했다면
      intersectObject = intersectObject.parent;

    } else if (this.chessPiecesName.includes(intersectObject.name)) { // 체스 말을 클릭했다면
      this.outlinePass.selectedObjects = Array.from([intersectObject]);
    }
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