import './style.css'
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class App {
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.Renderer;
  models!: THREE.Object3D;
  controls!: OrbitControls;
  pLight!: THREE.PointLight;

  constructor() {
    this.setupInit();
    this.setupLights();
    this.setupModels();
    this.setEvents();
    this.setupRender();
  }

  setupInit() {
    this.scene = new THREE.Scene();
    // this.scene.background = new THREE.Color("white");

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 100, 10);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

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
      const models = gltf.scene;
      this.models = models;
      models && this.scene.add(models);
    })
  }

  setEvents() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousedown', this.onMouseDown);
  }
  onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
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
    intersect?.parent && (intersect = intersect.parent); // 보드 클릭했을 때 그룹 선택하게함

    console.log(intersect.position);
  }

  setupRender() {
    const animate = () => {
      requestAnimationFrame(animate);
      this.renderer.render(this.scene, this.camera);
    }
    animate();
  }
}

window.onload = () => {
  new App();
}