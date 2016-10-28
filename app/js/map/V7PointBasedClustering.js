/*******************************************************************************
* Author: Richard Brundritt
* Website: http://rbrundritt.wordpress.com
* Date: December 4th, 2011
* 
* Description: 
* A point based Client Side Clustering Algorithm. This algorithm takes the first 
* pushpin in the collection and groups all nearby locations in it. It then takes 
* the next, ungrouped location and does the same. 
********************************************************************************/

/* ClusteredEntityCollection object */
var PointBasedClusteredEntityCollection = function (map, options) {
    /* Private Properties */
    var _map = map,
        _layer,
        _zoomLevel = 1,
        _tileZoomRatio = 0,
        _data = [],
        _clusters = [21],
        _maxClusterZoom = 21; //Maximium zoom level to cluster at. Clustering will not occur past this zoom level

    /* Constants used to speed up calculations*/
    var PiBy180 = (Math.PI / 180),
        OneBy4PI = 1 / (4 * Math.PI);

    var _options = {
        //The size of the grid cells for clustering in pixels
        clusterRadius: 30,

        //Default functionality to create a single pushpin
        singlePinCallback: function (data, clusterInfo) {
            return new Microsoft.Maps.Pushpin(clusterInfo.center);
        },

        //Default function to generate clustered pushpin
        clusteredPinCallback: function (clusterInfo) {
            var pin = new Microsoft.Maps.Pushpin(clusterInfo.center, { text: '+' });
            pin.description = clusterInfo.dataIndices.length + " locations<br/>Zoom in for more details.";
            return pin;
        },

        //Callback function that gets fired after clustering has been completed. 
        callback: null
    };

    /* Private Methods */

    function _init() {
        //Create an instance of an EntityCollection
        _layer = new Microsoft.Maps.EntityCollection();
        _map.entities.push(_layer);

        //Reset stored cluster information
        for (var i = 0; i < 21; i++) {
            _clusters[i] = null;
        }

        setOptions(options);
        Microsoft.Maps.Events.addThrottledHandler(_map, 'viewchangeend', function () {
            var z = _map.getZoom();
            _tileZoomRatio = 256 * Math.pow(2, z);

            if (z != _zoomLevel) {
                _zoomLevel = z;

                if(_zoomLevel <= _maxClusterZoom)
                {
                    //Recluster
                    cluster();
                }
            }

            //Rerender
            render();
        }, 500);
    }

    // Clusters the data for the current zoom level
    function cluster() {
        //remove all pins from the layer
        _layer.clear();

        var c = _clusters[_zoomLevel];

        if (c == null || c.length == 0) {

            //Initialize cluster array for current zoom level
            c = [], clusterCount = 0;

            if (_data != null) {
                var i = _data.length - 1, j, pixel, cData;

                //Itirate through the data
                if (i >= 0) {
                    do {
                        pixel = globalPixel(_data[i]._LatLong);

                        j = clusterCount - 1;

                        if (j >= 0) {
                            //See if pixel fits into any existing clusters
                            do {
                                if (pixel.y >= c[j].top && pixel.y <= c[j].bottom &&
                                    ((c[j].left <= c[j].right && pixel.x >= c[j].left && pixel.x <= c[j].right) ||
                                    (c[j].left >= c[j].right && (pixel.x >= c[j].left || pixel.x <= c[j].right)))) {

                                    c[j].dataIndices.push(i);
                                    _data[i]._clusterIndex = j;
                                    break;
                                }
                            }
                            while (j--);

                            //If j = 0 then pixel does not fit in existing cluster
                            if (j == -1) {
                                //Create new cluster
                                cData = {
                                    index: clusterCount,
                                    dataIndices: [],
                                    center: _data[i]._LatLong,
                                    left: pixel.x - _options.clusterRadius,
                                    right: pixel.x + _options.clusterRadius,
                                    top: pixel.y - _options.clusterRadius,
                                    bottom: pixel.y + _options.clusterRadius,
                                    zoom: _zoomLevel
                                };

                                cData.dataIndices.push(i);

                                if (cData.left < 0) {
                                    cData.left += _tileZoomRatio;
                                }

                                if (cData.right > _tileZoomRatio) {
                                    cData.right -= _tileZoomRatio;
                                }

                                _data[i]._clusterIndex = clusterCount;

                                c.push(cData);
                                clusterCount++;
                            }

                        } else {
                            //Create new cluster
                            cData = {
                                index: clusterCount,
                                dataIndices: [],
                                center: _data[i]._LatLong,
                                left: pixel.x - _options.clusterRadius,
                                right: pixel.x + _options.clusterRadius,
                                top: pixel.y - _options.clusterRadius,
                                bottom: pixel.y + _options.clusterRadius,
                                zoom: _zoomLevel
                            };

                            cData.dataIndices.push(i);

                            if (cData.left < 0) {
                                cData.left += _tileZoomRatio;
                            }

                            if (cData.right > _tileZoomRatio) {
                                cData.right -= _tileZoomRatio;
                            }

                            _data[i]._clusterIndex = clusterCount;

                            c.push(cData);
                            clusterCount++;
                        }
                    }
                    while (i--);
                }
            }
        }

        _clusters[_zoomLevel] = c;
    }

    function render() {
        //remove all pins from the layer
        _layer.clear();

        var bounds = _map.getBounds();

        if (_zoomLevel <= _maxClusterZoom) {
            var clusters = _clusters[_zoomLevel];

            if (clusters != null && clusters.length > 0) {
                var i = clusters.length - 1,
                pin, c;

                //Iteriates through the clusters and render those in view
                if (i >= 0) {
                    do {
                        c = clusters[i];

                        //Check that cluster is in map view
                        if (bounds.contains(clusters[i].center)) {
                            //Check to see if cluster has only one data point in it
                            if (c.dataIndices.length == 1) {
                                pin = _options.singlePinCallback(_data[c.dataIndices[0]], c);
                            }
                            else {  //generate clustered pushpin
                                pin = _options.clusteredPinCallback(c);
                            }

                            pin._clusterInfo = c;
                            _layer.push(pin);
                        }
                    }
                    while (i--);
                }
            }
        } else {
            var i = _data.length - 1,
                cData, pin;

            //Iteriates through the data and render the pushpins in view
            if (i >= 0) {
                do {
                    cData = {
                        index: i,
                        dataIndices: [],
                        center: _data[i]._LatLong,
                        left: null,
                        right: null,
                        top: null,
                        bottom: null,
                        zoom: _zoomLevel
                    };

                    cData.dataIndices.push(i);

                    //Check that data is in map view
                    if (bounds.contains(_data[i]._LatLong)) {
                        pin = _options.singlePinCallback(_data[i], cData);
                        pin._clusterInfo = cData;
                        _layer.push(pin);
                    }
                }
                while (i--);
            }
        }

        //Call users callback
        if (_options.callback) {
            _options.callback();
        }
    }

    /*
    * Calculates the global pixel coordinate for a latlong value, where a latlong value of 
    * (-90, 180) will have a global pixel value of (512, 512) at zoom level 1
    */
    function globalPixel(latlong) {
        //Formulas based on following article:
        //http://msdn.microsoft.com/en-us/library/bb259689.aspx
        var sinLatitude = Math.sin(latlong.latitude * PiBy180);

        //If Latitude == 90 or -90 then Y will become infinity when Math.log is calculated
        if (sinLatitude == 1 || sinLatitude == -1) {
            sinLatitude += 0.0000000001;
        }

        var x = ((latlong.longitude + 180) / 360) * _tileZoomRatio;
        var y = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) * OneBy4PI) * _tileZoomRatio;

        return { x: Math.round(x), y: Math.round(y) };
    }

    //Updates the default options with new options
    function setOptions(options) {
        //Reset stored cluster information
        for (var i = 0; i < 21; i++) {
            _clusters[i] = null;
        }

        for (attrname in options) {
            _options[attrname] = options[attrname];
        }

        cluster();
        render();
    }

    /* Public Methods */

    //Layer Methods

    /**
    * @returns A reference to the layer being used.
    */
    this.GetLayer = function () {
        return _layer;
    };

    /**
    * @returns The clustering options.
    */
    this.GetOptions = function () {
        return _options;
    };

    /**
    * Sets the clustering options.
    * Example: clusterLayer.SetOptions({ gridSize : 30});
    */
    this.SetOptions = function (options) {
        setOptions(options);
    };

    /**
    * Sets all layer's z-index to 0 and increases the z-index of the current layer to 1.
    */
    this.BringLayerToFront = function () {
        var i = _map.entities.getLength() - 1,
            entity;

        if (i >= 0) {
            do {
                entity = _map.entities.get(i);
                if (entity.clear != null) {//Only entity collections have the clear function
                    entity.setOptions({ zIndex: 0 });
                }
            }
            while (i--);

            i = _map.entities.indexOf(_layer);
            entity = _map.entities.get(i);
            entity.setOptions({ zIndex: 1 });
        }
    };

    //Data Handlers

    /**
    * Sets the data that is to be clustered and displayed on the map. All objects 
    * must at minimium have a latitude and longitude properties. 
    * The algorithm will convert them to a Location object when loading in data.
    * @param {[object]} data - An array of objects that are to be mapped. 
    */
    this.SetData = function (data) {
        if (data != null && data.length > 0) {
            _data = data;

            var i = _data.length - 1;

            if (i >= 0) {
                do {
                    //convert the data coordinate into a Location object and store it.
                    _data[i]._LatLong = new Microsoft.Maps.Location(_data[i].latitude, _data[i].longitude);
                } while (i--)
            }

            cluster();
            render();
        } else {
            _data = [];
            _layer.clear();
        }
    };

    /**
    * @returns The data array and returns it to the user. 
    */
    this.GetData = function () {
        return _data;
    };

    /**
    * @returns All the data that is currently displayed.
    */
    this.GetDisplayedData = function () {
        var result = [];

        var i = _layer.getLength() - 1;
        if (i >= 0) {
            do {
                var pin = _layer.get(i);

                if (pin._clusterInfo != null && pin._clusterInfo.dataIndices.length > 0) {
                    for (var j = 0; j < pin._clusterInfo.dataIndices.length; j++) {
                        result.push(_data[pin._clusterInfo.dataIndices[j]]);
                    }
                }
            }
            while (i--);
        }

        return result;
    };

    /** 
    * Gets data from by index
    */
    this.GetDataByIndex = function (index) {
        if (index < _data.length) {
            return _data[index];
        }

        return null;
    };

    /** 
    * Gets data by Cluster Index
    */
    this.GetDataByClusterIndex = function (index) {
        var result = [], c = _clusters[_zoomLevel];

        if (c != null
            && c.length > index
            && c[index] != null
            && c[index].dataIndices != null
            && c[index].dataIndices.length > 0) {

            for (var j = 0; j < c[index].dataIndices.length; j++) {
                result.push(_data[c[index].dataIndices[j]]);
            }
        }

        return result;
    };

    /** 
    * Gets the Pin by cluster Index
    */
    this.GetPinByClusterIndex = function (index) {
        var i = _layer.getLength() - 1;
        if (i >= 0) {
            do {
                var pin = _layer.get(i);

                if (pin._clusterInfo.index == index) {
                    return pin;
                }
            }
            while (i--);
        }

        return null;
    };

    //Initialize class
    _init();
};

//Call the Module Loaded method
Microsoft.Maps.moduleLoaded('PointBasedClusteringModule');