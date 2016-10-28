"use strict";

/* global _bingMapKey */

PS.API.Playground.getFilter = function() {
	var filters = [];
	if ($("#source-filter-ps1")[0].checked) {
		filters.push('Synths');
	}
	if ($("#source-filter-panorama")[0].checked) {
		filters.push('Panos');
	}
	if ($("#source-filter-ps2")[0].checked) {
		filters.push('SynthPackets');
	}

	if (filters.length === 0) {
		filters.push('None');
	}

	return filters.toString();
};

PS.API.Playground.getRequestDefaultOptions = function (outputSelector) {
	return {
		filter: PS.API.Playground.getFilter(), //remove this line to get all type of synths (including panoramas and ps1)
		maxItems: 300,
		onProgress: function(percent) {
			PS.Progress.set(percent);
		},
		onComplete: function(collections) {
			PS.Progress.done();
			outputSelector.setCollections(collections);
		}
	};
};

/*
	UserSynthsInputModule
*/
PS.API.Playground.UserSynthsInputModule = function() {};

PS.API.Playground.UserSynthsInputModule.prototype.name = "user_synths";

PS.API.Playground.UserSynthsInputModule.prototype.createDOM = function() {
	var str = "";
	str += '<h3 input_type="user_synths">Synths of one user</h3>';
	str += '<div input_type="user_synths">';
	str += '	<p>Username: <input type="text" value="dddexperiments" id="user-synths-username" /> (only public ones).</p>';
	str += '</div>';

	return str;
};

PS.API.Playground.UserSynthsInputModule.prototype.init = function(selector) {
	$("#user-synths-username").on("change", function() {
		selector.update();
	});
};

PS.API.Playground.UserSynthsInputModule.prototype.getCollections = function(outputSelector) {
	var username = $('#user-synths-username')[0].value;
	outputSelector.setInputParameters({
		username:  username,
		input: this.name
	});
	PS.API.getListOfUserSynth(username, PS.API.Playground.getRequestDefaultOptions(outputSelector));
};

/*
	FavoriteSynthsOfUserInputModule
*/
PS.API.Playground.FavoriteSynthsOfUserInputModule = function() {};

PS.API.Playground.FavoriteSynthsOfUserInputModule.prototype.name = "favorite_user_synths";

PS.API.Playground.FavoriteSynthsOfUserInputModule.prototype.createDOM = function() {
	var str = "";
	str += '<h3 input_type="favorite_user_synths">Favorite synths of one user</h3>';
	str += '<div input_type="favorite_user_synths">';
	str += '	<p>Username: <input type="text" value="ps2-hero" id="favorite-user-synths-username" /><br /><br />FYI favorite synths of ps2-hero are the heros synths (the ones displayed on the home page)</p>';
	str += '</div>';

	return str;
};

PS.API.Playground.FavoriteSynthsOfUserInputModule.prototype.init = function(selector) {
	$("#favorite-user-synths-username").on("change", function() {
		selector.update();
	});
};

PS.API.Playground.FavoriteSynthsOfUserInputModule.prototype.getCollections = function(outputSelector) {
	var username = $('#favorite-user-synths-username')[0].value;
	outputSelector.setInputParameters({
		username:  username,
		input: this.name
	});
	PS.API.getListOfFavoriteUserSynth(username, PS.API.Playground.getRequestDefaultOptions(outputSelector));
};

/*
	MostRecentSynthsInputModule
*/
PS.API.Playground.MostRecentSynthsInputModule = function() {};

PS.API.Playground.MostRecentSynthsInputModule.prototype.name = "most_recent_synths";

PS.API.Playground.MostRecentSynthsInputModule.prototype.createDOM = function() {
	var str = "";
	str += '<h3 input_type="most_recent_synths">Most recent synths</h3>';
	str += '<div input_type="most_recent_synths">';
	str += '	<p>There is a bug in the REST API right now so the synths returned by this input don\'t have any geotag information. Thus it\'s not possible to plot them on a map.</p>';
	str += '</div>';

	return str;
};

PS.API.Playground.MostRecentSynthsInputModule.prototype.init = function() {};

PS.API.Playground.MostRecentSynthsInputModule.prototype.getCollections = function(outputSelector) {
	outputSelector.setInputParameters({
		input: this.name
	});
	PS.API.getListOfMostRecentSynths(PS.API.Playground.getRequestDefaultOptions(outputSelector));
};

/*
	MostFavoriteInputModule
*/
PS.API.Playground.MostFavoriteInputModule = function() {};

PS.API.Playground.MostFavoriteInputModule.prototype.name = "most_favorite_synths";

PS.API.Playground.MostFavoriteInputModule.prototype.createDOM = function() {
	var str = "";
	str += '<h3 input_type="most_favorite_synths">Most favorite synths</h3>';
	str += '<div input_type="most_favorite_synths">';
	str += '	Time filter:';
	str += '	<select id="most_favorite_synths_time_filter">';
	str += '		<option value="Last7Days">Last7Days</option>';
	str += '		<option value="Last30Days">Last30Days</option>';
	str += '		<option value="AllTime">AllTime</option>';
	str += '	</select> |';
	str += '	order:';
	str += '	<select id="most_favorite_synths_order">';
	str += '		<option value="Favorites">Favorites</option>';
	str += '		<option value="Views">Views</option>';
	str += '	</select> <br />';
	str += '	<p>There is a bug in the REST API right now so the synths returned by this input don\'t have any geotag information. Thus it\'s not possible to plot them on a map.</p>';
	str += '</div>';

	return str;
};

PS.API.Playground.MostFavoriteInputModule.prototype.init = function(selector) {
	$("#most_favorite_synths_time_filter").on("change", function() {
		selector.update();
	});

	$("#most_favorite_synths_order").on("change", function() {
		selector.update();
	});
};

PS.API.Playground.MostFavoriteInputModule.prototype.getCollections = function(outputSelector) {
	var defaultOptions = PS.extend({}, PS.API.Playground.getRequestDefaultOptions(outputSelector)); //copy
	var timeFilter = $("#most_favorite_synths_time_filter")[0].value;
	var order      = $("#most_favorite_synths_order")[0].value;

	outputSelector.setInputParameters({
		timeFilter: timeFilter,
		order: order,
		input: this.name
	});
	PS.API.getListOfMostFavoriteSynths(PS.extend(defaultOptions, {
		timeFilter: timeFilter,
		order: order
	}));
};

/*
	TextSearchInputModule
*/

PS.API.Playground.TextSearchInputModule = function() {};

PS.API.Playground.TextSearchInputModule.prototype.name = "text_search_synths";

PS.API.Playground.TextSearchInputModule.prototype.createDOM = function() {
	var str = "";
	str += '<h3 input_type="text_search_synths">Text search</h3>';
	str += '<div input_type="text_search_synths">';
	str += '	<input type="text" id="text_search_synths_text" value="paris" /> <input type="button" value="Search" id="text_search_synths_search" /> | ';
	str += '	Sort these results by : ';
	str += '	<select id="text_search_synths_sort">';
	str += '		<option value="BestMatch">Best match</option>';
	str += '		<option value="BestSynth">Best synth</option>';
	str += '		<option value="DateAdded">Date added</option>';
	str += '		<option value="NumberOfViews">Number of views</option>';
	str += '		<option value="CreatedBy">Created by</option>';
	str += '	</select>';
	str += '	<select id="text_search_synths_ordering">';
	str += '		<option value="Descending">Desc</option>';
	str += '		<option value="Ascending">Asc</option>';
	str += '	</select>';
	str += '</div>';

	return str;
};

PS.API.Playground.TextSearchInputModule.prototype.init = function(selector) {
	$("#text_search_synths_text").on("change", function() {
		selector.update();
	});
	$("#text_search_synths_search").on("click", function() {
		selector.update();
	});
	$("#text_search_synths_sort").on("change", function() {
		selector.update();
	});
	$("#text_search_synths_ordering").on("change", function() {
		selector.update();
	});
};

PS.API.Playground.TextSearchInputModule.prototype.getCollections = function(outputSelector) {
	var text     = $("#text_search_synths_text")[0].value;
	var sort     = $("#text_search_synths_sort")[0].value;
	var ordering = $("#text_search_synths_ordering")[0].value;
	outputSelector.setInputParameters({
		input: this.name,
		text: text,
		sort: sort,
		ordering: ordering
	});
	PS.API.textSearchForSynths(text, PS.extend(PS.API.Playground.getRequestDefaultOptions(outputSelector), {
		ordering: ordering,
		sort: sort
	}));
};

/*
	SynthsInGeoBBoxInputModule
*/
PS.API.Playground.SynthsInGeoBBoxInputModule = function() {};

PS.API.Playground.SynthsInGeoBBoxInputModule.prototype.name = "geo_bbox_synths";

PS.API.Playground.SynthsInGeoBBoxInputModule.prototype.createDOM = function() {
	var str = "";
	str += '<h3 input_type="geo_bbox_synths">Synths inside a geo bounding box</h3>';
	str += '<div input_type="geo_bbox_synths">';
	str += '	Location search: <input type="text" id="geo-bbox-autocomplete" /> | <input type="button" value="Zoom out" id="geo-bbox-zoom-out" /> | <strong>move the map to define the bouding box (= viewing region)</strong><br />';
	str += '	<div id="geo-bbox-map">';
	str += '	</div>';
	str += '</div>';

	return str;
};

PS.API.Playground.SynthsInGeoBBoxInputModule.prototype.init = function(selector) {
	var _that = this;

	var w = 600;
	var h = 400;

	$("#geo-bbox-zoom-out").on("click", function() {
		PS.API.Playground.Maps.goHome(_that.map);
	});

	var mapDiv = $("#geo-bbox-map")[0];
	mapDiv.style.width  = w + "px";
	mapDiv.style.height = h + "px";

	_that.map = PS.API.Playground.Maps.create(mapDiv, w, h, 47.61735201453729, -122.28048211490592, 12);
	Microsoft.Maps.Events.addHandler(_that.map, 'viewchangeend', function() {
		_that.bounds = _that.map.getBounds();
		if (selector.getCurrent() === _that.name) {
			selector.update();
		}
	});

	PS.SynthMapAutoComplete.init(_that.map, _bingMapKey, $('#geo-bbox-autocomplete')[0]);
};

PS.API.Playground.SynthsInGeoBBoxInputModule.prototype.getCollections = function(outputSelector) {
	var b = this.bounds;
	outputSelector.setInputParameters({
		bounds: b,
		input: this.name
	});
	PS.API.getNearestSynthsByBBox(b.getSouth(), b.getWest(), b.getNorth(), b.getEast(), PS.API.Playground.getRequestDefaultOptions(outputSelector));
};

/*
	SynthsInGeoRadiusInputModule
*/
PS.API.Playground.SynthsInGeoRadiusInputModule = function() {};

PS.API.Playground.SynthsInGeoRadiusInputModule.prototype.name = "geo_radius_synths";

PS.API.Playground.SynthsInGeoRadiusInputModule.prototype.createDOM = function() {
	var str = "";
	str += '<h3 input_type="geo_radius_synths">Synths within a distance of a geo point</h3>';
	str += '<div  input_type="geo_radius_synths">';
	str += '	Location search: <input type="text" id="geo-radius-autocomplete" /> | <input type="button" value="Zoom out" id="geo-radius-zoom-out" /> | radius: <input type="range" value="2" min="1" max="100" step="1" id="geo-radius-slider" /> (<span id="geo-radius-value">2</span> km) | <strong>right-click to redefine center of search</strong> <br />';
	str += '	<div id="geo-radius-map">';
	str += '	</div>';
	str += '</div>';

	return str;
};

PS.API.Playground.SynthsInGeoRadiusInputModule.prototype.init = function(selector) {
	var _that = this;

	var w = 600;
	var h = 400;

	$("#geo-radius-slider").on("change", function() {
		$("#geo-radius-value")[0].innerHTML = this.value;
		_that.radius = this.value;
		PS.API.Playground.Maps.drawCircle(_that.map, _that.center.latitude, _that.center.longitude, _that.radius);
		selector.update();
	});

	$("#geo-radius-zoom-out").on("click", function() {
		PS.API.Playground.Maps.goHome(_that.map);
	});

	_that.radius = 18;
	_that.center = {latitude: 41.89863358616264, longitude: 12.496442794799796};

	var mapDiv = $("#geo-radius-map")[0];
	mapDiv.style.width  = w + "px";
	mapDiv.style.height = h + "px";

	_that.map = PS.API.Playground.Maps.create(mapDiv, w, h, 41.856817926958755, 12.515919832359854, 8);
	PS.API.Playground.Maps.drawCircle(_that.map, _that.center.latitude, _that.center.longitude, _that.radius);
	$("#geo-radius-value")[0].innerHTML = _that.radius;

	Microsoft.Maps.Events.addHandler(_that.map, 'rightclick', function(e) {
		e.originalEvent.preventDefault();
		var point = new Microsoft.Maps.Point(e.getX(), e.getY());
		var loc = e.target.tryPixelToLocation(point);
		_that.center = {latitude: loc.latitude, longitude: loc.longitude};
		PS.API.Playground.Maps.drawCircle(_that.map, _that.center.latitude, _that.center.longitude, _that.radius);
		selector.update();
	});

	PS.SynthMapAutoComplete.init(_that.map, _bingMapKey, $('#geo-radius-autocomplete')[0]);
};

PS.API.Playground.SynthsInGeoRadiusInputModule.prototype.getCollections = function(outputSelector) {
	var _that = this;

	var defaultOptions = PS.extend({}, PS.API.Playground.getRequestDefaultOptions(outputSelector));
	outputSelector.setInputParameters({
		latitude: _that.center.latitude,
		longitude: _that.center.longitude,
		radius: _that.radius,
		input: this.name
	});
	PS.API.getNearestSynthsByRadius(_that.center.latitude, _that.center.longitude, PS.extend(defaultOptions, {
		radius: _that.radius,
	}));
};
