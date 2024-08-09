import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

class App {
    constructor() {
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this._main = document.querySelector("#main");
        renderer.setSize(main.offsetWidth, main.offsetHeight);
        main.appendChild(renderer.domElement);

        this._renderer = renderer;

        const scene = new THREE.Scene();
        this._scene = scene;
        this._setupScene();

        window.addEventListener("keydown", this.onKeyDown.bind(this));
        window.addEventListener("keyup", this.onKeyUp.bind(this));

        this._mouse;
        this._camera;
        this._currentAction;
        this._mixerMap = {};
        this._animationsMap = {};
        this._previousTime = 0;
        this._keys = {
            ArrowUp: { value: false, code: 38 },
            ArrowDown: { value: false, code: 40 },
            ArrowLeft: { value: false, code: 37 },
            ArrowRight: { value: false, code: 39 },
            ShiftLeft: { value: false, code: 16 },
            ControlLeft: { value: false, code: 17 },
            AltLeft: { value: false, code: 18 },
        };
        this._boundary = {};
    }

    async _setupScene() {
        try {
            this._background = await this._setupModel("../model/forest/scene.gltf", { scale: [4, 4, 4] });
            this._mouse = await this._setupModel("../model/character/model.glb", {
                scale: [0.05, 0.05, 0.05],
                position: [10, 3.5, 2],
                rotation: [0, Math.PI / 2, 0],
            });

            this._setupDirectionalLight();
            this._setupAmbientLight();
            this._setupCamera();
            // this._setupControls();
            this._setupAnimations();

            this._initializeBoundingBox();

            requestAnimationFrame(this.render.bind(this));

            window.onresize = this.resize.bind(this);
            this.resize();
        } catch (error) {
            console.error("Error loading models:", error);
        }
    }
    _setupDirectionalLight() {
        const color = 0xffffff; // 조명 색상
        const intensity = 1; // 조명의 강도 1이 일반적인 밝기
        const light = new THREE.DirectionalLight(color, intensity); // 방향성 조명
        light.position.set(-200, 200, 0); // 조명의 위치
        light.castShadow = true; // 고명이 그림자 생성 (장면의 다른 객체들도 그림자 속성 필요)
        this._scene.add(light);
    }

    _setupAmbientLight() {
        const color = 0xffffff; // 조명 색상
        const intensity = 5; // 조명의 강도 1이 일반적인 밝기

        const softLight = new THREE.AmbientLight(color, intensity); // 환경 조명
        this._scene.add(softLight);
    }

    _setupModel(url, options = {}) {
        const { scale = [1, 1, 1], position = [0, 0, 0], rotation = [0, 0, 0], animationName } = options;
        let model;

        return new Promise((resolve, reject) => {
            new GLTFLoader().load(
                url,
                (gltf) => {
                    // 모델 파일 로드
                    model = gltf.scene;

                    model.scale.set(...scale); // 모델 크기 설정
                    model.position.set(...position); // 모델 회전 성정
                    model.rotation.set(...rotation); // 모델 그림자 설정
                    model.castShadow = true;

                    this._scene.add(model);
                    resolve(gltf);
                },
                undefined,
                (error) => {
                    reject(error); // 로딩 중 에러 발생 시 reject 호출
                }
            );
        });
    }

    _setupAnimations() {
        const model = this._mouse.scene;
        // 애니메이션 시스템에서 애니메이션을 제어하는 객체
        // 애니메이션 클립을 모델에 적용하고, 애니메이션의 시간 진행을 관리
        const mixer = new THREE.AnimationMixer(model);
        const gltfAnimations = this._mouse.animations;

        if (gltfAnimations.length > 0) {
            this._animationsMap[model.uuid] = {};

            gltfAnimations.forEach((clip) => {
                const name = clip.name;
                const action = mixer.clipAction(clip);
                action.setLoop(THREE.LoopRepeat, Infinity);

                this._animationsMap[model.uuid][name] = action;
            });

            this._mixerMap[model.uuid] = mixer;
        }
    }

    _playAnimation(animationName = "Idle") {
        const model = this._mouse.scene;
        const animationMap = this._animationsMap[model.uuid];

        if (animationMap) {
            const newAction = animationMap[animationName];
            if (newAction) {
                if (this._currentAction) {
                    if (this._currentAction !== newAction) {
                        this._currentAction.fadeOut(0.2);
                        newAction.reset().fadeIn(0.2).play();
                    }
                } else {
                    newAction.play();
                }

                this._currentAction = newAction;
            }
        }
    }

    _setupCamera() {
        this._camera = new THREE.PerspectiveCamera(750, window.innerWidth / window.innerHeight, 0.1, 2000);
        this._updateCameraPosition();
    }

    _updateCameraPosition() {
        const model = this._mouse.scene;
        const forward = new THREE.Vector3(0, 0, -1);
        model.getWorldDirection(forward);

        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(model.quaternion); // 모델의 회전 방향을 고려하여 오른쪽 벡터 계산

        const offset = forward
            .clone()
            .multiplyScalar(25) // 캐릭터 앞쪽으로부터 떨어진 위치
            .add(right.clone().multiplyScalar(10)) // 오른쪽으로 이동
            .add(new THREE.Vector3(0, 10, 0)); // 위쪽으로 이동

        const characterPosition = model.position; // 캐릭터 위치 복사
        const cameraPosition = characterPosition.clone().add(offset);

        this._camera.position.copy(cameraPosition); // 카메라 위치 업데이트
        this._camera.lookAt(characterPosition); // 카메라가 항상 캐릭터를 바라보도록 설정
    }

    // _setupControls() {
    //     new OrbitControls(this._camera, this._renderer.domElement);
    // }

    animationUpdate(time) {
        time *= 0.001;

        Object.values(this._mixerMap).forEach((mixer) => {
            const deltaTime = time - this._previousTime; // 현재 프레임과 이전 프레임 사이의 시간 간격을 계산, 프레임 간 시간 차이
            mixer.update(deltaTime); // 애니메이션 진행 속도 조절
        });

        this.handleMovement(time);
        this._previousTime = time;
    }

    handleMovement(time) {
        const model = this._mouse.scene;

        if (model) {
            const isRunning = this._keys["ShiftLeft"].value;

            const speed = isRunning ? 9 : 5; // 이동 속도
            const rotationSpeed = isRunning ? 7 : 5; // 회전 속도
            const deltaTime = time - this._previousTime;

            const forward = new THREE.Vector3(0, 0, -1);
            model.getWorldDirection(forward); //forward벤터를 모델의 현재 방향으로 설정

            // 뒤로 가는 방향 벡터 계산
            const backward = forward.clone().multiplyScalar(-1);

            // 새로운 위치를 계산합니다
            const newPosition = model.position.clone();
            const newRotation = model.rotation.clone();

            // bg 레이 계산
            const charHeight = this._checkObject(newPosition);
            charHeight && (newPosition.y = this._checkObject(newPosition));

            if (Object.values(this._keys).filter((data) => data.value === true).length === 0) {
                this._playAnimation("Idle");
            } else {
                if (this._keys["ControlLeft"].value) {
                    this._playAnimation("KneelDownPose"); // 무조건 앉음
                } else if (this._keys["AltLeft"].value) {
                    this._playAnimation("Dancing"); // 무조건 춤춤
                } else {
                    const sum = Object.values(this._keys).reduce((prev, data) => {
                        if (data.value === true) {
                            return prev + data.code;
                        }
                        return prev;
                    }, 0);

                    switch (sum) {
                        case 38: // ↑ or ↑ + shift
                        case 54:
                            this._playAnimation(isRunning ? "Running" : "Walking");
                            newPosition.add(forward.multiplyScalar(speed * deltaTime));
                            break;
                        case 40: // ↓
                            this._playAnimation("WalkingBackwards");
                            newPosition.add(backward.multiplyScalar(speed * deltaTime));
                            break;
                        case 37: // ← or ← + shift
                        case 53:
                            this._playAnimation(isRunning ? "Running" : "Walking");

                            newRotation.y += 1.5 * deltaTime;
                            newPosition.x += Math.sin(newRotation.y) * rotationSpeed * deltaTime;
                            newPosition.z += Math.cos(newRotation.y) * rotationSpeed * deltaTime;
                            break;
                        case 39: // → or → + shift
                        case 55:
                            this._playAnimation(isRunning ? "Running" : "Walking");

                            newRotation.y -= 1.5 * deltaTime;
                            newPosition.x += Math.sin(newRotation.y) * rotationSpeed * deltaTime;
                            newPosition.z += Math.cos(newRotation.y) * rotationSpeed * deltaTime;
                            break;
                        case 75: // ↑ ← or ↑ ← + shift
                        case 91:
                            this._playAnimation(isRunning ? "Running" : "Walking");

                            newPosition.add(forward.multiplyScalar(speed * deltaTime));
                            newRotation.y += 1.5 * deltaTime;
                            newPosition.x += Math.sin(newRotation.y) * rotationSpeed * deltaTime;
                            newPosition.z += Math.cos(newRotation.y) * rotationSpeed * deltaTime;
                            break;
                        case 77: // ↑ → or ↑ → + shift
                        case 93:
                            this._playAnimation(isRunning ? "Running" : "Walking");

                            newPosition.add(forward.multiplyScalar(speed * deltaTime));
                            newRotation.y -= 1.5 * deltaTime;
                            newPosition.x += Math.sin(newRotation.y) * rotationSpeed * deltaTime;
                            newPosition.z += Math.cos(newRotation.y) * rotationSpeed * deltaTime;
                            break;
                        default:
                            this._playAnimation("Idle");
                            break;
                    }
                }
            }

            model.position.copy(newPosition);
            model.rotation.copy(newRotation);
        }
    }

    _initializeBoundingBox() {
        if (this._background.scene) {
            // const boundingBox = new THREE.Box3().setFromObject(this._background.scene);
            // const center = new THREE.Vector3();
            // boundingBox.getCenter(center);
            // this._center = center;
            // // 경계 상자의 크기 계산
            // const size = new THREE.Vector3();
            // boundingBox.getSize(size);

            // // 반지름은 대각선 길이의 절반
            // const ratio = 0.5;
            // const radius = (Math.sqrt(size.x * size.x + size.y * size.y + size.z * size.z) / 2) * ratio;
            // this._radius = radius;

            let groundMesh = null;

            this._background.scene.traverse((child) => {
                console.log(child);
                if (child.isMesh && child.material.name === "ground") {
                    groundMesh = child;
                }
            });
            // console.log(groundMesh);
            // const boundingBox = new THREE.Box3().setFromObject(this._background.scene);
            const boundingBox = new THREE.Box3().setFromObject(groundMesh);

            // 경계 상자의 중심과 크기를 구합니다.
            const center = new THREE.Vector3();
            boundingBox.getCenter(center);
            this._center = center;

            const size = new THREE.Vector3();
            boundingBox.getSize(size);

            // 원래 바운더리 크기를 저장합니다.
            this._originalBoundary = {
                x: { min: boundingBox.min.x, max: boundingBox.max.x },
                y: { min: boundingBox.min.y, max: boundingBox.max.y },
                z: { min: boundingBox.min.z, max: boundingBox.max.z },
            };

            // 바운더리 크기를 줄이기 위한 스케일 비율을 설정합니다.
            this._scaleFactor = 0.6; // 원하는 스케일 비율 (0.8은 80% 크기)
            this._updateBoundaryWithScale();
        }
    }

    _updateBoundaryWithScale() {
        if (this._originalBoundary) {
            const scaleFactor = this._scaleFactor;

            this._boundary = {
                x: {
                    min: this._center.x + (this._originalBoundary.x.min - this._center.x) * scaleFactor,
                    max: this._center.x + (this._originalBoundary.x.max - this._center.x) * scaleFactor,
                },
                y: {
                    min: this._center.y + (this._originalBoundary.y.min - this._center.y) * scaleFactor,
                    max: this._center.y + (this._originalBoundary.y.max - this._center.y) * scaleFactor,
                },
                z: {
                    min: this._center.z + (this._originalBoundary.z.min - this._center.z) * scaleFactor,
                    max: this._center.z + (this._originalBoundary.z.max - this._center.z) * scaleFactor,
                },
            };
        }
    }

    _constrainPosition(position) {
        if (this._boundary) {
            position.x = Math.max(this._boundary.x.min, Math.min(this._boundary.x.max, position.x));
            position.y = Math.max(this._boundary.y.min, Math.min(this._boundary.y.max, position.y));
            position.z = Math.max(this._boundary.z.min, Math.min(this._boundary.z.max, position.z));
        }
    }

    // _constrainPosition(position) {
    //     const dx = position.x - this._center.x;
    //     const dz = position.z - this._center.y;
    //     const distance = Math.sqrt(dx * dx + dz * dz);

    //     if (distance > this._radius) {
    //         // 거리 초과 시, 위치를 원형의 경계로 조정
    //         const direction = new THREE.Vector2(dx, dz).normalize();
    //         position.x = this._center.x + direction.x * this._radius;
    //         position.z = this._center.y + direction.y * this._radius;
    //     }

    //     // position.x = Math.max(this._boundary.x.min, Math.min(this._boundary.x.max, position.x));
    //     // position.y = Math.max(this._boundary.y.min, Math.min(this._boundary.y.max, position.y));
    //     // position.z = Math.max(this._boundary.z.min, Math.min(this._boundary.z.max, position.z));
    // }

    _checkObject(newPosition) {
        // 래아캐스터를 사용하여 캐릭터의 높이 조정
        const raycaster = new THREE.Raycaster();
        const rayOrigin = newPosition.clone();
        rayOrigin.y = this._mouse.scene.position.y;
        raycaster.ray.origin.copy(rayOrigin);
        raycaster.ray.direction.set(0, -1, 0); // 아래 방향으로 레이 발사

        const meshes = [];
        this._background.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                meshes.push(child);
            }
        });

        if (meshes.length > 0) {
            const intersects = raycaster.intersectObjects(meshes, true); // true는 자식 객체들도 검사

            if (intersects.length > 0) {
                const intersection = intersects[0];
                const object = intersection.object;

                const groundHeight = intersection.point.y; // 바닥의 높이
                console.log(object.material.name);
                // 캐릭터의 y 위치를 바닥의 높이에 맞추어 조정
                if (object.material.name === "Ground" || object.material.name === "Rocks") return 3.5 + groundHeight;
            }
        }

        return false;
    }

    render(time) {
        this.animationUpdate(time);

        if (Object.values(this._keys).filter((data) => data.value === true).length > 0) {
            this._updateCameraPosition();
        }

        this._constrainPosition(this._mouse.scene.position);
        this._renderer.render(this._scene, this._camera);
        requestAnimationFrame(this.render.bind(this));
    }

    resize() {
        const width = this._main.offsetWidth;
        const height = this._main.offsetHeight;

        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();

        this._renderer.setSize(width, height);
    }

    onKeyDown(event) {
        if (this._keys[event.code] !== undefined) {
            this._keys[event.code].value = true;
        }
    }

    onKeyUp(event) {
        if (this._keys[event.code] !== undefined) {
            this._keys[event.code].value = false;
        }
    }
}

window.onload = function () {
    new App();
};
