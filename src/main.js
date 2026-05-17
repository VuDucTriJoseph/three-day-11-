import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const canvas = document.querySelector("#app");
const loadingElement = document.querySelector("#loading");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111827);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(1.5, 1.2, 2.5);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 1.2;
controls.maxDistance = 8;
controls.target.set(0, 0.2, 0);
controls.update();

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({
  color: 0x4f46e5,
  roughness: 0.25,
  metalness: 0.7,
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(2, 3, 2);
scene.add(directionalLight);

const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
scene.add(gridHelper);

const axesHelper = new THREE.AxesHelper(1.5);
scene.add(axesHelper);

const modelGroup = new THREE.Group();
scene.add(modelGroup);

const loadingManager = new THREE.LoadingManager(
  () => {
    loadingElement.textContent = "Model loaded";
    loadingElement.classList.add("visible");
    window.setTimeout(() => loadingElement.classList.remove("visible"), 600);
  },
  (url, loaded, total) => {
    const progress = Math.round((loaded / total) * 100);
    loadingElement.textContent = `Loading model… ${progress}%`;
    loadingElement.classList.add("visible");
  },
  (url) => {
    loadingElement.textContent = `Error loading model: ${url}`;
    loadingElement.classList.add("visible");
  },
);

const gltfLoader = new GLTFLoader(loadingManager);
gltfLoader.load(
  "/Fox.glb",
  (gltf) => {
    const model = gltf.scene;
    model.position.set(0, 0, 0);
    model.rotation.y = Math.PI;
    model.scale.set(0.01, 0.01, 0.01);
    modelGroup.add(model);
  },
  undefined,
  (error) => {
    console.error("GLTF load error:", error);
  },
);

function resizeRenderer() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", resizeRenderer, false);

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();
  cube.rotation.x = elapsed * 0.5;
  cube.rotation.y = elapsed * 0.8;

  controls.update();
  renderer.render(scene, camera);
}

animate();
