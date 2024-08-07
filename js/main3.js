import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

class App {
    constructor() {
        this._main = document.querySelector("#main");
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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
        this._keys = [];
        this._setDown = false;
        // this._islandBoundingBox = new THREE.Box3();
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
            this._setupControls();
            this._setupAnimations();

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

    _setupCamera(position = [0, 0, 0]) {
        const forward = new THREE.Vector3(0, 0, -1);
        this._mouse.scene.getWorldDirection(forward);

        const camera = new THREE.PerspectiveCamera(750, window.innerWidth / window.innerHeight, 0.1, 2000);

        const offset = forward.clone().multiplyScalar(30).add(new THREE.Vector3(0, 10, 0));
        // const offset = new THREE.Vector3(0, 0, -5);
        const characterPosition = new THREE.Vector3(this._mouse.scene.position.x, this._mouse.scene.position.y, this._mouse.scene.position.z); // 캐릭터 위치 복사

        camera.position.copy(characterPosition.clone().add(offset)); // 카메라 위치 업데이트
        camera.lookAt(characterPosition); // 카메라가 항상 캐릭터를 바라보도록 설정

        this._camera = camera;
    }

    _setupControls() {
        new OrbitControls(this._camera, this._renderer.domElement);
    }

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
            const isRunning = this._keys["ShiftLeft"];

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

            if (Object.values(this._keys).filter((value) => value === true).length === 0) {
                this._playAnimation("Idle");
            } else {
                if (this._keys["ArrowUp"]) {
                    this._playAnimation(isRunning ? "Running" : "Walking");
                    newPosition.add(forward.multiplyScalar(speed * deltaTime));
                } else if (this._keys["ArrowDown"]) {
                    this._playAnimation("WalkingBackwards");
                    newPosition.add(backward.multiplyScalar(speed * deltaTime));
                } else if (this._keys["ControlLeft"]) {
                    this._playAnimation("KneelDownPose");
                }

                if (this._keys["ArrowLeft"]) {
                    this._playAnimation(isRunning ? "Running" : "Walking");
                    newRotation.y += 1.5 * deltaTime;
                    newPosition.x += Math.sin(newRotation.y) * rotationSpeed * deltaTime;
                    newPosition.z += Math.cos(newRotation.y) * rotationSpeed * deltaTime;
                } else if (this._keys["ArrowRight"]) {
                    this._playAnimation(isRunning ? "Running" : "Walking");
                    newRotation.y -= 1.5 * deltaTime;
                    newPosition.x += Math.sin(newRotation.y) * rotationSpeed * deltaTime;
                    newPosition.z += Math.cos(newRotation.y) * rotationSpeed * deltaTime;
                }
            }

            model.position.copy(newPosition);
            model.rotation.copy(newRotation);

            // if (this._keys["ArrowUp"]) {
            //     newPosition.add(forward.multiplyScalar(speed * deltaTime));
            // } else if (this._keys["ArrowDown"]) {
            //     newPosition.add(forward.multiplyScalar(-speed * deltaTime));
            // }

            //         if (this._keys["ArrowLeft"]) {
            //             newRotation.y += 1 * deltaTime;
            //         } else if (this._keys["ArrowRight"]) {
            //             newRotation.y -= 1 * deltaTime;
            //         }

            //         // const worldPosition = newPosition.clone().applyMatrix4(model.matrixWorld);
            //         const modelBoundingBox = new THREE.Box3().setFromObject(model);

            //         const newModelBoundingBox = modelBoundingBox.clone();
            //         newModelBoundingBox.setFromCenterAndSize(newPosition, new THREE.Vector3(1, 1, 1));

            //         if (this._islandBoundingBox.intersectsBox(newModelBoundingBox)) {
            //             // 경계 내에 있다면 위치와 회전을 업데이트합니다
            //             model.position.copy(newPosition);
            //             model.rotation.copy(newRotation);
            //         }
        }
    }

    render(time) {
        this.animationUpdate(time);
        if (Object.values(this._keys).filter(() => true).length > 0) {
            //     const newPosition = [this._mouse.position.x, this._mouse.position.y, this._camera.position.z];
            //     // this._setupCamera(newPosition);
            this._setupCamera();
        }

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
        this._keys[event.code] = true;
    }

    onKeyUp(event) {
        this._keys[event.code] = false;
    }
}

window.onload = function () {
    new App();
};
