"use strict";

PS.Packet.SynthConnectionPreloader = function(player, options) {

	var _options = {
		debugBlendingEnabled: false,
		pathToWorker: "",
		onLog: function() {}
	};
	PS.extend(_options, options);

	var _isIE = navigator.userAgent.indexOf("Trident") !== -1;
	var _datasets = {};
	var _player = player;

	var _worker = new PS.Packet.DatasetLoaderWorker({
		onGeometryCreated: function(rootUrl, originalCameraIndex, geometry) {

			var dataset = _datasets[rootUrl];
			if (dataset) {
				var cameraIndex = dataset.reverseCamIndex[originalCameraIndex];
				var camera      = dataset.cameras[cameraIndex];

				if (camera.onPreloaded) {

					new PS.Utils.ImageDownloader(dataset.getImageUrl(camera.iIndex), function(err, img) {
						if (img) {
							var tex = new THREE.Texture(img);
							tex.flipY = true;
							tex.needsUpdate = false;
							tex.generateMipmaps = false;
							tex.onUpdate = function() {
								camera.onPreloaded(dataset, camera.sIndex, geometry, tex);
							};
							_player.packetViewer.loadTexture(tex);
						}
					}, _player.packetViewer.isCorsEnabled());

				}
				else {
					geometry.dispose();
					geometry = null;
				}
			}
			else {
				geometry.dispose();
				geometry = null;
			}
		},
		onLog: _options.onLog,
		pathToWorker: _options.pathToWorker
	});

	function downloadAndParseDataset(rootUrl, onParsed) {

		if (_datasets[rootUrl]) { //0.json was already parsed
			onParsed(_datasets[rootUrl]);
		}
		else {
			new PS.Utils.Request(rootUrl + "0.json", {
				onComplete: function(xhr) {
					var result = JSON.parse(xhr.responseText);
					var cams = result.cameras;

					var nbCameras = cams.length;

					var dataset = new PS.Packet.SynthConnectionDataset();
					dataset.geometryRanges = result.geometry_ranges;
					dataset.dominantColors = result.dominant_colors;
					dataset.rootUrl = rootUrl;
					dataset.version = {json: result.json_version};
					dataset.cameras = cams.map(function(jsonNode, index) {
						return new PS.Packet.SynthConnectionCamera(jsonNode, index);
					});
					dataset.cameras.sort(function(a, b) { return a.qIndex - b.qIndex; }); //sorting camera by quantized index [0,1023]
					dataset.cameras.forEach(function(cam, index) { cam.sIndex = index; });
					dataset.reverseCamIndex = new Array(nbCameras);
					for (var i=0; i<nbCameras; ++i) {
						dataset.reverseCamIndex[dataset.cameras[i].index] = i;
					}
					_datasets[dataset.rootUrl] = dataset;
					onParsed(dataset);
				},
				onError: function() {
					_options.onLog({type: "Error", message: "Fail to load: " + rootUrl + "0.json"});
				}
			});
		}
	}

	function downloadGeometry(dataset, geometryFileIndex) {
		new PS.Utils.Request(dataset.getGeometryUrl(geometryFileIndex), {
			responseType: "arraybuffer",
			onComplete: function(xhr) {

				var range = dataset.computeRange(geometryFileIndex);

				var arr = _isIE ? [] : [xhr.response];
				_worker.postMessage({
					"type": "createGeometry",
					"cameras": dataset.createSubCamerasList(range.start, range.end),
					"buffer": xhr.response,
					"startCameraIndex": range.start,
					"endCameraIndex": range.end,
					"fileIndex": geometryFileIndex,
					"debugBlendingEnabled": _options.debugBlendingEnabled,
					"rootUrl": dataset.rootUrl
				}, arr);
			}
		});
	}

	this.preload = function(rootUrl, camSIndex, onPreloaded) {

		downloadAndParseDataset(rootUrl, function(dataset) {

			if (camSIndex >= 0 && camSIndex < dataset.cameras.length) {

				var targetCamera = dataset.cameras[camSIndex];
				targetCamera.onPreloaded = onPreloaded;

				for (var i=0; i<dataset.geometryRanges.length; ++i) {
					var range = dataset.computeRange(i);
					if (targetCamera.index >= range.start && targetCamera.index < range.end) {
						var geometryFileIndex = i;
						downloadGeometry(dataset, geometryFileIndex);

						break;
					}
				}
			}
			else {
				_options.onLog({type: "Error", message: "Out of range camSIndex while preloading geometry for transition"});
			}
		});
	};

	this.destroy = function() {
		_worker.destroy();
	};
};
