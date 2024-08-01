import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

class App {
    constructor() {
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        this._renderer = renderer;

        const scene = new THREE.Scene();
        this._scene = scene;

        this._setupModel("../model/island/scene.gltf", { scale: 20, x: 0, y: -180, z: 0 });
        this._setupModel("../model/character/model.glb", { scale: 0.3, x: 46, y: -35, z: 200, rotationY: 3 }, true);

        this._setupLight();
        this._setupCamera();
        // this._setupControls();

        window.onresize = this.resize.bind(this);
        window.addEventListener("keydown", this.onKeyDown.bind(this));
        this.resize();
        requestAnimationFrame(this.render.bind(this));

        this._gltf;
        this._mixerMap = {};
        this._previousTime = 0;
    }

    _setupControls(model) {
        const orbitControls = new OrbitControls(this._camera, this._renderer.domElement);
        orbitControls.target.copy(model.position);
    }

    _setupAnimations(gltf) {
        const model = gltf.scene;
        const mixer = new THREE.AnimationMixer(model);
        const gltfAnimations = gltf.animations;
        const animationsMap = {};

        if (gltfAnimations) {
            gltfAnimations.forEach((animationClip) => {
                const name = animationClip.name;
                // const domButton = document.createElement("div");
                // domButton.classList.add("button");
                // domButton.innerText = name;

                // domButton.addEventListener("click", () => {
                //     const animationName = domButton.innerHTML;
                //     this.changeAnimation(animationName);
                // });
                const animationAction = mixer.clipAction(animationClip);
                animationsMap[name] = animationAction;
            });

            this._mixerMap[model.uuid] = mixer;
            animationsMap[gltfAnimations[0].name].play();
        }
    }

    _updateAnimation(gltf, name) {
        const model = gltf.scene;
        const mixer = new THREE.AnimationMixer(model);
        const gltfAnimations = gltf.animations;
        const animationsMap = {};

        if (gltfAnimations) {
            gltfAnimations.forEach((animationClip) => {
                const name = animationClip.name;
                const animationAction = mixer.clipAction(animationClip);
                animationsMap[name] = animationAction;
            });

            this._mixerMap[model.uuid] = mixer;
            animationsMap[name].play();
        }
    }

    _getAnimation() {}

    _setupModel(url, options = {}, isCenter = false) {
        const { scale = 1, x = 0, y = 0, z = 0, rotationX = 0, rotationY = 0, rotationZ = 0 } = options;

        new GLTFLoader().load(url, (gltf) => {
            const model = gltf.scene;

            model.scale.set(scale, scale, scale);
            model.position.set(x, y, z);
            model.rotation.set(rotationX, rotationY, rotationZ);
            model.castShadow = true;
            this._scene.add(model);

            if (isCenter) {
                this._gltf = gltf;
                this._setupControls(model);
                // this._camera.lookAt(model.position);
            }
            this._setupAnimations(gltf);
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
        });

        this._previousTime = time;
    }

    render(time) {
        this._renderer.render(this._scene, this._camera);
        this.update(time);

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
        const model = this._gltf.scene;

        console.log(this._gltf.animationAction);
        if (event.key === "ArrowUp" && model) {
            model.position.z -= 1;
            this._updateAnimation(this._gltf, "Walking");
        }
    }
}

window.onload = function () {
    new App();
};

// document.addEventListener("keyup", (e) => {
//     if (e.key === ArrowUp) {
//     }
//     console.log(e.key);
// });
