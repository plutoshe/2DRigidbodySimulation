$(document).ready(init());
function max(a, b) 
{
	return a > b? a : b;
}

function init() 
{
	var display = $('#display')[0];
    var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

	var renderer = new THREE.WebGLRenderer();
	var width = max(display.clientWidth, 100);
    var height = max(display.clientHeight, 100);
    renderer.setSize(width, height);
	display.appendChild(renderer.domElement);
	var geometry = new THREE.BoxGeometry( 1, 1, 1 );
	var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
	var cube = new THREE.Mesh( geometry, material );
	scene.add( cube );

	camera.position.z = 5;
	var animate = function () 
	{
		requestAnimationFrame( animate );

		cube.rotation.x += 0.01;
		cube.rotation.y += 0.01;

		renderer.render( scene, camera );
	};

	animate();
}

