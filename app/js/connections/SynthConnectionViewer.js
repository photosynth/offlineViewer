"use strict";

PS.Packet.SynthConnectionViewer = function(player, options) {

	function getPacketBaseUrl(guid) {
		return "http://cdn.photosynth.net/ps2/" + guid + "/packet/";
	}

	var _player = player;

	var _options = {
		displayTargetCameras: false,
		displayTargetGeometry: true,
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
	};
	PS.extend(_options, options);

	this.forward = function(info, opts) {

		var defaultOptions = {
			onCameraChanged: function() {},
			onComplete: function() {}
		};
		PS.extend(defaultOptions, opts);

		var renderer =_player.packetViewer.renderer;

		var sourceCamera = info.sourceCamera;
		var targetCamera = info.targetCamera;

		var sourceDataset = info.sourceDataset;
		var targetDataset = info.targetDataset;

		if (_options.displayTargetCameras) {
			var fakeDataset = {
				averageWorldDistBetweenCameras: sourceDataset.averageWorldDistBetweenCameras,
				cameras: targetDataset.cameras.map(function(c) {
					return {
						pose: info.transform.forward.transformPose(c.pose)
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

		var mesh = info.targetMesh;
		if (_options.displayTargetGeometry) {
			renderer.overlayScene.add(mesh);
		}

		_player.seadragonViewer.disable();

		_player.packetViewer.cameraController.forceInputMode(4);

		_player.packetViewer.gotoCamera(info.sourceCamera, {
			prefetchSeadragon: false,
			onCameraChanged: false,
			onComplete: function() {

				_player.packetViewer.cameraController.forceInputMode(4);

				var srcPose = sourceCamera.pose;
				var dstPose = info.transform.forward.target.pose;
				var srcFov  = sourceCamera.fovy;
				var dstFov  = targetCamera.fovy;
				var qIndex  = sourceCamera.qIndex;

				_options.forward.onStart();

				new PS.Tween.create({
					duration: _options.duration,
					onUpdate: function(value, percent) {
						_player.packetViewer.setPositionBetweenCameras(srcPose, srcFov, dstPose, dstFov, percent, qIndex);
						info.setTargetMeshOpacity(value);
						_options.forward.onProgress(value, sourceDataset, targetDataset);
					},
					onComplete: function() {
						_player.packetViewer.setPositionBetweenCameras(srcPose, srcFov, dstPose, dstFov, 1.0, qIndex);
						info.setTargetMeshOpacity(1.0);

						//loading target dataset
						_player.preload(getPacketBaseUrl(info.transform.forward.target.guid), function(dataset) {

							_player.packetViewer.cameraController.forceInputMode(2);

							var targetTexture  = info.targetMesh.material.uniforms.colorTex.value;
							var targetGeometry = info.targetMesh.geometry;

							dataset.startingCamera = dataset.cameras[info.transform.forward.target.sIndex];
							dataset.startingCamera.assignPreloadedContent(targetTexture, targetGeometry);

							//copy mesh(geometry+texture) of image in source synth (will be used for reverse transition)
							PS.Packet.SynthTransitionStore.add(info.transform.forward.source.guid, _player.packetViewer.dataset, info.transform.forward.source.sIndex);

							_player.setActiveDataset(dataset);

							_options.forward.onComplete(sourceDataset, targetDataset);
						});
					}
				}).start();
			}
		});
	};

	this.reverse = function(info) {

		var renderer =_player.packetViewer.renderer;

		var sourceCamera = info.targetCamera;
		var targetCamera = info.sourceCamera;

		var sourceDataset = info.targetDataset;
		var targetDataset = info.sourceDataset;

		var entry = PS.Packet.SynthTransitionStore.get(info.transform.reverse.target.guid, info.transform.reverse.target.sIndex);
		info.setSourcePreloadedContent(entry.geometry, entry.texture);

		var mesh = info.sourceMesh;
		if (_options.displayTargetGeometry) {
			renderer.overlayScene.add(mesh);
		}
		renderer.forceRenderFrame();

		_player.seadragonViewer.disable();

		_player.packetViewer.gotoCamera(sourceCamera, {
			prefetchSeadragon: false,
			onCameraChanged: false,
			onComplete: function() {

				_player.packetViewer.cameraController.forceInputMode(4);

				var srcPose = sourceCamera.pose;
				var dstPose = info.transform.reverse.target.pose;
				var srcFov  = sourceCamera.fovy;
				var dstFov  = targetCamera.fovy;
				var qIndex  = sourceCamera.qIndex;

				_options.reverse.onStart();

				new PS.Tween.create({
					duration: _options.duration,
					onUpdate: function(value, percent) {
						_player.packetViewer.setPositionBetweenCameras(srcPose, srcFov, dstPose, dstFov, percent, qIndex);
						info.setSourceMeshOpacity(value);
						_options.reverse.onProgress(value, sourceDataset, targetDataset);
					},
					onComplete: function() {
						_player.packetViewer.setPositionBetweenCameras(srcPose, srcFov, dstPose, dstFov, 1.0, qIndex);
						info.setSourceMeshOpacity(1.0);

						//loading target dataset
						_player.preload(getPacketBaseUrl(info.transform.reverse.target.guid), function(dataset) {

							_player.packetViewer.cameraController.forceInputMode(2);

							var targetTexture  = info.sourceMesh.material.uniforms.colorTex.value;
							var targetGeometry = info.sourceMesh.geometry;

							dataset.startingCamera = dataset.cameras[info.transform.reverse.target.sIndex];
							dataset.startingCamera.assignPreloadedContent(targetTexture, targetGeometry);

							//copy mesh(geometry+texture) of image in source synth (will be used for reverse transition)
							//PS.Packet.SynthTransitionStore.add(_connection.forward.source.guid, _that.player.packetViewer.dataset, _connection.forward.source.sIndex);

							_player.setActiveDataset(dataset);
							_options.reverse.onComplete(sourceDataset, targetDataset);
						});

					}
				}).start();

			}
		});
	};
};
