"use strict";

/* global _bingMapKey */

PS.API.Playground.Maps = {};

PS.API.Playground.Maps.create = function(div, width, height, latitude, longitude, zoom) {
	return new Microsoft.Maps.Map(div, {
		credentials: _bingMapKey,
		enableSearchLogo: false,
		showDashboard: false,
		backgroundColor: new Microsoft.Maps.Color(255, 0, 0, 0),
		mapTypeId : Microsoft.Maps.MapTypeId.aerial, //road?
		center: new Microsoft.Maps.Location(latitude, longitude),
		zoom: zoom,
		width: width,
		height: height
	});
};

PS.API.Playground.Maps.goHome = function(map) {
	map.setView({latitude: 21.18675757882727, longitude: 3.3250458226141433, zoom: 1});
};

PS.API.Playground.Maps.drawCircle = function(map, latitude, longitude, radius) {
	//adapted from: http://pietschsoft.com/post/2008/02/09/Virtual-Earth-Draw-a-Circle-Radius-Around-a-LatLong-Point
	function toRadians(deg) {
		return deg*Math.PI / 180;
	}
	function toDegrees(rad) {
		return rad*180/Math.PI;
	}

	map.entities.clear();
	var earthRadius = 6367;
	var points = [];
	var lat = toRadians(latitude);
	var lon = toRadians(longitude);
	var d = radius / earthRadius; // d = angular distance covered on earth's surface
	for (var x = 0; x <= 2*Math.PI; x+= Math.PI/180) {
		var brng = x;
		var latRadians = Math.asin(Math.sin(lat) * Math.cos(d) + Math.cos(lat) * Math.sin(d) * Math.cos(brng));
		var lngRadians = lon + Math.atan2(Math.sin(brng) * Math.sin(d) * Math.cos(lat), Math.cos(d) - Math.sin(lat) * Math.sin(latRadians));
		points.push(new Microsoft.Maps.Location(toDegrees(latRadians), toDegrees(lngRadians)));
	}
	var polygon = new Microsoft.Maps.Polygon(points, {
		fillColor: new Microsoft.Maps.Color(40, 255, 255, 255),
		strokeColor: new Microsoft.Maps.Color(100, 0, 0, 0),
		strokeThickness: 2
	});
	map.entities.push(polygon);
};

PS.API.Playground.Maps.zoomTo = function(map, collections) {
	var locations = collections.map(function(c) { return new Microsoft.Maps.Location(c.latitude, c.longitude); });
	var bounds = Microsoft.Maps.LocationRect.fromLocations(locations);
	bounds.height *= 1.2;
	bounds.width  *= 1.2;

	if (bounds.width === 0) {
		var zoom = collections.map(function(c) { return c.zoomLevel; }).reduce(function(a,b) { return Math.min(a,b);});
		map.setView({center: bounds.center, zoom: zoom});
	}
	else {
		map.setView({bounds: bounds});
	}
};
