"use strict";

PS.API.Playground = {};

PS.API.Playground.InputSelector = function(div) {
	var _that    = this;
	var _div     = div;
	var _modules = [];
	var _moduleNameMap = {};
	var _currentInput;
	var _outputSelector;

	this.addModule = function(module) {
		_div.innerHTML += module.createDOM();
		_modules.push(module);
	};

	this.buildDOM = function() {
		_currentInput = _modules[0].name;

		_modules.forEach(function(m) { m.init(_that); });
		_modules.forEach(function(m) { _moduleNameMap[m.name] = m; });

		$("#input-selector").accordion({
			heightStyle: "content",
			activate: function(event, ui) {
				_currentInput = ui.newHeader[0].getAttribute("input_type");
				_that.update();
			}
		});
	};

	this.update = function() {
		_moduleNameMap[_currentInput].getCollections(_outputSelector);
	};

	this.getCurrent = function() {
		return _currentInput;
	};

	this.init = function(outputSelector) {
		_outputSelector = outputSelector;
		_that.update();
		$("#source-filter-ps1").on("change", function() {
			_that.update();
		});
		$("#source-filter-panorama").on("change", function() {
			_that.update();
		});
		$("#source-filter-ps2").on("change", function() {
			_that.update();
		});
	};

	this.getCurrentModule = function() {
		return _moduleNameMap[_currentInput];
	};
};

PS.API.Playground.OutputSelector = function(div) {
	var _that = this;
	var _div = div;
	var _modules = [];
	var _moduleNameMap = {};
	var _currentOutput;
	var _collections = [];
	var _parameters = {};

	this.addModule = function(module) {
		_div.innerHTML += module.createDOM();
		_modules.push(module);
	};

	this.buildDOM = function() {
		_currentOutput = _modules[0].name;

		_modules.forEach(function(m) { m.init(_that); });
		_modules.forEach(function(m) { _moduleNameMap[m.name] = m; });

		$("#output-selector").accordion({
			heightStyle: "content",
			activate: function(event, ui) {
				_currentOutput = ui.newHeader[0].getAttribute("output_type");
				_that.update();
			}
		});
	};

	this.update = function() {
		_moduleNameMap[_currentOutput].render(_collections, _parameters);
	};

	this.setCollections = function(collections) {
		$("#output-nb-synths")[0].innerHTML = collections.length;
		_collections = collections;
		_that.update();
	};

	this.setInputParameters = function(parameters) {
		_parameters = parameters;
	};
};
