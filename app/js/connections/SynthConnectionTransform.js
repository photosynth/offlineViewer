"use strict";

PS.Packet.SynthConnectionTransform = function(jsonNode) {

	this.source = parseSynthConnectionEndpoint(jsonNode.source);
	this.target = parseSynthConnectionEndpoint(jsonNode.target);

	this.date    = jsonNode.date; //TODO: convert to JS Date Object
	this.quality = jsonNode.quality;
	this.version = jsonNode.version;

	this.targetToSourceTransform = parseTransform(jsonNode.targetToSourceTransform);

	function parseTransform(jsonNode) {
		return {
			rotation:    new THREE.Quaternion().fromArray(jsonNode.rotation),
			translation: new THREE.Vector3().fromArray(jsonNode.translation),
			scale:       jsonNode.scale
		};
	}

	function parseSynthConnectionEndpoint(jsonNode) {
		return {
			guid:        jsonNode.guid,
			sIndex:      jsonNode.sIndex,
			fovy:        jsonNode.intrinsics[0],
			aspectRatio: jsonNode.intrinsics[1],
			pose: {
				position:    new THREE.Vector3().fromArray(jsonNode.position),
				orientation: new THREE.Quaternion().fromArray(jsonNode.orientation)
			}
		};
	}

	function reverseTransform(transform) {
		var scaleInverse    = 1.0 / transform.scale;
		var rotationInverse = transform.rotation.clone().inverse();
		return {
			rotation:    rotationInverse,
			translation: transform.translation.clone().applyQuaternion(rotationInverse).multiplyScalar(-scaleInverse),
			scale:       scaleInverse,
		};
	}

	this.forward = new PS.Packet.SynthUnidirectionalConnectionTransform(this.source, this.target, this.targetToSourceTransform);
	this.reverse = new PS.Packet.SynthUnidirectionalConnectionTransform(this.target, this.source, reverseTransform(this.targetToSourceTransform));
};

PS.Packet.SynthUnidirectionalConnectionTransform = function(source, target, transform) {
	this.source      = source;
	this.target      = target;
	this.transform   = transform;

	//transform the pose of the target camera to be in the source synth (in the case of the forward transform)
	this.target.pose = this.transformPose(this.target.pose);
};

PS.Packet.SynthUnidirectionalConnectionTransform.prototype.transformPoint = function(point) {
	return point.clone().applyQuaternion(this.transform.rotation).multiplyScalar(this.transform.scale).add(this.transform.translation);
};

PS.Packet.SynthUnidirectionalConnectionTransform.prototype.transformPose = function(pose) {
	return {
		position:    this.transformPoint(pose.position),
		orientation: this.transform.rotation.clone().multiply(pose.orientation.clone())
	};
};
