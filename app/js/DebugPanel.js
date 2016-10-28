"use strict";

PS.DebugPanel = new function() {

	var _contentDiv;
	var _div;
	var _that = this;

	this.init = function() {
		if (_div) {
			return;
		}
		else {
			_div = document.createElement("div");
			_div.className = "PSDebugPannel";
			_div.style.borderRadius = "20px";
			_div.style.padding = "20px";
			_div.style.position = "absolute";
			_div.style.bottom = "10px";
			_div.style.left = "10px";
			_div.style.zIndex = 5;
			_div.style.backgroundColor = "white";
			_div.style.border = "1px solid black";
			_div.style.boxShadow = "5px 5px 10px rgba(0, 0, 0, 0.5)";

			_contentDiv = document.createElement("div");
			var exitDiv = document.createElement("div");
			exitDiv.innerHTML = "x";
			exitDiv.style.position = "absolute";
			exitDiv.style.top = "4px";
			exitDiv.style.right = "10px";
			exitDiv.style.cursor = "pointer";
			exitDiv.style.fontWeight = "bold";
			exitDiv.style.fontFamily = "Arial";
			_div.appendChild(exitDiv);
			_div.appendChild(_contentDiv);
			_div.addEventListener("click", function() {
				_that.setVisible(false);
			}, false);
			document.body.appendChild(_div);
		}
		_that.setVisible(false);
	};

	this.setVisible = function(visible) {
		if (_div) {
			_div.style.display = visible ? "block" : "none";
		}
	};

	this.setContent = function(content) {
		_that.setVisible(true);
		if (_div) {
			_div.innerHTML = content;
		}
	};

	this.appendContent = function(content) {
		_that.setVisible(true);
		if (_div) {
			_div.innerHTML += content;
		}
	};
};
