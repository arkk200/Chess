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
  pLight!: THREE.PointLight;
  chessPieces!: THREE.Object3D;
  composer!: EffectComposer;
  outlinePass!: OutlinePass;
  effectFXAA!: ShaderPass;

  constructor() {
    this.setupInit();
    this.setupLights();
    this.setupModels();
    this.setEvents();
    this.setupRendering();
  }



  setupInit() {
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

    const renderTarget = new THREE.WebGLRenderTarget(1024, 1024, {
      stencilBuffer: true
    });



    this.composer = new EffectComposer(this.renderer, renderTarget);
    this.composer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), this.scene, this.camera);
    this.composer.addPass(this.outlinePass);

    this.effectFXAA = new ShaderPass(FXAAShader);
    this.effectFXAA.uniforms['resolution'].value.set(0, 0);
    this.effectFXAA.renderToScreen = true;
    this.composer.addPass(this.effectFXAA);
    


    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }



  setupLights() {
    const light = new THREE.AmbientLight("white", 0.5);
    this.scene.add(light);

    for(let i = 0; i < 4; i++) {
      this.pLight = new THREE.PointLight("white", 1);
      this.pLight.position.set(200 * (Math.floor(i / 2) > 0 ? -1 : 1), 40, 200 * (i % 2 === 0 ? -1 : 1));
      this.scene.add(this.pLight);
    }
  }



  setupModels() {
    new GLTFLoader().load("/chess.glb", gltf =>  {
      this.models = gltf.scene
      this.createBoard();
      this.createPieces();
    });
  }
  createBoard() {
    const board = this.models.getObjectByName("Board");
    board && this.scene.add(board);
  }
  createPieces() {

    this.createPawn();
    this.createPiece({ x: -14, y: 0.5, z: -14 }, "Black-Rook"); this.createPiece({ x: 14, y: 0.5, z: -14 }, "Black-Rook");
    this.createPiece({ x: -10, y: 0.5, z: -14 }, "Black-Knight"); this.createPiece({ x: 10, y: 0.5, z: -14 }, "Black-Knight");
    this.createPiece({ x: -6, y: 0.5, z: -14 }, "Black-Bishop"); this.createPiece({ x: 6, y: 0.5, z: -14 }, "Black-Bishop");
    this.createPiece({ x: -2, y: 0.5, z: -14 }, "Black-Queen"); this.createPiece({ x: 2, y: 0.5, z: -14 }, "Black-King");
    this.createPiece({ x: -14, y: 0.5, z: 14 }, "White-Rook"); this.createPiece({ x: 14, y: 0.5, z: 14 }, "White-Rook");
    this.createPiece({ x: -10, y: 0.5, z: 14 }, "White-Knight"); this.createPiece({ x: 10, y: 0.5, z: 14 }, "White-Knight");
    this.createPiece({ x: -6, y: 0.5, z: 14 }, "White-Bishop"); this.createPiece({ x: 6, y: 0.5, z: 14 }, "White-Bishop");
    this.createPiece({ x: -2, y: 0.5, z: 14 }, "White-Queen"); this.createPiece({ x: 2, y: 0.5, z: 14 }, "White-King");

  }
  createPawn() {
    for(let i = 0; i < 8; i++) {
      this.createPiece({ x: -14 + i * 4, y: 0.5, z: -10}, "Black-Pawn");
      this.createPiece({ x: -14 + i * 4, y: 0.5, z: 10}, "White-Pawn");
    }
  }
  createPiece(boardPos: { x: number, y: number, z: number }, name: string) {
    const piece = this.models.getObjectByName(name)?.clone();
    piece?.position.set(boardPos.x, boardPos.y, boardPos.z);
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
    this.renderer.setSize( window.innerWidth, window.innerHeight );

    // this.composer.setSize( window.innerWidth, window.innerHeight );
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.composer.setSize(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);

    // this.effectFXAA.uniforms.resolution.value.set( 1 / window.innerWidth, 1 / window.innerHeight );
  }
  onMouseDown = (e: MouseEvent) => {
    const mouse = {
      x: (e.clientX / window.innerWidth) * 2 - 1,
      y: -(e.clientY / window.innerHeight) * 2 + 1
    }
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    const intersects = raycaster.intersectObjects(this.scene.children);
    if(intersects.length === 0) return;

    let intersect;
    intersect = raycaster.intersectObjects(this.scene.children)[0].object;
    if(intersect.name.startsWith("Cube")) { // 만약 보드를 클릭했다면
      intersect = intersect.parent;

    } else { // 체스 말을 클릭했다면
      this.outlinePass.visibleEdgeColor.set("red");
      this.outlinePass.hiddenEdgeColor.set("red");
      this.outlinePass.edgeStrength = 10;
      this.outlinePass.edgeGlow = 1;
      this.outlinePass.edgeThickness = 4;
      this.outlinePass.selectedObjects.push(intersect);

    }

    console.log(intersect)
  }


  
  setupRendering() {
    const animate = () => {
      requestAnimationFrame(animate);
      // this.renderer.render(this.scene, this.camera);
      this.composer.render();
    }
    animate();
  }
}

window.onload = () => {
  new App();
}