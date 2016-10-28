"use strict";

PS.SynthMapAutoComplete = new function() {
	this.init = function(map, key, input) {
		$(input).autocomplete({
			source: function (request, response) {
				$.ajax({
					url: "https://dev.virtualearth.net/REST/v1/Locations",
					dataType: "jsonp",
					data: {
						key: key,
						q: request.term
					},
					jsonp: "jsonp",
					success: function (data) {
						var result = data.resourceSets[0];
						if (result) {
							if (result.estimatedTotal > 0) {
								response($.map(result.resources, function (item) {
									return {
										data: item,
										label: item.name + ' (' + item.address.countryRegion + ')',
										value: item.name
									};
								}));
							}
						}
					}
				});
			},
			minLength: 3,
			change: function (event, ui) {
				if (!ui.item) {
					$("#searchBox").val('');
				}
			},
			select: function (event, ui) {
				var data = ui.item.data;
				var bbox  = data.bbox;

				var northwest = new Microsoft.Maps.Location(bbox[0], bbox[1]);
				var southeast = new Microsoft.Maps.Location(bbox[2], bbox[3]);

				var viewRect = Microsoft.Maps.LocationRect.fromCorners(northwest, southeast);
				viewRect.height *= 1.2;
				viewRect.width  *= 1.2;
				map.setView({bounds: viewRect});
			}
		});
	};
};
