"use strict";

/* exported ThumbnailGenerator */

function ThumbnailGenerator(options) {
	var _canvas;
	var _currentScreenshotIndex = 0;
	var _nbPoints;
	var _startQIndex;
	var _packetViewer;

	var _thumbnailCanvas = document.createElement("canvas");
	var _ctx;

	var _initialized = false;
	var _enabled = true;

	var _options = {
		width: 305,
		height: 305,
		nbScreenshots: 20,
		baseName: "",
		onUpdate: function() {}
	};
	PS.extend(_options, options);

	if (_options.baseName === "") {
		_enabled = false;
		console.warn("you need to provide a baseName");
	}

	var _that = this;

	//function dataUriToBlob() from http://stackoverflow.com/questions/12391628/how-can-i-upload-an-embedded-image-with-javascript/12470362#12470362
	function dataUriToBlob(dataURI) {
		// serialize the base64/URLEncoded data
		var byteString;
		if (dataURI.split(',')[0].indexOf('base64') >= 0) {
			byteString = atob(dataURI.split(',')[1]);
		}
		else {
			byteString = window.unescape(dataURI.split(',')[1]);
		}

		// parse the mime type
		var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

		// construct a Blob of the image data
		var array = [];
		for(var i = 0; i < byteString.length; i++) {
			array.push(byteString.charCodeAt(i));
		}
		return new Blob(
			[new Uint8Array(array)],
			{type: mimeString}
		);
	}

	this.init = function(packetViewer) {
		if (_enabled) {
			_packetViewer     =  packetViewer;
			var startPosition = _packetViewer.getStartPosition();
			_canvas = _packetViewer.renderer.getRenderer().domElement;
			_thumbnailCanvas.width  = _options.width;
			_thumbnailCanvas.height = _options.height;
			_ctx = _thumbnailCanvas.getContext("2d");
			_ctx.fillStyle = _packetViewer.dataset.getDominantColor().getStyle();

			_initialized = true;
			_currentScreenshotIndex = 0;
			_nbPoints = _packetViewer.dataset.path.nbPoints;
			_startQIndex = startPosition*_nbPoints;
			_packetViewer.setPosition(_startQIndex);
			setTimeout(function() { _that.update(); }, 500);
		}
	};

	this.update = function() {
		if (_initialized && _enabled && _currentScreenshotIndex < _options.nbScreenshots) {
			_ctx.fillRect(0, 0, _options.width, _options.height);
			_ctx.drawImage(_canvas, 0, 0, _options.width, _options.height);
			var uri = _thumbnailCanvas.toDataURL('image/jpeg', 0.75);
			var blob = dataUriToBlob(uri);

			var filename = _options.baseName+"_"+_currentScreenshotIndex+".jpg";
			PS.API.SimpleFileWriter.save(filename, blob, function() {
				_currentScreenshotIndex++;
				_options.onUpdate(_currentScreenshotIndex, _options.nbScreenshots);
				var qIndex = _startQIndex + _currentScreenshotIndex*(_nbPoints/5)/_options.nbScreenshots;
				_packetViewer.setPosition(qIndex);
				setTimeout(function() { _that.update(); }, 100);
			});
		}
	};
}
