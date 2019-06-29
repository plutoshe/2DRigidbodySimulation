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
	var settingTextureMesh = new THREE.Points(settingGeometry, settingMaterial);
	var settingScene = new THREE.Scene();
	//renderer.setRenderTarget(renderTarget);
	settingScene.add(settingTextureMesh);
	renderer.clear();
	renderer.setRenderTarget(renderTarget);
	renderer.clear();
	renderer.render(settingScene, camera);
	//scene.add(settingTextureMesh);
	renderer.setRenderTarget(null);
	renderer.clear();
		//, renderTarget, true);
	
	renderer.render(settingScene, camera);
	//renderer.clear();
}

function drawing() {

}

function add_objects(scene) {
    const scope_ysize = 200.0;
    const scope_xsize = 400.0;
    const magnitude = 100;
    const step_size = 1 * magnitude;
    const particle_size = 0.49 * magnitude;
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
	var sideSizeX = 0;
	var sideSizeY = 0;
	var index = [];
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
    var vertices_for_points = new Float32Array(vertices);
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
	var tex = createRenderTarget(sideSizeX, sideSizeY, THREE.FloatType);

	// setPositionTexture
	settingTexture(tex, 
		new THREE.BufferAttribute(vertices_for_points, 3),
		new THREE.BufferAttribute(new Float32Array(index), 1), 
		new THREE.BufferAttribute(new Float32Array(positionData), 4), sideSizeX, sideSizeY);

		//, renderTarget, true);
	//renderer.setRenderTarget(null);

	// drawing
	// var materialForDrawing = new THREE.ShaderMaterial({
	// 	uniforms: {
 //            pointSize: { value: particle_size },
 //            res: {value: new THREE.Vector2(sideSizeX, sideSizeY)},
 //            posTex: {value: null},
 //            screen: {value: new THREE.Vector2(800, 600)},
 //        },
 //        vertexShader: getShader( 'drawingVert' ),
 //        fragmentShader: getShader( 'drawingFrag' ),
	// });
	// materialForDrawing.uniforms.posTex.value = tex.texture;
	// console.log(tex.texture);
	// var geometryForDrawing = new THREE.BufferGeometry();
	// geometryForDrawing.addAttribute('position', new THREE.BufferAttribute(vertices_for_points, 3 ) );
	// console.log(index);
	// geometryForDrawing.addAttribute("bodyIndex",  new THREE.BufferAttribute(new Float32Array(index), 1)); //

	// var pointsForPosition = new THREE.Points(geometryForDrawing, materialForDrawing);
	// scene.add(pointsForPosition);
	// renderer.render( scene, camera );
	var i = j = 0;
	var aparticle_size = 600.0;
	var vertices_mesh = new Float32Array( [
		i - aparticle_size, j + aparticle_size,  0,
		i - aparticle_size, j - aparticle_size,  0,
	 	i + aparticle_size, j - aparticle_size,  0,
	 	i + aparticle_size, j + aparticle_size,  0,
	] );
	geometry_for_meshs.setIndex([0,1,2, 0, 2,3])
	geometry_for_meshs.addAttribute('position', new THREE.BufferAttribute( vertices_mesh, 3 ));			

	var material4 = new THREE.ShaderMaterial({
		// pointSize represents the number of pixels which its side will be occupying.
        uniforms: {
            pointSize: { value: particle_size },
            texture: { value: tex.texture},
        },
        vertexShader: getShader( 'generalVert' ),
        fragmentShader: getShader( 'generalFrag' ),
    });
	var mesh3 = new THREE.Mesh(geometry_for_meshs, material4);
	mesh3.position.z = 0;
	scene.add(mesh3);
	renderer.render( scene, camera );
}

var animate = 
	function (time) {
		requestAnimationFrame( animate );
		var deltaTime = prevTime === undefined ? 0 : (time - prevTime) / 1000;
		points1.position.y += deltaTime * -10.0;

		//renderer.render( scene, camera );
		prevTime = time;
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
	//renderer.render( scene, camera );
}



init();
animate();