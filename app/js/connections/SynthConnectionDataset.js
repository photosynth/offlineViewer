"use strict";

PS.Packet.SynthConnectionDataset = function() {
	this.rootUrl = "";
	this.cameras = [];
	this.version = {};
	this.geometryRanges = [];
	this.reverseCamIndex = [];
	this.onPreloaded = function() {};
	this.lod = 1; //TODO: hard-coded for now
};

PS.Packet.SynthConnectionDataset.prototype.createSubCamerasList = function() {
	return PS.Packet.Dataset.prototype.createSubCamerasList.apply(this, arguments);
};

PS.Packet.SynthConnectionDataset.prototype.computeRange = function() {
	return PS.Packet.Dataset.prototype.computeRange.apply(this, arguments);
};

PS.Packet.SynthConnectionDataset.prototype.getImageUrl = function() {
	return PS.Packet.Dataset.prototype.getImageUrl.apply(this, arguments);
};

PS.Packet.SynthConnectionDataset.prototype.getGeometryUrl = function() {
	return PS.Packet.Dataset.prototype.getGeometryUrl.apply(this, arguments);
};

PS.Packet.SynthConnectionDataset.prototype.getDominantColor = function() {
	return PS.Packet.Dataset.prototype.getDominantColor.apply(this);
};
