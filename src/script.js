import { gsap } from 'gsap';
import { Noise } from 'noisejs';

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader';
import { DotScreenShader } from 'three/examples/jsm/shaders/DotScreenShader';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader';

import * as Nodes  from 'three/examples/jsm/nodes/Nodes.js';
import { NodePass }  from 'three/examples/jsm/nodes/postprocessing/NodePass.js';
import { SceneUtils } from 'three/examples/jsm/utils/SceneUtils.js';

// import * as Stats from 'stats.js';

const canvas = document.getElementById( 'background' );

const noise = new Noise(Math.random());
const bonusH = 15 * window.innerHeight / 100;
let width = window.innerWidth;

/*
let stats = new Stats();
stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );
*/

export class MainScene {
	constructor() {
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
		this.camera.rotation.x = THREE.Math.degToRad(72);
		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			canvas: canvas,
		 });
		this.renderer.setSize(window.innerWidth, window.innerHeight + bonusH);
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.camera.position.set(0, -80, 40);
		
		// loader
		this.loadingManager = new THREE.LoadingManager( () => {
			const loadingScreen = document.getElementById( 'loading-screen' );
			loadingScreen.classList.add( 'loaded' );
			
			const main = document.getElementById( 'container' );
			main.classList.add( 'loaded' );
		});
		
		// terrain
		this.noise = [];
		this.offset = 0.0;
		
		//moon
		this.planetRing = new THREE.Group();
		this.count = 0;
		this.moon;

		// model
		this.loader = new GLTFLoader(this.loadingManager);
		this.model = new THREE.Group();

		// postprocessing
		this.composer = new EffectComposer( this.renderer );
		this.composer.setSize(window.innerWidth, window.innerHeight + bonusH);
		
		// node
		this.nodepass = new NodePass();
		this.clock = new THREE.Clock();
		this.frame = new Nodes.NodeFrame();

		let that = this;
		document.addEventListener('mousemove', function(e) {
			that.moveJoint(that.getMousePos(e), 15);
		});

		this.bindFuncs = this.bindFuncs.bind(this);
		this.bindFuncs();
	}

	bindFuncs() {
		this.animate = this.animate.bind(this);
		this.postProcessing = this.postProcessing.bind(this);
		this.handleResize = this.handleResize.bind(this);
		this.buildModel = this.buildModel.bind(this);
		this.buildGeom = this.buildGeom.bind(this);
		this.buildTerrain = this.buildTerrain.bind(this);
		this.buildPlanetMoon = this.buildPlanetMoon.bind(this);
		this.buildLight = this.buildLight.bind(this);
	}

	buildGeom() {
		this.buildModel();
		this.buildTerrain();
		this.buildPlanetMoon();
		this.buildLight();
	}

	buildLight() {
		const light = new THREE.PointLight(0xffffff, 2.5);
		light.position.set(0, -80, 40);
		this.scene.add(light);
	}

	buildTerrain() {
		const material = new THREE.MeshLambertMaterial({
		  wireframe: true,
		  // Due to limitations of the OpenGL Core Profile with the WebGL renderer on most platforms linewidth will always be 1 regardless of the set value.
		  wireframeLinewidth: 2.0,
		});
		const maxTerrainWidth = 250;
		const plane = new THREE.PlaneGeometry(50, maxTerrainWidth, 60, maxTerrainWidth / (5/3));

		for (let i = 0, l = plane.vertices.length; i < l; i += 1) {
		  const { x, y } = plane.vertices[i];
		  const noiseVal = this.map_range(noise.perlin2(x/6, y/6), 0, 1, -2.5, 2.5);
		  this.noise.push(noiseVal);
		  plane.vertices[i].z = noiseVal;
		}

		this.terrain = new THREE.Mesh(plane, material);
		this.terrain.rotateZ(270 * Math.PI / 180);
		this.scene.add(this.terrain);
	}

	map_range(value, low1, high1, low2, high2) {
		return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
	}
	
	buildPlanetMoon() {
		const material1 = new THREE.MeshLambertMaterial({
			color: 0x444400
		});
		const material2 = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			wireframe: true
		});

		const planet = SceneUtils.createMultiMaterialObject(
			new THREE.IcosahedronGeometry(300, 3), [
				material1, material2
			]
		);
		planet.position.set(-400, 1100, 0);

		this.planetRing.add(planet);

		const ringMaterial = new THREE.MeshBasicMaterial( { color: 0xeee000 } );
		const ringGeo = new THREE.RingGeometry( 340, 500, 100, 1 );
		const ring = new THREE.Mesh( ringGeo, ringMaterial );
		ring.position.copy(planet.position);
		ring.rotateZ(THREE.Math.degToRad(90));
		ring.rotateX(THREE.Math.degToRad(35));

		this.planetRing.add(ring);

		this.moon= SceneUtils.createMultiMaterialObject(
			new THREE.IcosahedronGeometry(50, 3), [
				material1, material2
			]
		);
		this.moon.position.set(-100, 900, 50);

		this.scene.add(this.planetRing);
		this.scene.add(this.moon);
	}

	// Load the 3D model
	buildModel() {
		let that = this;
		// Load a glTF resource
		this.loader.load(
			// resource URL
			'models/basic-head/scene.gltf',
			// called when the resource is loaded
			function(data) {
				that.model = data.scene;
				that.model.scale.set(.45,.45,.45);
				
				that.model.position.set(0, 0, 13);
				that.model.rotateX(THREE.Math.degToRad(90));
				that.model.rotateY(THREE.Math.degToRad(-50));
				
				that.setModelXPosition();
				
				// animation up and down
				gsap.from( that.model.position, 3, {
					z: 18,
					yoyo: true,
					repeat: -1,
					ease: 'Power2.easeInOut'
				});
				
				that.scene.add(that.model);
			},
			// called while loading is progressing
			function ( xhr ) {
				console.log( ( xhr.loaded / xhr.total * 100 ) + '% model loaded' );
			},
			// called when loading has errors
			function ( error ) {
				console.log( 'An error happened while loading model' );
			}
		);
	}
	
	setModelXPosition() {
		// Get visible size
		let vFOV = THREE.MathUtils.degToRad( this.camera.fov ); // convert vertical fov to radians
		let visibleHeight = 2 * Math.tan( vFOV / 2 ) * this.model.position.distanceTo(this.camera.position);
		let visibleWidth = visibleHeight * this.camera.aspect;
		
		this.model.position.x = visibleWidth/4;
	}
	
	/*
		Model's direction follow the cursor
		https://tympanus.net/codrops/2019/10/14/how-to-create-an-interactive-3d-character-with-three-js/
	*/
	// Return current mouse position
	getMousePos(e) {
		return { x: e.clientX, y: e.clientY };
	}
	// Rotate the model under the degree limit
	moveJoint(mouse, degreeLimit) {
		let degrees = this.getMouseDegrees(mouse.x, mouse.y, degreeLimit);
		// add default rotation
		this.model.rotation.y = THREE.Math.degToRad(degrees.x + -50);
		this.model.rotation.x = THREE.Math.degToRad(degrees.y + 90);
	}
	// Check the degree rotation needed
	getMouseDegrees(x, y, degreeLimit) {
		let dx = 0,
		dy = 0,
		xdiff,
		xPercentage,
		ydiff,
		yPercentage;

		let w = { x: window.innerWidth, y: window.innerHeight };

		// Left (Rotates neck left between 0 and -degreeLimit)

		// 1. If cursor is in the left half of screen
		if (x <= w.x / 2) {
			// 2. Get the difference between middle of screen and cursor position
			xdiff = w.x / 2 - x;  
			// 3. Find the percentage of that difference (percentage toward edge of screen)
			xPercentage = (xdiff / (w.x / 2)) * 100;
			// 4. Convert that to a percentage of the maximum rotation we allow for the neck
			dx = ((degreeLimit * xPercentage) / 100) * -1;
		}
		
		// Right (Rotates model right between 0 and degreeLimit)
		if (x >= w.x / 2) {
			xdiff = x - w.x / 2;
			xPercentage = (xdiff / (w.x / 2)) * 100;
			dx = (degreeLimit * xPercentage) / 100;
		}
		// Up (Rotates model up between 0 and -degreeLimit)
		if (y <= w.y / 2) {
			ydiff = w.y / 2 - y;
			yPercentage = (ydiff / (w.y / 2)) * 100;
			// Note that I cut degreeLimit in half when she looks up
			dy = (((degreeLimit * 0.5) * yPercentage) / 100) * -1;
		}

		// Down (Rotates model down between 0 and degreeLimit)
		if (y >= w.y / 2) {
			ydiff = y - w.y / 2;
			yPercentage = (ydiff / (w.y / 2)) * 100;
			dy = (degreeLimit * yPercentage) / 100;
		}

		return { x: dx, y: dy};
	}
	
	postProcessing() {
		// postprocessing
		this.composer.addPass( new RenderPass( this.scene, this.camera ) );

		// dot shaders
		let dotEffect = new ShaderPass( DotScreenShader );	
		dotEffect.uniforms[ 'scale' ].value = 5;
		this.composer.addPass( dotEffect );
		
		// RGB splitter shader
		/*
		let rgbEffect = new ShaderPass( RGBShiftShader );
		rgbEffect.uniforms[ 'amount' ].value = 0.002;
		this.composer.addPass( rgbEffect );
		*/
		
		// copy shader to avoid error message
		let copyPass = new ShaderPass( CopyShader );
		this.composer.addPass( copyPass );
		
		// invert colors
		/*
		this.composer.addPass( this.nodepass );
		
		let alpha = new Nodes.FloatNode( 1 );
		let screen = new Nodes.ScreenNode();
		let inverted = new Nodes.MathNode( screen, Nodes.MathNode.INVERT );

		let fade = new Nodes.MathNode(
			 screen,
			 inverted,
			 alpha,
			 Nodes.MathNode.MIX
		 );

		 this.nodepass.input = fade;
		this.nodepass.needsUpdate = true;
		*/
	}
	
	handleResize() {
		// check for mobile devices when scroll showed up
		if (window.innerWidth !== width) {
			this.camera.aspect = window.innerWidth / window.innerHeight;
			this.camera.updateProjectionMatrix();
			
			this.renderer.setSize(window.innerWidth, window.innerHeight + bonusH);
			this.composer.setSize(window.innerWidth, window.innerHeight + bonusH);
			
			this.setModelXPosition();
		}
	}
	
	animate() {
		// stats.begin();
		window.addEventListener('resize', this.handleResize, false);

		this.noise.forEach((noiseVal, index) => {
			const planeIndex = Math.floor((index + this.offset) % this.terrain.geometry.vertices.length);
			this.terrain.geometry.vertices[planeIndex].z = noiseVal;
		});

		this.offset += 0.25;

		this.planetRing.children[0].rotateZ(-0.0005);
		this.count += 1;
		// Alternate up and down every 500 animations
		if(Math.floor(this.count/500) % 2 === 0)
			this.planetRing.children[1].rotateX(-0.0005); // ring rotation up
		else
			this.planetRing.children[1].rotateX(+0.0005); // ring rotation down
		
		this.moon.rotateZ(0.001);
		this.moon.rotateY(-0.002);

		this.terrain.geometry.verticesNeedUpdate = true;

		// stats.end();
		requestAnimationFrame(this.animate);
		
		let delta = this.clock.getDelta();
		this.frame.update( delta ).updateNode( this.nodepass.material );

		this.composer.render();
	}
}