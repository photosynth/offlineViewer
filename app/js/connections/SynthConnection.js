"use strict";

PS.Packet.SynthConnection = function(dataset, annotation) {

	this.annotation = annotation;
	this.transform  = new PS.Packet.SynthConnectionTransform(annotation.transform);

	this.sourceDataset = dataset;
	this.targetDataset = null;

	//source and target camera in their respective coordinate system
	this.sourceCamera = this.sourceDataset.cameras[this.transform.forward.source.sIndex];
	this.targetCamera = null;

	this.targetMesh = null; //target mesh in source synth for forward transform
	this.sourceMesh = null; //source mesh in target synth for reverse transform
};

PS.Packet.SynthConnection.prototype.createHighMaterial = function(textureMatrix, texture) {
	var debugBlendingEnabled = false; //TODO: read options

	var shaders = PS.Packet.Shaders.Factory.generateProjectiveShaders({
		thumbnailAtlasShader: false,
		debugPolygonColorEnabled: debugBlendingEnabled,
		featheringBlendingEnabled: false, //we are overriding the opacity so there it's not compatible with the feathering blending
		opacityOverrideEnabled: true,
		positioningEnabled: true,
		overrideColorEnabled: false
	});
	var uniforms = THREE.UniformsUtils.clone(shaders.uniforms);
	uniforms.textureMatrix.value = textureMatrix;
	uniforms.colorTex.value = texture;

	var material = new THREE.ShaderMaterial({
		fragmentShader: shaders.fragmentShader,
		vertexShader: shaders.vertexShader,
		uniforms: uniforms,
		depthWrite: true,
		transparent: true,
		vertexColors: debugBlendingEnabled ? THREE.VertexColors : THREE.NoColors
	});
	return material;
};

PS.Packet.SynthConnection.prototype.setTargetPreloadedContent = function(geometry, texture, dataset) {

	this.targetDataset = dataset;

	this.targetCamera = this.targetDataset.cameras[this.transform.forward.target.sIndex];

	var textureMatrix = this.targetCamera.computeTextureMatrix(this.transform.forward.target.pose);
	var material = this.createHighMaterial(textureMatrix, texture);

	var transform = this.transform.forward.transform;

	this.targetMesh = new THREE.Mesh(geometry, material);
	this.targetMesh.position.copy(transform.translation);
	this.targetMesh.scale.set(transform.scale, transform.scale, transform.scale);
	this.targetMesh.quaternion.copy(transform.rotation);

	this.setTargetMeshOpacity(0);
};

PS.Packet.SynthConnection.prototype.setTargetMeshOpacity = function(opacity) {
	this.targetMesh.material.uniforms.opacity.value = opacity;
};

PS.Packet.SynthConnection.prototype.setSourcePreloadedContent = function(geometry, texture) {

	texture.needsUpdate = true;

	var textureMatrix = this.sourceCamera.computeTextureMatrix(this.transform.reverse.target.pose);
	var material = this.createHighMaterial(textureMatrix, texture);

	var transform = this.transform.reverse.transform;

	this.sourceMesh = new THREE.Mesh(geometry, material);
	this.sourceMesh.position.copy(transform.translation);
	this.sourceMesh.scale.set(transform.scale, transform.scale, transform.scale);
	this.sourceMesh.quaternion.copy(transform.rotation);
	this.setSourceMeshOpacity(0);
};

PS.Packet.SynthConnection.prototype.setSourceMeshOpacity = function(opacity) {
	this.sourceMesh.material.uniforms.opacity.value = opacity;
};
