import * as THREE from "three";
import WebGL from "three/addons/capabilities/WebGL.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// if (WebGL.isWebGL2Available()) {
//     const scene = new THREE.Scene();
//     // 시야각, 종횡비, near, far
//     const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

//     const renderer = new THREE.WebGLRenderer();
//     // 렌더링할 곳의 크기, 3번째 인자 더 낮은 해상도 (false 설정)
//     renderer.setSize(window.innerWidth, window.innerHeight);
//     document.body.appendChild(renderer.domElement);

//     // 상자 생성
//     const geometry = new THREE.BoxGeometry(1, 1, 1);
//     const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
//     // 화면에서 움직일 수 있도록 설정
//     const cube = new THREE.Mesh(geometry, material);
//     scene.add(cube);

//     camera.position.z = 5;

//     // 화면을 새로고침 할 떄마다 렌더링
//     function animate() {
//         // 모든 프레임마다 실행
//         cube.rotation.x += 0.01;
//         cube.rotation.y += 0.01;
//         renderer.render(scene, camera);
//     }

//     renderer.setAnimationLoop(animate);
// } else {
//     const warning = WebGL.getWebGL2ErrorMessage();
//     document.getElementById("container").appendChild(warning);
// }

const scene = new THREE.Scene();
scene.backgroundColor = new THREE.Color("white");

let light = new THREE.DirectionalLight(0xffff00, 10);
scene.add(light);

const camera = new THREE.PerspectiveCamera(500, window.innerWidth / window.innerHeight);
camera.position.set(50, 400, 900);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

const loader = new GLTFLoader();
loader.load("/scene.gltf", function (gltf) {
    scene.add(gltf.scene);

    function animate(animate) {
        requestAnimationFrame(animate);
        // 모든 프레임마다 실행
        gltf.rotation.y += 0.01;
        renderer.render(scene, camera);
    }

    animate();
});
