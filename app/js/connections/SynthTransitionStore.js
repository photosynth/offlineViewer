"use strict";

PS.Packet.SynthTransitionStoreEntry = function(guid, camera, geometry, texture, color) {
	this.guid     = guid;
	this.sIndex   = camera.sIndex;
	this.geometry = geometry;
	this.texture  = texture;
	this.color    = color;
	this.camera   = this.createFakeCamera(camera);
};

PS.Packet.SynthTransitionStoreEntry.prototype.createFakeCamera = function(camera) {
	return {
		fovx: camera.fovx,
		fovy: camera.fovy,
		aspectRatio: camera.aspectRatio
	};
};

PS.Packet.SynthTransitionStore = new function() {

	var _store = [];

	this.add = function(guid, dataset, sIndex) {
		var camera   = dataset.cameras[sIndex];
		var geometry = camera.mesh.geometry.clone();
		var texture  = camera.mesh.material.uniforms.colorTex.value.clone();
		var color    = dataset.getDominantColor();

		_store.push(new PS.Packet.SynthTransitionStoreEntry(guid, camera, geometry, texture, color));
	};

	this.get = function(guid, sIndex) {

		//jshint loopfunc: true
		for (var i=0; i<_store.length; ++i) {

			var entry = _store[i];
			if (entry.guid === guid && entry.sIndex === sIndex) {

				return {
					dataset: {
						getDominantColor: (function() {
							var color = entry.color;
							return function() {
								return color;
							};
						})()
					},
					geometry: entry.geometry,
					texture:  entry.texture,
					camera:   entry.camera
				};
			}
		}
		//jshint loopfunc: false
	};
};
