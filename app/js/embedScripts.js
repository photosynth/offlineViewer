"use strict";

// jshint evil: true
/* global _useCompileJS */

/* exported _bingMapKey */
var _bingMapKey = 'ArNMeVPrTEWs-raRBo8iJCBCiQNwWCRHOrJnuXekWu2EteapRA2fVBvMo_THeiqu';

/* exported _useStaticStorage */
/* exported _staticStoragePrefix */
var _useStaticStorage = true;
var _staticStoragePrefix = "synths/";

/* exported _annotationStorageURL  */
/* exported _annotationStoragePort */
/* exported _simpleSynthLinkerURL  */
/* exported _simpleSynthLinkerPort */
/* exported _simpleFileWriterUrl   */
/* exported _simpleFileWriterPort  */

//Experimental annotation storage based on node.js + mongodb
var _annotationStorageURL  = "localhost";
var _annotationStoragePort = 3000;

//Experimental synth linker based on node.js + synther.exe
var _simpleSynthLinkerURL  = "localhost";
var _simpleSynthLinkerPort = 4000;

var _simpleFileWriterUrl  = "localhost";
var _simpleFileWriterPort = 5000;

var _pathToWorkerParser;

_useCompileJS = true;

if (_useCompileJS) {
	_pathToWorkerParser = "build/js/PS2PacketPlayer.worker.min.js";

	document.write('<link rel="stylesheet" type="text/css" href="build/css/PS2PacketPlayer.min.css" />');

	document.write('<script type="text/javascript" src="build/js/PS2PacketPlayer.min.js"></script>');
	document.write('<script type="text/javascript" src="build/js/PS2API.min.js"></script>');
}
else {
	_pathToWorkerParser = "../src/PacketPlayer/PacketViewer/WorkerParser.js";

	//css styling
	document.write('<link rel="stylesheet" type="text/css" href="../css/PS2PacketPlayer.css" />');
	document.write('<link rel="stylesheet" type="text/css" href="../css/PS2AnnotationEditor.css" />');

	//ThirdParty
	document.write('<script type="text/javascript" src="../src/ThirdParty/ie.float32array.js"></script>');
	document.write('<script type="text/javascript" src="../src/ThirdParty/three.min.js"></script>');
	document.write('<script type="text/javascript" src="../src/ThirdParty/dat.gui.min.js"></script>');
	document.write('<script type="text/javascript" src="../src/ThirdParty/openseadragon.min.js"></script>');
	document.write('<script type="text/javascript" src="../src/ThirdParty/Autolinker.min.js"></script>');
	document.write('<script type="text/javascript" src="../src/ThirdParty/TrackballControls.js"></script>');

	//Core
	document.write('<script type="text/javascript" src="../src/Core/Core.js"></script>');
	document.write('<script type="text/javascript" src="../src/Core/WebGLMemoryUsage.js"></script>');
	document.write('<script type="text/javascript" src="../src/Core/Touch/MultiTouchGestureHandler.js"></script>');
	document.write('<script type="text/javascript" src="../src/Core/Touch/SingleTouchInputHandler.js"></script>');
	document.write('<script type="text/javascript" src="../src/Core/Utils/Utils.js"></script>');
	document.write('<script type="text/javascript" src="../src/Core/Utils/Async/Async.js"></script>');
	document.write('<script type="text/javascript" src="../src/Core/Utils/Async/Parallel.js"></script>');
	document.write('<script type="text/javascript" src="../src/Core/Utils/Async/Queue.js"></script>');
	document.write('<script type="text/javascript" src="../src/Core/Utils/Async/PriorityQueue.js"></script>');
	document.write('<script type="text/javascript" src="../src/Core/Utils/Request/Request.js"></script>');
	document.write('<script type="text/javascript" src="../src/Core/Utils/Tween/legacy.js"></script>');
	document.write('<script type="text/javascript" src="../src/Core/Utils/Tween/Tween.js"></script>');

	//Progress
	document.write('<script type="text/javascript" src="../src/Progress/Progress.js"></script>');

	//Exif
	document.write('<script type="text/javascript" src="../src/Exif/Exif.js"></script>');

	//PacketPlayer
	document.write('<script type="text/javascript" src="../src/PacketPlayer/PacketPlayer.js"></script>');
	document.write('<script type="text/javascript" src="../src/PacketPlayer/ViewerOptions.js"></script>');
	document.write('<script type="text/javascript" src="../src/PacketPlayer/Map/MapViewer.js"></script>');
	document.write('<script type="text/javascript" src="../src/PacketPlayer/Metadata/Viewer.js"></script>');
	document.write('<script type="text/javascript" src="../src/PacketPlayer/Metadata/ProgressIndicator.js"></script>');
	document.write('<script type="text/javascript" src="../src/PacketPlayer/PacketViewer/Camera.js"></script>');
	document.write('<script type="text/javascript" src="../src/PacketPlayer/PacketViewer/Dataset.js"></script>');
	document.write('<script type="text/javascript" src="../src/PacketPlayer/PacketViewer/DatasetLoader.js"></script>');
	document.write('<script type="text/javascript" src="../src/PacketPlayer/PacketViewer/DatasetLoaderWorker.js"></script>');
	document.write('<script type="text/javascript" src="../src/PacketPlayer/PacketViewer/GestureVelocity.js"></script>');
	document.write('<script type="text/javascript" src="../src/PacketPlayer/PacketViewer/KeyboardVelocity.js"></script>');
	document.write('<script type="text/javascript" src="../src/PacketPlayer/PacketViewer/MultiViewerCameraController.js"></script>');
	document.write('<script type="text/javascript" src="../src/PacketPlayer/PacketViewer/OffscreenScene.js"></script>');
	document.write('<script type="text/javascript" src="../src/PacketPlayer/PacketViewer/PacketRenderer.js"></script>');
	document.write('<script type="text/javascript" src="../src/PacketPlayer/PacketViewer/PacketViewer.js"></script>');
	document.write('<script type="text/javascript" src="../src/PacketPlayer/PacketViewer/Parser.js"></script>');
	document.write('<script type="text/javascript" src="../src/PacketPlayer/PacketViewer/Path.js"></script>');
	document.write('<script type="text/javascript" src="../src/PacketPlayer/PacketViewer/Shaders.js"></script>');
	document.write('<script type="text/javascript" src="../src/PacketPlayer/Seadragon/Viewer.js"></script>');

	//Annotations
	document.write('<script type="text/javascript" src="../src/AnnotationViewer/AnnotationViewer.js"></script>');
	document.write('<script type="text/javascript" src="../src/AnnotationEditor/AnnotationGeometryService.js"></script>');
	document.write('<script type="text/javascript" src="../src/AnnotationEditor/AnnotationVisibilityServiceFallback.js"></script>');
	document.write('<script type="text/javascript" src="../src/AnnotationEditor/AnnotationVisibilityService.js"></script>');
	document.write('<script type="text/javascript" src="../src/AnnotationEditor/AnnotationBuilder.js"></script>');
	document.write('<script type="text/javascript" src="../src/AnnotationEditor/AnnotationVisibilityControl.js"></script>');
	document.write('<script type="text/javascript" src="../src/AnnotationEditor/AnnotationEditor.js"></script>');

	//SDK
	document.write('<script type="text/javascript" src="../src/SDK/SDK.js"></script>');
	document.write('<script type="text/javascript" src="../src/SDK/EventDispatcher.js"></script>');
	document.write('<script type="text/javascript" src="../src/SDK/PacketPlayer.js"></script>');
	document.write('<script type="text/javascript" src="../src/SDK/PacketPlayerEventDispatcher.js"></script>');
	document.write('<script type="text/javascript" src="../src/SDK/AnnotationViewer.js"></script>');
	document.write('<script type="text/javascript" src="../src/SDK/AnnotationViewerEventDispatcher.js"></script>');
	document.write('<script type="text/javascript" src="../src/SDK/AnnotationEditor.js"></script>');
	document.write('<script type="text/javascript" src="../src/SDK/AnnotationEditorEventDispatcher.js"></script>');

	//API
	document.write('<script type="text/javascript" src="../src/API/Photosynth.js"></script>');
	document.write('<script type="text/javascript" src="../src/API/PhotosynthRead.js"></script>');
	document.write('<script type="text/javascript" src="../src/API/SimpleAnnotationProxy.js"></script>');
	document.write('<script type="text/javascript" src="../src/API/SimpleAnnotationStorage.js"></script>');
	document.write('<script type="text/javascript" src="../src/API/SimpleFileWriter.js"></script>');
	document.write('<script type="text/javascript" src="../src/API/SimpleSynthLinker.js"></script>');
	document.write('<script type="text/javascript" src="../src/API/SimpleStaticStorage.js"></script>');
}
