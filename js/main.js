import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(750, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 20); //x, y, z 위치 설정
camera.lookAt(new THREE.Vector3(0, 0, 0));

const light = new THREE.DirectionalLight(0xffffff, 1); // 방향성 조명
light.position.set(0, 800, 0);
scene.add(light);

const softLight = new THREE.AmbientLight(0xffffff, 1.75); // 환경 조명 (방향x)
scene.add(softLight);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const loader = new GLTFLoader();
loader.load("../model/island/scene.gltf", (gltf) => {
    const model = gltf.scene;
    scene.add(model);

    model.position.y = -2;
});

loader.load("../model/dog/scene.gltf", (dog) => {
    const model = dog.scene;
    scene.add(model);
    // model.position.x = 0;
    model.position.y = 4.2;
    model.position.z = 6;
});

const controls = new OrbitControls(camera, renderer.domElement);

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();

// import * as THREE from "three";
// import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
// import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(750, window.innerWidth / window.innerHeight, 0.1, 1000);
// camera.position.set(3, 2, 3); //x, y, z 위치 설정
// camera.lookAt(new THREE.Vector3(0, 0.3, 0));

// const light = new THREE.DirectionalLight(0xffffff, 1); // 방향성 조명
// light.position.set(0, 800, -50);
// scene.add(light);

// const softLight = new THREE.AmbientLight(0xffffff, 0.8); // 환경 조명 (방향x)
// scene.add(softLight);

// const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
// renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.setClearColor("#fff", 0);
// document.body.appendChild(renderer.domElement);

// // OrbitControls 추가
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableRotate = false;
// controls.enableZoom = true;

// const loader = new GLTFLoader();
// loader.load("../imgs/scene.gltf", (gltf) => {
//     const model = gltf.scene;
//     scene.add(model);
//     console.log(model);
//     model.position.y = -0.25;

//     // 회전 변수 설정
//     let isDragging = false;
//     let previousMousePosition = { x: 0, y: 0 };

//     window.addEventListener("mousedown", (event) => {
//         isDragging = true;
//         // 마우스 드래그 시작 시 위치 초기화
//         previousMousePosition = {
//             x: event.clientX,
//             y: event.clientY,
//         };
//     });

//     window.addEventListener("mouseup", () => {
//         isDragging = false;
//     });

//     window.addEventListener("mousemove", (event) => {
//         if (isDragging && model) {
//             const deltaX = event.clientX - previousMousePosition.x;

//             // 모델 회전
//             model.rotation.y += deltaX * 0.001;

//             previousMousePosition = {
//                 x: event.clientX,
//                 y: event.clientY,
//             };
//         }
//     });

//     function animate() {
//         requestAnimationFrame(animate);
//         controls.update();
//         if (model) {
//             model.rotation.y += 0.0005;
//         }

//         renderer.render(scene, camera);
//     }

//     animate();
// });

// // 윈도우 리사이즈 이벤트 처리
// window.addEventListener("resize", () => {
//     camera.aspect = window.innerWidth / window.innerHeight;
//     camera.updateProjectionMatrix();
//     renderer.setSize(window.innerWidth, window.innerHeight);
// });
