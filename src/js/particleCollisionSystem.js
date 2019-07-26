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
		this.magnitude = 5;
		this.stepSize = 1 * this.magnitude;
		this.particleRadius = 0.4 * this.magnitude;
		this.geometries = {};
		this.geometries = {};
		this.meshs = {};
		this.materials = {};
		this.scenes = {};
		this.cameras = {};
		this.textures = {};
		this.images = {};
		this.vertices = {};
		this.buffers = {};
		this.isMeshRendering = true;

		this.drag = 0.3;
		this.groundFriction = 1;
		this.groundDamping = 1;
		this.groundSpring = 200;
		this.particleFriction = 0.7;
		this.particleDamping = 1;
		this.particleSpring = 100;
		this.width = 800;
  		this.height = 600;
	}

	max(a, b) 
	{
		return a > b? a : b;
	}

	createRenderTarget(w, h, type, format)
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
		}
		
		if (dataBuffer || positionBuffer || bodyIndexBuffer) 
		{
			this.geometries.needsUpdate = true;
		}
		
		this.renderer.clear();
		this.renderer.setRenderTarget(renderTarget);
		this.renderer.render(this.scenes.settingScene, this.cameras.fullscreenCamera);
		this.renderer.setRenderTarget(null);
	}

	swapTexture(a, b) {
		var tmp = this.textures[a];
		this.textures[a] = this.textures[b];
		this.textures[b] = tmp;
	}

	swapBuffer() {
		// var tmp = this.textures.posTex1;
		// this.textures.posTex1 = this.textures.posTex2;
		// this.textures.posTex2 = tmp;
		this.swapTexture("posTex1", "posTex2");
		this.swapTexture("velocityTex1", "velocityTex2");
		this.swapTexture("forceTex1", "forceTex2");
		//this.textures.velocityTex1 = this.textures.velocityTex2;
	}

	drawing() {

		
		this.materials.drawing = new THREE.ShaderMaterial({
			uniforms: {
	            particleResolution: {value: new THREE.Vector2(this.sideSizeX, this.sideSizeY)},
	            posTex: {value: this.textures.posTex1.texture},
				screen: {value: new THREE.Vector2(this.width, this.height)},
				originTex: {value: this.images.circle},
	        },
	        vertexShader: getShader( 'drawingVert' ),
	        fragmentShader: getShader( 'drawingFrag' ),
		});
		var gl = this.renderer.context;
		gl.clearColor(0.5,1,0.5,1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		

		this.geometries.drawing = new THREE.BufferGeometry();
		this.geometries.drawing.addAttribute('position', this.buffers.verticesMesh);
		this.geometries.drawing.addAttribute("uv", this.buffers.verticesMeshUV);
		this.geometries.drawing.addAttribute("bodyIndex", this.buffers.verticesMeshCenterIndex); 
		this.geometries.drawing.setIndex(this.buffers.verticesMeshIndex);
		
		
		this.geometries.drawing.computeFaceNormals();
		this.geometries.drawing.computeVertexNormals();

		this.meshs.drawing = new THREE.Mesh(this.geometries.drawing, this.materials.drawing);
		gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
		gl.enable( gl.BLEND ); 
		this.scenes.majorScene.add(this.meshs.drawing);
		this.renderer.render(this.scenes.majorScene, this.cameras.majorCamera);
		gl.disable( gl.BLEND ); 
		
	}

	drawingTexture() {
		this.materials.drawingTexture = new THREE.ShaderMaterial({
			uniforms: {
	            originTex: {value: this.images.circle},
	        },
	        vertexShader: getShader( 'printTextureVert' ),
	        fragmentShader: getShader( 'printTextureFrag' ),
		});
		this.geometries.drawingTexture = new THREE.BufferGeometry();
		this.geometries.drawingTexture.addAttribute('position', this.buffers.verticesMeshForTexture);
		this.geometries.drawingTexture.addAttribute("uv", this.buffers.verticesMeshUV);
		this.geometries.drawingTexture.setIndex(this.buffers.verticesMeshIndex);
		this.geometries.drawingTexture.computeFaceNormals();
		this.geometries.drawingTexture.computeVertexNormals();

		this.meshs.drawingTexture = new THREE.Mesh(
			this.geometries.drawingTexture, 
			this.materials.drawingTexture);
		this.scenes.majorScene.add(this.meshs.drawingTexture);
		this.renderer.render(this.scenes.majorScene, this.cameras.fullscreenCamera);
	}

	initBuffers() {
	    
		this.vertices.startingGeneralVertices = [];
		this.vertices.startingPosition4Vertices = [];
		this.vertices.index = [];
		this.vertices.verticesMesh = [];
		this.vertices.verticesMeshIndex = [];
		this.vertices.verticesMeshUV = [];
		this.vertices.verticesMeshCenterIndex = [];
		this.vertices.verticesMeshForTexture = [];
		var id = 0;
	    for (var i = -this.scopeXsize / 2; i <= this.scopeXsize / 2; i += this.stepSize) {
	    	this.sideSizeX++;
	    	this.sideSizeY = 0;
	    	for (var j = -this.scopeYsize / 2; j <= this.scopeYsize / 2; j += this.stepSize) {
	    		this.sideSizeY++;
				
				this.vertices.startingGeneralVertices.push.apply(
					this.vertices.startingGeneralVertices, 
					[i, j, 0]);
				this.vertices.startingPosition4Vertices.push.apply(
					this.vertices.startingPosition4Vertices,
					[i, j, 0, 1],
				);
				this.vertices.index.push(id);
				this.vertices.verticesMeshCenterIndex.push.apply(
					this.vertices.verticesMeshCenterIndex,
					[id,id,id,id],
				);
				id++;
				
				this.vertices.verticesMesh.push.apply(
					this.vertices.verticesMesh,
					[
						- this.particleRadius, - this.particleRadius,  0,
						+ this.particleRadius, - this.particleRadius,  0,
						+ this.particleRadius, + this.particleRadius,  0,
						- this.particleRadius, + this.particleRadius,  0,
					] );
				this.vertices.verticesMeshForTexture.push.apply(
					this.vertices.verticesMeshForTexture,
					[
						(i - this.particleRadius) / this.width, (j - this.particleRadius) / this.height,  0,
						(i + this.particleRadius) / this.width, (j - this.particleRadius) / this.height,  0,
						(i + this.particleRadius) / this.width, (j + this.particleRadius) / this.height,  0,
						(i - this.particleRadius) / this.width, (j + this.particleRadius) / this.height,  0,
					] );
				var ids = this.vertices.verticesMesh.length / 3;
				this.vertices.verticesMeshIndex.push.apply(
					this.vertices.verticesMeshIndex,
					[ids - 4, ids - 3, ids - 2, ids - 2, ids - 1, ids - 4]);
				this.vertices.verticesMeshUV.push.apply(
					this.vertices.verticesMeshUV,
					[0.0, 0.0, 
					1.0, 0.0,
					1.0, 1.0,
					0.0, 1.0]);
	    	}
		}
		// console.log(this.vertices.verticesMesh);
		// console.log(this.vertices.verticesMeshIndex);
		// console.log(this.vertices.verticesMeshUV);
		// console.log(this.vertices.verticesMeshForTexture);
		// console.log(this.vertices.index);
		// console.log(this.vertices.verticesMeshCenterIndex);
		this.buffers.startingPosition3Vertices = new THREE.BufferAttribute(new Float32Array(this.vertices.startingGeneralVertices), 3);
		this.buffers.index = new THREE.BufferAttribute(new Float32Array(this.vertices.index), 1);
		this.buffers.startingPosition4Vertices = new THREE.BufferAttribute(new Float32Array(this.vertices.startingPosition4Vertices), 4);
		this.buffers.verticesMesh  = new THREE.BufferAttribute(new Float32Array(this.vertices.verticesMesh), 3);
		this.buffers.verticesMeshIndex  = new THREE.BufferAttribute(new Uint16Array(this.vertices.verticesMeshIndex), 1);
		this.buffers.verticesMeshUV  = new THREE.BufferAttribute(new Float32Array(this.vertices.verticesMeshUV), 2);
		this.buffers.verticesMeshCenterIndex = new THREE.BufferAttribute(new Uint16Array(this.vertices.verticesMeshCenterIndex), 1);
		this.buffers.verticesMeshForTexture  = new THREE.BufferAttribute(new Float32Array(this.vertices.verticesMeshForTexture), 3);
		
	}

	initTextures() 
	{
		var type = THREE.FloatType; //( /(iPad|iPhone|iPod)/g.test( navigator.userAgent ) ) ? THREE.HalfFloatType : THREE.FloatType;
		this.textures.posTex1 = this.createRenderTarget(this.sideSizeX, this.sideSizeY, type);
		this.textures.posTex2 = this.createRenderTarget(this.sideSizeX, this.sideSizeY, type);
		this.textures.velocityTex1 = this.createRenderTarget(this.sideSizeX, this.sideSizeY, type);
		this.textures.velocityTex2 = this.createRenderTarget(this.sideSizeX, this.sideSizeY, type);
		this.textures.forceTex1 = this.createRenderTarget(this.sideSizeX, this.sideSizeY, type);
		this.textures.forceTex2 = this.createRenderTarget(this.sideSizeX, this.sideSizeY, type);
		this.textures.massTex = this.createRenderTarget(this.sideSizeX, this.sideSizeY, type);
		this.textures.momentumTex1 = this.createRenderTarget(this.sideSizeX, this.sideSizeY, type);
		this.textures.momentumTex2 = this.createRenderTarget(this.sideSizeX, this.sideSizeY, type);
		this.generalTexSize = new THREE.Vector2(this.sideSizeX, this.sideSizeY);

		this.gridResolutionSize = [
			this.width  * 2 / (this.particleRadius * 2),
			this.height * 2 / (this.particleRadius * 2)];
		this.gridOriginPos = [-800, -600];
		this.textures.cellTex = 
			this.createRenderTarget(
				this.gridResolutionSize[0], 
				this.gridResolutionSize[1]);
		// this.textures.relativePosTex1 = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);
		// this.textures.relativePosTex2 = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);
		// this.textures.quaternionTex1 = this.createRenderTarget(this.sideSizeX, this.sideSizeY, type);
		// this.textures.quaternionTex2 = this.createRenderTarget(this.sideSizeX, this.sideSizeY, type);
		// this.textures.avelocityTex1 = this.createRenderTarget(this.sideSizeX, this.sideSizeY, type);
		// this.textures.avelocityTex2 = this.createRenderTarget(this.sideSizeX, this.sideSizeY, type);
		// this.textures.torqueTex1 = this.createRenderTarget(this.sideSizeX, this.sideSizeY, type);
		// this.textures.torqueTex2 = this.createRenderTarget(this.sideSizeX, this.sideSizeY, type);

		// image textures

		this.images.circle = new THREE.TextureLoader().load("src/img/circle.png");
		//console.log(this.textures.circleTex);
		this.images.circle.wrapS = THREE.ClampToEdgeWrapping;
		this.images.circle.wrapT = THREE.ClampToEdgeWrapping;
		//this.textures.circleTex.repeat.set( 4, 4 );
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
			"particleIndex",
			this.buffers.index,
		);
		this.meshs.UpdatePosition = new THREE.Points(this.geometries.UpdatePosition, this.materials.UpdatePosition);
		this.scenes.UpdatePosition = new THREE.Scene();
		this.scenes.UpdatePosition.add(this.meshs.UpdatePosition);

	}	
	initUpdateMomentumPipeline() {
		this.materials.UpdateMomentum = new THREE.ShaderMaterial(
			{
				uniforms: {
					forceTex: {value: this.textures.forceTex1.texture},
					deltaTime: {value: 0},
					momentumTex: {value: this.textures.momentumTex1},
					momentumTexResolution: {value: this.generalTexSize},
					massTex: {value: this.textures.massTex.texture},
					gravity: {value: this.gravity},
				},
				vertexShader: getShader("updateMomentumVert"),
				fragmentShader: getShader("updateMomentumFrag"),
			}
		);
		this.geometries.UpdateMomentum = new THREE.BufferGeometry();
		this.geometries.UpdateMomentum.addAttribute("position", this.buffers.startingPosition3Vertices);
		this.geometries.UpdateMomentum.addAttribute("particleIndex", this.buffers.index);
		this.scenes.UpdateMomentum = new THREE.Scene();
		this.scenes.UpdateMomentum.add(new THREE.Points(this.geometries.UpdateMomentum, this.materials.UpdateMomentum));
	}

	updateMomentum() {
		this.materials.UpdateMomentum.uniforms.momentumTex.value = this.textures.momentumTex1.texture;
		this.materials.UpdateMomentum.uniforms.forceTex.value = this.textures.forceTex1.texture;
		this.materials.UpdateMomentum.uniforms.deltaTime.value = this.deltaTime;
		this.materials.UpdateMomentum.uniforms.massTex.value = this.textures.massTex.texture;
		this.materials.UpdateMomentum.uniforms.needsUpdate = true;

		this.renderer.setRenderTarget(this.textures.momentumTex2);
		this.renderer.render(this.scenes.UpdateMomentum, this.cameras.fullscreenCamera);
		this.renderer.setRenderTarget(null);
	}

	initUpdateVelocityPipeline() {
		this.materials.UpdateVelocity = new THREE.ShaderMaterial({
			uniforms: {
				particleResolution: {value: new THREE.Vector2(this.sideSizeX, this.sideSizeY)},
				momentumTex: {value: this.textures.momentumTex1.texture},
				massTex: {value: this.textures.massTex.texture},
				deltaTime: {value: this.deltaTime},				
			},
			vertexShader: getShader("velocityUpdateVert"),
			fragmentShader: getShader("velocityUpdateFrag"),
		});
		this.geometries.UpdateVelocity = new THREE.BufferGeometry();
		this.geometries.UpdateVelocity.addAttribute(
			"position", 
			this.buffers.startingPosition3Vertices);
			//new THREE.BufferAttribute(new Float32Array(this.sideSizeY * this.sideSizeX * 3), 3));
		this.geometries.UpdateVelocity.addAttribute(
			"particleIndex",
			this.buffers.index,
		);
		this.meshs.UpdateVelocity = new THREE.Points(this.geometries.UpdateVelocity, this.materials.UpdateVelocity);
		this.scenes.UpdateVelocity = new THREE.Scene();
		this.scenes.UpdateVelocity.add(this.meshs.UpdateVelocity);
	}

	updateVelocity() {
		this.materials.UpdateVelocity.uniforms.momentumTex.value = this.textures.momentumTex1.texture;
		this.materials.UpdateVelocity.uniforms.deltaTime.value = this.deltaTime;
		this.materials.UpdateVelocity.needsUpdate = true;

		this.renderer.setRenderTarget(this.textures.velocityTex2);
		this.renderer.render(this.scenes.UpdateVelocity, this.cameras.fullscreenCamera);
		this.renderer.setRenderTarget(null);
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

	initUpdateForcePipeline() {
		this.materials.UpdateForce = new THREE.ShaderMaterial({
			uniforms: {
				particleResolution: {value: new THREE.Vector2(this.sideSizeX, this.sideSizeY)},
				screen: {value: new THREE.Vector2(this.width, this.height)},

				posTex: {value: this.textures.posTex1.texture},
				velocityTex: {value: this.textures.velocityTex1.texture},
				forceTex: {value: this.textures.forceTex1.texture},
				massTex: {value: this.textures.massTex.texture},
				gravity: {value: this.gravity},
				deltaTime: {value: this.groundDeltaTime},

				groundSpring: {value: this.groundSpring},
				groundDamping: {value: this.groundDamping},
				groundFriction: {value: this.groundFriction},
				particleSpring: {value: this.particleSpring},
				particleDamping: {value: this.particleDamping},
				particleFriction: {value: this.particleFriction},

				particleRadius: {value: this.particleRadius},

				cellSize: {value: new THREE.Vector2(this.particleRadius * 2, this.particleRadius * 2)},
				gridTextureResolution: {value: new THREE.Vector2(this.textures.cellTex.width, this.textures.cellTex.height)},
				cellTex: {value: this.textures.cellTex.texture},
				gridOriginPos: {value: new THREE.Vector2(this.gridOriginPos[0], this.gridOriginPos[1])},
				pointSize: {value: 1},
			},
			vertexShader: getShader("forceUpdateVert"),
			fragmentShader: getShader("forceUpdateFrag"),
		});
		this.geometries.UpdateForce = new THREE.BufferGeometry();
		this.geometries.UpdateForce.addAttribute(
			"position", 
			this.buffers.startingPosition3Vertices);
			//new THREE.BufferAttribute(new Float32Array(this.sideSizeY * this.sideSizeX * 3), 3));
		this.geometries.UpdateForce.addAttribute(
			"bodyIndex",
			this.buffers.index,
		);
		this.meshs.UpdateForce = new THREE.Points(this.geometries.UpdateForce, this.materials.UpdateForce);
		this.scenes.UpdateForce = new THREE.Scene();
		this.scenes.UpdateForce.add(this.meshs.UpdateForce);
	}

	updateForce(){
        this.materials.UpdateForce.uniforms.posTex.value = this.textures.posTex1.texture;
		this.materials.UpdateForce.uniforms.velocityTex.value = this.textures.velocityTex1.texture;
		this.materials.UpdateForce.uniforms.cellTex.value = this.textures.cellTex.texture;
		this.materials.UpdateForce.uniforms.forceTex.value = this.textures.forceTex1.texture;
		this.materials.UpdateForce.uniforms.deltaTime.value = this.deltaTime;
		this.materials.UpdateForce.needsUpdate = true;

		this.renderer.setRenderTarget(this.textures.forceTex2);
		this.renderer.render(this.scenes.UpdateForce, this.cameras.fullscreenCamera);
		this.renderer.setRenderTarget(null);
    }

	updatePhysics() {
		this.updateForce();
		this.swapTexture("forceTex1", "forceTex2");
		this.updateMomentum();
		this.swapTexture("momentumTex1", "momentumTex2");
		this.updateVelocity();
		this.swapTexture("velocityTex1", "velocityTex2");
		this.updatePosition();
		this.swapTexture("posTex1", "posTex2");
		
	}

	updateConvertParticleToCell() {
		this.materials.materialConvertParticleToCell.uniforms.particlePosTex.value = this.textures.posTex1.texture;
		this.materials.materialConvertParticleToCell.needsUpdate = true;
		this.cellPointSize = 1;
		this.particleRenderCell(
			this.textures.cellTex, 
			this.scenes.sceneConvertParticleToCell, 
			this.materials.materialConvertParticleToCell,
			[this.cellPointSize,this.cellPointSize,this.cellPointSize,this.cellPointSize]);
	}

	updateConvertParticleToCellPrint() {
		this.materials.materialConvertParticleToCell.uniforms.particlePosTex.value = this.textures.posTex1.texture;
		this.materials.materialConvertParticleToCell.needsUpdate = true;
		this.cellPointSize = 20;
		this.particleRenderCell(
			//this.textures.cellTex, 
			null,
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
		this.renderer.setRenderTarget(renderTarget);
	  	gl.colorMask(true, true, true, true);
  	 	gl.clearColor(0, 0, 0, 0);
        gl.enable(gl.STENCIL_TEST);
        gl.stencilOp(gl.INCR, gl.INCR, gl.INCR);
        gl.stencilFunc(gl.EQUAL, 0, 0xff);
		gl.stencilMask(0xFF);        
        gl.clear(gl.STENCIL_BUFFER_BIT);
        amaterial.uniforms.pointSize.value = layerSize[0];
		this.renderer.render(ascene, this.cameras.fullscreenCamera);
	
		// second render   
		     
		gl.clearStencil(0);
		gl.clear(gl.STENCIL_BUFFER_BIT);
        gl.colorMask(false, true, false, false);
        gl.depthMask(false);

        gl.enable(gl.STENCIL_TEST);
        gl.stencilFunc(gl.EQUAL, 1, 0xff);
        gl.stencilOp(gl.INCR, gl.INCR, gl.INCR);

		amaterial.uniforms.pointSize.value = layerSize[1];

		this.autoClearColor = false;
		this.renderer.render(ascene, this.cameras.fullscreenCamera);
	

		// third render

        gl.colorMask(false, false, true, false);
		gl.stencilOp(gl.INCR, gl.INCR, gl.INCR);
		gl.stencilFunc(gl.EQUAL, 2, 0xff);
		gl.stencilMask(0xFF);        
	    gl.clear(gl.STENCIL_BUFFER_BIT);
		amaterial.uniforms.pointSize.value = layerSize[2];
        this.renderer.render(ascene, this.cameras.fullscreenCamera);

        // fourth render
        this.renderer.clearStencil();
        gl.colorMask(false, false, false, true);
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
		this.renderer.clear(true, true, true);
		this.autoClearColor = true;
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
		this.deltaTime = this.prevTime === undefined ? 0 : (time - this.prevTime) / 3000;
		this.prevTime = time;
		//updateParticleVelocity
		 
		this.updateConvertParticleToCell();
		this.updatePhysics();
		
	    // this.printTexture(this.images.circle, null);
		//  this.drawingTexture();
		this.drawing();
		//this.printTexture(this.textures.massTex, null);
	}

	animate(time) {
		requestAnimationFrame((time) => this.animate(time));
		this.oneStep(time);
	};

	initCellsPipeline() 
	{
		this.materials.materialConvertParticleToCell = new THREE.ShaderMaterial({
			uniforms: {
				cellSize: {value: new THREE.Vector2(this.particleRadius * 2, this.particleRadius * 2)},
				gridOriginPos: {value: new THREE.Vector2(this.gridOriginPos[0], this.gridOriginPos[1])},
				particlePosTex: {value: this.textures.posTex1.texture},
				particleResolution: {value: new THREE.Vector2(this.sideSizeX, this.sideSizeY)},
				pointSize: {value : 1},
				gridTextureResolution: {value: new THREE.Vector2(this.textures.cellTex.width, this.textures.cellTex.height)}
			},
			vertexShader: getShader("convertParticleToCellVert"),
			fragmentShader: getShader("convertParticleToCellFrag"),
		});
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

		var initialVelocity = [];
		var initialMomentum = [];
		var initialForce = [];
		var initialMass = [];
		// this.initGeneralPipeline();
		for (var i = 0; i < this.sideSizeX; i++) 
		{
			for (var j = 0; j < this.sideSizeY; j++) 
			{
				//initialVelocity.push.apply(initialVelocity, [0, 0, 0, 0]); //Math.random() * 100 - 5
				initialVelocity.push.apply(initialVelocity, [this.magnitude * (Math.random() * 10 - 5) / 20, 1000, 0, 0]); //Math.random() * 100 - 5

				initialForce.push.apply(initialForce, [0, 0, 0, 0]);
				initialMass.push.apply(initialMass, [0, 0, 0, 0.02 * this.magnitude]);
				initialMomentum.push.apply(initialMomentum, initialVelocity.slice(-4).map(function(a) { return a * initialMass.slice(-1)[0];})); //Math.random() * 100 - 5
			}
		}	
		this.initSettingTexturePipeline(this.buffers.index, this.sideSizeX, this.sideSizeY);
		
		this.runSettingTexturePipeline(
			this.textures.posTex1,
			this.buffers.startingPosition4Vertices,
			this.buffers.startingPosition3Vertices,
			this.buffers.index);
		this.runSettingTexturePipeline(
			this.textures.massTex,
			new THREE.BufferAttribute(new Float32Array(initialMass), 4),
		);
		this.runSettingTexturePipeline(
			this.textures.velocityTex1,
			new THREE.BufferAttribute(new Float32Array(initialVelocity), 4),
		);

		this.runSettingTexturePipeline(
			this.textures.momentumTex1,
			new THREE.BufferAttribute(new Float32Array(initialMomentum), 4),
		);
		
		this.runSettingTexturePipeline(
			this.textures.forceTex1,
			new THREE.BufferAttribute(new Float32Array(initialForce), 4),
		);
		

		this.initUpdatePositionPipeline();
		this.initUpdateVelocityPipeline();
		this.initUpdateForcePipeline();
		this.initUpdateMomentumPipeline();
		this.initCellsPipeline();
		
		
		// drawing
		// this.drawing();
	}

	testNeighboor() {
		this.materials.testNeighboor = new THREE.ShaderMaterial({
			uniforms: {
				cellSize: {value: new THREE.Vector2(this.particleRadius * 2, this.particleRadius * 2)},
				particlePosTex: {value: this.textures.posTex1.texture},
				particleResolution: {value: new THREE.Vector2(this.sideSizeX, this.sideSizeY)},
				gridTextureResolution: {value: new THREE.Vector2(this.textures.cellTex.width, this.textures.cellTex.height)},
				cellTex: {value: this.textures.cellTex.texture},
				gridOriginPos: {value: new THREE.Vector2(this.gridOriginPos[0], this.gridOriginPos[1])},
				pointSize: {value: this.particleRadius},
			},
			vertexShader: getShader("testVert"),
			fragmentShader: getShader("testFrag")}
		);
		this.geometries.testNeighboor = new THREE.BufferGeometry();
		this.geometries.testNeighboor.addAttribute("position", this.buffers.startingPosition3Vertices);
		this.geometries.testNeighboor.addAttribute("particleIndex", this.buffers.index);
		this.meshs.testNeighboor = new THREE.Points(this.geometries.testNeighboor, this.materials.testNeighboor);		
		this.scenes.testNeighboor = new THREE.Scene();
		this.scenes.testNeighboor.add(this.meshs.testNeighboor);
		this.renderer.render(this.scenes.testNeighboor, this.cameras.fullscreenCamera);
	}

	printTexture(origintex, dst) {
		this.materials.printTexture = new THREE.ShaderMaterial({
			uniforms: {
				originTex: {
					value: origintex,//(origintex==undefined)? origin.texture : null,
				},
			},
			vertexShader: getShader("printTextureVert"),
			fragmentShader: getShader("printTextureFrag"),
		});
		var vertices = new Float32Array( [
			-1.0, -1.0,  1.0,
			 1.0, -1.0,  1.0,
			 1.0,  1.0,  1.0,
			-1.0,  1.0,  1.0,
		] );
		var indices = [0,1,2,2,3,0];
		var uvs = [0,0,1,0,1,1,0,1];
		
		this.geometries.printTexture = new THREE.BufferGeometry();
		this.geometries.printTexture.addAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices), 3));
		this.geometries.printTexture.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2));
		this.geometries.printTexture.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));
		
		this.geometries.printTexture.computeFaceNormals();
		this.geometries.printTexture.computeVertexNormals();
		//this.geometries.printTexture.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(positions), 3));
		this.scenes.printTexture = new THREE.Scene();
		
		this.scenes.printTexture.add(new THREE.Mesh(this.geometries.printTexture, this.materials.printTexture));
		this.renderer.setRenderTarget(dst);
	 
		
		var gl = this.renderer.context;
		
        this.renderer.alpha = true;  

		// first render
		this.renderer.autoClearColor = false;
		this.renderer.autoClear = false;
		this.renderer.antialias = true;
		this.renderer.setClearAlpha(0.0);
		this.renderer.alpha = true; 
		this.renderer.premultipliedAlpha = false;
		
		gl.clearColor(1,0.5,0.5,0.6);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.enable( gl.BLEND );
		//gl.blendEquation( gl.FUNC_ADD );
		//gl.blendFunc( gl.ZERO, gl.ONE );
		//gl.blendFunc( gl.ZERO, gl.SRC_ALPHA );
		// gl.blendFunc( gl.ONE, gl.ZERO );
		gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
		//gl.blendFunc( gl.SRC_ALPHA, gl.ZERO );
		 this.renderer.render(this.scenes.printTexture, this.cameras.fullscreenCamera);
		 this.renderer.setRenderTarget(null);
		 gl.disable( gl.BLEND );
	}

	printImage() {
		//var map = new THREE.TextureLoader().load( "src/img/circle.jpg" );
		// var material = new THREE.SpriteMaterial( { map: map, color: 0xffffff } );
		// var sprite = new THREE.Sprite( material );
		// sprite.scale.set(1024,1024,1);
		// var scene = new THREE.Scene();
		// scene.add( sprite );
		// this.renderer.render(scene, this.cameras.fullscreenCamera);
		// var canvas = document.createElement( 'canvas' );
		// var context = canvas.getContext( '2d' );

		
	}

	init() 
	{
  		var display = $('#display')[0];
  		this.scenes.majorScene = new THREE.Scene();
  		
  		this.cameras.fullscreenCamera = new THREE.Camera();
	    this.cameras.majorCamera = new THREE.PerspectiveCamera( 90, this.width / this.height, 0.1, 1000 );
	    this.cameras.majorCamera.position.x = 0;
		this.cameras.majorCamera.position.y = 0;
		this.cameras.majorCamera.position.z = this.height;
		this.gravity = new THREE.Vector4(0, -980, 0, 0);
		this.renderer = new THREE.WebGLRenderer( { alpha: true });
		// this.width = this.max(display.clientWidth, 100);
		// this.height = this.max(display.clientHeight, 100);
	    this.renderer.setSize(this.width, this.height);
		display.appendChild(this.renderer.domElement);

		this.initBuffers();
		this.initPipelines();
		// this.updateConvertParticleToCell();
		// this.updateConvertParticleToCell();
		this.updateConvertParticleToCell();
		// this.printTexture(
		// 	this.textures.cellTex, 
		// 	this.gridResolutionSize[0],
		// 	this.gridResolutionSize[1],
		// 	);
		// this.updateConvertParticleToCell1();
		
		//this.testNeighboor();
  	}

};	

