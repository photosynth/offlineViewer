"use strict";

/* global PointBasedClusteredEntityCollection */

PS.SynthMapClusterLayer = new function() {

	var _map = null;
	var _options = {
		onInit: function() {},
		onMouseOverPin: function() {},
		onClusterClick: function() {},
		onPinClick: function() {}
	};

	var _mapClusterLayer = null;
	var _initialized = false;

	this.init = function(map, pathToClusterPlugin, options) {
		_map = map;
		PS.extend(_options, options);

		Microsoft.Maps.registerModule('PointBasedClusteringModule', pathToClusterPlugin);
		Microsoft.Maps.loadModule('PointBasedClusteringModule', {
			callback: function() {
				_mapClusterLayer = new PointBasedClusteredEntityCollection(_map, {
					clusterRadius: 70,
					singlePinCallback: createPin,
					clusteredPinCallback: createClusteredPin
				});
				_initialized = true;
				_options.onInit();
			}
		});
	};

	this.isInitialized = function() {
		return _initialized;
	};

	this.clear = function() {
		if (_mapClusterLayer) {
			_mapClusterLayer.SetData([]);
			_mapClusterLayer.SetOptions({}); //needed due to a bug in the clusterer code
		}
	};

	this.update = function(collections) {
		if (_mapClusterLayer) {
			_mapClusterLayer.SetData(collections);
		}
	};

	this.getDisplayedData = function() {
		if (_mapClusterLayer) {
			return _mapClusterLayer.GetDisplayedData();
		}
		else {
			return [];
		}
	};

	function createPin(data, clusterInfo) {

		var pin = new Microsoft.Maps.Pushpin(clusterInfo.center, {
			icon: 'images/cluster/1.png',
			width: 48,
			height: 48,
			anchor: new Microsoft.Maps.Point(29, 30) //29,30
		});
		pin.data = data;

		Microsoft.Maps.Events.addHandler(pin, 'mouseover', _options.onMouseOverPin);
		Microsoft.Maps.Events.addHandler(pin, 'click', _options.onPinClick);

		return pin;
	}

	function createClusteredPin(clusterInfo) {

		var pin = new Microsoft.Maps.Pushpin(clusterInfo.center, {
			icon: 'images/cluster/' + getClusterImage(clusterInfo.dataIndices.length),
			width: 48,
			height: 48,
			anchor: new Microsoft.Maps.Point(29, 30)
		});

		var collections = clusterInfo.dataIndices.map(function(index) { return _mapClusterLayer.GetDataByIndex(index); });

		Microsoft.Maps.Events.addHandler(pin, 'click', (function() {
			var c = collections;
			return function() {
				_options.onClusterClick(c);
			};
		})());

		return pin;
	}

	function getClusterImage(clusterSize) {
		if (clusterSize < 10) {
			return clusterSize + ".png";
		}
		else {
			var size = Math.min(Math.floor(clusterSize/10), 10);
			return size + "0+.png";
		}
	}
};
