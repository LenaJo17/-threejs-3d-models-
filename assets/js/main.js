import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

let camera, scene, renderer, mixer;
let actions = {};
let activeAction, previousAction;
const clock = new THREE.Clock();

const animationsList = [
    { name: "hiphop", file: "Hip Hop Dancing.fbx" },
    { name: "jump", file: "Joyful Jump.fbx" },
    { name: "strafe", file: "Strafing.fbx" },
    { name: "running", file: "Running.fbx" },
    { name: "entry", file: "Entry.fbx" }
];

init();

function init() {
    const container = document.getElementById('canvas-container');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    // Añadimos niebla para profundidad
    scene.fog = new THREE.Fog(0x222222, 500, 1500);

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 2000);
    camera.position.set(100, 200, 400);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 100, 0);
    controls.update();

    // Luces
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(0, 200, 100);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Suelo para que el personaje no flote en la nada
    const grid = new THREE.GridHelper(2000, 20, 0x000000, 0x444444);
    scene.add(grid);

    const loader = new FBXLoader();

    // 1. Cargar el Personaje (Asegúrate que el archivo se llame Personaje.fbx con P mayúscula si así está en tu carpeta)
    loader.load('./assets/models/fbx/Personaje.fbx', (model) => {
        model.scale.setScalar(0.8); // Ajuste de tamaño
        model.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        mixer = new THREE.AnimationMixer(model);
        scene.add(model);

        // 2. Cargar animaciones
        animationsList.forEach(anim => {
            loader.load('./assets/models/fbx/' + anim.file, (animData) => {
                const action = mixer.clipAction(animData.animations[0]);
                actions[anim.name] = action;

                // Iniciar con "entry" por defecto
                if (anim.name === "entry") {
                    activeAction = action;
                    activeAction.play();
                }
            }, undefined, (err) => console.error("Error cargando: " + anim.file, err));
        });
    });

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onWindowResize);

    animate();
}

function fadeToAction(name, duration = 0.5) {
    if (!actions[name] || activeAction === actions[name]) return;

    previousAction = activeAction;
    activeAction = actions[name];

    if (previousAction) {
        previousAction.fadeOut(duration);
    }

    activeAction
        .reset()
        .setEffectiveTimeScale(1)
        .setEffectiveWeight(1)
        .fadeIn(duration)
        .play();
}

function onKeyDown(event) {
    switch (event.key) {
        case '1': fadeToAction('hiphop'); break;
        case '2': fadeToAction('jump'); break;
        case '3': fadeToAction('strafe'); break;
        case '4': fadeToAction('running'); break;
        case '5': fadeToAction('entry'); break;
    }
}

function onWindowResize() {
    const container = document.getElementById('canvas-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    renderer.render(scene, camera);
}