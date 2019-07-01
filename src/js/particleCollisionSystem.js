// illustration for steps
// Create float render targets of size N*N for bodies: position, quaternion, velocity, angular velocity, force, torque.
// Create float render targets of size M*M for particles: local position, world position, relative position, force.
// Create float render target of size 4*M*M for a broadphase grid.
// While running:
// Calculate particle properties: world position, body-relative position, velocity.
// Set up "broadphase render target". Stencil buffer is set up for stencil routing (see this presentation, slide 24) by clearing once (to set stencil values to zero) and drawing point clouds thrice to set values 1, 2 and 3 into the stencil buffer. An alternative is using PBOs to set these values, but it doesn't seem to be available in WebGL1.
// Particles are drawn to the "broadphase render target" using GL_POINTS with point-size 2. This maps them into the correct "grid bucket" and writes the particle ID's there. The stencil routing guarantees four particle ID's can be drawn into the same grid bucket in this single draw call.
// Particle forces are calculated using spring-and-dashpot model equations. Neighboring particles are easily looked up in the broadphase render target.
// Forces are added to the bodies' force render target using GL_POINTS with additive blending. Other forces such as gravity is added here too.
// Torque is added to bodies' torque render target in the same way.
// Body velocities are updated: velocity += deltaTime * force / inertia.
// Body positions are updated: position += deltaTime * velocity.
// Render each body by looking up body position and quaternion in the correct render target texture.


class particleCollisionSystem {
	constructor() {		
		this.sideSizeX = 0;
		this.sideSizeY = 0;
		this.index = [];
		this.scopeYsize = 200.0;
		this.scopeXsize = 400.0;
		this.magnitude = 100;
		this.stepSize = 1 * magnitude;
		this.particleSize = 0.49 * magnitude;
		this.geometries = {};
		this.meshs = {};
		this.materials = {};
		this.scenes = {};
		this.cameras = {};
		this.textures = {};
		this.vertices = {};
	}

  	init() {
  		var display = $('#display')[0];

  		this.scenes.majorScene = new THREE.Scene();

  		this.cameras.fullscreenCamera = new THREE.Camera();
	    this.cameras.majorCamera = new THREE.PerspectiveCamera( 90, 800 / 600, 0.1, 1000 );
	    this.cameras.majorCamera.position.x = 0;
		this.cameras.majorCamera.position.y = 0;
		this.cameras.majorCamera.position.z = 600;

		this.renderer = new THREE.WebGLRenderer();
		this.width = max(display.clientWidth, 100);
	    this.height = max(display.clientHeight, 100);
	    this.renderer.setSize(width, height);
		display.appendChild(renderer.domElement);

		this.addObjects(this.scenes.majorScene);
		this.initUpdatePhysics();
  	}

	max(a, b) 
	{
		return a > b? a : b;
	}

	createRenderTarget(w,h,type,format){
	    return new THREE.WebGLRenderTarget(w, h, {
	        minFilter: THREE.LinearFilter,//THREE.NearestFilter,
	        magFilter: THREE.NearestFilter,
	        format: format === undefined ? THREE.RGBAFormat : format,
	        type: THREE.FloatType,
	    });;
	}

	settingTexture(renderTarget, position, bodyIndex, data, w, h) {
		this.materials.settingMaterial = new THREE.ShaderMaterial({
			uniforms: {
	            res: { value: new THREE.Vector2(w, h) },
	        },
	        vertexShader: getShader( 'textureSetVert' ),
	        fragmentShader: getShader( 'textureSetFrag' ),
		});
		this.geometries.settingGeometry = new THREE.BufferGeometry();
		this.geometries.settingGeometry.addAttribute("position",  position); //
		this.geometries.settingGeometry.addAttribute("bodyIndex",  bodyIndex); //
		this.geometries.settingGeometry.addAttribute("data", data); // new THREE.BufferAttribute(new Float32Array(ver))

		this.meshs.settingTextureMesh = new THREE.Points(settingGeometry, settingMaterial);

		this.scenes.settingScene = new THREE.Scene();
		this.scenes.settingScene.value.add(settingTextureMesh);

		this.renderer.clear();
		this.renderer.setRenderTarget(renderTarget);
		this.renderer.render(this.scenes.settingScene, this.cameras.fullscreenCamera);
		this.renderer.setRenderTarget(null);
		this.renderer.clear();

		// renderer.render(settingScene, camera);
	}

	swapBuffer() {
		var tmp = this.textures.posTex1;
		this.textures.posTex1 = this.textures.posTex2;
		this.textures.posTex2 = tmp;
	}

	drawing() {
		this.materials.materialForDrawing = new THREE.ShaderMaterial({
			uniforms: {
	            pointSize: { value: particleSize },
	            res: {value: new THREE.Vector2(sideSizeX, sideSizeY)},
	            posTex: {value: null},
	            screen: {value: new THREE.Vector2(800, 600)},
	        },
	        vertexShader: getShader( 'drawingVert' ),
	        fragmentShader: getShader( 'drawingFrag' ),
		});
		this.materials.materialForDrawing.uniforms.posTex.value = posTex1.texture;
		this.geometries.geometryForDrawing = new THREE.BufferGeometry();
		this.geomerties.geometryForDrawing.addAttribute('position', new THREE.BufferAttribute(this.vertices.verticesForPoints, 3 ) );
		this.geomerties.geometryForDrawing.addAttribute("bodyIndex",  new THREE.BufferAttribute(new Float32Array(this.vertices.index), 1)); 

		this.meshs.drawingPosition = new THREE.Points(geometryForDrawing, materialForDrawing);
		this.scenes.majorScene.scene.add(pointsForPosition);
		this.renderer.render(this.scenes.majorScene, this.cameras.majorCamera);
	}

	add_objects(scene) {
	    var isMeshRendering = false;
		this.geometrices.geometryForMeshs = new THREE.BufferGeometry();
		this.materials.generalMaterial = new THREE.ShaderMaterial({
			// pointSize represents the number of pixels which its side will be occupying.
	        uniforms: {
	            pointSize: { value: this.particleSize },
	        },
	        vertexShader: getShader( 'generalVert' ),
	        fragmentShader: getShader( 'generalFrag' ),
	    });
		
		this.vertices.startingGeneralVertices = [];
		this.vertices.startingPositionData = [];
		this.vertices.index = [];
		var id = 0;
	    for (var i = -scopeXsize / 2; i <= scopeXsize / 2; i += stepSize) {
	    	sideSizeX++;
	    	sideSizeY = 0;
	    	for (var j = -scopeYsize / 2; j <= scopeYsize / 2; j += stepSize) {
	    		sideSizeY++;
	    		this.vertices.startingGeneralVertices.push(i); 
	    		this.vertices.startingGeneralVertices.push(j); 
	    		this.vertices.startingGeneralVertices.push(0);
	    		this.vertices.startingPositionData.push(i); 
	    		this.vertices.startingPositionData.push(j); 
	    		this.vertices.startingPositionData.push(0); 
	    		this.vertices.startingPositionData.push(1);
	    		this.vertices.index.push(id);
	    		id++;

	    		if (isMeshRendering) {
					// var vertices_mesh = new Float32Array( [
					// 	i - particle_size, j + particle_size,  0,
					// 	i - particle_size, j - particle_size,  0,
					//  	i + particle_size, j - particle_size,  0,
					//  	i + particle_size, j + particle_size,  0,
					// ] );
					// geometry_for_meshs.setIndex([0,1,2, 0, 2,3])
					// geometry_for_meshs.addAttribute('position', new THREE.BufferAttribute( vertices3, 3 ));			
					// var mesh3 = new THREE.Mesh(geometry_for_meshs, material3);
					// scene.add(mesh3);
				}
	    	}
	    }
	    this.geometrices.geometryForPoints = new THREE.BufferGeometry();
		
		this.buffers.startingVertices = new THREE.BufferAttribute(new Float32Array(this.vertices.startingGeneralVertices), 3);
		this.buffers.index = new THREE.BufferAttribute(new Float32Array(this.vertices.index));

		this.geometrices.geometryForPoints.addAttribute('position', this.buffers.startingVertices);
		initTextures();
		
		// setPositionTexture
		settingTexture(this.textures.posTex1, 
			this.buffers.startingVertices,
			this.buffers.index, 
			new THREE.BufferAttribute(new Float32Array(this.vertices.startingPositionData), 4), 
			sideSizeX, 
			sideSizeY);

		// drawing
		drawing();
	}

	initTextures() {
		var type = THREE.FloatType; //( /(iPad|iPhone|iPod)/g.test( navigator.userAgent ) ) ? THREE.HalfFloatType : THREE.FloatType;
		this.textures.posTex1 = createRenderTarget(sideSizeX, sideSizeY, type);
		this.textures.posTex2 = createRenderTarget(sideSizeX, sideSizeY, type);
		// this.textures.relativePosTex1 = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);
		// this.textures.relativePosTex2 = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);
		// this.textures.velocityTex1 = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);
		// this.textures.velocityTex2 = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);
		// this.textures.forceTex1 = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);
		// this.textures.forceTex2 = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);
		// this.textures.quaternionTex1 = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);
		// this.textures.quaternionTex2 = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);
		// this.textures.avelocityTex1 = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);
		// this.textures.avelocityTex2 = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);
		// this.textures.torqueTex1 = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);
		// this.textures.torqueTex2 = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);
	}

	initUpdatePhysics() {
		
		this.materials.materialForUpdatePhysics = new THREE.ShaderMaterial({
			uniforms: {
				res: {value: new THREE.Vector2(this.sideSizeX, this.sideSizeY)},
				screen: {value: new THREE.Vector2(800, 600)},
				posTex: {value: this.textures.posTex1.texture},
				deltaTime: {value: this.deltaTime},
			},
			vertexShader: getShader("physicsUpdateVert"),
			fragmentShader: getShader("physicsUpdateFrag"),
		});
		this.geometrices.geometryForUpdatePhysics = new THREE.BufferGeometry();
		this.geometrices.geometryForUpdatePhysics.addAttribute(
			"position", 
			this.buffers.startingVertices);
			//new THREE.BufferAttribute(new Float32Array(this.sideSizeY * this.sideSizeX * 3), 3));
		this.geometrices.geometryForUpdatePhysics.addAttribute(
			"bodyIndex",
			this.buffers.index,
		);
		this.meshs.meshForUpdate = new THREE.Points(geometryForUpdatePhysics, materialForUpdatePhysics);
		this.scenes.updatePhysicsScene = new THREE.Scene();
		this.scenes.updatePhysicsScene.add(this.meshs.meshForUpdate);

	}

	updatePhysics() {
		this.materials.materialForUpdatePhysics.uniforms.posTex.value = posTex1.texture;
		this.materials.materialForUpdatePhysics.uniforms.deltaTime.value = deltaTime;
		this.materials.materialForUpdatePhysics.needsUpdate = true;
		// geometryForUpdatePhysics.attributes.position.needsUpdate = true;
		// geometryForUpdatePhysics.setDrawRange( 0, sideSizeX * sideSizeY);
		
		// attributes.data.needsUpdate
		this.renderer.setRenderTarget(this.texture.posTex2);
		this.renderer.render(this.scenes.updatePhysicsScene, this.cameras.fullscreenCamera);
		this.renderer.setRenderTarget(null);
	}

	animate(time) {
		requestAnimationFrame( this.animate );
		this.deltaTime = this.prevTime === undefined ? 0 : (time - prevTime) / 1000;
		this.prevTime = time;

		updatePhysics();
		swapBuffer();
		drawing();
	};

};	

