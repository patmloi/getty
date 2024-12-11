import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module'
import { Mesh, MeshBasicMaterial, TextureLoader, PlaneGeometry } from 'three'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Vector2, Vector3 } from 'three';

import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';


let flowerData  = {};

fetch('data.json')
    .then((response) => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json(); // Parse the JSON data from the response
    })
    .then((data) => {
        flowerData = data;
        generateFlowers(data);
    })
    .catch((error) => {
        console.error('There was a problem with the fetch operation:', error);
    });


const scene = new THREE.Scene();
scene.fog = new THREE.Fog( 0x000000, 0, 75 );


const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Text
var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 0, 10).normalize();
scene.add(directionalLight);

var pointLight = new THREE.PointLight(0xffffff, 3);
pointLight.position.set()

var ambientLight = new THREE.AmbientLight(0x404040); // soft white light
scene.add(ambientLight);

var titleGroup = new THREE.Group();
var titleText = 'flowers and art';
var titleZPos = 95; 

const depth = 0.05,
    size = 1,
    hover = 1,
    curveSegments = 15,
    bevelThickness = 0.05,
    bevelSize = 0.01;

let font = null;
const mirror = false;

const ttfLoader = new TTFLoader();

ttfLoader.load('fonts/ttf/Giarek-DemoVersion-Regular.ttf', function ( json ) {
    font = new Font(json);
    console.log("CHECK VAR")
    console.log(titleGroup)
    createText(titleText, titleZPos, titleGroup); 
    scene.add(titleGroup)
} );

function createText(text, zPos, group) {

    var textGeo = new TextGeometry( text, {

        font: font,

        size: size,
        depth: depth,
        curveSegments: curveSegments,

        bevelThickness: bevelThickness,
        bevelSize: bevelSize,
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


    const centerOffset = - 0.5 * ( textGeo.boundingBox.max.x - textGeo.boundingBox.min.x );
    const hover = 0.5 * ( textGeo.boundingBox.max.y - textGeo.boundingBox.min.y );

    var textMesh1 = new THREE.Mesh( textGeo, textMaterial );

    textMesh1.position.x = centerOffset;
    textMesh1.position.y = hover;
    textMesh1.position.z = 95;

    console.log("TEXT MESH")
    console.log(textMesh1.position.x, textMesh1.position.y, textMesh1.position.z)
    group.add( textMesh1 );

}

scene.add(titleGroup)


// Box
const boxSize = 5;
const geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
const materials = [
    new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, visible: false}), // Red
    new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide, visible: false}), // Green
    new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.DoubleSide, visible: false}), // Blue
    new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide, visible: false}), // Yellow
    new THREE.MeshBasicMaterial({ color: 0xff00ff, side: THREE.DoubleSide, visible: false}), // Magenta
    new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide, visible: false})  // Cyan
  ];
const cube = new THREE.Mesh(geometry, materials);
scene.add(cube);

camera.position.z = 100;

// Objects 
var objectsNum = 250; 
var objects = []; 
const flowerGroup = new THREE.Group();


function generateFlowers(data) {

    var imgNames = Object.keys(data); 

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
            material.map = texture
            material.transparent = true
            material.needsUpdate = true

            var geo = new THREE.PlaneGeometry( 1, 1 );

            // Item 
            var mesh = new Mesh(geo, material);
            mesh.scale.x = texture.image.width / 1000;
            mesh.scale.y = texture.image.height / 1000;
            mesh.material.side = THREE.DoubleSide;
            mesh.name = imgName;

            console.log("MESH NAME")
            console.log(mesh.name)

            // Position
            const phi = Math.acos( - 1 + ( 2 * i ) / l );
            const theta = Math.sqrt( l * Math.PI ) * phi;
            mesh.position.setFromSphericalCoords(10, phi, theta );

            // Direction
            const vector = new THREE.Vector3();
            vector.copy(mesh.position).multiplyScalar(3);
            mesh.lookAt(vector);

            flowerGroup.add(mesh);
        });

    };
};
scene.add(flowerGroup);

console.log("FLOWER GROUP POSITION")
console.log(flowerGroup.position.x, flowerGroup.position.y, flowerGroup.position.z)

// Flower are clickable 
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Modal 
var showModal = false; // Change this value to false to hide the modal
const myModal = new bootstrap.Modal(document.getElementById('myModal'));


// Add an event listener for mouse clicks
window.addEventListener('click', onClick, false);


function updatePopupImg(id, intersectName){
    var intersectJpg = intersectName.slice(0, -3) + 'jpg'; 
    var popupImgPath = "artwork/" + intersectJpg
    var popupImgId = '#' + id; 
    var popupImg = document.querySelector(popupImgId); 
    popupImg.src = popupImgPath; 
}

function updatePopupText(id, intersectInfo, key){
    var popupItemId = '#' + id; 
    var popupItem = document.querySelector(popupItemId);
    popupItem.textContent = intersectInfo[key]; 
}

function updatePopupUrl (id, intersectInfo, key){
    var popupItemId = '#' + id; 
    var popupItem = document.querySelector(popupItemId);
    popupItem.href = intersectInfo[key]; 
}

function displayPopup(intersectObject){
    intersectObject.material.color.set(0x0000ff);
    var intersectName = intersectObject.name; 
    var intersectInfo = flowerData[intersectName];

    // Show popup
    const popupElement = document.querySelector('#popup');
    popupElement.style.display = 'block';

    // Change text
    updatePopupImg('popupImg', intersectName)
    updatePopupText('popupTitle', intersectInfo, 'title')
    updatePopupText('popupArtist', intersectInfo, 'artist')
    updatePopupText('popupDesc', intersectInfo, 'description')
    updatePopupUrl('popupUrl', intersectInfo, 'url')
}

function closePopup() {
    const popupElement = document.querySelector('#popup');
    if (popupElement) {
        popupElement.style.display = 'none';
        console.log("CLOSED");
    } else {
        console.log("Popup element not found");
    }
}


function onClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.ray.origin.copy(camera.position);
    raycaster.ray.direction.set(mouse.x, mouse.y, 1).unproject(camera).normalize();

    const intersects = raycaster.intersectObjects(flowerGroup.children, true);
    console.log('Intersections:', intersects);

    if (intersects.length > 0) {
        // Get intersected element
        const intersectObject = intersects[0].object;
        console.log("INTERSECT OBJECT")
        console.log(intersectObject)
        displayPopup(intersectObject)

        
        if (showModal) {
            myModal.show(); // Show the modal

            
        } else {
            myModal.hide(); // Hide the modal

        }
    } else {
        console.log('Nothing clicked');
    }
}

// Stars
// Sphere
const baseRadius = 1;
const minRadius = 0.01;
const maxRadius = 0.05;
const sphereGeometry = new THREE.SphereGeometry(baseRadius, 32, 32);
const sphereMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff, 
    emissiveIntensity: 2.0 
});

// Instances
const count = 25000;
const instancedMesh = new THREE.InstancedMesh(sphereGeometry, sphereMaterial, count);

// Customising each star: 
const dummy = new THREE.Object3D(); 

for (let i = 0; i < count; i++) {
    // Positions
    dummy.position.set(
        Math.random() * 200 - 100,
        Math.random() * 200 - 100,
        Math.random() * 200 - 100
    );

    // Size
    const randomRadius = minRadius + (maxRadius - minRadius) * Math.random();
    dummy.scale.set(randomRadius, randomRadius, randomRadius);

    // Apply transformations
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);
}

// Update mesh
instancedMesh.instanceMatrix.needsUpdate = true;
scene.add(instancedMesh);

// Set up post-processing
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// Add UnrealBloomPass with increased strength for visibility
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.0, 0.4, 0.95);
bloomPass.renderTargetsHorizontal.forEach(element => {
    element.texture.type = THREE.FloatType;
});
bloomPass.renderTargetsVertical.forEach(element => {
    element.texture.type = THREE.FloatType;
});
composer.addPass(bloomPass);

// Variables for rotation
let targetRotationX = 0.2;
let targetRotationOnMouseDownX = 0;

let targetRotationY = 0.2;
let targetRotationOnMouseDownY = 0;

let mouseX = 0;
let mouseXOnMouseDown = 0;

let mouseY = 0;
let mouseYOnMouseDown = 0;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

let slowingFactor = 0.1;

// Event Listeners
document.addEventListener('mousedown', onDocumentMouseDown, false);

function onDocumentMouseDown(event) {
    event.preventDefault();

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mouseup', onDocumentMouseUp, false);
    document.addEventListener('mouseout', onDocumentMouseOut, false);

    mouseXOnMouseDown = event.clientX - windowHalfX;
    targetRotationOnMouseDownX = targetRotationX;

    mouseYOnMouseDown = event.clientY - windowHalfY;
    targetRotationOnMouseDownY = targetRotationY;
}

function onDocumentMouseMove(event) {
    mouseX = event.clientX - windowHalfX;
    targetRotationX = (mouseX - mouseXOnMouseDown) * 0.0001;

    mouseY = event.clientY - windowHalfY;
    targetRotationY = (mouseY - mouseYOnMouseDown) * 0.0001;
}

function onDocumentMouseUp(event) {
    document.removeEventListener('mousemove', onDocumentMouseMove, false);
    document.removeEventListener('mouseup', onDocumentMouseUp, false);
    document.removeEventListener('mouseout', onDocumentMouseOut, false);
}

function onDocumentMouseOut(event) {
    document.removeEventListener('mousemove', onDocumentMouseMove, false);
    document.removeEventListener('mouseup', onDocumentMouseUp, false);
    document.removeEventListener('mouseout', onDocumentMouseOut, false);
}

// Rotation Functions
function rotateAroundWorldAxis(object, axis, radians) {
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationAxis(axis.normalize(), radians);
    rotationMatrix.multiply(object.matrix); // Pre-multiply
    object.matrix = rotationMatrix;
    object.rotation.setFromRotationMatrix(object.matrix);
}

// Window resize
window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

function lerp(x, y, a) {
    return (1 - a) * x + a * y
}

// Used to fit the lerps to start and end at specific scrolling percentages
function scalePercent(start, end) {
    return (scrollPercent - start) / (end - start)
}

const animationScripts = [];

// Animations
animationScripts.push({
    start: 0,
    end: 100,
    func: function() {
        camera.position.set(0, 1, 0);
        const newZ = lerp(100, 0, scalePercent(0, 100));
        camera.position.set(0, 1, newZ);
    },
});
function playScrollAnimations() {
    animationScripts.forEach((a) => {
        if (scrollPercent >= a.start && scrollPercent < a.end) {
            a.func()
        }
    })
}

let scrollPercent = 0

document.body.onscroll = () => {
    //calculate the current scroll progress as a percentage
    scrollPercent =
        ((document.documentElement.scrollTop || document.body.scrollTop) /
            ((document.documentElement.scrollHeight ||
                document.body.scrollHeight) -
                document.documentElement.clientHeight)) * 100
    ;(document.getElementById('scrollProgress')).innerText =
        'Scroll Progress : ' + scrollPercent.toFixed(2)
}

let time = 0;
// Rendering 
function animate() {

    time += 0.10;
    // Animation
    requestAnimationFrame(animate)
    instancedMesh.rotation.x += 0.00001;
    instancedMesh.rotation.y += 0.00001;

    // Continue rotating the flowerGroup automatically
    if (targetRotationX === 0 && targetRotationY === 0) {
        flowerGroup.rotation.y += 0.0001;
        flowerGroup.rotation.x += 0.0001;
    } else {
        // Rotate the flowerGroup based on user interaction
        rotateAroundWorldAxis(flowerGroup, new THREE.Vector3(0, 1, 0), targetRotationX);
        rotateAroundWorldAxis(flowerGroup, new THREE.Vector3(1, 0, 0), targetRotationY);
        targetRotationX = targetRotationX * (1 - slowingFactor);
        targetRotationY = targetRotationY * (1 - slowingFactor);
    }

    playScrollAnimations()


    render()
}

function render() {
    composer.render();
    // composer.render();
    // renderer.render(scene, camera)
}

window.scrollTo({ top: 0, behavior: 'smooth' })
animate()