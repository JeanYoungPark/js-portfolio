import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";

class App {
    constructor() {
        this._main = document.querySelector("#main");
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(main.offsetWidth, main.offsetHeight);
        main.appendChild(renderer.domElement);

        // renderer.setSize(window.innerWidth, window.innerHeight);
        // document.body.appendChild(renderer.domElement);

        this._renderer = renderer;

        const scene = new THREE.Scene();
        this._scene = scene;
        this._setupScene();

        window.addEventListener("keydown", this.onKeyDown.bind(this));
        window.addEventListener("keyup", this.onKeyUp.bind(this));

        this._camera;
        this._currentAction;
        this._mixerMap = {};
        this._animationsMap = {};
        this._previousTime = 0;
        this._performanceTime = performance.now();
        this._keys = [];
        this._islandBoundingBox = new THREE.Box3();

        this.control = { ArrowUp: "Walking", ArrowLeft: "Walking", ArrowRight: "Walking", Space: "Jumping" };
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
            this._setupCamera([this._mouse.position.x + 30, this._mouse.position.y + 8, this._mouse.position.z + 12]);
            this._setupControls();

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

                    this._setupAnimations(gltf);
                    resolve(model);

                    // this._playAnimation(gltf);

                    // if (isCenter) {
                    //     this._gltf = gltf;
                    // } else {
                    //     const boundingBox = new THREE.Box3().setFromObject(model);

                    //     const scaleFactor = 0.3;

                    //     const size = new THREE.Vector3();
                    //     boundingBox.getSize(size);
                    //     size.multiplyScalar(scaleFactor);

                    //     const center = boundingBox.getCenter(new THREE.Vector3());
                    //     boundingBox.setFromCenterAndSize(center, size);

                    //     this._islandBoundingBox = boundingBox;
                    // }

                    // if (animationName) {
                    //     this._setupAnimations(gltf);
                    //     this._playAnimation(gltf, animationName);
                    // }
                },
                undefined,
                (error) => {
                    reject(error); // 로딩 중 에러 발생 시 reject 호출
                }
            );
        });
    }

    _setupAnimations(gltf) {
        const model = gltf.scene;
        // 애니메이션 시스템에서 애니메이션을 제어하는 객체
        // 애니메이션 클립을 모델에 적용하고, 애니메이션의 시간 진행을 관리
        const mixer = new THREE.AnimationMixer(model);
        const gltfAnimations = gltf.animations;

        if (gltfAnimations.length > 0) {
            this._animationsMap[model.uuid] = {};

            gltfAnimations.forEach((clip) => {
                const name = clip.name;
                const action = mixer.clipAction(clip);
                action.setLoop(THREE.LoopRepeat, Infinity);

                this._animationsMap[model.uuid][name] = action;

                //         if (name === "Jumping") {
                //             animationAction.setLoop(THREE.LoopOnce);
                //         } else {
                //             animationAction.setLoop(THREE.LoopRepeat, Infinity);
                //         }

                //         this._animationsMap[model.uuid][name] = animationAction;
            });

            this._mixerMap[model.uuid] = mixer;
            this._playAnimation(gltf);
        }
    }

    _playAnimation(gltf, animationName = "Idle") {
        const model = gltf.scene;
        const animationMap = this._animationsMap[model.uuid];

        if (animationName) {
            const newAction = animationMap[animationName];

            if (newAction) {
                // 현재 실행 중인 애니메이션을 멈추고 새로운 애니메이션을 재생
                if (this._currentAction && this._currentAction !== animationMap[animationName]) {
                    this._currentAction.fadeOut(0.2);
                }

                if (!newAction.isRunning()) {
                    newAction.reset().fadeIn(0.2).play();
                }

                this._currentAction = newAction;
            }
        }
    }

    _setupCamera(position = [0, 0, 0]) {
        console.log(position);
        console.log(this._mouse.position);
        const camera = new THREE.PerspectiveCamera(750, window.innerWidth / window.innerHeight, 0.1, 2000);

        camera.position.set(...position);
        camera.lookAt(this._mouse.position);
        this._camera = camera;
    }

    _setupControls() {
        const orbitControls = new OrbitControls(this._camera, this._renderer.domElement);
        // orbitControls.target.copy(model.position);
    }

    animationUpdate(time) {
        // if (this._keys["ArrowUp"]) {
        //     // 16은 기본적으로 60FPS를 기준으로 하는 프레임 시간을 나타냄
        //     this._mouse.position.z -= (speed * Math.cos(this._mouse.rotation.y) * deltaTime) / 16;
        //     this._mouse.position.x += (speed * Math.sin(this._mouse.rotation.y) * deltaTime) / 16;
        // }

        time *= 0.001; //

        Object.values(this._mixerMap).forEach((mixer) => {
            const deltaTime = time - this._previousTime;
            mixer.update(deltaTime);
            // this.handleMovement(time);
        });

        this._previousTime = time;
    }

    // handleMovement(time) {
    //     const model = this._gltf?.scene;

    //     if (model) {
    //         const speed = 15; // 이동 속도
    //         const deltaTime = time - this._previousTime;

    //         const forward = new THREE.Vector3(0, 0, -1); // 기본 Z축 방향
    //         model.getWorldDirection(forward);

    //         // 새로운 위치를 계산합니다
    //         const newPosition = model.position.clone();
    //         const newRotation = model.rotation.clone();

    //         if (this._keys["ArrowUp"]) {
    //             newPosition.add(forward.multiplyScalar(speed * deltaTime));
    //         } else if (this._keys["ArrowDown"]) {
    //             newPosition.add(forward.multiplyScalar(-speed * deltaTime));
    //         }

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
    //     }
    // }

    // updateCameraPosition() {
    //     const model = this._gltf?.scene;

    //     if (model) {
    //         // 캐릭터의 방향 벡터를 가져옵니다 (앞쪽 방향).
    //         // const forward = new THREE.Vector3(0, 0, -1); // 기본 Z축 방향
    //         // model.getWorldDirection(forward); // 모델의 월드 방향 벡터를 업데이트

    //         // 카메라와 캐릭터 사이의 거리와 오프셋을 설정합니다.
    //         const distance = 1200; // 카메라와 캐릭터 사이의 거리
    //         const offset = new THREE.Vector3(-1000, 300, distance); // Y축과 Z축 오프셋

    //         // 카메라의 위치를 업데이트합니다.
    //         this._camera.position.copy(model.position).add(offset.applyMatrix4(model.matrixWorld));

    //         //         // 카메라가 캐릭터를 바라보도록 설정합니다.
    //         this._camera.lookAt(model.position);
    //     }
    // }

    render(time) {
        this.animationUpdate(time);
        // if (Object.values(this._keys).filter(() => true).length > 0) {
        //     const newPosition = [this._mouse.position.x, this._mouse.position.y, this._camera.position.z];
        //     this._setupCamera(newPosition);
        // }

        // this.updateCameraPosition();

        this._renderer.render(this._scene, this._camera);
        requestAnimationFrame(this.render.bind(this));
    }

    resize() {
        // const width = window.innerWidth;
        // const height = window.innerHeight;
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
        //     if (this._gltf) {
        this._keys[event.code] = false;

        //         const keydownList = Object.keys(this._keys).filter((key) => this._keys[key]);

        //         if (keydownList.length === 0) {
        //             this._playAnimation(this._gltf, "Idle");
        //         }
        //     }
    }
}

window.onload = function () {
    new App();
};
