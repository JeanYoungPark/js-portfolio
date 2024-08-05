import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

class App {
    constructor() {
        this.main = document.querySelector("#main");
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(main.offsetWidth, main.offsetHeight);
        main.appendChild(renderer.domElement);

        this._renderer = renderer;

        const scene = new THREE.Scene();
        this._scene = scene;

        this._setupModel("../model/character2/model.glb");
        this._setupLight();
        this._setupCamera();
        // this._setupControls();

        window.onresize = this.resize.bind(this);
        window.addEventListener("keydown", this.onKeyDown.bind(this));
        window.addEventListener("keyup", this.onKeyUp.bind(this));
        this.resize();
        requestAnimationFrame(this.render.bind(this));

        this._mixerMap = {};
        this._animationsMap;
        this._previousTime = 0;
        this._camera;
    }

    // _setupControls(model) {
    //     new OrbitControls(this._camera, this._renderer.domElement);
    // }

    _setupAnimations(gltf) {
        const model = gltf.scene;
        const mixer = new THREE.AnimationMixer(model);
        const gltfAnimations = gltf.animations;

        if (gltfAnimations) {
            this._animationsMap = {};

            gltfAnimations.forEach((animationClip) => {
                const name = animationClip.name;
                const animationAction = mixer.clipAction(animationClip);
                this._animationsMap[name] = animationAction;
            });

            this._mixerMap[model.uuid] = mixer;
        }
    }

    _playAnimation(animationName) {
        const animationMap = this._animationsMap;

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

    _setupModel(url) {
        new GLTFLoader().load(url, (gltf) => {
            const model = gltf.scene;
            this._scene.add(model);

            this._setupAnimations(gltf);
            this._playAnimation("Idle");
        });
    }

    _setupCamera() {
        const camera = new THREE.PerspectiveCamera(750, window.innerWidth / window.innerHeight, 0.1, 2000);

        camera.position.set(0, 0, 300);
        this._camera = camera;
    }

    _setupLight() {
        const color = 0xffffff;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-300, 0, 10);
        light.castShadow = true;
        this._scene.add(light);

        const softLight = new THREE.AmbientLight(0xffffff, 3.3);
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
        }
    }

    updateCameraPosition() {
        const model = this._gltf?.scene;

        if (model) {
            // 카메라와 캐릭터 사이의 거리와 오프셋을 설정합니다.
            const distance = 1200; // 카메라와 캐릭터 사이의 거리
            const offset = new THREE.Vector3(-1000, 0, distance); // Y축과 Z축 오프셋

            // 카메라의 위치를 업데이트합니다.
            this._camera.position.copy(model.position).add(offset.applyMatrix4(model.matrixWorld));

            //         // 카메라가 캐릭터를 바라보도록 설정합니다.
            this._camera.lookAt(model.position);
        }
    }

    render(time) {
        this._renderer.render(this._scene, this._camera);
        this.update(time);

        // this.updateCameraPosition();

        requestAnimationFrame(this.render.bind(this));
    }

    resize() {
        const width = this.main.offsetWidth;
        const height = this.main.offsetHeight;

        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();

        this._renderer.setSize(width, height);
    }

    onKeyDown(event) {
        if (this._gltf) {
            this._keys[event.code] = true;

            if (this._keys["ArrowUp"] || this._keys["ArrowLeft"] || this._keys["ArrowRight"]) {
                this._playAnimation("Walking");
            } else if (this._keys["ArrowDown"]) {
                this._playAnimation(this._gltf, "WalkingBackward");
            }

            if (this._keys["Space"]) {
                this._playAnimation("Jumping");
            }
        }
    }

    onKeyUp(event) {
        if (this._gltf) {
            this._keys[event.code] = false;

            const keydownList = Object.keys(this._keys).filter((key) => this._keys[key]);

            if (keydownList.length === 0) {
                this._playAnimation("Idle");
            }
        }
    }
}

window.onload = function () {
    new App();
};
