import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";

class App {
    constructor() {
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        this._renderer = renderer;

        const scene = new THREE.Scene();
        this._scene = scene;

        this._setupModel("../model/island/scene.gltf", {
            scale: 20,
            x: 0,
            y: -180,
            z: 0,
            animationName: "Propeller|PropellerAction",
        });
        this._setupModel("../model/character/model.glb", { scale: 0.3, x: 46, y: -35, z: 200, rotationY: 3, animationName: "Idle" }, true);

        this._setupLight();
        this._setupCamera();
        this._setupTransformControls();
        // this._setupControls();

        window.onresize = this.resize.bind(this);
        window.addEventListener("keydown", this.onKeyDown.bind(this));
        window.addEventListener("keyup", this.onKeyUp.bind(this));
        this.resize();
        requestAnimationFrame(this.render.bind(this));

        this._gltf;
        this._mixerMap = {};
        this._animationsMap = {};
        this._previousTime = 0;
        this._currentAction = null;
        this._keys = [];
        this._camera;
        this._islandBoundingBox = new THREE.Box3();
    }

    _setupTransformControls() {
        // Create TransformControls instance
        this._transformControls = new TransformControls(this._camera, this._renderer.domElement);
        this._scene.add(this._transformControls);
    }

    // _setupControls(model) {
    //     const orbitControls = new OrbitControls(this._camera, this._renderer.domElement);
    //     orbitControls.target.copy(model.position);
    // }

    _setupAnimations(gltf) {
        const model = gltf.scene;
        const mixer = new THREE.AnimationMixer(model);
        const gltfAnimations = gltf.animations;

        if (gltfAnimations) {
            this._animationsMap[model.uuid] = {};

            gltfAnimations.forEach((animationClip) => {
                const name = animationClip.name;
                const animationAction = mixer.clipAction(animationClip);

                if (name === "Jumping") {
                    animationAction.setLoop(THREE.LoopOnce);
                } else {
                    animationAction.setLoop(THREE.LoopRepeat, Infinity);
                }

                this._animationsMap[model.uuid][name] = animationAction;
            });

            this._mixerMap[model.uuid] = mixer;
        }
    }

    _playAnimation(gltf, animationName) {
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
                    //     animationMap[animationName].play();
                    newAction.reset().fadeIn(0.2).play();
                }

                this._currentAction = newAction;
            }
        }
    }

    _setupModel(url, options = {}, isCenter = false) {
        const { scale = 1, x = 0, y = 0, z = 0, rotationX = 0, rotationY = 0, rotationZ = 0, animationName } = options;

        new GLTFLoader().load(url, (gltf) => {
            const model = gltf.scene;

            model.scale.set(scale, scale, scale);
            model.position.set(x, y, z);
            model.rotation.set(rotationX, rotationY, rotationZ);

            this._scene.add(model);

            if (isCenter) {
                this._gltf = gltf;
                model.castShadow = true;
            } else {
                // 경계선 계산
                // const boundingBox = new THREE.Box3().setFromObject(model);
                // this._islandBoundingBox.copy(boundingBox);

                const boundingBox = new THREE.Box3().setFromObject(model);

                // 축소 비율 설정 (여기서는 0.9로 설정했습니다)
                const scaleFactor = 0.4;

                const size = new THREE.Vector3();
                boundingBox.getSize(size);
                size.multiplyScalar(scaleFactor);

                const center = boundingBox.getCenter(new THREE.Vector3());
                boundingBox.setFromCenterAndSize(center, size);

                this._islandBoundingBox = boundingBox;
            }

            if (animationName) {
                this._setupAnimations(gltf);
                this._playAnimation(gltf, animationName);
            }
        });
    }

    _setupCamera() {
        const camera = new THREE.PerspectiveCamera(750, window.innerWidth / window.innerHeight, 0.1, 2000);

        camera.position.set(900, 230, 300);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        this._camera = camera;
    }

    _setupLight() {
        const color = 0xffffff;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(10, 100, 10);
        light.castShadow = true;
        this._scene.add(light);

        const softLight = new THREE.AmbientLight(0xffffff, 2.3);
        this._scene.add(softLight);
    }

    update(time) {
        time *= 0.001; // second unit

        Object.values(this._mixerMap).forEach((mixer) => {
            const deltaTime = time - this._previousTime;
            mixer.update(deltaTime);
            this.handleMovement(time);
        });

        this._previousTime = time;
    }

    handleMovement(time) {
        const model = this._gltf?.scene;

        if (model) {
            const speed = 15; // 이동 속도
            const deltaTime = time - this._previousTime;

            const forward = new THREE.Vector3(0, 0, -1); // 기본 Z축 방향
            model.getWorldDirection(forward);

            // 새로운 위치를 계산합니다
            const newPosition = model.position.clone();
            const newRotation = model.rotation.clone();

            if (this._keys["ArrowUp"]) {
                newPosition.add(forward.multiplyScalar(speed * deltaTime));
            } else if (this._keys["ArrowDown"]) {
                newPosition.add(forward.multiplyScalar(-speed * deltaTime));
            }

            if (this._keys["ArrowLeft"]) {
                newRotation.y += 1 * deltaTime;
            } else if (this._keys["ArrowRight"]) {
                newRotation.y -= 1 * deltaTime;
            }

            // const worldPosition = newPosition.clone().applyMatrix4(model.matrixWorld);
            const modelBoundingBox = new THREE.Box3().setFromObject(model);

            const newModelBoundingBox = modelBoundingBox.clone();
            newModelBoundingBox.setFromCenterAndSize(newPosition, new THREE.Vector3(1, 1, 1));

            if (this._islandBoundingBox.intersectsBox(newModelBoundingBox)) {
                // 경계 내에 있다면 위치와 회전을 업데이트합니다
                model.position.copy(newPosition);
                model.rotation.copy(newRotation);
            }
        }
    }

    updateCameraPosition() {
        const model = this._gltf?.scene;

        if (model) {
            // 캐릭터의 방향 벡터를 가져옵니다 (앞쪽 방향).
            // const forward = new THREE.Vector3(0, 0, -1); // 기본 Z축 방향
            // model.getWorldDirection(forward); // 모델의 월드 방향 벡터를 업데이트

            // 카메라와 캐릭터 사이의 거리와 오프셋을 설정합니다.
            const distance = 1200; // 카메라와 캐릭터 사이의 거리
            const offset = new THREE.Vector3(-1000, 300, distance); // Y축과 Z축 오프셋

            // 카메라의 위치를 업데이트합니다.
            this._camera.position.copy(model.position).add(offset.applyMatrix4(model.matrixWorld));

            //         // 카메라가 캐릭터를 바라보도록 설정합니다.
            this._camera.lookAt(model.position);
        }
    }

    render(time) {
        this._renderer.render(this._scene, this._camera);
        this.update(time);

        this.updateCameraPosition();

        requestAnimationFrame(this.render.bind(this));
    }

    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();

        this._renderer.setSize(width, height);
    }

    onKeyDown(event) {
        if (this._gltf) {
            this._keys[event.code] = true;

            if (this._keys["ArrowUp"] || this._keys["ArrowLeft"] || this._keys["ArrowRight"]) {
                this._playAnimation(this._gltf, "Walking");
            } else if (this._keys["ArrowDown"]) {
                this._playAnimation(this._gltf, "WalkingBackward");
            }

            if (this._keys["Space"]) {
                this._playAnimation(this._gltf, "Jumping");
            }
        }
    }

    onKeyUp(event) {
        if (this._gltf) {
            this._keys[event.code] = false;

            const keydownList = Object.keys(this._keys).filter((key) => this._keys[key]);

            if (keydownList.length === 0) {
                this._playAnimation(this._gltf, "Idle");
            }
        }
    }
}

window.onload = function () {
    new App();
};
