"use strict";

Photosynth.SynthTourViewer = function(div, storage, startingGuid, options) {

	var _options = {
		startCameraIndex: 0,
		pathToWorker: "",
		displayTargetCameras: false,
		displayTargetGeometry: true,
		transitionDuration: 1000
	};
	PS.extend(_options, options);

	var _container = div;
	var _storage = storage;

	var _container = document.getElementById("viewer-container");
	var _guid = startingGuid;

	var _connectionAnnotations = [];
	var _connectionManager;

	//create synth viewer
	var _viewer = new Photosynth.PS2Viewer(_container, {
		width:  window.innerWidth,
		height: window.innerHeight,
		animateSpeed: 1.0,
		autoStart: false,
		pathToWorker: _options.pathToWorker,
		autoResizeEnabled: true
	});

	_viewer.addEventListener("dataset-loaded", function(dataset) {
		_guid = PS.extractGuid(dataset.rootUrl);
	});

	//create the annotation viewer
	var _annotationViewer = new Photosynth.PS2AnnotationViewer(_viewer, {
		visibleInFullscreen: true
	});

	//load some annotations in the annotation viewer
	_annotationViewer.addEventListener("init", function() {

		//loading annotations from storage
		_storage.load(_guid, function (annotations) {

			var regularAnnotations = annotations.filter(function(a) { return !a.transform; });
			_connectionAnnotations = annotations.filter(function(a) { return a.transform; });

			_annotationViewer.clear();
			_annotationViewer.load(regularAnnotations);
		});
	});

	_annotationViewer.addEventListener("annotation-click", function(annotation) {
		if (annotation.transform) {
			_connectionManager.forwardTransition(annotation.dbid);
			return false; //override default zoom to annotation behaviour
		}
		return true;
	});

	_viewer.addEventListener("viewer-built", function() {
		_connectionManager = new PS.Packet.SynthConnectionManager(_viewer.getInternal(), _annotationViewer.getInternal(), {
			displayTargetCameras:  _options.displayTargetCameras,
			displayTargetGeometry: _options.displayTargetGeometry,
			transitionDuration:    _options.transitionDuration
		});

		_viewer.addEventListener("geometry-loaded", function() {
			_connectionManager.init(_guid, _connectionAnnotations);
		});

		window.addEventListener("popstate", function(e) {
			e.preventDefault();
			_connectionManager.back();
		});

	});

	_viewer.loadGuid(_guid, {
		startCameraIndex: _options.startCameraIndex
	});

};
