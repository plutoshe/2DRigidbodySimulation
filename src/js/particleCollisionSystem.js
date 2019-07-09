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


class particleCollisionSystem 
{
	constructor() 
	{		
		this.sideSizeX = 0;
		this.sideSizeY = 0;
		this.index = [];
		this.scopeYsize = 200.0;
		this.scopeXsize = 400.0;
		this.magnitude = 100;
		this.stepSize = 1 * this.magnitude;
		this.particleRadius = 0.49 * this.magnitude;
		this.geometries = {};
		this.geometries = {};
		this.meshs = {};
		this.materials = {};
		this.scenes = {};
		this.cameras = {};
		this.textures = {};
		this.vertices = {};
		this.buffers = {};
	}

	max(a, b) 
	{
		return a > b? a : b;
	}

	createRenderTarget(w,h,type,format)
	{
	    return new THREE.WebGLRenderTarget(w, h, {
	        minFilter: THREE.LinearFilter,//THREE.NearestFilter,
	        magFilter: THREE.NearestFilter,
	        format: format === undefined ? THREE.RGBAFormat : format,
	        type: THREE.FloatType,
	    });;
	}

	initSettingTexturePipeline(bodyIndex, w, h) 
	{
		this.materials.settingMaterial = new THREE.ShaderMaterial({
			uniforms: 
			{
	            res: { value: new THREE.Vector2(w, h) },
	        },
	        vertexShader: getShader( 'textureSetVert' ),
	        fragmentShader: getShader( 'textureSetFrag' ),
		});
		
		this.geometries.settingGeometry = new THREE.BufferGeometry();
		this.geometries.settingGeometry.addAttribute("bodyIndex",  bodyIndex); 
		this.meshs.settingTextureMesh = new THREE.Points(this.geometries.settingGeometry, this.materials.settingMaterial); 
		this.scenes.settingScene = new THREE.Scene();
		this.scenes.settingScene.add(this.meshs.settingTextureMesh);
	}

	runSettingTexturePipeline(renderTarget, dataBuffer, positionBuffer, bodyIndexBuffer, textureResolutionUniform) 
	{
		if (positionBuffer) 
		{
			this.geometries.settingGeometry.addAttribute("position",  positionBuffer); 
		}
		if (dataBuffer) 
		{
			this.geometries.settingGeometry.addAttribute("data", dataBuffer);
		}
		if (bodyIndexBuffer) 
		{
			this.geometries.settingGeometry.addAttribute("bodyIndex",  bodyIndexBuffer); 
		}
		if (textureResolutionUniform)
		{
			this.materials.settingMaterial.uniforms.res.value = textureResolutionUniform;
			this.materials.settingMaterial.needsUpdate = true;
			console.log("uniform true");
		}
		
		if (dataBuffer || positionBuffer || bodyIndexBuffer) 
		{
			this.geometries.needsUpdate = true;
			console.log("attribute true");
		}
		
		this.renderer.clear();
		this.renderer.setRenderTarget(renderTarget);
		this.renderer.render(this.scenes.settingScene, this.cameras.fullscreenCamera);
		this.renderer.setRenderTarget(null);
	}

	swapBuffer() {
		var tmp = this.textures.posTex1;
		this.textures.posTex1 = this.textures.posTex2;
		this.textures.posTex2 = tmp;
		//this.textures.velocityTex1 = this.textures.velocityTex2;
	}

	drawing() {
		this.materials.materialForDrawing = new THREE.ShaderMaterial({
			uniforms: {
	            pointSize: { value: this.particleRadius },
	            particleResolution: {value: new THREE.Vector2(this.sideSizeX, this.sideSizeY)},
	            posTex: {value: null},
	            screen: {value: new THREE.Vector2(this.width, this.height)},
	        },
	        vertexShader: getShader( 'drawingVert' ),
	        fragmentShader: getShader( 'drawingFrag' ),
		});
		this.materials.materialForDrawing.uniforms.posTex.value = this.textures.posTex1.texture;
		this.geometries.geometryForDrawing = new THREE.BufferGeometry();
		this.geometries.geometryForDrawing.addAttribute('position', this.buffers.startingPosition3Vertices);
		this.geometries.geometryForDrawing.addAttribute("bodyIndex", this.buffers.index); 

		this.meshs.drawingPosition = new THREE.Points(this.geometries.geometryForDrawing, this.materials.materialForDrawing);
		this.scenes.majorScene.add(this.meshs.drawingPosition);
		this.renderer.render(this.scenes.majorScene, this.cameras.majorCamera);
	}

	initBuffers() {
	    var isMeshRendering = false;
		this.vertices.startingGeneralVertices = [];
		this.vertices.startingPositionData = [];
		this.vertices.index = [];
		var id = 0;
	    for (var i = -this.scopeXsize / 2; i <= this.scopeXsize / 2; i += this.stepSize) {
	    	this.sideSizeX++;
	    	this.sideSizeY = 0;
	    	for (var j = -this.scopeYsize / 2; j <= this.scopeYsize / 2; j += this.stepSize) {
	    		this.sideSizeY++;
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
		this.buffers.startingPosition3Vertices = new THREE.BufferAttribute(new Float32Array(this.vertices.startingGeneralVertices), 3);
		this.buffers.index = new THREE.BufferAttribute(new Float32Array(this.vertices.index), 1);
		this.buffers.startingPosition4Vertices = new THREE.BufferAttribute(new Float32Array(this.vertices.startingPositionData), 4);
	}

	initTextures() 
	{
		var type = THREE.FloatType; //( /(iPad|iPhone|iPod)/g.test( navigator.userAgent ) ) ? THREE.HalfFloatType : THREE.FloatType;
		this.textures.posTex1 = this.createRenderTarget(this.sideSizeX, this.sideSizeY, type);
		this.textures.posTex2 = this.createRenderTarget(this.sideSizeX, this.sideSizeY, type);
		this.textures.velocityTex1 = this.createRenderTarget(this.sideSizeX, this.sideSizeY, type);
		this.textures.velocityTex2 = this.createRenderTarget(this.sideSizeX, this.sideSizeY, type);

		this.gridResolutionSize = [
			this.width / this.stepSize ,
			this.height / this.stepSize ];
		this.textures.cellTex = 
			this.createRenderTarget(
				this.gridResolutionSize[0], 
				this.gridResolutionSize[1]);
		// this.textures.relativePosTex1 = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);
		// this.textures.relativePosTex2 = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);
		// this.textures.forceTex1 = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);
		// this.textures.forceTex2 = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);
		// this.textures.quaternionTex1 = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);
		// this.textures.quaternionTex2 = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);
		// this.textures.avelocityTex1 = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);
		// this.textures.avelocityTex2 = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);
		// this.textures.torqueTex1 = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);
		// this.textures.torqueTex2 = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);
	}

	initUpdatePositionPipeline() {
		this.materials.UpdatePosition = new THREE.ShaderMaterial({
			uniforms: {
				particleResolution: {value: new THREE.Vector2(this.sideSizeX, this.sideSizeY)},
				screen: {value: new THREE.Vector2(this.width, this.height)},
				posTex: {value: this.textures.posTex1.texture},
				velocityTex: {value: this.textures.velocityTex1.texture},
				deltaTime: {value: this.deltaTime},
			},
			vertexShader: getShader("positionUpdateVert"),
			fragmentShader: getShader("positionUpdateFrag"),
		});
		this.geometries.UpdatePosition = new THREE.BufferGeometry();
		this.geometries.UpdatePosition.addAttribute(
			"position", 
			this.buffers.startingPosition3Vertices);
			//new THREE.BufferAttribute(new Float32Array(this.sideSizeY * this.sideSizeX * 3), 3));
		this.geometries.UpdatePosition.addAttribute(
			"bodyIndex",
			this.buffers.index,
		);
		this.meshs.UpdatePosition = new THREE.Points(this.geometries.UpdatePosition, this.materials.UpdatePosition);
		this.scenes.UpdatePosition = new THREE.Scene();
		this.scenes.UpdatePosition.add(this.meshs.UpdatePosition);

	}

	updatePosition() {
		this.materials.UpdatePosition.uniforms.posTex.value = this.textures.posTex1.texture;
		this.materials.UpdatePosition.uniforms.velocityTex.value = this.textures.velocityTex1.texture;
		this.materials.UpdatePosition.uniforms.deltaTime.value = this.deltaTime;
		this.materials.UpdatePosition.needsUpdate = true;

		this.renderer.setRenderTarget(this.textures.posTex2);
		this.renderer.render(this.scenes.UpdatePosition, this.cameras.fullscreenCamera);
		this.renderer.setRenderTarget(null);
	}

	updateParticleForce() {

	}

	updateParticleTorque() {

	}
	
	updateVelocity() {

	}

	updatePhysics() {
		this.updateParticleForce();
        this.updateParticleTorque();
        this.updateVelocity();
        this.updatePosition();
	}

	updateConvertParticleToCell() {
		this.materials.materialConvertParticleToCell.uniforms.particlePosTex.value = this.textures.posTex1.texture;
		this.materials.materialConvertParticleToCell.needsUpdate = true;
		this.particleRenderCell(
			this.textures.cellTex, 
			this.scenes.sceneConvertParticleToCell, 
			this.materials.materialConvertParticleToCell,
			[this.cellPointSize,this.cellPointSize,this.cellPointSize,this.cellPointSize]);
	}

	particleRenderCell(renderTarget, ascene, amaterial, layerSize) {
		this.renderer.autoClear = false;
		var gl = this.renderer.context;
		var buffers = this.renderer.state.buffers;
		this.renderer.clearStencil();
        this.renderer.alpha = true;  

		// first render
	  	gl.colorMask(true, true, true, true);
  	 	gl.clearColor(0,0,0,0);
        gl.enable(gl.STENCIL_TEST);
        gl.stencilOp(gl.INCR, gl.INCR, gl.INCR);
        gl.stencilFunc(gl.EQUAL, 0, 0xff);
		gl.stencilMask(0xFF);        
        gl.clear(gl.STENCIL_BUFFER_BIT);
        amaterial.uniforms.pointSize.value = layerSize[0];
        this.renderer.setRenderTarget(renderTarget);
		this.renderer.render(ascene, this.cameras.fullscreenCamera);
		console.log("Finish");
	
		// second render   
		     
		gl.clearStencil(0);
		gl.clear(gl.STENCIL_BUFFER_BIT);
        gl.colorMask(false, false, true, false);
        gl.depthMask(false);

        gl.enable(gl.STENCIL_TEST);
        gl.stencilFunc(gl.EQUAL, 1, 0xff);
        gl.stencilOp(gl.INCR, gl.INCR, gl.INCR);

		amaterial.uniforms.pointSize.value = layerSize[1];

		this.renderer.clear(false, false,false);
		this.autoClearColor = false;
		this.renderer.render(ascene, this.cameras.fullscreenCamera);
	

		// third render

        gl.colorMask(false, true, false, false);
		gl.stencilOp(gl.INCR, gl.INCR, gl.INCR);
		gl.stencilFunc(gl.EQUAL, 2, 0xff);
		gl.stencilMask(0xFF);        
	    gl.clear(gl.STENCIL_BUFFER_BIT);
		amaterial.uniforms.pointSize.value = layerSize[2];
        this.renderer.render(ascene, this.cameras.fullscreenCamera);

        // fourth render
        this.renderer.clearStencil();
        gl.colorMask(true, false, false, false);
		gl.stencilOp(gl.INCR, gl.INCR, gl.INCR);
		gl.stencilFunc(gl.EQUAL, 3, 0xff);
		gl.stencilMask(0xFF);        
	    gl.clear(gl.STENCIL_BUFFER_BIT);
        amaterial.uniforms.pointSize.value = layerSize[3];
        this.renderer.render(ascene, this.cameras.fullscreenCamera);

        // clear status
        // this.renderer.clearStencil();
        gl.colorMask(true, true, true, true);
        buffers.stencil.setTest(false);
        gl.disable(gl.STENCIL_TEST);
		gl.disable(gl.DEPTH_TEST);
		this.renderer.setRenderTarget(null);
	}


	testStencil() {
		//this.textures.cellTex = this.createRenderTarget(2, 2);

		var size = 4;
		var tvertices =  new Float32Array( 3 * size);
        var particleIndices = new Float32Array( size);
        for(var i = 0; i < size; i++){
            particleIndices[i] =  i; // Need to do this because there's no way to get the vertex index in webgl1 shaders...
        }

        var amaterial = new THREE.ShaderMaterial({
        	uniforms: {
        		pointSize: { value: 0 },
        	},
        	vertexShader : getShader("testVert"),
        	fragmentShader : getShader("testFrag"),

        });
        // amaterial.transparent = true;
		var ageometry = new THREE.BufferGeometry();
		ageometry.addAttribute("position", new THREE.BufferAttribute(tvertices, 3));
		ageometry.addAttribute("particleIndex", new THREE.BufferAttribute(particleIndices, 1));
		
		var amesh = new THREE.Points(ageometry, amaterial);
		var ascene = new THREE.Scene();
		ascene.add(amesh);
		// console.log( );
		
        this.particleRenderCell(null, ascene, amaterial,[500,400,300,200]);
	}

	oneStep(time) {
		this.deltaTime = this.prevTime === undefined ? 0 : (time - this.prevTime) / 1000;
		this.prevTime = time;
		//updateParticleVelocity
		
		this.updateConvertParticleToCell();
		//this.testStencil();
		this.updatePhysics();
		this.swapBuffer();
		this.drawing();
	}

	animate(time) {
		requestAnimationFrame((time) => this.animate(time));
		this.oneStep(time);
	};

	initCellsPipeline() 
	{
		this.materials.materialConvertParticleToCell = new THREE.ShaderMaterial({
			uniforms: {
				cellSize: {value: new THREE.Vector2(this.stepSize, this.stepSize)},
				gridOriginPos: {value: new THREE.Vector2(0,0)},
				particlePosTex: {value: this.textures.posTex1.texture},
				particleResolution: {value: new THREE.Vector2(this.sideSizeX, this.sideSizeY)},
				pointSize: {value : 1},
				gridTextureResolution: {value: new THREE.Vector2(this.textures.cellTex.width, this.textures.cellTex.height)}
			},
			vertexShader: getShader("convertParticleToCellVert"),
			fragmentShader: getShader("convertParticleToCellFrag"),
		});
		//console.log(this.textures.cellTex.width, this.textures.cellTex.height);
		//console.log(this.vertices.startingGeneralVertices[0] / this.stepSize);
		this.geometries.geometryConvertParticelToCell = new THREE.BufferGeometry();
		this.geometries.geometryConvertParticelToCell.addAttribute("position", this.buffers.startingPosition3Vertices);
		this.geometries.geometryConvertParticelToCell.addAttribute("particleIndex", this.buffers.index);
		var gl = this.renderer.context;
		var buffers = this.renderer.state.buffers;
		this.meshs.meshConvertParticleToCell = new THREE.Points(
			this.geometries.geometryConvertParticelToCell,
			this.materials.materialConvertParticleToCell);
		this.scenes.sceneConvertParticleToCell = new THREE.Scene();
		this.scenes.sceneConvertParticleToCell.add(this.meshs.meshConvertParticleToCell);
		this.cellPointSize = 1;
		this.particleRenderCell(
			this.textures.cellTex, 
			this.scenes.sceneConvertParticleToCell, 
			this.materials.materialConvertParticleToCell,
			[this.cellPointSize,this.cellPointSize,this.cellPointSize,this.cellPointSize]);
	}

	initGeneralPipeline() {
		// this.geometries.geometryForPoints = new THREE.BufferGeometry();
		// this.geometries.geometryForPoints.addAttribute('position', this.buffers.startingPosition3Vertices);
		
		// this.materials.generalMaterial = new THREE.ShaderMaterial({
		// 	// pointSize represents the number of pixels which its side will be occupying.
	    //     uniforms: {
	    //         pointSize: { value: this.particleRadius },
	    //     },
	    //     vertexShader: getShader( 'generalVert' ),
	    //     fragmentShader: getShader( 'generalFrag' ),
	    // });
		
		// this.meshs.tmpMesh = new THREE.Points(this.geometries.geometryForPoints, this.materials.generalMaterial);
		// this.scenes.majorScene.add(this.meshs.tmpMesh);
		// this.renderer.render(this.scenes.majorScene, this.cameras.majorCamera);
	}

	initPipelines() 
	{
		this.initTextures();
		// this.initGeneralPipeline();
		this.initSettingTexturePipeline(this.buffers.index, this.sideSizeX, this.sideSizeY);
		this.runSettingTexturePipeline(
			this.textures.posTex1,
			this.buffers.startingPosition4Vertices,
			this.buffers.startingPosition3Vertices,
			this.buffers.index);
		this.initUpdatePositionPipeline();
		this.initCellsPipeline();
		var initialVelocity = [];
		for (var i = 0; i < this.sideSizeX; i++) 
		{
			for (var j = 0; j < this.sideSizeY; j++) 
			{
				initialVelocity.push(-10);
				initialVelocity.push(-9.8);
				initialVelocity.push(0);
				initialVelocity.push(0);
			}
		}
		this.runSettingTexturePipeline(
			this.textures.velocityTex1,
			new THREE.BufferAttribute(new Float32Array(initialVelocity), 4),
		);
		
		// drawing
		this.drawing();
	}

	init() 
	{
  		var display = $('#display')[0];

  		this.scenes.majorScene = new THREE.Scene();
  		this.width = 800;
  		this.height = 600;
  		this.cameras.fullscreenCamera = new THREE.Camera();
	    this.cameras.majorCamera = new THREE.PerspectiveCamera( 90, this.width / this.height, 0.1, 1000 );
	    this.cameras.majorCamera.position.x = 0;
		this.cameras.majorCamera.position.y = 0;
		this.cameras.majorCamera.position.z = this.height;

		this.renderer = new THREE.WebGLRenderer();
		// this.width = this.max(display.clientWidth, 100);
		// this.height = this.max(display.clientHeight, 100);
	    this.renderer.setSize(this.width, this.height);
		display.appendChild(this.renderer.domElement);

		this.initBuffers();
		this.initPipelines();
  	}

};	

