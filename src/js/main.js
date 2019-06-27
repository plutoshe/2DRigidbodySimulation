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
	// var material = new THREE.ShaderMaterial({

 //        // uniforms: {
 //        //     res: { value: new THREE.Vector2() }
 //        // },
 //        vertexShader: getShader( 'generalVert' ),
 //        fragmentShader: getShader( 'generalFrag' ),
 //        // defines: this.getDefines()
 //    });

	var geometry = new THREE.Geometry();
	var size = 100 - 50;
	geometry.vertices.push(
		new THREE.Vector3( -size,  size, 0 ),
		new THREE.Vector3( -size, -size, 0 ),
		new THREE.Vector3(  size, -size, 0 ),
		new THREE.Vector3(  size, size, 0 ),
	); 

	geometry.faces.push( new THREE.Face3( 0, 1, 2 ), new THREE.Face3( 0, 2, 3) );
	var geometry1 = new THREE.BufferGeometry();
// create a simple square shape. We duplicate the top left and bottom right
// vertices because each vertex needs to appear once per triangle.
	var vertices = new Float32Array( [
		-size, -size,  0,
	 	size, -size,  0,
	 	size,  size,  0,

	 	size,  size,  0,
		-size,  size,  0,
		-size, -size,  0
	] );

// itemSize = 3 because there are 3 values (components) per vertex
	geometry1.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
	var material1 = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
	var material2 = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
	var mesh = new THREE.Mesh( geometry1, material1 );
	//geometry.computeBoundingSphere();
	
	var cube = new THREE.Mesh( geometry, material2 );

	camera.position.x = 0;
	camera.position.y = 0;
	camera.position.z = 100;
	cube.position.z = 0;
	


	var material3 = new THREE.ShaderMaterial({
        // uniforms: {
        //     res: { value: new THREE.Vector2() }
        // },
        vertexShader: getShader( 'generalVert' ),
        fragmentShader: getShader( 'generalFrag' ),
    });


	
    
	

	var size2 = 10;
	var vertices3 = new Float32Array( [
		-size2, size2,  0,
		-size2, -size2,  0,
	 	size2, -size2,  0,
	 	size2,  size2,  0,
	] );
	var geometry2 = new THREE.BufferGeometry();
	geometry2.addAttribute( 'position', new THREE.BufferAttribute(vertices, 3 ) );

	var geometry3 = new THREE.BufferGeometry();

	geometry3.setIndex([0,1,2, 0, 2,3])
    geometry3.addAttribute('position', new THREE.BufferAttribute( vertices3, 3 ));
    var points1 = new THREE.Points( geometry2, material3 );   
    //console.log(points1);
    //points1.position.z = 99;
	var mesh3 = new THREE.Mesh(geometry3, material3);
	scene.add(points1);
	//mesh3.position.z = 99;
	scene.add(mesh3);
	renderer.render( scene, camera );
}

