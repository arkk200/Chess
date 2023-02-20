import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { chessBoard, pieceInfo, pieceMeshInfo } from './types';
import { getModelName, getNameFromInfo, getPosFromMat } from './utils';

class ChessSetup {
    scene!: THREE.Scene;
    camera!: THREE.PerspectiveCamera;
    playerColor!: string;
    renderer!: THREE.WebGLRenderer;
    models!: THREE.Object3D;
    controls!: OrbitControls;
    spotLight!: THREE.SpotLight;
    composer!: EffectComposer;
    outlinePass!: OutlinePass;
    effectFXAA!: ShaderPass;
    piecesNameMat: chessBoard;

    constructor() {
        this.piecesNameMat = [
            [{ role: 'R1', color: 'B' }, { role: 'N1', color: 'B' }, { role: 'B1', color: 'B' }, { role: 'Q', color: 'B' }, { role: 'K', color: 'B' }, { role: 'B2', color: 'B' }, { role: 'N2', color: 'B' }, { role: 'R2', color: 'B' }],
            [{ role: 'P1', color: 'B' }, { role: 'P2', color: 'B' }, { role: 'P3', color: 'B' }, { role: 'P4', color: 'B' }, { role: 'P5', color: 'B' }, { role: 'P6', color: 'B' }, { role: 'P7', color: 'B' }, { role: 'P8', color: 'B' }],
            new Array(8).fill(0),
            new Array(8).fill(0),
            new Array(8).fill(0),
            new Array(8).fill(0),
            [{ role: 'P1', color: 'W' }, { role: 'P2', color: 'W' }, { role: 'P3', color: 'W' }, { role: 'P4', color: 'W' }, { role: 'P5', color: 'W' }, { role: 'P6', color: 'W' }, { role: 'P7', color: 'W' }, { role: 'P8', color: 'W' }],
            [{ role: 'R1', color: 'W' }, { role: 'N1', color: 'W' }, { role: 'B1', color: 'W' }, { role: 'Q', color: 'W' }, { role: 'K', color: 'W' }, { role: 'B2', color: 'W' }, { role: 'N2', color: 'W' }, { role: 'R2', color: 'W' }],
        ]
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
        this.renderer.shadowMap.enabled = true;
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
            this.spotLight = new THREE.SpotLight("white", 1);
            this.spotLight.position.set(200 * (Math.floor(i / 2) > 0 ? -1 : 1), 40, 200 * (i % 2 === 0 ? -1 : 1));
            this.spotLight.castShadow = true;
            this.scene.add(this.spotLight);
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
        if (!board) return;
        board.traverse(child => child.receiveShadow = true)
        this.scene.add(board);
    }
    createPieces() {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.piecesNameMat[i][j] !== 0) {
                    this.createPiece(getPosFromMat({ x: i, y: j }), getModelName(<pieceInfo>this.piecesNameMat[i][j]), <pieceInfo>this.piecesNameMat[i][j])
                }
            }
        }
    }
    createPiece(pos: { x: number, y: number, z: number }, modelName: string, pieceInfo: pieceInfo) {
        const piece = this.models.getObjectByName(modelName)?.clone();
        if (!piece) return

        piece.position.set(pos.x, pos.y, pos.z);
        (<pieceMeshInfo>piece).role = pieceInfo.role;
        (<pieceMeshInfo>piece).color = pieceInfo.color;
        piece.name = getNameFromInfo(pieceInfo);

        piece.traverse(child => child.castShadow = true);
        this.scene.add(piece);
    }
}

export default ChessSetup;