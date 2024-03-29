import { gsap } from 'gsap';
import { Noise } from 'noisejs';

import{
	BufferGeometry,
	Group,
	IcosahedronGeometry,
	LoadingManager,
	MathUtils,
	Mesh,
	MeshBasicMaterial,
	MeshLambertMaterial,
	PerspectiveCamera,
	PlaneGeometry,
	PointLight,
	Points,
	PointsMaterial,
	RingGeometry,
	Scene,
	TextureLoader,
	Vector2,
	Vector3,
	WebGLRenderer
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
// import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
import { DotScreenShader } from 'three/addons/shaders/DotScreenShader.js';
import { CopyShader } from 'three/addons/shaders/CopyShader.js';

// import * as Nodes  from 'three/examples/jsm/nodes/Nodes.js';
// import { NodePass }  from 'three/examples/jsm/nodes/postprocessing/NodePass.js';
import { createMultiMaterialObject } from 'three/addons/utils/SceneUtils.js';

// import * as Stats from 'stats.js';
// let stats = new Stats();
// stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
// document.body.appendChild( stats.dom );

const canvas = document.getElementById( 'background' );

const noise = new Noise(Math.random());
const bonusH = 15 * window.innerHeight / 100;
let width = window.innerWidth;
let height = window.innerHeight;

export class BackgroundScene {
	constructor() {
		this.scene = new Scene();
		this.camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
		this.camera.rotation.x = MathUtils.degToRad(72);
		this.renderer = new WebGLRenderer({
			antialias: true,
			canvas: canvas,
		 });
		this.renderer.setSize(window.innerWidth, window.innerHeight + bonusH);
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.camera.position.set(0, -80, 40);
		
		// loader
		this.loadingManager = new LoadingManager( () => {
			const loadingScreen = document.getElementById( 'loading-screen' );
			loadingScreen.classList.add( 'loaded' );
			
			const main = document.getElementById( 'container' );
			main.classList.add( 'loaded' );
		});
		
		// terrain
		this.noise = [];
		this.offset = 0.0;
		
		//moon
		this.planetRing = new Group();
		this.count = 0;
		this.moon;

		// model
		this.loader = new GLTFLoader(this.loadingManager);
		this.model = new Group();

		// postprocessing
		this.composer = new EffectComposer( this.renderer );
		this.composer.setSize(window.innerWidth, window.innerHeight + bonusH);
		
		// node
		// this.nodepass = new NodePass();
		// this.clock = new Clock();
		// this.frame = new Nodes.NodeFrame();

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
		this.buildStars = this.buildStars.bind(this);
		this.buildLight = this.buildLight.bind(this);
	}

	buildGeom() {
		this.buildTerrain();
		this.buildPlanetMoon();
		this.buildStars();
		// end of loader
		this.buildModel();
		this.buildLight();
	}

	buildLight() {
		const light = new PointLight(0xffffff, 2.5);
		light.position.set(0, -80, 40);
		this.scene.add(light);
	}

	buildTerrain() {
		const material = new MeshLambertMaterial({
		  wireframe: true,
		  // Due to limitations of the OpenGL Core Profile with the WebGL renderer on most platforms linewidth will always be 1 regardless of the set value.
		  // wireframeLinewidth: 2.0,
		});
		const maxTerrainWidth = 250;
		const plane = new PlaneGeometry(50, maxTerrainWidth, 60, maxTerrainWidth / (5/3));

		// the vector from the plane position
		const v = new Vector2();
		// adapted from: https://stackoverflow.com/a/71305084
		for(let i = 0; i < plane.attributes.position.count; i++) {
			v.fromBufferAttribute(plane.attributes.position, i);
			const noiseVal = this.map_range(noise.perlin2(v.x/6, v.y/6), 0, 1, -2.5, 2.5);
		  	this.noise.push(noiseVal);
			plane.attributes.position.setZ(i, noiseVal);
		}

		this.terrain = new Mesh(plane, material);
		this.terrain.rotateZ(270 * Math.PI / 180);
		this.scene.add(this.terrain);
	}

	map_range(value, low1, high1, low2, high2) {
		return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
	}
	
	buildPlanetMoon() {
		const material1 = new MeshLambertMaterial({
			color: 0x444400
		});
		const material2 = new MeshBasicMaterial({
			color: 0xffffff,
			wireframe: true
		});

		const planet = createMultiMaterialObject(
			new IcosahedronGeometry(300, 3), [
				material1, material2
			]
		);
		planet.position.set(-400, 1100, 0);

		this.planetRing.add(planet);

		const ringMaterial = new MeshBasicMaterial( { color: 0xeee000 } );
		const ringGeo = new RingGeometry( 340, 500, 100, 1 );
		const ring = new Mesh( ringGeo, ringMaterial );
		ring.position.copy(planet.position);
		ring.rotateZ(MathUtils.degToRad(90));
		ring.rotateX(MathUtils.degToRad(35));

		this.planetRing.add(ring);

		this.moon = createMultiMaterialObject(
			new IcosahedronGeometry(50, 3), [
				material1, material2
			]
		);
		this.moon.position.set(-100, 900, 50);

		this.scene.add(this.planetRing);
		this.scene.add(this.moon);
	}

	buildStars() {
		const points = [];
		const starXCoeff = 1000 * (window.innerWidth / window.innerHeight);
		const starZCoeff = 600;
		for(let i=0; i<3000; i++) {
			let star = new Vector3(
				Math.random() * starXCoeff,
				0,
				Math.random() * starZCoeff
		  	);
		  	points.push(star);
		}

		let starGeo = new BufferGeometry().setFromPoints( points );
		let sprite = new TextureLoader().load('resources/img/star.png');
		let starMaterial = new PointsMaterial({
			color: 0xaaaaaa,
			size: 0.7,
			map: sprite
		});

		let stars = new Points(starGeo, starMaterial);
		stars.position.set(-starXCoeff / 2, 1000, -400);
		// invert rotation of camera
		stars.rotation.x = MathUtils.degToRad(-18);
		this.scene.add(stars);
	}

	// Load the 3D model
	buildModel() {
		let that = this;
		// Load a glTF resource
		this.loader.load(
			// resource URL
			'resources/model/scene.gltf',
			// called when the resource is loaded
			function(data) {
				that.model = data.scene;
				that.model.scale.set(.45, .45, .45);
				
				that.model.position.set(0, 0, 13);
				that.model.rotateX(MathUtils.degToRad(90));
				that.model.rotateY(MathUtils.degToRad(-50));
				
				that.setModelXPosition();
				
				// animation up and down
				gsap.from( that.model.position, {
					z: 18,
					duration: 3,
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
		let vFOV = MathUtils.degToRad( this.camera.fov ); // convert vertical fov to radians
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
		this.model.rotation.y = MathUtils.degToRad(degrees.x + -50);
		this.model.rotation.x = MathUtils.degToRad(degrees.y + 90);
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
		if (window.innerWidth !== width || window.innerHeight !== height) {
			width = window.innerWidth;
			height = window.innerHeight;

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
			const planeIndex = Math.floor((index + this.offset) % this.terrain.geometry.attributes.position.count);
			this.terrain.geometry.attributes.position.setZ(planeIndex, noiseVal);
		});

		this.offset += 0.2;

		this.planetRing.children[0].rotateZ(-0.0005);
		this.count += 1;
		// Alternate up and down every 500 animations
		if(Math.floor(this.count/500) % 2 === 0)
			this.planetRing.children[1].rotateX(-0.0005); // ring rotation up
		else
			this.planetRing.children[1].rotateX(+0.0005); // ring rotation down
		
		this.moon.rotateZ(0.001);
		this.moon.rotateY(-0.002);

		this.terrain.geometry.attributes.position.needsUpdate = true;

		// stats.end();
		requestAnimationFrame(this.animate);
		
		// let delta = this.clock.getDelta();
		// this.frame.update( delta ).updateNode( this.nodepass.material );

		this.composer.render();
	}
}