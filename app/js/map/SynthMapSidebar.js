"use strict";

PS.SynthMapSidebar = new function() {

	var _nbItems = 0;
	var _visibleCollections = [];

	var _mapSidebarDiv;
	var _visibleCollectionsDiv;

	var _options = {
		onMouseOverPS2: function() {},
		onMouseOutPS2: function() {}
	};

	this.init = function(div, options) {
		PS.extend(_options, options);
		_mapSidebarDiv = div;
		_visibleCollectionsDiv = div.getElementsByClassName("visible-collections")[0];

		_mapSidebarDiv.addEventListener("scroll", function() {

			var maxScrolling     = _mapSidebarDiv.scrollHeight - _mapSidebarDiv.offsetHeight;
			var currentScrolling = _mapSidebarDiv.scrollTop;
			var scrollingPercent = currentScrolling/maxScrolling;

			if (scrollingPercent > 0.7) {
				if (_nbItems !== _visibleCollections.length) {
					addCollections(10);
				}
			}

		}, false);

	};

	this.update = function(visibleCollections) {
		visibleCollections.sort(function(a, b) { return b.date - a.date; }); //sort NEW -> OLD

		var rowHeight = 166; //in px
		var nbItemsToNeedScrollbar = (Math.ceil(window.innerHeight/rowHeight)+1)*2;
		var nbItems = Math.min(nbItemsToNeedScrollbar, visibleCollections.length);

		//reset
		_visibleCollections = visibleCollections;
		_visibleCollectionsDiv.innerHTML = "";
		_nbItems = 0;
		_mapSidebarDiv.scrollTop = 0;

		addCollections(nbItems);
	};

	this.onMouseOverPS2 = function(guid) {
		_options.onMouseOverPS2(guid);
	};

	this.onMouseOutPS2 = function() {
		_options.onMouseOutPS2();
	};

	this.onMouseClickPS2 = function(guid, zoom) {
		_options.onMouseClickPS2(guid, zoom);
	};

	function addCollections(nbItems) {

		var end = Math.min(_visibleCollections.length, _nbItems+nbItems);

		var str = "";
		for (var i=_nbItems; i<end; ++i) {
			var collection = _visibleCollections[i];

			var title = collection.name.length > 17 ? collection.name.substr(0, 16) + "..." : collection.name;

			str +='<div class="collection" onmouseover="PS.SynthMapSidebar.onMouseOverPS2(\''+collection.guid+'\')" PS.SynthMapSidebar.onmouseout="onMouseOutPS2()">';
			str +='<div class="type">'+collection.topology+'</div>';
			str +='<div class="title" title="'+collection.name+'">'+title+'</div>';
			str +='<img title="'+collection.name+'" src="'+collection.thumb+'" onclick="PS.SynthMapSidebar.onMouseClickPS2(\''+collection.guid+'\', '+collection.zoomLevel+')"/>';
			str +='</div>';
		}
		_visibleCollectionsDiv.innerHTML += str;

		_nbItems += end-_nbItems;
	}

};
