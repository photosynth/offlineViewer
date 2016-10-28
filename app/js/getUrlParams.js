"use strict";

/* exported getUrlParams */

function getUrlParams() {
	var result = {};
	var params = (window.location.search.split('?')[1] || '').split('&');
	for(var param in params) {
		if (params.hasOwnProperty(param)) {
			var paramParts = params[param].split('=');
			result[paramParts[0]] = decodeURIComponent(paramParts[1] || "");
		}
	}
	return result;
}
