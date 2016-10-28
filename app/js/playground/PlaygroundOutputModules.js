"use strict";

/* global _bingMapKey */
/* global hljs */
/* global vis */
/* global moment */

/*
	GalleryOutputModule
*/
PS.API.Playground.GalleryOutputModule = function() {};

PS.API.Playground.GalleryOutputModule.prototype.name = "gallery";

PS.API.Playground.GalleryOutputModule.prototype.createDOM = function() {
	var str = "";
	str += '<h3 output_type="gallery">Gallery</h3>';
	str += '<div output_type="gallery">';
	str += '	<div id="output-gallery-container"></div>';
	str += '</div>';

	return str;
};

PS.API.Playground.GalleryOutputModule.prototype.init = function() {};

PS.API.Playground.GalleryOutputModule.prototype.render = function(collections) {
	var galleryContainer = $("#output-gallery-container")[0];
	galleryContainer.innerHTML = "";
	collections.forEach(function(c) {

		var img = document.createElement("img");
		img.setAttribute("src", c.thumb);

		var a = document.createElement("a");
		a.className = "thumb";
		a.href = "https://photosynth.net/view/"+c.guid;
		a.title = c.name;
		a.appendChild(img);

		galleryContainer.appendChild(a);
	});
};

/*
	MapOutputModule
*/
PS.API.Playground.MapOutputModule = function() {};

PS.API.Playground.MapOutputModule.prototype.name = "map";

PS.API.Playground.MapOutputModule.prototype.createDOM = function() {
	var str = "";
	str += '<h3 output_type="map">Map</h3>';
	str += '<div output_type="map">';
	str += '	Location search: <input type="text" id="geo-browse-autocomplete" /> | <input type="button" value="Zoom out" id="geo-browse-zoom-out" /> <br />';
	str += '	<div id="geo-browse-map">';
	str += '	</div>';
	str += '</div>';

	return str;
};

PS.API.Playground.MapOutputModule.prototype.init = function() {
	var w = 600;
	var h = 400;

	$("#geo-browse-zoom-out").on("click", function() {
		PS.API.Playground.Maps.goHome(map);
	});

	var mapDiv = $("#geo-browse-map")[0];
	mapDiv.style.width  = w + "px";
	mapDiv.style.height = h + "px";

	var map = PS.API.Playground.Maps.create(mapDiv, w, h, 21.18675757882727, 3.3250458226141433, 1);

	PS.SynthMapClusterLayer.init(map, 'js/map/V7PointBasedClustering.js', {
		onPinClick: function() {
			var guid = this.target.data.guid;
			window.location.assign("https://photosynth.net/view/"+guid);
		},
		onClusterClick: function(collections) {
			PS.API.Playground.Maps.zoomTo(map, collections);
		}
	});

	PS.SynthMapAutoComplete.init(map, _bingMapKey, $('#geo-browse-autocomplete')[0]);
};

PS.API.Playground.MapOutputModule.prototype.render = function(collections) {
	var collectionsWithGeoTag = collections.filter(function(c) { return c.latitude && c.longitude;});

	PS.SynthMapClusterLayer.clear();
	PS.SynthMapClusterLayer.update(collectionsWithGeoTag);
};

/*
	CodeOutputModule
*/
PS.API.Playground.CodeOutputModule = function() {};

PS.API.Playground.CodeOutputModule.prototype.name = "code";

PS.API.Playground.CodeOutputModule.prototype.createDOM = function() {
	var str = "";
	str += '<h3 output_type="code">Code</h3>';
	str += '<div output_type="code">';
	str += '	Use PS.Progress for progress indication: <input type="checkbox" id="output-code-progress" checked=checked/>';
	str += '	<pre id="output-code-content">';
	str += '	</pre>';
	str += '	<p>If you want to implement it yourself, you need to use the route: <a href="" id="output-code-route"><a> (click to see corresponding query)</p>';
	str += '	<p>More information at: <a href="" id="output-code-information"><a></p>';
	str += '</div>';

	return str;
};

PS.API.Playground.CodeOutputModule.prototype.init = function(selector) {
	$("#output-code-progress").on("change", function() {
		selector.update();
	});
};

PS.API.Playground.CodeOutputModule.prototype.render = function(collections, parameters) {
	var useProgress = $("#output-code-progress")[0].checked;
	var pre = $("#output-code-content")[0];
	var info = PS.API.Playground.generateCode(parameters.input, useProgress, parameters);
	pre.innerHTML = info.code;
	var aRoute = $("#output-code-route")[0];
	var aInfo  = $("#output-code-information")[0];
	aRoute.innerHTML = info.urls.template;
	aRoute.href = info.urls.sample;
	aInfo.innerHTML = info.urls.doc;
	aInfo.href = info.urls.doc;
	hljs.highlightBlock(pre); //syntax highlighting
};

/*
	FileOutputModule
*/
PS.API.Playground.FileOutputModule = function() {};

PS.API.Playground.FileOutputModule.prototype.name = "textarea";

PS.API.Playground.FileOutputModule.prototype.createDOM = function() {
	var str = "";
	str += '<h3 output_type="textarea">File</h3>';
	str += '<div output_type="textarea">';
	str += '	Output format:';
	str += '	<select id="output-textarea-format">';
	str += '		<option value="json">json</option>';
	str += '		<option value="csv">csv</option>';
	str += '	</select> | ';
	str += '	Only geotagged ones: <input type="checkbox" id="output-textarea-geotag" /> |';
	str += '	<input type="button" value="download (chrome only)" class="download" id="output-textarea-download" /><br />';
	str += '	<textarea id="output-textarea-dump"></textarea>';
	str += '</div>';

	return str;
};

PS.API.Playground.FileOutputModule.prototype.init = function(selector) {
	$("#output-textarea-format").on("change", function() {
		selector.update();
	});

	$("#output-textarea-geotag").on("change", function() {
		selector.update();
	});

	$("#output-textarea-download").on("click", function() {
		var filename = "dump." + $("#output-textarea-format")[0].value;
		var content  = $("#output-textarea-dump")[0].value;

		var blob = new Blob([content], {
			type: "application/json"
		});
		var url = URL.createObjectURL(blob);

		var a = document.createElement('a');
		a.download = filename;
		a.href = url;
		a.click();
	});
};

PS.API.Playground.FileOutputModule.prototype.render = function(collections) {
	var onlyGeotagged = $("#output-textarea-geotag")[0].checked;
	if (onlyGeotagged) {
		collections = collections.filter(function(c) { return c.latitude && c.longitude;}); //only keep synth with geotag
	}
	if ($("#output-textarea-format")[0].value === "json") {
		$("#output-textarea-dump")[0].value = JSON.stringify(collections, null, '\t');
	}
	else {
		var str = "guid,";
		if (onlyGeotagged) {
			str += "latitude,longitude,zoomLevel,";
		}
		str += "title\n";
		collections.forEach(function(c) {
			str += c.guid + ",";
			if (onlyGeotagged) {
				str += c.latitude + "," + c.longitude + "," + c.zoomLevel + ",";
			}
			str += '"' + c.name.replace('"', '""') + '"';
			str += "\n";
		});
		$("#output-textarea-dump")[0].value = str;
	}
};

/*
	TimelineOutputModule
*/
PS.API.Playground.TimelineOutputModule = function() {};

PS.API.Playground.TimelineOutputModule.prototype.name = "timeline";

PS.API.Playground.TimelineOutputModule.prototype.createDOM = function() {
	var str = "";
	str += '<h3 output_type="timeline">Timeline</h3>';
	str += '<div output_type="timeline">';
	str += '	<p>Render with <select id="output-timeline-select"><option value="interactive">interactive</option><option value="list">list</option></select> timeline :</p>';
	str += '	<div id="output-timeline-interactive-container"></div>';
	str += '	<div id="output-timeline-static-container"></div>';
	str += '</div>';

	return str;
};

PS.API.Playground.TimelineOutputModule.prototype.init = function(selector) {
	$("#output-timeline-select").on("change", function() {
		selector.update();
	});
};

PS.API.Playground.TimelineOutputModule.prototype.render = function(collections) {

	var _that = this;

	collections.sort(function(a, b) { return b.date - a.date; }); //sort New -> Old

	var dynamicContainer = $("#output-timeline-interactive-container")[0];
	var staticContainer = $("#output-timeline-static-container")[0];

	if ($("#output-timeline-select")[0].value === "list") {
		dynamicContainer.style.display = "none";
		staticContainer.style.display = "block";
		staticContainer.innerHTML = "";
		var str = "<ul>";
		collections.forEach(function(c) {
			function padded(num) {
				return (num < 10) ? '0'+num : num;
			}
			//<li>DD/MM/YYYY: synth link</li>
			str += '<li>'+padded(c.date.getDate())+'/'+padded(c.date.getMonth()+1)+'/'+c.date.getFullYear()+': <a href="https://photosynth.net/view/'+c.guid+'">'+c.name+'<a></li>';
		});
		str += "</ul>";
		staticContainer.innerHTML = str;
	}
	else {
		staticContainer.style.display = "none";
		dynamicContainer.style.display = "block";

		if (_that.timeline) {
			_that.items.clear();
		}
		else {
			_that.items = new vis.DataSet({
				type: {start: 'ISODate', end: 'ISODate' }
			});
		}

		var synths = [];
		var min = Number.POSITIVE_INFINITY;
		var max = Number.NEGATIVE_INFINITY;
		for (var i=0; i<collections.length; ++i) {
			var c = collections[i];
			min = Math.min(min, c.date.getTime());
			max = Math.max(max, c.date.getTime());
			synths.push({
				id: i,
				content: '<a target="_blank" href="https://photosynth.net/view/'+c.guid+'">'+c.name+'</a>',
				start: c.date.getTime()
			});
		}
		_that.items.add(synths);

		if (!_that.timeline) {
			_that.timeline = new vis.Timeline(dynamicContainer, _that.items, {
				start: moment(min),
				end: moment(max),
				zoomMin: 1000 * 60 * 60 * 24,           // a day
				zoomMax: 1000 * 60 * 60 * 24 * 30 * 48, // 48 months
				maxHeight: '300px',
				height: '300px'
			});
		}
		else {
			//TODO: fix range on update
		}
	}
};
