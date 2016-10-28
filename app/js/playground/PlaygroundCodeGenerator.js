"use strict";

PS.API.Playground.generateCode = function(input, useProgress, parameters) {

	var _maxItems = 300;
	var _numRows  = 100;

	var str = '';
	var urls = {};

	if (input === PS.API.Playground.UserSynthsInputModule.prototype.name) {

		if (useProgress) {
			str += 'PS.Progress.Init();\n';
			str += '\n';
		}
			str += 'var username = "'+parameters.username+'";\n';
			str += '\n';
			str += 'PS.API.getListOfUserSynth(username, {\n';
			str += '	filter: "'+PS.API.Playground.getFilter()+'",\n';
			str += '	maxItems: '+_maxItems+',\n';
		if (useProgress) {
			str += '	onProgress: function(percent) {\n';
			str += '		PS.Progress.set(percent);\n';
			str += '	},\n';
		}
			str += '	onComplete: function(collections) {\n';
		if (useProgress) {
			str += '		PS.Progress.done();\n';
		}
			str += '		console.log(collections);\n';
			str += '	}\n';
			str += '});\n';
			urls = {
				template: PS.API.getRootUrl()+'users/{username}/media?numRows='+_numRows+'&offset=0&collectionTypeFilter={filter}',
				sample: PS.API.getRootUrl()+'users/'+parameters.username+'/media?numRows='+_numRows+'&offset=0&collectionTypeFilter='+PS.API.Playground.getFilter()+'',
				doc: 'https://photosynth.net/api/docs/restapi.html#OP_Users.MediaAll'
			};
	}
	else if (input === PS.API.Playground.FavoriteSynthsOfUserInputModule.prototype.name) {

		if (useProgress) {
			str += 'PS.Progress.Init();\n';
			str += '\n';
		}
			str += 'var username = "'+parameters.username+'";\n';
			str += '\n';
			str += 'PS.API.getListOfFavoriteUserSynth(username, {\n';
			str += '	filter: "'+PS.API.Playground.getFilter()+'",\n';
			str += '	maxItems: '+_maxItems+',\n';
		if (useProgress) {
			str += '	onProgress: function(percent) {\n';
			str += '		PS.Progress.set(percent);\n';
			str += '	},\n';
		}
			str += '	onComplete: function(collections) {\n';
		if (useProgress) {
			str += '		PS.Progress.done();\n';
		}
			str += '		console.log(collections);\n';
			str += '	}\n';
			str += '});\n';
			urls = {
				template: PS.API.getRootUrl()+'users/{username}/favorites?numRows='+_numRows+'&offset=0&collectionTypeFilter={filter}',
				sample: PS.API.getRootUrl()+'users/'+parameters.username+'/favorites?numRows='+_numRows+'&offset=0&collectionTypeFilter='+PS.API.Playground.getFilter()+'',
				doc: 'https://photosynth.net/api/docs/restapi.html#OP_Users.GetFavorites'
			};
	}
	else if (input === PS.API.Playground.MostRecentSynthsInputModule.prototype.name) {

		if (useProgress) {
			str += 'PS.Progress.Init();\n';
			str += '\n';
		}
			str += 'PS.API.getListOfMostRecentSynths({\n';
			str += '	filter: "'+PS.API.Playground.getFilter()+'",\n';
			str += '	maxItems: '+_maxItems+',\n';
		if (useProgress) {
			str += '	onProgress: function(percent) {\n';
			str += '		PS.Progress.set(percent);\n';
			str += '	},\n';
		}
			str += '	onComplete: function(collections) {\n';
		if (useProgress) {
			str += '		PS.Progress.done();\n';
		}
			str += '		console.log(collections);\n';
			str += '	}\n';
			str += '});\n';
			urls = {
				template: PS.API.getRootUrl()+'media/explore/?numRows='+_numRows+'&offset=0&collectionTypeFilter={filter}&order=Date',
				sample: PS.API.getRootUrl()+'media/explore/?numRows='+_numRows+'&offset=0&collectionTypeFilter='+PS.API.Playground.getFilter()+'&order=Date',
				doc: 'https://photosynth.net/api/docs/restapi.html#OP_Medias.ExploreMedia'
			};
	}
	else if (input === PS.API.Playground.MostFavoriteInputModule.prototype.name) {

		if (useProgress) {
			str += 'PS.Progress.Init();\n';
			str += '\n';
		}
			str += 'PS.API.getListOfMostFavoriteSynths({\n';
			str += '	filter: "'+PS.API.Playground.getFilter()+'",\n';
			str += '	maxItems: '+_maxItems+',\n';
			str += '	timeFilter: "'+parameters.timeFilter+'",\n';
			str += '	order: "'+parameters.order+'",\n';
		if (useProgress) {
			str += '	onProgress: function(percent) {\n';
			str += '		PS.Progress.set(percent);\n';
			str += '	},\n';
		}
			str += '	onComplete: function(collections) {\n';
		if (useProgress) {
			str += '		PS.Progress.done();\n';
		}
			str += '		console.log(collections);\n';
			str += '	}\n';
			str += '});\n';
			urls = {
				template: PS.API.getRootUrl()+'media/explore/?numRows='+_numRows+'&offset=0&&collectionTypeFilter={filter}&order={OrderBy}&time={TimeFilter}',
				sample: PS.API.getRootUrl()+'media/explore/?numRows='+_numRows+'&offset=0&&collectionTypeFilter='+PS.API.Playground.getFilter()+'&order='+parameters.order+'&time='+parameters.timeFilter,
				doc: 'https://photosynth.net/api/docs/restapi.html#OP_Medias.ExploreMedia'
			};
	}
	else if (input === PS.API.Playground.SynthsInGeoBBoxInputModule.prototype.name) {

		if (useProgress) {
			str += 'PS.Progress.Init();\n';
			str += '\n';
		}
			var b = parameters.bounds;
			str += 'PS.API.getNearestSynthsByBBox('+b.getSouth()+', '+b.getWest()+', '+b.getNorth()+', '+b.getEast()+', { //south, west, north, east\n';
			str += '	filter: "'+PS.API.Playground.getFilter()+'",\n';
			str += '	maxItems: '+_maxItems+',\n';
		if (useProgress) {
			str += '	onProgress: function(percent) {\n';
			str += '		PS.Progress.set(percent);\n';
			str += '	},\n';
		}
			str += '	onComplete: function(collections) {\n';
		if (useProgress) {
			str += '		PS.Progress.done();\n';
		}
			str += '		console.log(collections);\n';
			str += '	}\n';
			str += '});\n';
			urls = {
				template: PS.API.getRootUrl()+'search/bbox/?numRows='+_numRows+'&offset=0&collectionTypeFilter={filter}&slat={SouthLatitude}&wlon={WestLongitude}&nlat={NorthLatitude}&elon={EastLongitude}',
				sample: PS.API.getRootUrl()+'search/bbox/?numRows='+_numRows+'&offset=0&collectionTypeFilter='+PS.API.Playground.getFilter()+'&slat='+b.getSouth()+'&wlon='+b.getWest()+'&nlat='+b.getNorth()+'&elon='+b.getEast(),
				doc: 'https://photosynth.net/api/docs/restapi.html#OP_Search.SearchBoundingBox'
			};
	}
	else if (input === PS.API.Playground.SynthsInGeoRadiusInputModule.prototype.name) {

		if (useProgress) {
			str += 'PS.Progress.Init();\n';
			str += '\n';
		}
			str += 'PS.API.getNearestSynthsByRadius('+parameters.latitude+', '+parameters.longitude+', { //latitude, longitude\n';
			str += '	filter: "'+PS.API.Playground.getFilter()+'",\n';
			str += '	maxItems: '+_maxItems+',\n';
			str += '	radius: '+parameters.radius+', //in km\n';
		if (useProgress) {
			str += '	onProgress: function(percent) {\n';
			str += '		PS.Progress.set(percent);\n';
			str += '	},\n';
		}
			str += '	onComplete: function(collections) {\n';
		if (useProgress) {
			str += '		PS.Progress.done();\n';
		}
			str += '		console.log(collections);\n';
			str += '	}\n';
			str += '});\n';
			urls = {
				template: PS.API.getRootUrl()+'search/nearby/?numRows='+_numRows+'&offset=0&collectionTypeFilter={filter}&lat={Latitude}&lon={Longitude}&radius={radiusInKM}',
				sample: PS.API.getRootUrl()+'search/nearby/?numRows='+_numRows+'&offset=0&collectionTypeFilter='+PS.API.Playground.getFilter()+'&lat='+parameters.latitude+'&lon='+parameters.longitude+'&radius='+parameters.radius,
				doc: 'https://photosynth.net/api/docs/restapi.html#OP_Search.SearchNearby'
			};
	}
	else if (input === PS.API.Playground.TextSearchInputModule.prototype.name) {

		if (useProgress) {
			str += 'PS.Progress.Init();\n';
			str += '\n';
		}
			str += 'PS.API.textSearchForSynths("'+parameters.text+'", {\n';
			str += '	filter: "'+PS.API.Playground.getFilter()+'",\n';
			str += '	maxItems: '+_maxItems+',\n';
			str += '	sort: "'+parameters.sort+'",\n';
			str += '	ordering: "'+parameters.ordering+'",\n';
		if (useProgress) {
			str += '	onProgress: function(percent) {\n';
			str += '		PS.Progress.set(percent);\n';
			str += '	},\n';
		}
			str += '	onComplete: function(collections) {\n';
		if (useProgress) {
			str += '		PS.Progress.done();\n';
		}
			str += '		console.log(collections);\n';
			str += '	}\n';
			str += '});\n';
			urls = {
				template: PS.API.getRootUrl()+'search/?numRows='+_numRows+'&offset=0&collectionTypeFilter={filter}&sortby={sortcriteria}&orderby={ordering}&q={text query}',
				sample: PS.API.getRootUrl()+'search/?numRows='+_numRows+'&offset=0&collectionTypeFilter='+PS.API.Playground.getFilter()+'&sortby='+parameters.sort+'&orderby='+parameters.ordering+'&q='+encodeURI(parameters.text),
				doc: 'https://photosynth.net/api/docs/restapi.html#OP_Search.SearchKeywords2'
			};
	}

	return {
		code: str,
		urls: urls
	};

};
