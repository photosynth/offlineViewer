"use strict";

/* exported ThumbnailRotator */

function ThumbnailRotator(nbImages) {
	var _img;
	var _timer;
	var _name;
	var _nbImages         = nbImages || 20;
	var _interval         = 50; //in ms
	var _currentIndex     = 0;
	var _currentDirection = 1;

	var _images = new Array(_nbImages);
	for (var i=0; i<_nbImages; ++i) {
		_images[i] = new Image();
	}

	function updateImage() {
		if (_img && _images[_currentIndex].src) {
			_img.src = _images[_currentIndex].src;
		}
	}

	function getNext() {
		var index     = _currentIndex + _currentDirection;
		var direction = _currentDirection;
		if (index === _nbImages) {
			index = _nbImages-2;
			direction *= -1;
		}
		else if (index === -1) {
			index = 1;
			direction *= -1;
		}
		return {
			index: index,
			direction: direction
		};
	}

	function preloadImages(urls) {
		if (urls.length > 0) {
			for (var i=0; i<urls.length; ++i) {
				_images[i].src = urls[i];
			}
		}
		else {
			_images[0].src = _img.src;
			for (var i=1; i<_nbImages; ++i) {
				_images[i].src = _name+"/"+i+".jpg";
			}
		}
	}

	function clearTimer() {
		if (_timer) {
			clearInterval(_timer);
		}
	}

	this.start = function(img, name, urls) {
		_name = name;
		_img  = img;
		_currentIndex = 0;
		clearTimer();
		preloadImages(urls || []);
		updateImage();

		_timer = setInterval(function() {
			var next = getNext();
			if (!_images[next.index].complete) { //do not switch to next image if the image is not loaded
				return;
			}
			else {
				_currentIndex     = next.index;
				_currentDirection = next.direction;
				updateImage();
			}
		}, _interval);
	};

	this.stop = function() {
		_currentIndex     = 0;
		_currentDirection = 1;
		updateImage();
		clearTimer();
	};
}
