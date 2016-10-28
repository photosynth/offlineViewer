"use strict";

/* global PhotosynthRml */
/* global RwwViewer */
/* global MathHelper */
/* global PhotosynthTileSource */

Photosynth.StitchedPanoViewer = function(div, options) {

	var _viewer;
	var _options = {
		guid: "",
		url: "",
	};
	PS.extend(_options, options);

	var _that = this;
	var _container = div;

	this.loadGuid = function(guid) {
		PS.API.getMedia(guid, function(collection) {
			if (collection && collection.type === "Panorama") {
				PhotosynthRml.createFromJsonUri(collection.url, function (rml) {
					if (rml !== null) {
						loadRml(rml);
					}
				});
			}
			else {
				console.error("'"+guid+"' is not a valid panorama guid");
			}
		});
	};

	this.load = function(pathToLocalDotPano) {

		PS.Utils.Request(pathToLocalDotPano+"formats/cubemap/cubemap.json", {
			onComplete: function(xhr) {

				var json = JSON.parse(xhr.responseText);
				json.atlas_image = pathToLocalDotPano + "formats/cubemap/atlas.jpg";
				json.rootPath = pathToLocalDotPano;

				var rml = createRmlFromDotPanoJson(json);
				if (rml) {
					loadRml(rml);
				}
			}
		});
	};

	function loadRml(rml) {
		_viewer = new RwwViewer(_container, {
			rml: rml,
			renderer: 'default' //css, webgl
		});
	}

	function createRmlFromDotPanoJson(json) {

		if (json.cubemap_json_version && json.cubemap_json_version < 2.0) {

			//If null or undefined, defaults to 1.  Only 0 if explicitly set to false.
			var tileOverlap = 1;
			if (json.tile_overlap_borders) {
				tileOverlap = json.tile_overlap_borders + 0;
			}
			else if (json.tile_overlaps_borders) {
				tileOverlap = json.tile_overlaps_borders + 0;
			}

			tileOverlap = (json.tile_overlap_borders === false) ? 0 : 1;

			var tileSize   = json.tile_size || 510; // Default to 510 unless otherwise specified per spec.
			var atlasImage = json.atlas_image;
			var faceSize   = json.face_size;
			var rml = {
				id: 'panorama',
				type: 'panorama',
				source: {
					'attribution': { //TODO: parse from XML in .pano folder
						'author':         undefined,
						'attributionUrl': undefined,
						'licenseUrl': "http://creativecommons.org/licenses/by/3.0/"
					},
					'dimension':   faceSize,
					'tileSize':    tileSize,
					'tileOverlap': tileOverlap,
					'tileBorder':  tileOverlap,
					'minimumLod': (atlasImage !== null) ? 7 : 8,
					'bounds': { //default values here, in case they're not specified
						'left':   0,
						'right':  MathHelper.twoPI,
						'top':   -MathHelper.halfPI,
						'bottom': MathHelper.halfPI
					},
					'startingPitch':        0,
					'startingHeading':      0,
					'projectorAspectRatio': 1,
					'projectorFocalLength': 0.5,
					'atlasImage': json.atlas_image
				}
			};

			if (json.field_of_view_bounds) {
				rml.source.bounds = {
					'left':   Math.PI-MathHelper.degreesToRadians(json.field_of_view_bounds[0]), //TODO: check this
					'right':  MathHelper.degreesToRadians(json.field_of_view_bounds[1]),
					'top':    MathHelper.degreesToRadians(json.field_of_view_bounds[2]),
					'bottom': MathHelper.degreesToRadians(json.field_of_view_bounds[3])
				};
			}

			if (json.orientation) {
				rml.source.startingPitch   = -json.orientation[0]; //TODO: check this
				rml.source.startingHeading =  json.orientation[1];
			}

			for (var i=0; i<PhotosynthRml.faceNames.length; ++i) {
				var faceName = PhotosynthRml.faceNames[i];
				var face = json[faceName];
				if (face !== null) {

					var clip;
					if (face.tile_boundaries) {
						var tileBoundaries = face.tile_boundaries;
						clip = [
							tileBoundaries.left,  tileBoundaries.top,
							tileBoundaries.left,  tileBoundaries.bottom,
							tileBoundaries.right, tileBoundaries.bottom,
							tileBoundaries.right, tileBoundaries.top
						];
					}
					else {
						clip = [
							0,               0,
							0,        faceSize,
							faceSize, faceSize,
							faceSize,        0
						];
					}

					rml.source[faceName + 'Face'] = {
						tileSource: (new PhotosynthTileSource(json.rootPath + 'formats/cubemap/' + faceName + "/", rml.source.atlasImage)).getTileUrl,
						clip: clip
					};
				}
			}
			rml.source.highlights = null;

			return rml;
		}
		else {
			return null;
		}
	}

	if (_options.guid) {
		_that.loadGuid(_options.guid);
	}
	else if (_options.url) {
		_that.load(_options.url);
	}
};
