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

function add_objects(scene) {
    const scope_ysize = 200.0;
    const scope_xsize = 400.0;
    const magnitude = 1;
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

    for (var i = -scope_xsize / 2; i <= scope_xsize / 2; i += step_size) {
    	for (var j = -scope_ysize / 2; j <= scope_ysize / 2; j += step_size) {
    		vertices.push(i);
    		vertices.push(j);
    		vertices.push(0);
    		//console.log(i, j);
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
    var vertices_for_points = new Float32Array(vertices);
    geometry_for_points = new THREE.BufferGeometry();
    console.log(vertices);
	geometry_for_points.addAttribute( 'position', new THREE.BufferAttribute(vertices_for_points, 3 ) );

    points1 = new THREE.Points( geometry_for_points, material3 );   
	scene.add(points1);
	// var mesh3 = new THREE.Mesh(geometry3, material3);
	// scene.add(mesh3);
}

var animate = 
	function (time) {
		requestAnimationFrame( animate );
		console.log(points1.position.y);
		var deltaTime = prevTime === undefined ? 0 : (time - prevTime) / 1000;
		points1.position.y += deltaTime * -2.0;

		renderer.render( scene, camera );
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
	renderer.render( scene, camera );
}



init();
animate();