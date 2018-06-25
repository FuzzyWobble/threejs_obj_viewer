



//written by fuzzy wobble



/*
	this code has six parts:
	0. init
	1. setup environment
	2. animate/render
	3. ui/gui
	4. obj loader
	5. other junk
*/











//===========================================================================
//###############################  0. init  #################################
//===========================================================================

//typical vars
var container; //our div container for the scene
var camera; //our camera
var scene; //our scene
var renderer; //our renderer
var controls; // our mouse controls
var grid; //our grid
var floor; //our floor
var clock; //our clock for timing
var stats; //our stats for performance
var raycaster; //our raycaster for hover detections (not used in this code)
var spotlight; //our spotlight (just using one for now)
var spotlightball;
var ambientlight; //our ambient light
var hemispherelight; //our hemispheric light
var fog; //our fog (only looks good in very basic scenes where fog color exacly matches background color)

//other vars
var model_is_loading = true; //turns false after model loaded

//OUR OBJs
var our_objs = [];
our_objs.push( {uid:"mw01", name:"mikew", file:"Mike", x:0,y:0,z:0, rx:0,ry:-Math.PI/2,rz:0, oscale:4} );
our_objs.push( {uid:"hh01", name:"hulkhogan", file:"Hulk_Hogan_Beach_Basher", x:0,y:0,z:0, rx:0,ry:-Math.PI/2,rz:0, oscale:3.3} );
//name/file represent the location where the obj/mtl is stored (obj/name/file.obj & obj/name/file.mtl)
//x,y,z is the starting position
//rx,ry,rz is the starting rotation (many models online have arbitrary inital rotations)
//scale is the starting scale (most models online have arbitrary scales)

var active_obj; //stores the current obj
var active_obj_index = 0; //stores the active index

var slow_jazz_mp3 = new Howl({
  src: ['mp3/luxury.mp3'],
  volume: 0.75,
  loop: true
});

//our initial camera matrix. 
//move the camera to any position and hit [c] to get this matix. paste here. 
//this is not working right now sadly
var camera_state_init = "[0.14188073420398306,-2.7755575615628914e-17,0.9898837594696352,0,0.2081715910061202,0.9776371102998909,-0.029837380288150472,0,-0.9677470981406864,0.21029902654191981,0.13870787099440884,0,-9.465153032030017,4.925814783186549,1.9115839464991184,1]";

//our page is ready, lets init
$(document).ready(function(){ 

	//setup the environment
	setup_environment();

	//init our gui
	init_gui();

	//load our object load_obj(uid, name, file, x,y,z, rx,ry,rz, scale)
	var o = our_objs[0]; //just load our first obj
	load_obj(o.uid, o.name, o.file, o.x,o.y,o.z, o.rx,o.ry,o.rz, o.oscale);

	//render
	render();

});










//===========================================================================
//########################  1. setup environment  ###########################
//===========================================================================
function setup_environment(){


	//====================================================================
	//DIV
	container = document.getElementById( 'canvas_fuzzy_wobble' );


	//====================================================================
	//CAMERA
	camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 1, 20000 );
	camera.position.set( -8,4,2 );
	//camera.matrix.fromArray(JSON.parse(camera_state_init));
	//camera.matrix.decompose(camera.position, camera.quaternion, camera.scale);

	//====================================================================
	//RENDERER
	renderer = new THREE.WebGLRenderer( {canvas: container, antialias: true} );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowIntensity = 0.5;
	renderer.setClearColor( 0x222222 );
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;


	//====================================================================
	//SCENE
	scene = new THREE.Scene();
	

	//====================================================================
	//CONTROLS
	controls = new THREE.OrbitControls( camera, container );


	//====================================================================
	//CLOCK
	clock = new THREE.Clock();


	//====================================================================
	//STATS
	stats = new Stats();
	document.body.appendChild( stats.dom );


	//====================================================================
	//FOG
	// fog = new THREE.FogExp2( 0xffffff, 0.05);
	// scene.add( fog );


	//====================================================================
	//LIGHTS
	ambientlight = new THREE.AmbientLight( 0xffffff, 0.33 ); 
	scene.add( ambientlight );
	hemispherelight = new THREE.HemisphereLight(0xffffff, 0x999999, 0.33);
	hemispherelight.position.set(0, 10, 0);
	scene.add( hemispherelight );


	//====================================================================
	//SPOT LIGHTS
	//https://threejs.org/examples/webgl_lights_rectarealight.html
	spotlight = new THREE.SpotLight( 0xffffff, 1.5, 30, 2, 1, 0.01 ); //(color,intensity,distance,angle,penumbra,decay)
	spotlight.position.set( -3, 3, 3 );
	scene.add( spotlight );
	spotlight.castShadow = true;
	spotlight.shadow.mapSize.width = 1024;
	spotlight.shadow.mapSize.height = 1024;
	spotlight.shadow.camera.near = 500;
	spotlight.shadow.camera.far = 4000;
	spotlight.shadow.camera.fov = 30;
	scene.add( spotlight.target );
	spotlight.target.position.set(0,2,0);
	var geometry = new THREE.SphereGeometry( 0.50, 32, 32 );
	var material = new THREE.MeshBasicMaterial( {color: 0xffffff} );
	spotlightball = new THREE.Mesh( geometry, material );
	scene.add( spotlightball );
	spotlightball.position.set( -3,8,3 );

	//====================================================================
	//GRID HELPTER
	grid = new THREE.GridHelper( 50, 50, 0x666666, 0x666666 );
	grid.position.set( 0, 0, 0 );
	grid.receiveShadow = true; //this don't do shit
	scene.add( grid );


	//====================================================================
	//FLOOR
	var geometry = new THREE.PlaneBufferGeometry( 50, 50 );
	var material = new THREE.MeshStandardMaterial( {color: 0xaaaaaa, roughness: 1.0, metalness: 0.0} );
	floor = new THREE.Mesh( geometry, material );
	floor.rotation.x = - Math.PI / 2;
	floor.receiveShadow = true;
	scene.add( floor );
	floor.visible = false;

	//====================================================================
	//DRAG TARGET (what is this again? somehow helps with draggables but dont remember how exactly -_-)
	targetForDragging = new THREE.Mesh(
		new THREE.BoxGeometry(50,5,50),
		new THREE.MeshBasicMaterial()
	);
	targetForDragging.material.visible = false;
	scene.add( targetForDragging );


	//====================================================================
	//RAYCASTER
	raycaster = new THREE.Raycaster();


	//====================================================================
	//TEXTURE FLOOR
	// var loader = new THREE.TextureLoader();
	// var floorTexture = loader.load('../../lib/textures/grass1.jpg');
	// floorTexture.wrapS = THREE.RepeatWrapping;
	// floorTexture.wrapT = THREE.RepeatWrapping;
	// floorTexture.repeat.set(160, 160);
	// var planeGeometry = new THREE.PlaneGeometry(1000, 1000);
	// var planeMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF, map: floorTexture });
	// var plane = new THREE.Mesh(planeGeometry, planeMaterial);
	// plane.receiveShadow = true;
	// plane.castShadow = true;
	// plane.rotation.x = -0.5 * Math.PI;
	// plane.position.set(0, 0, 0);
	// scene.add(plane);


	//====================================================================
	//SKYBOX
	var cubeTextureLoader = new THREE.CubeTextureLoader();
	cubeTextureLoader.setPath( '../../lib/threejs_93/examples/textures/cube/MilkyWay/' );
	var cubeTexture = cubeTextureLoader.load( [
		'dark-s_px.jpg', 'dark-s_nx.jpg',
		'dark-s_py.jpg', 'dark-s_ny.jpg',
		'dark-s_pz.jpg', 'dark-s_nz.jpg',
	] );
	var cubeShader = THREE.ShaderLib[ 'cube' ];
	cubeShader.uniforms[ 'tCube' ].value = cubeTexture;
	var skyBoxMaterial = new THREE.ShaderMaterial( {
		fragmentShader: cubeShader.fragmentShader,
		vertexShader: cubeShader.vertexShader,
		uniforms: cubeShader.uniforms,
		side: THREE.BackSide
	} );
	var skyBox = new THREE.Mesh( new THREE.BoxBufferGeometry( 1000, 1000, 1000 ), skyBoxMaterial );
	scene.add( skyBox );


	//====================================================================
	//TEXT
	// var floader = new THREE.FontLoader();
	// floader.load( '../../lib/threejs_93/examples/fonts/optimer_bold.typeface.json', function ( font ) {
	// 	var geometry = new THREE.TextGeometry( 'Scene Creator', {
	// 		font: font,
	// 		size: 1.15,
	// 		height: 0.25,
	// 		curveSegments: 12,
	// 		bevelEnabled: false,
	// 	} );
	// 	var material = new THREE.MeshNormalMaterial();
	// 	var textMesh = new THREE.Mesh( geometry, material );
	// 	scene.add( textMesh );
	// 	textMesh.rotation.y = -Math.PI/2;
	// 	textMesh.position.y = 1.5;
	// 	textMesh.position.x = 10;
	// 	textMesh.position.z = -9;
	// } );


}








//===========================================================================
//#########################  2. animate/render  #############################
//===========================================================================
var loop_counter = 0;
function render(){

	loop_counter++;

	animate();

	requestAnimationFrame( render ); //jumps to next frame when the renderer is ready, tries for 60fps

	if(model_is_loading===true){
		//do nothing
	}else{
		renderer.render( scene, camera );
	}
	
	stats.update(); //update our stats/performance

}
function animate(){

	if(model_is_loading===true){
		//do nothing
	}else{
		//let's just slowly rotate our obj
		active_obj.rotation.y += 0.005;
	}

}












//===========================================================================
//#############################  3. ui/gui  #################################
//===========================================================================

var gui_global_param, gui_spotlight_param, gui_model_param; //these just hold data controlled by the gui. they are defined below.

function init_gui(){


	//gui is from https://github.com/dataarts/dat.gui
	//i don't really like the syntax but it is the go-to turnkey gui so let's just use it
	gui = new dat.GUI();

	//gui for global
	var gui_global = gui.addFolder( 'global' ); //create gui category
		var gui_global_param = {
			ambient_light_intensity: 0.33,
			hemishpere_light_intensity: 0.33,
			floor_on: false,
			floor_color: 0x444444,
			grid_on: true,
		};
		//gui, ambient light
		gui_global.add( gui_global_param, 'ambient_light_intensity',0,1 ).step(0.01).onChange(function(val){  
			ambientlight.intensity = val;
		});
		//gui, hemisphere light
		gui_global.add( gui_global_param, 'hemishpere_light_intensity',0,1 ).step(0.01).onChange(function(val){  
			hemispherelight.intensity = val;
		});
		//gui, floor hide/show
		gui_global.add(gui_global_param, 'floor_on').onChange(function(val){  
			if(gui_global_param.floor_on===false){
				floor.visible = false; 
			}else{
				floor.visible = true;
			}
		});
		//gui, floor color
		gui_global.addColor( gui_global_param, 'floor_color' ).onChange(function(val){  
			floor.material.color.setHex( val );
		});
		//gui, grid hide/show
		gui_global.add(gui_global_param, 'grid_on').onChange(function(val){  
			if(gui_global_param.grid_on===false){
				grid.visible = false;
			}else{
				grid.visible = true;
			}
		});
		gui_global.close();

	//gui for spotlight
	var gui_spotlight = gui.addFolder( 'spotlight' ); //create gui category for spotlight
		gui_spotlight_param = {
			spotlight_intensity: spotlight.intensity,
			spotlight_color: spotlight.color.getHex(),
			spotlight_px:spotlight.position.x, spotlight_py:spotlight.position.y, spotlight_pz:spotlight.position.z,
			spotlight_tx:spotlight.target.position.x, spotlight_ty:spotlight.target.position.y, spotlight_tz:spotlight.target.position.z,
			spotlight_distance: spotlight.distance,
			spotlight_angle: spotlight.angle,
			spotlight_decay: spotlight.decay,
		};
		//spotlight color
		gui_spotlight.addColor( gui_spotlight_param, 'spotlight_color' ).onChange(function(val){  
			spotlight.color.setHex( val );
		});
		//spotlight angle
		gui_spotlight.add( gui_spotlight_param, 'spotlight_angle',0.1,3 ).step(0.01).onChange(function(val){  
			spotlight.angle = val;
		});
		//spotlight decay
		gui_spotlight.add( gui_spotlight_param, 'spotlight_decay',0.1,3 ).step(0.01).onChange(function(val){  
			spotlight.decay = val;
		});
		//spotlight intensity
		gui_spotlight.add( gui_spotlight_param, 'spotlight_intensity',0.1,3 ).step(0.01).onChange(function(val){  
			spotlight.intensity = val;
		});
		//spotlight position
		gui_spotlight.add( gui_spotlight_param, 'spotlight_px',-10,10 ).step(0.1).onChange(function(val){  
			spotlight.position.x = val;
			spotlightball.position.x = val;
		});
		gui_spotlight.add( gui_spotlight_param, 'spotlight_py',-10,10 ).step(0.1).onChange(function(val){  
			spotlight.position.y = val;
			spotlightball.position.y = val;
		});
		gui_spotlight.add( gui_spotlight_param, 'spotlight_pz',-10,10 ).step(0.1).onChange(function(val){  
			spotlight.position.z = val;
			spotlightball.position.z = val;
		});
		//spotlight target
		gui_spotlight.add( gui_spotlight_param, 'spotlight_tx',-10,10 ).step(0.1).onChange(function(val){  
			spotlight.target.position.x = val;
		});
		gui_spotlight.add( gui_spotlight_param, 'spotlight_ty',-10,10 ).step(0.1).onChange(function(val){  
			spotlight.target.position.y = val;
		});
		gui_spotlight.add( gui_spotlight_param, 'spotlight_tz',-10,10 ).step(0.1).onChange(function(val){  
			spotlight.target.position.z = val;
		});
		gui_spotlight.close();

	//gui for model
	var gui_model = gui.addFolder( 'model' );
		gui_model_param = {
			scale:1.0,
			shininess: 33,
		};
		//adjust the scale
		gui_model.add( gui_model_param, 'scale',0.1,5 ).step(0.1).onChange(function(val){  
			var original_scale = our_objs[active_obj_index].oscale;
			active_obj.scale.set( val*original_scale, val*original_scale, val*original_scale );
		});	
		//adjust the sininess
		gui_model.add( gui_model_param, 'shininess',1,300 ).step(1).onChange(function(val){  
			active_obj.traverse(function(child){
				if(child instanceof THREE.Mesh){ 
					child.material.shininess = val;
				}
			});
		});	
		gui_model.close();


}

$(document).ready(function(){ //our page is ready

	//clicked to load a different obj
	$(".model").click(function(){
		var clicked_uid = $(this).attr("id");
		for(var i=0;i<our_objs.length;i++){
			if(our_objs[i].uid === clicked_uid){ //we have a match
				active_obj_index = i; 
				var o = our_objs[i]; //just load our first obj
				load_obj(o.uid, o.name, o.file, o.x,o.y,o.z, o.rx,o.ry,o.rz, o.oscale);
			}
		}
	});

	//click okay on intro screen
	$(".okay_button").click(function(){
		$(".instructions_whiteout").fadeOut(500);
		slow_jazz_mp3.play();
	});

	//key pressed
	$(document).keydown(function(event){
    	var keyCode = (event.keyCode ? event.keyCode : event.which);
    	console.log(keyCode);
		if(keyCode === 67){
			console.log( JSON.stringify(camera.matrix.toArray()) );
			alert( JSON.stringify(camera.matrix.toArray()) );
		}
	});

	

});













//===========================================================================
//###########################  4. obj loader  ###############################
//===========================================================================
function load_obj(uid, name, file, x,y,z, rx,ry,rz, scale){

	model_is_loading = true;

	new THREE.MTLLoader().load( 'obj/'+name+'/'+file+'.mtl', function ( materials ) {

		materials.baseUrl = 'obj/'+name+'/';

		materials.preload();

		new THREE.OBJLoader().setMaterials( materials ).load( 'obj/'+name+'/'+file+'.obj', function ( object ) {

			console.log(object); //look at the object in console and ur head will explode.

			object.scale.set( scale,scale,scale );

			object.rotation.set( rx,ry,rz );

			object.position.set( x,y,z );

			if(active_obj!==undefined){
				scene.remove( active_obj ); //remove the existing obj from the scene
			}

			scene.add( object ); //add obj to our scene

			//lets set our active object to the loaded object
			active_obj = object;

			//lets set the shininess
			object.traverse(function(child){
				if(child instanceof THREE.Mesh){ 
					child.material.shininess = 33;
				}
			});

			model_is_loading = false;

		}, onProgressOBJ, onErrorOBJ );

	} );
	
}
var onProgressOBJ = function ( xhr ) {
	if ( xhr.lengthComputable ) {
		var percentComplete = xhr.loaded / xhr.total * 100;
		console.log( Math.round( percentComplete, 2 ) + '% downloaded' );

		loading_bar_w = (xhr.loaded/xhr.total)*100; //final bar width is 100
		$(".loading_bar").css("width",loading_bar_w+"px");

		//we only need to do this on the very first load
		if((xhr.loaded/xhr.total) >= 1.0){
			$(".loading_whiteout").fadeOut(500);
		}

	}

};
var onErrorOBJ = function ( xhr ) { 
	console.log("OBJ LOADING ERROR");
	console.log(xhr);
};





















//===========================================================================
//###########################  5. other junk  ###############################
//===========================================================================
$(window).resize(function(){
	responsive_ui();
});
$(document).ready(function(){
	responsive_ui();
});
$(window).load(function(){
	responsive_ui();
});
function responsive_ui(){
	$(".centerxy").each(function(){ $(this).center(1,1); });
	$(".centerx").each(function(){ $(this).center(1,0); });
	$(".centery").each(function(){ $(this).center(0,1); });
}
$.fn.center = function(x,y){
	if(x==1){this.css("left", Math.max(0, (($(this).parent().width() - $(this).outerWidth()) / 2) ) + "px");}
	if(y==1){this.css("top", Math.max(0, (($(this).parent().height() - $(this).outerHeight()) / 2) ) + "px");}
	return this;
};
$.fn.center2 = function(x,y){
	if(x==1){this.css("left", (($(this).parent().width() - $(this).outerWidth()) / 2)  + "px");}
	if(y==1){this.css("top", (($(this).parent().height() - $(this).outerHeight()) / 2)  + "px");}
	return this;
};

