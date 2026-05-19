import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
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

const gui = new GUI();

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const intersectableObjects = [];
const actions = {};
let mixer = null;
let activeAction = null;
let activeActionIndex = 0;
let foxModel = null;
let targetRotation = 0;
// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshStandardMaterial({
//   color: 0x4f46e5,
//   roughness: 0.25,
//   metalness: 0.7,
// });
// const cube = new THREE.Mesh(geometry, material);
// cube.name = "ControlCube";
// scene.add(cube);
// intersectableObjects.push(cube);

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

// const modelProxy = new THREE.Mesh(
//   new THREE.BoxGeometry(0.4, 0.4, 0.4),
//   new THREE.MeshBasicMaterial({
//     color: 0xffffff,
//     wireframe: true,
//     opacity: 0.55,
//     transparent: true,
//   }),
// );
// modelProxy.name = "ModelProxy";
// modelGroup.add(modelProxy);

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
    // modelProxy.visible = false;
    model.name = "FoxModel";
    foxModel = model;

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(model);

      gltf.animations.forEach((clip, index) => {
        const action = mixer.clipAction(clip);
        actions[clip.name] = action;
      });
      activeAction = actions["Survey"];
      activeAction.play();
    }
  },
  undefined,
  (error) => {
    console.error("GLTF load error:", error);
  },
);
// console.log(actions);
const fadeToAction = (name, duration) => {
  const nextAction = actions[name];

  nextAction.reset().fadeIn(duration).play();
  activeAction.fadeOut();
  activeAction = nextAction;
};

const foxAction = {
  survey: () => fadeToAction("Survey", 3),
  walk: () => fadeToAction("Walk", 3),
  run: () => fadeToAction("Run", 3),

  turnLeft: () => {
    targetRotation += Math.PI * 0.5;
  },
  turnRight: () => {
    targetRotation -= Math.PI / 2;
  },
  resetDirection: () => {
    targetRotation = 0;
  },
};

const animFolder = gui.addFolder("Điều khiển Cáo");
animFolder.add(foxAction, "survey").name("Đứng nhìn");
animFolder.add(foxAction, "walk").name("Đi bộ");
animFolder.add(foxAction, "run").name("Chạy nhanh");

const controlFolder = gui.addFolder("Dieu huong");
controlFolder.add(foxAction, "turnLeft").name("re trai");
controlFolder.add(foxAction, "turnRight").name("re phai");
controlFolder.add(foxAction, "resetDirection").name("nhin thang");

function resizeRenderer() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", resizeRenderer, false);
window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// window.addEventListener("click", () => {
//   raycaster.setFromCamera(mouse, camera);
//   const intersects = raycaster.intersectObjects(intersectableObjects, true);
//   if (intersects.length === 0 || actions.length === 0) {
//     return;
//   }

//   if (actions.length === 1) {
//     const action = actions[0];
//     if (action.isRunning()) {
//       action.paused = true;
//       console.log("Model animation paused");
//     } else {
//       action.paused = false;
//       action.play();
//       console.log("Model animation resumed");
//     }
//     return;
//   }

//   const nextIndex = (activeActionIndex + 1) % actions.length;
//   if (nextIndex !== activeActionIndex) {
//     const nextAction = actions[nextIndex];
//     nextAction.reset().play();
//     activeAction.crossFadeTo(nextAction, 0.5, false);
//     activeAction = nextAction;
//     activeActionIndex = nextIndex;
//     console.log(`Switched to animation ${nextIndex}`);
//   }
// });

const clock = new THREE.Clock();
const forwardVector = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);

  // const elapsed = clock.getElapsedTime();
  // cube.rotation.x = elapsed * 0.5;
  // cube.rotation.y = elapsed * 0.8;

  const delta = clock.getDelta();
  if (mixer !== null) {
    mixer.update(delta);
  }

  // 2. Làm mượt góc xoay của con cáo (Logic cũ của bạn)
  if (foxModel) {
    foxModel.rotation.y += (targetRotation - foxModel.rotation.y) * 0.1;

    // ==========================================
    // LOGIC DI CHUYỂN THỰC TẾ (NEW)
    // ==========================================
    if (activeAction) {
      let speed = 0;

      // Kiểm tra xem cuộn băng nào đang phát để quyết định tốc độ
      if (activeAction._clip.name === "Walk") {
        speed = 0.5; // Tốc độ đi bộ (0.5 mét / giây)
      } else if (activeAction._clip.name === "Run") {
        speed = 1.8; // Tốc độ chạy nhanh (1.8 mét / giây)
      }

      // Nếu tốc độ > 0 (tức là đang Walk hoặc Run, còn Survey thì đứng yên)
      if (speed > 0) {
        // Lấy hướng thực tế mà mũi con cáo đang chĩa về ngoài không gian
        foxModel.getWorldDirection(forwardVector);

        // LƯU Ý: File Fox.glb mặc định hướng mặt của con cáo trùng với trục Z.
        // Nếu con cáo bị chạy lùi, bạn chỉ cần đổi dấu thành trừ (-) ở dòng dưới, hoặc dùng forwardVector.negate()
        foxModel.position.addScaledVector(forwardVector, speed * delta);

        // Đỉnh cao: Bắt Camera và OrbitControls phải tự động "đuổi theo" tâm con Cáo
        // Tạo cảm giác Camera góc nhìn thứ 3 giống game GTA / Assassin's Creed
        controls.target.copy(foxModel.position);
      }
    }

    controls.update();
    renderer.render(scene, camera);
  }
}

animate();
