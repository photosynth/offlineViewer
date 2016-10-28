"use strict";

PS.Packet.SynthConnectionCamera = function(jsonNode, index) {

	var position = new THREE.Vector3().fromArray(jsonNode.position);
	var rotation = new THREE.Quaternion().fromArray(jsonNode.orientation);
	var cameraRot = new THREE.Matrix4().makeRotationFromQuaternion(rotation);

	this.aspectRatio = parseFloat(jsonNode.intrinsics[1]);
	this.fovy        = parseFloat(jsonNode.intrinsics[0]);
	this.fovx        = 2*Math.atan(this.aspectRatio*Math.tan(this.fovy*Math.PI/360))*180/Math.PI;

	var fov = this.fovy*Math.PI/180;

	this.my  = Math.tan(fov/2);
	this.mx  = this.my*this.aspectRatio;

	this.pose        = new PS.Packet.Pose(position, rotation);
	this.cameraFront = new THREE.Vector3().getColumnFromMatrix(2, cameraRot).negate(); //-Z in OpenGL
	this.cameraUp    = new THREE.Vector3().getColumnFromMatrix(1, cameraRot);
	this.cameraRight = new THREE.Vector3().getColumnFromMatrix(0, cameraRot);

	this.qIndex = jsonNode.path_index;
	this.iIndex = jsonNode.index;
	this.sIndex = 0;
	this.index  = index;
	this.onPreloaded = function() {};
};

PS.Packet.SynthConnectionCamera.prototype.computeTextureMatrix = function() {
	return PS.Packet.Camera.prototype.computeTextureMatrix.apply(this, arguments);
};
