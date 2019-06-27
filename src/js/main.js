$(document).ready(init());
function max(a, b) 
{
	return a > b? a : b;
}

function init() 
{
	var display = $('#display')[0];
    var scene = new THREE.Scene();
 	var camera = new THREE.PerspectiveCamera( 90, 1, 0.1, 500 );

	var renderer = new THREE.WebGLRenderer();
	var width = max(display.clientWidth, 100);
    var height = max(display.clientHeight, 100);
    renderer.setSize(width, height);
	display.appendChild(renderer.domElement);
	var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
	// this.materials.setBodyData = new THREE.ShaderMaterial({
 //        uniforms: {
 //            res: { value: new THREE.Vector2() }
 //        },
 //        vertexShader: getShader( 'setBodyDataVert' ),
 //        fragmentShader: getShader( 'setBodyDataFrag' ),
 //        defines: this.getDefines()
 //    });

	var geometry = new THREE.Geometry();
	var size = 100;
	geometry.vertices.push(
		new THREE.Vector3( -size,  size, 0 ),
		new THREE.Vector3( -size, -size, 0 ),
		new THREE.Vector3(  size, -size, 0 ),
		new THREE.Vector3(  size, size, 0 ),
	);

	geometry.faces.push( new THREE.Face3( 0, 1, 2 ), new THREE.Face3( 0, 2, 3) );

	geometry.computeBoundingSphere();
	var cube = new THREE.Mesh( geometry, material );
	scene.add( cube );
	camera.position.x = 0;
	camera.position.y = 0;
	camera.position.z = 100;
	cube.position.z = 0;
	renderer.render( scene, camera );
	 
	// var animate = function () 
	// {
	// 	requestAnimationFrame( animate );

	// 	cube.rotation.x += 0.01;
	// 	cube.rotation.y += 0.01;

	// 	renderer.render( scene, camera );
	// };

	// animate();
}

