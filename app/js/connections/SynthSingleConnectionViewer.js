"use strict";

PS.Packet.SynthSingleConnectionViewer = function(div, connection, options) {

	function getPacketBaseUrl(guid) {
		return "http://cdn.photosynth.net/ps2/" + guid + "/packet/";
	}

	var _renderingWidth  = window.innerWidth;
	var _renderingHeight = window.innerHeight;
	var _that = this;
	var _connection = connection;
	var _dataset;

	var _options = {
		displayTargetCameras: false,
		pathToWorker: "",
		transition: {
			duration: 800,
			forward: {
				onStart:    function() {},
				onProgress: function() {},
				onComplete: function() {}
			},
			reverse: {
				onStart:    function() {},
				onProgress: function() {},
				onComplete: function() {}
			}
		}
	};
	PS.extend(_options, options);

	var playerOptions = {
		packetURL: getPacketBaseUrl(_connection.forward.source.guid),
		width:  _renderingWidth,
		height: _renderingHeight,
		seadragonEnabled: true,
		corsEnabled: true,
		viewer: {
			autoStartEnabled: false,
			pathToWorker: _options.pathToWorker,
			onDatasetLoaded: function(dataset) {
				_dataset = dataset;
			}
		}
	};
	PS.extend(playerOptions, PS.Packet.ViewerOptions.getUser());

	this.player = new PS.Packet.Player(div, playerOptions);

	var _synthConnectionPreloader = new PS.Packet.SynthConnectionPreloader(this.player, {
		pathToWorker: _options.pathToWorker,
		onLog: function(msg) {
			console.log(msg);
		}
	});

	function createHighMaterial(textureMatrix, texture) {

		var debugBlendingEnabled = false; //TODO: read options

		var shaders = PS.Packet.Shaders.Factory.generateProjectiveShaders({
			thumbnailAtlasShader: false,
			debugPolygonColorEnabled: debugBlendingEnabled,
			featheringBlendingEnabled: false, //we are overriding the opacity so there it's not compatible with the feathering blending
			opacityOverrideEnabled: true,
			positioningEnabled: true,
			overrideColorEnabled: false
		});
		var uniforms = THREE.UniformsUtils.clone(shaders.uniforms);
		uniforms.textureMatrix.value = textureMatrix;
		uniforms.colorTex.value = texture;

		var material = new THREE.ShaderMaterial({
			fragmentShader: shaders.fragmentShader,
			vertexShader: shaders.vertexShader,
			uniforms: uniforms,
			depthWrite: true,
			transparent: true,
			vertexColors: debugBlendingEnabled ? THREE.VertexColors : THREE.NoColors
		});
		return material;
	}

	/*
	function createFarPlaneGeometry(camera) {

		var distanceFromCamera = camera.far*0.99;
		var planeHeight = 2 * distanceFromCamera * Math.tan(camera.fovy*0.5*Math.PI/180);
		var planeWidth  = planeHeight * camera.aspectRatio;

		var pos = camera.pose.position.clone();
		var rot = camera.pose.orientation.clone();

		var c = new THREE.Vector3(-planeWidth/2,  planeHeight/2, -distanceFromCamera).applyQuaternion(rot).add(pos);
		var d = new THREE.Vector3( planeWidth/2,  planeHeight/2, -distanceFromCamera).applyQuaternion(rot).add(pos);
		var e = new THREE.Vector3( planeWidth/2, -planeHeight/2, -distanceFromCamera).applyQuaternion(rot).add(pos);
		var f = new THREE.Vector3(-planeWidth/2, -planeHeight/2, -distanceFromCamera).applyQuaternion(rot).add(pos);

		var geometry = new THREE.BufferGeometry();
		geometry.dynamic = true;
		geometry.attributes = {
			index: {
				itemSize: 1,
				array: new Uint16Array([0,2,1,0,3,2]),
				numItems: 6
			},
			position: {
				itemSize: 3,
				array: new Float32Array([   c.x, c.y, c.z,
											d.x, d.y, d.z,
											e.x, e.y, e.z,
											f.x, f.y, f.z]),
				numItems: 4
			},
			uv: {
				itemSize: 2,
				//array: new Float32Array([0,0,1,0,1,1,0,1]), //good one
				array: new Float32Array([0,1,1,1,1,0,0,0]), //bad one to compensate for flipY missing in texture creation
				numItems: 4
			}
		};
		geometry.offsets.push({
			'start': 0,
			'count': 6,
			'index': 0
		});

		return geometry;
	}
	*/

	var _material;
	var _targetCameraPose;
	var _targetFov;
	var _targetTexture;
	var _targetGeometry;
	var _sourceDataset;
	var _targetDataset;
	var _transitionMesh;

	_synthConnectionPreloader.preload(getPacketBaseUrl(_connection.forward.target.guid), _connection.forward.target.sIndex, function(dataset, camSIndex, geometry, texture) {

			var packetViewer = _that.player.packetViewer;
			var renderer = packetViewer.renderer;

			var sourceDataset = packetViewer.dataset;
			var targetDataset = dataset;
			_sourceDataset = sourceDataset;
			_targetDataset = targetDataset;

			var targetCamera = targetDataset.cameras[_connection.forward.target.sIndex];

			_targetCameraPose = _connection.forward.target.pose;
			_targetFov = _connection.forward.target.fovy;
			_targetTexture = texture;
			_targetGeometry = geometry;

			targetCamera.textureMatrix = PS.Packet.Camera.prototype.computeTextureMatrix.call(targetCamera, _targetCameraPose);
			_material = createHighMaterial(targetCamera.textureMatrix, texture);
			_material.uniforms.opacity.value =  0.0;
			_material.side = THREE.DoubleSide;

			/*
			var planeGeometry = createFarPlaneGeometry(_dataset.cameras[_connection.source.sIndex]);
			var planeMaterial = new THREE.MeshBasicMaterial({ color: "white", transparent: true, map: texture});
			var planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
			//planeMaterial.opacity = 0.5;
			renderer.overlayScene.add(planeMesh);
			renderer.forceRenderFrame();
			*/

			var transform = _connection.forward.transform;

			var mesh = new THREE.Mesh(geometry, _material);
			mesh.position.copy(transform.translation);
			mesh.scale.set(transform.scale, transform.scale, transform.scale);
			mesh.quaternion.copy(transform.rotation);

			mesh.matrixAutoUpdate = false;
			mesh.updateMatrix();
			mesh.updateMatrixWorld(true);
			renderer.overlayScene.add(mesh);
			renderer.forceRenderFrame();

			_transitionMesh = mesh;

			if (_options.displayTargetCameras) {
				var fakeDataset = {
					averageWorldDistBetweenCameras: sourceDataset.averageWorldDistBetweenCameras,
					cameras: targetDataset.cameras.map(function(c) {
						return {
							pose: _connection.forward.transformPose(c.pose)
						};
					}),
					createAxes: PS.Packet.Dataset.prototype.createAxes
				};
				var axes = PS.Packet.Dataset.prototype.createCamerasAxes.call(fakeDataset);
				axes.forEach(function(a) {
					a.visible = true;
					renderer.overlayScene.add(a);
				});
			}
	});

	this.forwardTransition = function() {
		var camera = _dataset.cameras[_connection.forward.source.sIndex];

		_that.player.seadragonViewer.disable();

		_that.player.packetViewer.gotoCamera(camera, {
			prefetchSeadragon: false,
			onCameraChanged: false,
			onComplete: function() {

				var srcPose = camera.pose;
				var dstPose = _targetCameraPose;
				var qIndex  = camera.qIndex;
				var srcFov  = camera.fovy;
				var dstFov  = _targetFov;

				new PS.Tween.create({
					duration: _options.transition.duration,
					onUpdate: function(value, percent) {
						_that.player.packetViewer.setPositionBetweenCameras(srcPose, srcFov, dstPose, dstFov, percent, qIndex);
						_material.uniforms.opacity.value = value;
						_options.transition.forward.onProgress(value, _sourceDataset, _targetDataset);
					},
					onComplete: function() {
						_that.player.packetViewer.setPositionBetweenCameras(srcPose, srcFov, dstPose, dstFov, 1.0, qIndex);
						_material.uniforms.opacity.value = 1.0;

						//loading target dataset
						_that.player.preload(getPacketBaseUrl(_connection.forward.target.guid), function(dataset) {
							dataset.startingCamera = dataset.cameras[_connection.forward.target.sIndex];
							dataset.startingCamera.assignPreloadedContent(_targetTexture, _targetGeometry);

							//copy mesh(geometry+texture) of image in source synth (will be used for reverse transition)
							PS.Packet.SynthTransitionStore.add(_connection.forward.source.guid, _that.player.packetViewer.dataset, _connection.forward.source.sIndex);

							//dispose (geom+texture+material) of the mesh used for the current geometry.
							//well actually I'm assigning it to the preloaded dataset so I can't dispose it here...
							/*
							_that.player.packetViewer.renderer.overlayScene.remove(_transitionMesh);
							_transitionMesh.material.uniforms.colorTex.value.dispose();
							_transitionMesh.material.dispose();
							_transitionMesh.geometry.dispose();
							*/
							_that.player.setActiveDataset(dataset);
							_options.transition.forward.onComplete(_sourceDataset, _targetDataset);
						});
					}
				}).start();
			}
		});
	};

	this.reverseTransition = function() {

		var camera = _that.player.packetViewer.dataset.cameras[_connection.forward.target.sIndex];

		_that.player.seadragonViewer.disable();

		_that.player.packetViewer.gotoCamera(camera, {
			onComplete: function() {

				_targetCameraPose = _connection.reverse.target.pose;
				_targetFov = _connection.reverse.target.fovy;

				var entry = PS.Packet.SynthTransitionStore.get(_connection.reverse.target.guid, _connection.reverse.target.sIndex);
				_targetDataset = entry.dataset;
				_targetTexture = entry.texture;
				_targetTexture.needsUpdate = true;
				_targetGeometry = entry.geometry;

				var targetCamera = entry.camera;

				targetCamera.textureMatrix = PS.Packet.Camera.prototype.computeTextureMatrix.call(targetCamera, _targetCameraPose);
				_material = createHighMaterial(targetCamera.textureMatrix, _targetTexture);
				_material.uniforms.opacity.value =  0.0;
				_material.side = THREE.DoubleSide;

				var transform = _connection.reverse.transform;

				var mesh = new THREE.Mesh(_targetGeometry, _material);
				mesh.position.copy(transform.translation);
				mesh.scale.set(transform.scale, transform.scale, transform.scale);
				mesh.quaternion.copy(transform.rotation);

				mesh.matrixAutoUpdate = false;
				mesh.updateMatrix();
				mesh.updateMatrixWorld(true);

				var renderer = _that.player.packetViewer.renderer;

				renderer.overlayScene.add(mesh);
				renderer.forceRenderFrame();

				var srcPose = camera.pose;
				var dstPose = _targetCameraPose;
				var qIndex  = camera.qIndex;
				var srcFov  = camera.fovy;
				var dstFov  = _targetFov;

				new PS.Tween.create({
					duration: _options.transition.duration,
					onUpdate: function(value, percent) {
						_that.player.packetViewer.setPositionBetweenCameras(srcPose, srcFov, dstPose, dstFov, percent, qIndex);
						_material.uniforms.opacity.value = value;
						_options.transition.reverse.onProgress(value, _sourceDataset, _targetDataset);
					},
					onComplete: function() {
						_that.player.packetViewer.setPositionBetweenCameras(srcPose, srcFov, dstPose, dstFov, 1.0, qIndex);
						_material.uniforms.opacity.value = 1.0;

						//loading target dataset
						_that.player.preload(getPacketBaseUrl(_connection.reverse.target.guid), function(dataset) {
							dataset.startingCamera = dataset.cameras[_connection.reverse.target.sIndex];
							dataset.startingCamera.assignPreloadedContent(_targetTexture, _targetGeometry);

							_targetDataset = dataset;

							_that.player.setActiveDataset(dataset);
							_options.transition.reverse.onComplete(_sourceDataset, _targetDataset);
						});
					}
				}).start();
			}
		});
	};
};
