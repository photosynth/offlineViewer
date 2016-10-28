"use strict";

/* exported fillSynthGraph */

function fillSynthGraph(storage, entryGuid, graph, onComplete) {

	var _storage = storage;

	function addSynth(graph, guid) {
		if (!graph.hasNode(guid)) {
			graph.addNode(guid);
			return true;
		}
		else {
			return false;
		}
	}

	function addConnection(graph, src, dst) {
		addSynth(graph, src);
		addSynth(graph, dst);
		graph.addEdge(null, src, dst);
	}

	function getConnections(guid, callback) {
		_storage.load(guid, function(annotations) {
			var connections = annotations.filter(function(a) { return a.transform; }); //ignore annotations: keep only synth connections
				callback(connections.map(function(c) { return c.transform.target.guid; }), annotations);
		});
	}

	var _visitedNodes     = [];
	var _toBeVisitedNodes = [];

	function addToBeVisitedList(guid) {
		if (_toBeVisitedNodes.indexOf(guid) === -1) {
			_toBeVisitedNodes.push(guid);
		}
	}

	function removeFromToBeVisitedList(guid) {
		_toBeVisitedNodes = _toBeVisitedNodes.filter(function(c) { return c !== guid; });
	}

	function recursiveFilling(graph, guid, onComplete) {

		if (_visitedNodes.indexOf(guid) === -1) {
			//unvisited node
			_visitedNodes.push(guid);

			getConnections(guid, function(connections) {

				removeFromToBeVisitedList(guid);

				//add connections to the ToBeVisited list
				connections.map(function(c) {
					addToBeVisitedList(c);
				});

				//add all connections to the graph
				connections.forEach(function(c) {
					addConnection(graph, guid, c);
				});

				//visit all target nodes
				connections.forEach(function(c) {
					recursiveFilling(graph, c, onComplete);
				});

				if (_toBeVisitedNodes.length === 0) {

					var nodes = graph.nodes();

					//get titles from the rest API
					new PS.Utils.Async.Queue(nodes, {
						concurrency: 8,
						onProcess: function(guid, callback) {

							_storage.load(guid, function(annotations) {
								new PS.API.getMedia(guid, function(collection) {
									graph.node(collection.guid, {width: 100, height: 100, label: collection.name, annotations: annotations});
									callback();
								});
							});
						},
						onComplete: function() {
							onComplete(graph);
						}
					});

				}
			});

		}
		else {
			//already visited, skip this one
			removeFromToBeVisitedList(guid);
		}
	}

	recursiveFilling(graph, entryGuid, onComplete);
}
