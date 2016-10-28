"use strict";

PS.Packet.SynthConnectionManager = function(packetPlayer, annotationViewer, options) {

	var _options = {
		displayTargetCameras: true,
		displayTargetGeometry: false,
		transitionDuration: 800
	};
	PS.extend(_options, options);

	var _guid;

	var _annotationViewer = annotationViewer;

	var _player           = packetPlayer;
	var _playerOptions    = _player.packetViewer.getOptions();

	var _synthConnectionPreloader = new PS.Packet.SynthConnectionPreloader(_player, {
		debugBlendingEnabled: _playerOptions.debugBlendingEnabled,
		pathToWorker: _playerOptions.pathToWorker,
		onLog: _playerOptions.onLog
	});

	var _synthConnectionViewer = new PS.Packet.SynthConnectionViewer(_player, {
		displayTargetCameras: _options.displayTargetCameras,
		displayTargetGeometry: _options.displayTargetGeometry,
		duration: _options.transitionDuration,
		forward: {
			onStart: function() {
				_annotationViewer.clear();
				_annotationViewer.setVisible(false);
			},
			onProgress: function(percent, srcDataset, dstDataset) {
				var color = srcDataset.getDominantColor().lerp(dstDataset.getDominantColor(), percent);
				_player.setBackgroundColor(color);
			},
			onComplete: function(srcDataset, dstDataset) {
				window.history.pushState(null, null, "?guid="+PS.extractGuid(dstDataset.rootUrl));
			}
		},
		reverse: {
			onStart: function() {
				_annotationViewer.clear();
				_annotationViewer.setVisible(false);
			},
			onProgress: function(percent, srcDataset, dstDataset) {
				var color = srcDataset.getDominantColor().lerp(dstDataset.getDominantColor(), percent);
				_player.setBackgroundColor(color);
			}
		}
	});

	var _cache = {};
	var _currentEntry = null;

	var _queue = new PS.Utils.Async.PriorityQueue([], {
		concurrency: 1,
		onProcess: function(task, callback) {
			var annotation = task.value;
			var target = annotation.transform.target;

			_synthConnectionPreloader.preload(getPacketBaseUrl(target.guid), target.sIndex, function(dataset, sIndex, geometry, texture) {

				if (task.key !== annotation.transform.source.guid + "_" + annotation.dbid) {
					//this can happen if the user is pressing the back button before the connection is preloaded
					//thus when the connection is preloaded then the active synth in the viewer is different
					//thus we should just ignore this preloaded connection, well actually we should unload it properly
					//TODO: handle unloading properly!
					return;
				}

				var connection = new PS.Packet.SynthConnection(_player.packetViewer.dataset, annotation);
				connection.setTargetPreloadedContent(geometry, texture, dataset);
				connection.setTargetMeshOpacity(0);

				_cache[annotation.dbid] = connection;
				_annotationViewer.load([annotation]);
				callback();
			});
		}
	});

	this.init = function(guid, annotations) {
		_guid = guid;
		_cache = {}; //TODO: dispose the geometry and texture and material!!!

		//TODO: clear the queue or create a new one!

		annotations.forEach(function(a) {
			var key      = _guid + "_" + a.dbid;
			var value    = a;
			var priority = 0;
			_queue.push(key, value, priority);
		});
	};

	this.forwardTransition = function(dbid) {
		_currentEntry = _cache[dbid];
		_synthConnectionViewer.forward(_currentEntry);
	};

	function getPacketBaseUrl(guid) {
		return "http://cdn.photosynth.net/ps2/" + guid + "/packet/";
	}

	this.back = function() {
		_synthConnectionViewer.reverse(_currentEntry);
	};

};
