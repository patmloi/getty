// import * as THREE from 'three';
// import { Mesh, MeshBasicMaterial, TextureLoader, PlaneGeometry } from 'three'

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.140.0/build/three.module.js'
import { Mesh, MeshBasicMaterial, TextureLoader, PlaneGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.140.0/build/three.module.js';

// import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
// import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
// import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
// import { Font } from 'three/addons/loaders/FontLoader.js';
// import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.140.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.140.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.140.0/examples/jsm/postprocessing/UnrealBloomPass.js';

import { TTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.140.0/examples/jsm/loaders/TTFLoader.js';
import { Font } from 'https://cdn.jsdelivr.net/npm/three@0.140.0/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.140.0/examples/jsm/geometries/TextGeometry.js';


// Utilities
var noise = id => 1. * Math.sin(id);

// Global variables
let scene, camera, renderer, composer;
let flowerGroup = new THREE.Group(), titleGroup = new THREE.Group(), starsMesh
let raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2(), modalShown = false;
let highlightedFlower = false, originalMaterial = false; 
const modalElement = document.querySelector('#modal');
let flowerData = {};
let scrollPercent = 0;

let flockParams = {
    separationFactor: 1.5,    // Stronger separation to prevent clustering
    alignmentFactor: 0.3,      // Encourage group alignment
    cohesionFactor: 0.3,       // Tendency to move as a group
    maxSpeed: 0.01,             // Consistent group speed
    perceptionRadius: 1.0,     // Radius of interaction between stars
    targetSpeed: 0.005,         // Desired overall group velocity
    globalDirection: new THREE.Vector3(1, 0.2, 0.1) // Consistent group movement direction
};

// Rotation variables 
let windowHalfX = window.innerWidth / 2, windowHalfY = window.innerHeight / 2;
let mouseX = 0, mouseY = 0;
let mouseXOnMouseDown = 0, mouseYOnMouseDown = 0;
let targetRotationX = 0.2, targetRotationY = 0.2;
let targetRotationOnMouseDownX = 0, targetRotationOnMouseDownY = 0;


// Initialize the scene
function initScene() {
    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 0, 75);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 100;

    // Renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
}

// Setup lighting
function initLighting() {
    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 0, 10).normalize();
    scene.add(directionalLight);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
}

function createText(text, font, zPos, group) {
    const textDepth = 0.05,
        textSize = 1,
        textCurveSegments = 15,
        textBevelThickness = 0.05,
        textBevelSize = 0.01;

    var textGeo = new TextGeometry( text, {

        font: font,

        size: textSize,
        depth: textDepth,
        curveSegments: textCurveSegments,

        bevelThickness: textBevelThickness,
        bevelSize: textBevelSize,
        bevelEnabled: true

    } );

    textGeo.computeBoundingBox();
    textGeo.computeVertexNormals();

    var textMaterial = new THREE.MeshPhongMaterial( { 
        color: 0xffffff,
        specular: 0xffffff,
        flatShading: false,
        reflectivity: 10,
        shininess: 15,
        emissive: 0xffffff,
        emissiveIntensity: 0.40
     } );

    const centerOffset = - 0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);
    const textHover = 0.5 * (textGeo.boundingBox.max.y - textGeo.boundingBox.min.y);

    var textMesh = new THREE.Mesh(textGeo, textMaterial);

    textMesh.position.x = centerOffset;
    textMesh.position.y = textHover;
    textMesh.position.z = 95;

    group.add(textMesh);

}

function initTitle() {
    const ttfLoader = new TTFLoader();
    ttfLoader.load('fonts/ttf/Giarek-DemoVersion-Regular.ttf', function(json) {
        var titleFont = new Font(json);
        createText("Getty's Flowers", titleFont, 95, titleGroup);
        scene.add(titleGroup);
    });
}

function initStar() {
    // Star
    const minRadius = 0.01;
    const maxRadius = 0.05;

    // Randomise star
    const dummy = new THREE.Object3D(); 

    // Randomise position
    dummy.position.set(
        Math.random() * 200 - 100,
        Math.random() * 200 - 100,
        Math.random() * 200 - 100
    );

    // Randomise size 
    const randomRadius = minRadius + (maxRadius - minRadius) * Math.random();
    dummy.scale.set(randomRadius, randomRadius, randomRadius);

    // Apply transformation 
    dummy.updateMatrix();
    return dummy; 
}

function initStars(count){ 
    // Sphere
    const baseRadius = 1;
    const sphereGeometry = new THREE.SphereGeometry(baseRadius, 5, 5);
    const sphereMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff, 
        emissiveIntensity: 2.0 
    });

    // Instanced Mesh
    starsMesh = new THREE.InstancedMesh(sphereGeometry, sphereMaterial, count);

    // Add stars to mesh
    for (let i = 0; i < count; i++) { 
        let star = initStar();
        starsMesh.setMatrixAt(i, star.matrix);
    }

    // Update mesh
    starsMesh.instanceMatrix.needsUpdate = true;
    scene.add(starsMesh);
    return starsMesh
}

function initFlowers(data) {

    var imgNames = Object.keys(data); 
    var objectsNum = 250; 

    // Create flower objects 
    for (let i = 0, l = objectsNum; i < objectsNum; i++) {
        const loader = new TextureLoader();

        // Image 
        let refIndex= i % imgNames.length;
        let imgName = imgNames[refIndex];
        let imgPath = 'textures/' + imgName;

        loader.load(imgPath, function (texture) {
            // Item components
            const material = new THREE.MeshBasicMaterial()
            // const material = new THREE.MeshStandardMaterial();
            // material.flatShading = false;
            // material.normalScale = new THREE.Vector2(0,0);
            material.map = texture
            material.transparent = true
            material.needsUpdate = true

            var geo = new THREE.PlaneGeometry( 1, 1 );

            // Item 
            var mesh = new Mesh(geo, material);
            var scale_random = 1.125 + .125 * noise(39278 * i);
            mesh.scale.x = texture.image.width / 1000 * scale_random;
            mesh.scale.y = texture.image.height / 1000 * scale_random;
            mesh.material.side = THREE.DoubleSide;
            mesh.name = imgName;

            // Position
            const phi = Math.acos( - 1 + ( 2 * i ) / l );
            const theta = Math.sqrt( l * Math.PI ) * phi;
            mesh.position.setFromSphericalCoords(10, phi, theta);

            // Direction
            const vector = new THREE.Vector3();
            vector.copy(mesh.position).multiplyScalar(3);
            mesh.lookAt(vector);

            mesh.rotateX(.3 * noise(10385 * i));
            mesh.rotateY(.3 * noise(18394 * i));
            mesh.rotateZ(.3 * noise(19372 * i));

            flowerGroup.add(mesh);
            scene.add(flowerGroup);
        });

    };
};

function initBloomPass() {
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.0, 0.4, 0.95);
    bloomPass.renderTargetsHorizontal.forEach(element => {
        element.texture.type = THREE.FloatType;
    });
    bloomPass.renderTargetsVertical.forEach(element => {
        element.texture.type = THREE.FloatType;
    });
    return bloomPass; 
};

function initPostProcessing() {
    composer = new EffectComposer(renderer); 
    var bloomPass = initBloomPass();

    composer.addPass(new RenderPass(scene, camera)); // RenderPass 
    composer.addPass(bloomPass); // BloomPass

};

// Event Handling
// Mouse click event handling 
function updateModalImg(id, intersectName){
    var intersectJpg = intersectName.slice(0, -3) + 'jpg'; 
    var popupImgPath = "artwork/" + intersectJpg
    var popupImgId = '#' + id; 
    var popupImg = document.querySelector(popupImgId); 
    popupImg.src = popupImgPath; 
}

function updateModalText(id, intersectInfo, key){
    var popupItemId = '#' + id; 
    var popupItem = document.querySelector(popupItemId);
    popupItem.textContent = intersectInfo[key]; 
}

function updateModalArtist(id, intersectInfo) {
    var popupItemId = '#' + id; 
    var popupItem = document.querySelector(popupItemId);

    if (intersectInfo['artistUrl'][0] == "") {
        popupItem.textContent = intersectInfo['artist']; 
    }
    else {
        var artistsUrls = intersectInfo['artist'].map((artist, index) => ({
            Artist: artist, 
            Url: intersectInfo['artistUrl'][index]
        }));

        var artistsUrlsList = artistsUrls.map(au => 
            `<a class='modalUrl' href="${au.Url}" target="_blank">
                ${au.Artist}
            </a>`
        );

        // Join the links with comma separator
        popupItem.innerHTML = artistsUrlsList.join(', &nbsp;');
    }
}

function updateModalLink (id, intersectInfo, key){
    var popupItemId = '#' + id; 
    var popupItem = document.querySelector(popupItemId);
    popupItem.href = intersectInfo[key]; 
}

function updateModal(intersectObject){
    // intersectObject.material.color.set(0x0000ff);
    var intersectName = intersectObject.name; 
    var intersectInfo = flowerData[intersectName];

    // Show modal
    modalElement.style.display = 'flex';
    modalShown = true;

    // Change text
    updateModalImg('modalImg', intersectName)
    updateModalText('modalTitle', intersectInfo, 'title')
    updateModalArtist('modalArtist', intersectInfo)
    updateModalText('modalDate', intersectInfo, 'date')
    updateModalText('modalDesc', intersectInfo, 'description')
    updateModalLink('modalLink', intersectInfo, 'url')
};

function removeMovedFlower() {
    var movedFlower = scene.getObjectByName('movedFlower');
    scene.remove(movedFlower);

}

function explanationsVisible(){
    document.querySelectorAll('.explanation').forEach(element => {
        element.style.opacity = 1;
    });
}

function flowersVisible() {
    flowerGroup.children.forEach(flower => {
        if (flower.material) {
            flower.material.opacity = 1;
            flower.material.transparent = true; // Keep this true to allow future opacity changes
            flower.material.needsUpdate = true;
        }
    });
}

function resetFlowers() {
    removeMovedFlower(); 
    flowersVisible(); 
    explanationsVisible(); 
    
}

function closeModal() {
    resetFlowers(); 
    modalElement.style.display = 'none';
    modalShown = false;
};

function hideExplanations() {
    document.querySelectorAll('.explanation').forEach(element => {
        element.style.opacity = 0;
    });
}

function hideFlowers () {
    flowerGroup.children.forEach(flower => {
        if (flower.material && flower.name != 'movedFlower') {
            flower.material.opacity = 0;
            flower.material.transparent = true;
            flower.material.needsUpdate = true;
        }
    });
}

function getFlowerPosition(movedFlower) {
    if (!movedFlower) {
        console.error("movedFlower is undefined");
        return;
    }

    // Calculate the desired height of the flower in viewport space (e.g., 1.1 times viewport height)
    const desiredViewportHeight = 1.1;

    // Calculate the distance from the camera where the flower should stop
    const fov = camera.fov * (Math.PI / 180); // convert to radians
    const flowerHeight = movedFlower.scale.y;
    const distance = (flowerHeight / 2) / Math.tan(fov / 2) / desiredViewportHeight;

    // Calculate horizontal position
    const aspectRatio = window.innerWidth / window.innerHeight;
    const flowerWidth = movedFlower.scale.x;
    const visibleWidthRatio = 0.9; // 90% of the flower width should be visible
    const horizontalFov = fov * aspectRatio;
    const horizontalOffset = (distance * Math.tan(horizontalFov / 2)) * (0.5 + (1 - visibleWidthRatio) / 2);

    // Calculate target position
    const targetPosition = camera.position.clone();
    const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const cameraRight = new THREE.Vector3(0.75, 0, 0).applyQuaternion(camera.quaternion);
    targetPosition.addScaledVector(cameraDirection, distance);
    targetPosition.addScaledVector(cameraRight, horizontalOffset);
    return targetPosition;
}

function highlightFlower(intersectObject) {
    if (highlightedFlower != intersectObject) {
        resetHighlightedFlower(); 

    }
    if (highlightedFlower == false && originalMaterial == false) {
        const highlightMaterial = new THREE.MeshStandardMaterial();
        highlightMaterial.map = intersectObject.material.map;
        highlightMaterial.transparent = true; 
        highlightMaterial.needsUpdate = true; 
        highlightMaterial.emissive = new THREE.Color(0xffffff);
        highlightMaterial.missiveIntensity = 1000;
        highlightMaterial.side = THREE.DoubleSide; 
    
        highlightedFlower = intersectObject; 
        originalMaterial = intersectObject.material;
        highlightedFlower.material = highlightMaterial;
    }

}

function resetHighlightedFlower() {
    if (highlightedFlower) {
        highlightedFlower.material = originalMaterial;
        highlightedFlower = false;
        originalMaterial = false;
    }
}


function changeBackgroundFlower(intersectObject, intersectPoint){
    var movedFlower = intersectObject.clone();
    if (intersectObject.material) {
        movedFlower.material = intersectObject.material.clone();
        movedFlower.material.opacity = 1;
        movedFlower.material.transparent = true;
        movedFlower.material.needsUpdate = true;
    }

    movedFlower.name = "movedFlower";

    // Position
    var targetPosition = getFlowerPosition(movedFlower); 
    movedFlower.position.copy(targetPosition);

    // Transformation
    const targetQuaternion = camera.quaternion.clone();
    movedFlower.quaternion.copy(targetQuaternion); 

    scene.add(movedFlower);
}

function getFlowerIntersectMouse() {
    raycaster.ray.origin.copy(camera.position);
    raycaster.ray.direction.set(mouse.x, mouse.y, 1).unproject(camera).normalize();
    return raycaster.intersectObjects(flowerGroup.children, true);
}

function updateMouseGlobal(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}

function onHover() {
    if (modalShown) return;

    let intersects = getFlowerIntersectMouse();
    if (intersects.length > 0) {
        document.body.style.cursor = 'pointer';
        var intersectObject = intersects[0].object;
        highlightFlower(intersectObject);

    } else {
        document.body.style.cursor = 'auto';
        resetHighlightedFlower(); 

    }
}

function onClick(event) {
    if (modalShown) return;

    let intersects = getFlowerIntersectMouse();
    if (intersects.length > 0) {
        // Get intersected element
        var intersectPoint = intersects[0].point;
        var intersectObject = intersects[0].object;
        resetHighlightedFlower(); 
        changeBackgroundFlower(intersectObject, intersectPoint);
        hideFlowers(); 
        hideExplanations(); 
        updateModal(intersectObject);
    }
}; 

// Mouse actions event handling
function onDocumentMouseDown(event) {
    if (!modalShown) {
        event.preventDefault();

        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('mouseup', onDocumentMouseUp, false);
        document.addEventListener('mouseout', onDocumentMouseOut, false);
    
        mouseXOnMouseDown = event.clientX - windowHalfX;
        targetRotationOnMouseDownX = targetRotationX;
    
        mouseYOnMouseDown = event.clientY - windowHalfY;
        targetRotationOnMouseDownY = targetRotationY;
    }
};

function onDocumentMouseMove(event) {
    mouseX = event.clientX - windowHalfX;
    targetRotationX = (mouseX - mouseXOnMouseDown) * 0.0001;

    mouseY = event.clientY - windowHalfY;
    targetRotationY = (mouseY - mouseYOnMouseDown) * 0.0001;
};

function onDocumentMouseUp(event) {
    document.removeEventListener('mousemove', onDocumentMouseMove, false);
    document.removeEventListener('mouseup', onDocumentMouseUp, false);
    document.removeEventListener('mouseout', onDocumentMouseOut, false);
};

function onDocumentMouseOut(event) {
    document.removeEventListener('mousemove', onDocumentMouseMove, false);
    document.removeEventListener('mouseup', onDocumentMouseUp, false);
    document.removeEventListener('mouseout', onDocumentMouseOut, false);
};

// Window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render(); 
}

// Update scroll progress
function updateScrollPercent() {
    scrollPercent = ((document.documentElement.scrollTop || document.body.scrollTop) /
        ((document.documentElement.scrollHeight || document.body.scrollHeight) -
            document.documentElement.clientHeight)) * 100;
};

function lerp(x, y, a) {
    return (1 - a) * x + a * y
};

function scalePercent(start, end) {
    return (scrollPercent - start) / (end - start)
};

function scrollAnimation() {
    const scrollAnimationList = [
        {
            start: 0,
            end: 100,
            func: function() {
                camera.position.set(0, 1, 0);
                const newZ = lerp(100, 0, scalePercent(0, 100));
                camera.position.set(0, 1, newZ);
            }
        }];

    scrollAnimationList.forEach((a) => {
        if (scrollPercent >= a.start && scrollPercent < a.end) {
            a.func()
        }
    })
}

function initEventListeners() {
    // Scroll
    document.addEventListener('mousedown', onDocumentMouseDown, false);
    // Clicks 
    window.addEventListener('click', onClick, false);
    document.getElementById('closeBtn').addEventListener('click', closeModal);
    // Mouse moves
    document.addEventListener('mousemove', updateMouseGlobal, false);

    window.addEventListener('resize', onWindowResize, false);
    document.body.onscroll = updateScrollPercent;
}; 

function rotateStars(starsSpeed){
    starsMesh.rotation.x += starsSpeed;
    starsMesh.rotation.y += starsSpeed;
};

function rotateAroundSphereAxis(object, axis, radians) {
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationAxis(axis.normalize(), radians);
    rotationMatrix.multiply(object.matrix); // Pre-multiply
    object.matrix = rotationMatrix;
    object.rotation.setFromRotationMatrix(object.matrix);
}; 

function rotateSphere(sphereSpeed) {
    if (!modalShown) {
        // Continue rotating the flowerGroup automatically
        if (targetRotationX === 0 && targetRotationY === 0) {
            flowerGroup.rotation.y += sphereSpeed;
            flowerGroup.rotation.x += sphereSpeed;
        } else {
            // Rotate the flowerGroup based on user interaction
            rotateAroundSphereAxis(flowerGroup, new THREE.Vector3(0, 1, 0), targetRotationX);
            rotateAroundSphereAxis(flowerGroup, new THREE.Vector3(1, 0, 0), targetRotationY);
            var slowingFactor = 0.1;
            targetRotationX = targetRotationX * (1 - slowingFactor);
            targetRotationY = targetRotationY * (1 - slowingFactor);
        }

    }


    // Reset rotation
    targetRotationX = 0;
    targetRotationY = 0;
    
}; 

function render() {
    composer.render();
}; 

function jitterFlowers(time) {
    flowerGroup.children.forEach((flower, i) => {
        flower.position.setLength(10 + .6 * noise(10012 * i + .2 * time));
    });
}

var time = 0;
function animate() {
    requestAnimationFrame(animate);
    jitterFlowers(time);
    rotateStars(0.000005);
    rotateSphere(0.00025); 
    scrollAnimation();
    render();

    onHover();
    time += .01;
}

function initMobile() {
    initScene();
    initLighting();
    initStars(50000);
    initPostProcessing();
    render();
}

function initDesktop() {
    initScene();
    initLighting();
    initTitle();
     
    initStars(50000);
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            flowerData = data;
            initFlowers(data);
        })
        .catch(error => console.error('Error loading data:', error));
    // setupRaycaster();
    
    initPostProcessing();
    initEventListeners();
    animate();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function init() {
    const screenThreshold = 768; // Set your screen size threshold
    if (window.innerWidth >= screenThreshold) {
        initDesktop();
    } else {
        initMobile();
        // console.log('Screen size is too small. Initialization skipped.');
    }
}

init(); 

