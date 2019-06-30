//$(document).ready(init());
function max(a, b) 
{
	return a > b? a : b;
}
var scene;
var renderer;
var camera;
var geometry_for_points;
var points1;
var prevTime;
var posTexture;
var fullscreenCamera = new THREE.Camera();
var posTex1, posTex2;
var sideSizeX = 0;
var sideSizeY = 0;
var index = [];
const scope_ysize = 200.0;
const scope_xsize = 400.0;
const magnitude = 100;
const step_size = 1 * magnitude;
const particle_size = 0.49 * magnitude;
var vertices_for_points;
var deltaTime;
var materialForUpdatePhysics, geometryForUpdatePhysics;
var meshForUpdate;
var updatePhysicsScene;

function createRenderTarget(w,h,type,format){
    var a =new THREE.WebGLRenderTarget(w, h, {
        minFilter: THREE.LinearFilter,//THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,//format === undefined ? THREE.RGBAFormat : format,
        type: THREE.FloatType,
    });
    // a.texture.minFilter = THREE.LinearFilter;
    return a;
}

var settingTexture = function(renderTarget, position, bodyIndex, data, w, h) {
	var settingMaterial = new THREE.ShaderMaterial({
		uniforms: {
            res: { value: new THREE.Vector2(w, h) },
        },
        vertexShader: getShader( 'textureSetVert' ),
        fragmentShader: getShader( 'textureSetFrag' ),
	});
	var settingGeometry = new THREE.BufferGeometry();
	settingGeometry.addAttribute("position",  position); //
	settingGeometry.addAttribute("bodyIndex",  bodyIndex); //
	console.log(data);
	settingGeometry.addAttribute("data", data); // new THREE.BufferAttribute(new Float32Array(ver))
	// settingGeometry.setDrawRange(0,1);
	//this.onePointPerBodyGeometry.setDrawRange( 0, count );
	var settingTextureMesh = new THREE.Points(settingGeometry, settingMaterial);
	var settingScene = new THREE.Scene();
	//renderer.setRenderTarget(renderTarget);
	settingScene.add(settingTextureMesh);
	renderer.clear();
	renderer.setRenderTarget(renderTarget);
	
	renderer.render(settingScene, fullscreenCamera);
	//scene.add(settingTextureMesh);
	renderer.setRenderTarget(null);
	renderer.clear();
		//, renderTarget, true);
	
	renderer.render(settingScene, camera);
	//renderer.clear();
}

function swapBuffer() {
	var tmp = posTex1;
	posTex1 = posTex2;
	posTex2 = tmp;
}

function drawing() {
	var materialForDrawing = new THREE.ShaderMaterial({
		uniforms: {
            pointSize: { value: particle_size },
            res: {value: new THREE.Vector2(sideSizeX, sideSizeY)},
            posTex: {value: null},
            screen: {value: new THREE.Vector2(800, 600)},
        },
        vertexShader: getShader( 'drawingVert' ),
        fragmentShader: getShader( 'drawingFrag' ),
	});
	materialForDrawing.uniforms.posTex.value = posTex1.texture;
	var geometryForDrawing = new THREE.BufferGeometry();
	geometryForDrawing.addAttribute('position', new THREE.BufferAttribute(vertices_for_points, 3 ) );
	geometryForDrawing.addAttribute("bodyIndex",  new THREE.BufferAttribute(new Float32Array(index), 1)); //

	var pointsForPosition = new THREE.Points(geometryForDrawing, materialForDrawing);
	scene.add(pointsForPosition);
	renderer.render( scene, camera );
}

function add_objects(scene) {
    var vertices = [];
	var geometry_for_meshs = new THREE.BufferGeometry();
	var is_mesh_rendering = false;

	var material3 = new THREE.ShaderMaterial({
		// pointSize represents the number of pixels which its side will be occupying.
        uniforms: {
            pointSize: { value: particle_size },
        },
        vertexShader: getShader( 'generalVert' ),
        fragmentShader: getShader( 'generalFrag' ),
    });
	
	var positionData = []
	var id = 0;
    for (var i = -scope_xsize / 2; i <= scope_xsize / 2; i += step_size) {
    	sideSizeX++;
    	sideSizeY = 0;
    	for (var j = -scope_ysize / 2; j <= scope_ysize / 2; j += step_size) {
    		sideSizeY++;
    		// vertices.push(i);
    		// vertices.push(j);
    		// vertices.push(0);
    		//console.log(i, j);
    		vertices.push(i);
    		vertices.push(j);
    		vertices.push(0);
    		positionData.push(i);
    		positionData.push(j);
    		positionData.push(0);
    		positionData.push(1);
    		index.push(id);
    		id++;
    		if (is_mesh_rendering) {
				var vertices_mesh = new Float32Array( [
					i - particle_size, j + particle_size,  0,
					i - particle_size, j - particle_size,  0,
				 	i + particle_size, j - particle_size,  0,
				 	i + particle_size, j + particle_size,  0,
				] );
				geometry_for_meshs.setIndex([0,1,2, 0, 2,3])
				geometry_for_meshs.addAttribute('position', new THREE.BufferAttribute( vertices3, 3 ));			
				var mesh3 = new THREE.Mesh(geometry_for_meshs, material3);
				scene.add(mesh3);
			}
    	}
    }
    console.log("!!!");
    vertices_for_points = new Float32Array(vertices);
    geometry_for_points = new THREE.BufferGeometry();
    console.log(vertices);
	geometry_for_points.addAttribute( 'position', new THREE.BufferAttribute(vertices_for_points, 3 ) );

    points1 = new THREE.Points( geometry_for_points, material3 );   
	//scene.add(points1);
	//renderer.render( scene, camera );
	// var mesh3 = new THREE.Mesh(geometry3, material3);
	// scene.add(mesh3);

	// 不去想复用先，之后再改
	var type = THREE.FloatType; //( /(iPad|iPhone|iPod)/g.test( navigator.userAgent ) ) ? THREE.HalfFloatType : THREE.FloatType;
	console.log(sideSizeX, sideSizeY)
	posTex1 = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);
	posTex2 = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);
	
	// setPositionTexture
	settingTexture(posTex1, 
		new THREE.BufferAttribute(vertices_for_points, 3),
		new THREE.BufferAttribute(new Float32Array(index), 1), 
		new THREE.BufferAttribute(new Float32Array(positionData), 4), sideSizeX, sideSizeY);

	// drawing
	drawing();
}

function initUpdatePhysics() {
	
	materialForUpdatePhysics = new THREE.ShaderMaterial({
		uniforms: {
			res: {value: new THREE.Vector2(sideSizeX, sideSizeY)},
			screen: {value: new THREE.Vector2(800, 600)},
			posTex: {value: posTex1.texture},
			deltaTime: {value:deltaTime},
		},
		vertexShader: getShader("physicsUpdateVert"),
		fragmentShader: getShader("physicsUpdateFrag"),
	});
	geometryForUpdatePhysics = new THREE.BufferGeometry();
	geometryForUpdatePhysics.addAttribute(
		"position", 
		new THREE.BufferAttribute(new Float32Array(sideSizeY * sideSizeX * 3), 3));
	geometryForUpdatePhysics.addAttribute(
		"bodyIndex",
		new THREE.BufferAttribute(new Float32Array(index)),
	);
	meshForUpdate = new THREE.Points(geometryForUpdatePhysics, materialForUpdatePhysics);
	updatePhysicsScene = new THREE.Scene();
	updatePhysicsScene.add(meshForUpdate);

}

function updatePhysics() {
	materialForUpdatePhysics.uniforms.posTex.value = posTex1.texture;
	materialForUpdatePhysics.uniforms.deltaTime.value = deltaTime;
	materialForUpdatePhysics.needsUpdate = true;
	// geometryForUpdatePhysics.attributes.position.needsUpdate = true;
	// geometryForUpdatePhysics.setDrawRange( 0, sideSizeX * sideSizeY);
	
	// attributes.data.needsUpdate
	renderer.setRenderTarget(posTex2);
	renderer.render(updatePhysicsScene, fullscreenCamera);
	renderer.setRenderTarget(null);
}

var animate = 
	function (time) {
		requestAnimationFrame( animate );
		deltaTime = prevTime === undefined ? 0 : (time - prevTime) / 1000;
		points1.position.y += deltaTime * -10.0;

		//renderer.render( scene, camera );
		prevTime = time;
		// update physics
		updatePhysics();
		swapBuffer();
		drawing();
		// render.clear();
		// renderer.render(df)
		// render new image for particles
	};

			
function init() 
{
	var display = $('#display')[0];
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 90, 800 / 600, 0.1, 1000 );
    camera.position.x = 0;
	camera.position.y = 0;
	camera.position.z = 600;

	renderer = new THREE.WebGLRenderer();
	var width = max(display.clientWidth, 100);
    var height = max(display.clientHeight, 100);
    renderer.setSize(width, height);
	display.appendChild(renderer.domElement);

	add_objects(scene);
	initUpdatePhysics();
	//renderer.render( scene, camera );
}



init();
animate();