var quirks = new function () {
    "use strict";

    var _ua = navigator.userAgent;
    var _isSafari = (navigator.vendor === 'Apple Computer, Inc.');
    var _isWebkit = _ua.indexOf('Webkit');
    var _chromeIndex = _ua.indexOf('Chrome');
    var _isChrome = _chromeIndex !== -1;
    var _firefoxIndex = _ua.indexOf('Firefox');
    var _isFirefox = _firefoxIndex !== -1;
    var _chromeVersion = _isChrome ? parseInt(_ua.substring(_chromeIndex + 7)) : -1;
    var _firefoxVersion = _isFirefox ? parseInt(_ua.substring(_firefoxIndex + 8)) : -1;
    var _isTrident = _ua.indexOf('Trident') !== -1;

    this.isWebGLCORSSupported = (_isChrome && _chromeVersion >= 13) ||
                                (_isFirefox && _firefoxVersion >= 8);

    this.failsToRenderItemsNearContainerBorder = (_isChrome && _chromeVersion <= 19);
    this.isWebGLCORSRequired = (_isFirefox && _firefoxVersion > 4) || (_isChrome && _chromeVersion >= 13);
    this.useImageDisposer = _isSafari;
    this.supportsPreserve3D = !_isTrident && !_isFirefox;

    this.cssRequiresTileSubdivision = _isWebkit;

    this.webGLRendersAllBlack = (_isChrome && _chromeVersion == 21);

    this.isWebkitAndNotAtOneHundredPercentZoom = function () {
        var resized = document.createElement("span");
        resized.innerHTML = "m";
        resized.style.visibility = "hidden";
        resized.style.fontSize = "40px";
        resized.style.position = "absolute";
        resized.style.left = "0px";
        resized.style.top = "0px";
        resized.style.webkitTextSizeAdjust = "none";
        document.body.appendChild(resized);

        var notResized = document.createElement("span");
        notResized.innerHTML = "m";
        notResized.style.visibility = "hidden";
        notResized.style.fontSize = "40px";
        notResized.style.position = "absolute";
        notResized.style.left = "0px";
        notResized.style.top = "0px";
        document.body.appendChild(notResized);

        var zoomIsOneHundredPercent = (resized.offsetWidth == notResized.offsetWidth);

        document.body.removeChild(resized);
        document.body.removeChild(notResized);

        return !zoomIsOneHundredPercent;
    };

};
var RendererCheckCSS3D = {};

RendererCheckCSS3D.isValidBrowser = function () {
    "use strict";

    //Check that CSS3D transforms are here, otherwise throw an exception.
    //
    //  Future: Does it make sense to have a caps object we create in a singleton?

    var CSSMatrix = window.CSSMatrix || window.WebKitCSSMatrix || window.MSCSSMatrix || window.MozCSSMatrix;

    if (CSSMatrix == null || quirks.failsToRenderItemsNearContainerBorder) {
        RendererCheckCSS3D.isValidBrowser = function () { return false; };
        return false;
    }

    var matrix = new CSSMatrix();
    if (!matrix) {
        RendererCheckCSS3D.isValidBrowser = function () { return false; };
        return false;
    }

    if (quirks.isWebkitAndNotAtOneHundredPercentZoom()) {
        return false;
    }

    //Test presence of properties  want.
    var div = document.createElement('div');
    var style = div.style;

    if ((style.webkitTransform === undefined) &&
       (style.msTransform === undefined) &&
       (style.mozTransform === undefined)) {
        RendererCheckCSS3D.isValidBrowser = function () { return false; };
        return false;
    }

    if (quirks.supportsPreserve3D) {
        //Older CSS3-3D implementations are sometimes busted depending on the graphics drivers.
        //The testElement below creates a snippet of problematic DOM, then measure's the size on screen.
        //This is a webkit specific isue.

        var testElem = document.createElement('div');
        var testElemStyle = testElem.style;
        testElemStyle.width = '0px';
        testElemStyle.height = '0px';
        testElemStyle.position = 'absolute';
        testElemStyle.overflowX = 'hidden';
        testElemStyle.overflowY = 'hidden';
        testElemStyle.backgroundColor = 'rgb(0, 0, 0)';
        testElem.innerHTML = '<div style="position: absolute; z-index: -10; -webkit-transform: matrix3d(772.413793, 0, 0, 0, 0, 772.413793, 0, 0, -537600, -315000, -1050.021, -1050, -772.413793, -112072.413793, 525.0085, 525); -ms-transform: matrix3d(772.413793, 0, 0, 0, 0, 772.413793, 0, 0, -537600, -315000, -1050.021, -1050, -772.413793, -112072.413793, 525.0085, 525); -moz-transform: matrix3d(772.413793, 0, 0, 0, 0, 772.413793, 0, 0, -537600, -315000, -1050.021, -1050, -772.413793, -112072.413793, 525.0085, 525); transform: matrix3d(772.413793, 0, 0, 0, 0, 772.413793, 0, 0, -537600, -315000, -1050.021, -1050, -772.413793, -112072.413793, 525.0085, 525); "><div id="_rwwviewer_cssrenderer_test_id" style="width: 256px; height: 256px;"></div></div>';
        document.body.appendChild(testElem);
        var size = document.getElementById('_rwwviewer_cssrenderer_test_id').getClientRects()[0];
        document.body.removeChild(testElem);
        //With the canned set of nested divs and matrix transforms, the element should be 337 pixels in width and height.
        //Webkit sometimes expands things much further if the machine has old graphics drivers installed.
        if (Math.abs(size.width - 377) <= 1 && Math.abs(size.height - 377) <= 1) {
            //cache the value so that we only perform the check once
            RendererCheckCSS3D.isValidBrowser = function () { return true; };
            return true;
        } else {
            RendererCheckCSS3D.isValidBrowser = function () { return false; };
            return false;
        }
    } else {
        // Here we must be IE10, as we don't support preserve3d but can make a CSS matrix.
        RendererCheckCSS3D.isValidBrowser = function () { return true; };
        return true;
    }
};
var RendererCheckWebGL = {};

RendererCheckWebGL.getWebGLContext = function (win) {
    "use strict";

	if (win.getContext) {
		var possibleNames = 
			["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
		for(var i = 0; i < possibleNames.length; ++i) {
			try {
				var context = win.getContext(possibleNames[i], { antialias: true });
				if (context != null) {
				    return context;
				}
			} catch(ex) { }
		}
	}
	return null;
};

RendererCheckWebGL.isValidBrowser = function () {
    "use strict";

    var canvas = document.createElement('canvas');

	var gl = RendererCheckWebGL.getWebGLContext(canvas);
	if (!gl) {
		console.log("WebGL is not supported.");
        RendererCheckWebGL.isValidBrowser = function () { return false; };
        return false;
	}
	else if (quirks.isWebGLCORSRequired && !quirks.isWebGLCORSSupported) {
        console.log('CORS image textures are not supported in this browser.');
        RendererCheckWebGL.isValidBrowser = function () { return false; };
        return false;
	}
	else if (quirks.webGLRendersAllBlack) {
	    console.log('Webgl fails to render image tiles correctly in this browser.');
	    RendererCheckWebGL.isValidBrowser = function () { return false; };
	    return false;
	}

    RendererCheckWebGL.isValidBrowser = function () { return true; };
    return true;
};
/**
 * This is utility class for doing homogenous coordinate polygon clipping.
 */
var convexPolygonClipper = {
    /**
     * This performs clipping against the view volume (defined by upper and lower bounds).
     * It will return results as an array of vector4 points. 
     *
     * @param {Vector3} upperClipBound
     * @param {Vector3} lowerClipBound
     * @param {Array.<Vector4>} polygon
     * @return {Array.<Vector4>} 
     */
    clip: function (lowerClipBound, upperClipBound, polygon) {
        "use strict";

        if(upperClipBound.x < lowerClipBound.x || 
           upperClipBound.y < lowerClipBound.y || 
           upperClipBound.z < lowerClipBound.z ) {
            throw 'clip bounds should have positive volume';
        }

        var options = {
            clipBounds : {
                x: lowerClipBound.x,
                y: lowerClipBound.y,
                z: lowerClipBound.z,
                sizeX: upperClipBound.x - lowerClipBound.x,
                sizeY: upperClipBound.y - lowerClipBound.y,
                sizeZ: upperClipBound.z - lowerClipBound.z
            },
            poly : polygon,
            polyTextureCoords : null,
            polyVertexCount : polygon.length,
            clippedPoly: new Array(polygon.length + 6),
            clippedPolyTextureCoords: null,
            clippedPolyVertexCount: 0,
            tempVertexBuffer: new Array(polygon.length + 6),
            tempTextureCoordBuffer: null
        };
        convexPolygonClipper.clipConvexPolygonGeneral(options);
        options.clippedPoly.length = options.clippedPolyVertexCount;
        return options.clippedPoly;
    },


    /**
    * Clips a convex polygon against the provided clip volume in homogenous coordinates. Results
    * are undefined for a concave polygon or a polygon with overlapping edges.
    * 
    * This requires an option object with the following properites (that will get updated with results in place.)
    *  clipBounds  The 3D bounds the clipping, e.g. {x:-1,y:-1,z:0, sizeX:2,sizeY:2,sizeZ:1}.  Which is (-1,-1,0) to (1,1,1).
    *  poly  The polygon to clipped. This is an Array of Vector4.
    *  polyTextureCoords  Texture coordinates associated with the poly. May be null. This is an Array of Vector2 or null.
    *  polyVertexCount  The number of vertices in the polygon to be clipped.
    *  clippedPoly  The resulting clipped poly. This array must be at least polyVertexCount + 6 in length.
    *  clippedPolyTextureCoords  The texture coordinates of the resulting clipped poly. May be null if polyTextureCoords is null. The array must be at least polyVertexCount + 6 in length.
    *  clippedPolyVertexCount  The number of vertices in the clipped polygon.
    *  tempVertexBuffer  A buffer that's used for temporary storage in the algorithm. This is an Array of Vector4. This array must be at least polyVertexCount + 6 in length.
    *  tempTextureCoordBuffer  A buffer that's used for temporary storage in the algorithm. May be null if polyTextureCoords is null. This array must be at least polyVertexCount + 6 in length.
    *
    *
    * @param {Object} options
    */
    clipConvexPolygonGeneral: function (options) {
        "use strict";

        if(!options.clipBounds ) {
            throw 'expected clip bounds option';
        }
        // The algorithm used here is Sutherland-Hodgman extended to 3D. It basically works like so:
        //
        // P' = P
        // for each clipping plane:
        //     P = clip P' agsint clipping plane
        //     P' = P

        if (options.polyVertexCount < 3 || options.poly == null || options.poly.length < options.polyVertexCount ||
            options.clippedPoly == null || options.clippedPoly.length < options.polyVertexCount + 6 ||
            options.tempVertexBuffer == null || options.tempVertexBuffer.length < options.polyVertexCount + 6)
        {
            throw 'polygon arrays must have sufficient capacity';
        }

        if (options.polyTextureCoords != null)
        {
            if (options.polyTextureCoords.Length < options.polyVertexCount ||
                options.clippedPolyTextureCoords == null || options.clippedPolyTextureCoords.Length < options.polyVertexCount + 6 ||
                options.tempTextureCoordBuffer == null || options.tempTextureCoordBuffer.Length < options.polyVertexCount + 6)
            {
                throw 'polygon arrays must have sufficient capacity';
            }
        }

        var t;
        t = options.tempVertexBuffer;
        options.tempVertexBuffer = options.clippedPoly;
        options.clippedPoly = t;
        t = null;

        t = options.tempTextureCoordBuffer;
        options.tempTextureCoordBuffer = options.clippedPolyTextureCoords;
        options.clippedPolyTextureCoords = t;
        t = null;

        var clippedPolyCurrent = options.tempVertexBuffer;
        var clippedPolyTextureCoordsCurrent = options.tempTextureCoordBuffer;
        var clippedPolyVertexCountCurrent = options.polyVertexCount;

        var p0Idx, p1Idx,BC0, BC1;
        // Left
        {
            options.clippedPolyVertexCount = 0;

            p0Idx = clippedPolyVertexCountCurrent - 1;

            for (p1Idx = 0; p1Idx < clippedPolyVertexCountCurrent; p1Idx++)
            {
                BC0 = options.poly[p0Idx].x - options.clipBounds.x * options.poly[p0Idx].w;
                BC1 = options.poly[p1Idx].x - options.clipBounds.x * options.poly[p1Idx].w;

                options.BC0 = BC0;
                options.BC1 = BC1;
                options.p0Idx = p0Idx;
                options.p1Idx = p1Idx;
                options.clippedPolyCurrent = options.poly;  //Notice here we use input poly, in others we'll use clippedPolyCurrent instead.
                options.clippedPolyTextureCoordsCurrent = options.polyTextureCoords;

                convexPolygonClipper.genericClipAgainstPlane(options);

                p0Idx = p1Idx;
            }

            if (options.clippedPolyVertexCount == 0)
            {
                return;
            }

            // Swap the current with the output
            t = clippedPolyCurrent; clippedPolyCurrent = options.clippedPoly; options.clippedPoly = t; t = null;
            t = clippedPolyTextureCoordsCurrent; clippedPolyTextureCoordsCurrent = options.clippedPolyTextureCoords; options.clippedPolyTextureCoords = t; t = null;
            clippedPolyVertexCountCurrent = options.clippedPolyVertexCount;
        }


        // Right
        {
            options.clippedPolyVertexCount = 0;

            p0Idx = clippedPolyVertexCountCurrent - 1;

            for (p1Idx = 0; p1Idx < clippedPolyVertexCountCurrent; p1Idx++)
            {
                BC0 = (options.clipBounds.x + options.clipBounds.sizeX) * clippedPolyCurrent[p0Idx].w - clippedPolyCurrent[p0Idx].x;
                BC1 = (options.clipBounds.x + options.clipBounds.sizeX) * clippedPolyCurrent[p1Idx].w - clippedPolyCurrent[p1Idx].x;


                options.BC0 = BC0;
                options.BC1 = BC1;
                options.p0Idx = p0Idx;
                options.p1Idx = p1Idx;
                options.clippedPolyCurrent = clippedPolyCurrent; 
                options.clippedPolyTextureCoordsCurrent = clippedPolyTextureCoordsCurrent;

                convexPolygonClipper.genericClipAgainstPlane(options);

                p0Idx = p1Idx;
            }

            if (options.clippedPolyVertexCount == 0)
            {
                return;
            }

            // Swap the current with the output
            t = clippedPolyCurrent; clippedPolyCurrent = options.clippedPoly; options.clippedPoly = t; t = null;
            t = clippedPolyTextureCoordsCurrent; clippedPolyTextureCoordsCurrent = options.clippedPolyTextureCoords; options.clippedPolyTextureCoords = t; t = null;
            clippedPolyVertexCountCurrent = options.clippedPolyVertexCount;
        }

        // Top
        {
            options.clippedPolyVertexCount = 0;

            p0Idx = clippedPolyVertexCountCurrent - 1;

            for (p1Idx = 0; p1Idx < clippedPolyVertexCountCurrent; p1Idx++)
            {
                BC0 = clippedPolyCurrent[p0Idx].y - options.clipBounds.y * clippedPolyCurrent[p0Idx].w;
                BC1 = clippedPolyCurrent[p1Idx].y - options.clipBounds.y * clippedPolyCurrent[p1Idx].w;

                options.BC0 = BC0;
                options.BC1 = BC1;
                options.p0Idx = p0Idx;
                options.p1Idx = p1Idx;
                options.clippedPolyCurrent = clippedPolyCurrent; 
                options.clippedPolyTextureCoordsCurrent = clippedPolyTextureCoordsCurrent;

                convexPolygonClipper.genericClipAgainstPlane(options);

                p0Idx = p1Idx;
            }

            if (options.clippedPolyVertexCount == 0)
            {
                return;
            }

            // Swap the current with the output
            t = clippedPolyCurrent; clippedPolyCurrent = options.clippedPoly; options.clippedPoly = t; t = null;
            t = clippedPolyTextureCoordsCurrent; clippedPolyTextureCoordsCurrent = options.clippedPolyTextureCoords; options.clippedPolyTextureCoords = t; t = null;
            clippedPolyVertexCountCurrent = options.clippedPolyVertexCount;
        }

        // Bottom
        {
            options.clippedPolyVertexCount = 0;

            p0Idx = clippedPolyVertexCountCurrent - 1;

            for (p1Idx = 0; p1Idx < clippedPolyVertexCountCurrent; p1Idx++)
            {
                BC0 = (options.clipBounds.y + options.clipBounds.sizeY) * clippedPolyCurrent[p0Idx].w - clippedPolyCurrent[p0Idx].y;
                BC1 = (options.clipBounds.y + options.clipBounds.sizeY) * clippedPolyCurrent[p1Idx].w - clippedPolyCurrent[p1Idx].y;

                options.BC0 = BC0;
                options.BC1 = BC1;
                options.p0Idx = p0Idx;
                options.p1Idx = p1Idx;
                options.clippedPolyCurrent = clippedPolyCurrent; 
                options.clippedPolyTextureCoordsCurrent = clippedPolyTextureCoordsCurrent;

                convexPolygonClipper.genericClipAgainstPlane(options);

                p0Idx = p1Idx;
            }

            if (options.clippedPolyVertexCount == 0)
            {
                return;
            }

            // Swap the current with the output
            t = clippedPolyCurrent; clippedPolyCurrent = options.clippedPoly; options.clippedPoly = t; t = null;
            t = clippedPolyTextureCoordsCurrent; clippedPolyTextureCoordsCurrent = options.clippedPolyTextureCoords; options.clippedPolyTextureCoords = t; t = null;
            clippedPolyVertexCountCurrent = options.clippedPolyVertexCount;
        }

        // Near
        {
            options.clippedPolyVertexCount = 0;

            p0Idx = clippedPolyVertexCountCurrent - 1;

            for (p1Idx = 0; p1Idx < clippedPolyVertexCountCurrent; p1Idx++)
            {
                BC0 = clippedPolyCurrent[p0Idx].z - options.clipBounds.z * clippedPolyCurrent[p0Idx].w;
                BC1 = clippedPolyCurrent[p1Idx].z - options.clipBounds.z * clippedPolyCurrent[p1Idx].w;

                options.BC0 = BC0;
                options.BC1 = BC1;
                options.p0Idx = p0Idx;
                options.p1Idx = p1Idx;
                options.clippedPolyCurrent = clippedPolyCurrent; 
                options.clippedPolyTextureCoordsCurrent = clippedPolyTextureCoordsCurrent;

                convexPolygonClipper.genericClipAgainstPlane(options);

                p0Idx = p1Idx;
            }

            if (options.clippedPolyVertexCount == 0)
            {
                return;
            }

            // Swap the current with the output
            t = clippedPolyCurrent; clippedPolyCurrent = options.clippedPoly; options.clippedPoly = t; t = null;
            t = clippedPolyTextureCoordsCurrent; clippedPolyTextureCoordsCurrent = options.clippedPolyTextureCoords; options.clippedPolyTextureCoords = t; t = null;
            clippedPolyVertexCountCurrent = options.clippedPolyVertexCount;
        }

        // Far
        {
            options.clippedPolyVertexCount = 0;

            p0Idx = clippedPolyVertexCountCurrent - 1;

            for (p1Idx = 0; p1Idx < clippedPolyVertexCountCurrent; p1Idx++)
            {
                BC0 = (options.clipBounds.z + options.clipBounds.sizeZ) * clippedPolyCurrent[p0Idx].w - clippedPolyCurrent[p0Idx].z;
                BC1 = (options.clipBounds.z + options.clipBounds.sizeZ) * clippedPolyCurrent[p1Idx].w - clippedPolyCurrent[p1Idx].z;


                options.BC0 = BC0;
                options.BC1 = BC1;
                options.p0Idx = p0Idx;
                options.p1Idx = p1Idx;
                options.clippedPolyCurrent = clippedPolyCurrent; 
                options.clippedPolyTextureCoordsCurrent = clippedPolyTextureCoordsCurrent;

                convexPolygonClipper.genericClipAgainstPlane(options);

                p0Idx = p1Idx;
            }

            // No need to swap current with output because this is the last clipping plane

            options.clippedPolyCurrent  = null;
            options.clippedPolyTextureCurrent  = null;
        }
    },

    /**
     * This helper function for the clipper it expects an options object with the following items. 
     * Note: Clipped Poly Vertex Count will be updated along with clipped poly.
     *
     * options.clippedPoly,  Vector4[]
     * options.clippedPolyTextureCoords, Vector2[] optional
     * options.clippedPolyVertexCount,   number
     * options.clippedPolyCurrent,     Vector4[]
     * options.clippedPolyTextureCoordsCurrent, Vector2[]
     * options.p0Idx,    number
     * options.p1Idx,   number
     * options.BC0, number
     * options.BC1 number
     *
     * @param {Object} options
     */
    genericClipAgainstPlane: function (options) {
        "use strict";

        var alpha;
        if (options.BC1 >= 0)
        {
            // P1 inside

            if (options.BC0 < 0)
            {
                // P0 outside, P1 inside

                // Output intersection of P0, P1
                alpha = options.BC0 / (options.BC0 - options.BC1);
                options.clippedPoly[options.clippedPolyVertexCount] = options.clippedPolyCurrent[options.p0Idx].lerp(options.clippedPolyCurrent[options.p1Idx], alpha);
                if (options.clippedPolyTextureCoords != null)
                {
                    options.clippedPolyTextureCoords[options.clippedPolyVertexCount] = options.clippedPolyTextureCoordsCurrent[options.p0Idx].lerp(options.clippedPolyTextureCoordsCurrent[options.p1Idx], alpha);
                }
                options.clippedPolyVertexCount++;
            }

            // output P1
            options.clippedPoly[options.clippedPolyVertexCount] = options.clippedPolyCurrent[options.p1Idx];
            if (options.clippedPolyTextureCoords != null)
            {
                options.clippedPolyTextureCoords[options.clippedPolyVertexCount] = options.clippedPolyTextureCoordsCurrent[options.p1Idx];
            }
            options.clippedPolyVertexCount++;
        }
        else if (options.BC0 >= 0)
        {
            // P0 inside clip plane, P1 outside

            // Output intersection of P0, P1
            alpha = options.BC0 / (options.BC0 - options.BC1);
            options.clippedPoly[options.clippedPolyVertexCount] = options.clippedPolyCurrent[options.p0Idx].lerp(options.clippedPolyCurrent[options.p1Idx], alpha);
            if (options.clippedPolyTextureCoords != null)
            {
                options.clippedPolyTextureCoords[options.clippedPolyVertexCount] = options.clippedPolyTextureCoordsCurrent[options.p0Idx].lerp(options.clippedPolyTextureCoordsCurrent[options.p1Idx], alpha);
            }
            options.clippedPolyVertexCount++;
        }
    }
};
/**
* Provides common graphics helper function
* @class
*/
var GraphicsHelper = {};

/**
* Creates a right handed look at matrix.  This is with +Z coming
* towards the viewer, +X is to the right and +Y is up
* @param {Vector3} position The position of the eye
* @param {Vector3} look The look direction
* @param {Vector3} up The up direction
* @return {Matrix4x4}
*/
GraphicsHelper.createLookAtRH = function (position, look, up) {
    "use strict";

    var rotatedPos, viewSide, viewUp, result;

    look = look.normalize();
    up = up.normalize();
    viewUp = up.subtract(look.multiplyScalar(up.dot(look))).normalize();
    viewSide = look.cross(viewUp);

    result = Matrix4x4.createIdentity();
    result.m11 = viewSide.x;
    result.m12 = viewSide.y;
    result.m13 = viewSide.z;
    result.m21 = viewUp.x;
    result.m22 = viewUp.y;
    result.m23 = viewUp.z;
    result.m31 = -look.x;
    result.m32 = -look.y;
    result.m33 = -look.z;
    rotatedPos = result.transformVector3(position);
    result.m14 = -rotatedPos.x;
    result.m24 = -rotatedPos.y;
    result.m34 = -rotatedPos.z;
    return result;
};

/**
* Creates a perspective projection matrix for use with column vectors.
* The near and far planes are mapped to [0, -1]
* @param {number} verticalFov The vertical field of view
* @param {number} aspectRatio The aspect ratio of the viewport
* @param {number} near The distance to the near plane
* @param {number} far The distance to the far plane
* @param {Vector2} digitalPan X and Y value defining how much to translate the projected
* imagery in 2D.  Values are in viewport dimension, so a value of 1 for the X would mean shift
* all projected 2D values to the right viewportWidth pixels
* @return {Matrix4x4}
*/
GraphicsHelper.createPerspective = function (verticalFov,
                                             aspectRatio,
                                             near,
                                             far,
                                             digitalPan) {

    "use strict";

    var d;
    d = 1.0 / Math.tan(verticalFov / 2.0);

    var projection = new Matrix4x4(d / aspectRatio, 0, digitalPan.x * 2, 0,
                                   0, d, digitalPan.y * 2, 0,
                                   0, 0, far / (far - near), -(near * far) / (far - near),
                                   0, 0, -1, 0);
    return projection;
};


/**
 * Creates a perspective projection from clip volume boundaries. (like glFrustum).
 * note the following relations should hold l < r, b < t, n < f.
 * @param {number} l left 
 * @param {number} r right
 * @param {number} b bottom
 * @param {number} t top
 * @param {number} n near
 * @param {number} f far
 * @return {Matrix4x4} The perspective projection.
 */
GraphicsHelper.createPerspectiveFromFrustum = function (l, r, b, t, n,f) {
    "use strict";

    return new Matrix4x4((2.0 * n) / (r - l), 0.0, (r + l) / (r - l), 0.0,
                                    0.0, (2.0*n)/(t-b),        (t+b)/(t-b),              0.0,
                                    0.0,           0.0, (-1.0*(f+n))/(f-n), (-2.0*f*n)/(f-n),
                                    0.0,           0.0,               -1.0,              0.0);

};

/** 
 * Creates a perpective projection (similiar to gluPerspective.) 
 * @param {number} verticalFov  fovy in radians.
 * @param {number} aspectRatio
 * @param {number} near  distance to the near z-plane. (Should be non-negative.)
 * @param {number} far   distance to the far  z-plane. (Should be non-negative, and greater than near.)
 * @return {Matrix4x4} The perspective projection.
 */
GraphicsHelper.createPerspectiveOGL = function (verticalFov,
                                                aspectRatio,
                                                near,
                                                far) {
    "use strict";

    //Phrase this in terms of frustum boundaries, as that's how most texts present this projection..
    var yMax = near * Math.tan(verticalFov/2),
        yMin = -yMax,
        xMin = yMin * aspectRatio,
        xMax = yMax * aspectRatio,
        zMin = near,
        zMax = far;
   return  GraphicsHelper.createPerspectiveFromFrustum(xMin, xMax, yMin, yMax, zMin, zMax);
};

/**
* Transforms all points onto the specified plane from the projector position
* @param {Vector3} position The position of the projector in world space
* @param {Plane} plane The plane where the geometry will be projected onto
* @return {Matrix4x4} A transform that projects any point onto the specified plane from the perspetive
*                     of the specified projector parameters
*/
GraphicsHelper.projectOntoPlane = function (position, plane) {
    "use strict";

    //See Real-time rendering, page 333, planar shadows, to see how the following matrix is derived

    var l = position;
    var n = plane.normal;
    var d = plane.d;
    var nDotL = n.dot(l);
    var m11 = nDotL + d - l.x * n.x;
    var m12 = -l.x * n.y;
    var m13 = -l.x * n.z;
    var m14 = -l.x * d;
    var m21 = -l.y * n.x;
    var m22 = nDotL + d - l.y * n.y;
    var m23 = -l.y * n.z;
    var m24 = -l.y * d;
    var m31 = -l.z * n.x;
    var m32 = -l.z * n.y;
    var m33 = nDotL + d - l.z * n.z;
    var m34 = -l.z * d;
    var m41 = -n.x;
    var m42 = -n.y;
    var m43 = -n.z;
    var m44 = nDotL;
    return new Matrix4x4(m11, m12, m13, m14,
                         m21, m22, m23, m24,
                         m31, m32, m33, m34,
                         m41, m42, m43, m44);
};

GraphicsHelper.createViewportToScreen = function (width, height) {
    "use strict";

    var n = Matrix4x4.createIdentity();
    n.m11 = width / 2.0;
    n.m12 = 0;
    n.m13 = 0;
    n.m14 = 0;

    n.m21 = 0;
    n.m22 = -1 * height / 2.0;
    n.m23 = 0;
    n.m24 = 0;

    n.m31 = 0;
    n.m32 = 0;
    n.m33 = 1;
    n.m34 = 0;

    n.m41 = width / 2;
    n.m42 = height / 2;
    n.m43 = 0;
    n.m44 = 1;
    n = n.transpose();
    return n;
};
/**
 * The MathHelper class provides common math functions.
 * @class
*/
var MathHelper = {};

/**
 * A small value indicating the maximum precision used for equaliy checks
 * @const
 * @type {number}
*/
MathHelper.zeroTolerance = 1e-12;

MathHelper.halfPI = Math.PI / 2;

/**
* PI times 2
* @const
* @type {number}
*/
MathHelper.twoPI = 2 * Math.PI;

/**
 * 180.0 divided by PI
 * @const
 * @type {number}
*/
MathHelper.oneEightyOverPI = 180.0 / Math.PI;

/**
 * PI divided by 180.0
 * @const
 * @type {number}
*/
MathHelper.piOverOneEighty = Math.PI / 180.0;

/**
 * Returns true if the number is close enough to zero to be considered zero
 * @param {number} value
 * @return {boolean}
 */
MathHelper.isZero = function (value) {
    "use strict";

    return Math.abs(value) < MathHelper.zeroTolerance;
};

/**
 * Converts radians to degrees
 * @param {number} angle An angle in degrees
 * @return {number}
*/
MathHelper.degreesToRadians = function (angle) {
    "use strict";

    return angle * MathHelper.piOverOneEighty;
};

/**
 * Converts degrees to radians
 * @param {number} angle An angle in radians
*/
MathHelper.radiansToDegrees = function (angle) {
    "use strict";

    return angle * MathHelper.oneEightyOverPI; 
};

/**
 * Normalizes a radian angle to be between [0, 2 * PI)
 * @param {number} angle An angle in radians
 * @return {number}
*/
MathHelper.normalizeRadian = function (angle) {
    "use strict";

    while (angle < 0) {
        angle += MathHelper.twoPI;
    }
    while (angle >= MathHelper.twoPI) {
        angle -= MathHelper.twoPI;
    }
    return angle;
};

/**
 * Always want to take the shortest path between the source and the target i.e. if source
 * is 10 degrees and target is 350 degrees we want to travel 20 degrees not 340
 * @param {number} source heading in radians
 * @param {number} target heading in radians
 * @return {number} the new source heading, from which a linear path to the target will also be the shortest path around a circle
*/
MathHelper.pickStartHeadingToTakeShortestPath = function (source, target) {
    "use strict";

    //Always want to take the shortest path between the source and the target i.e. if source
    //is 10 degrees and target is 350 degrees we want to travel 20 degrees not 340
    if (Math.abs(target - source) > Math.PI) {
        if (source < target) {
            return source + MathHelper.twoPI;
        }
        else {
            return source - MathHelper.twoPI;
        }
    }
    else {
        return source;
    }
};

/**
 * Returns the inverse square root of the input parameter
 * @param {number} v input value
 * @return {number}
*/
MathHelper.invSqrt = function (v) {
    "use strict";

    return 1.0 / Math.sqrt(v);
};

/**
* Returns if the value is finite (i.e., less than POSITIVE_INFINITY and greater than NEGATIVE_INFINITY)
* @param {number} v input value
* @return {boolean} 
*/
MathHelper.isFinite = function (v) {
    "use strict";

    return v > Number.NEGATIVE_INFINITY && v < Number.POSITIVE_INFINITY;
};

/**
 * Returns the value v , clamped to [min,max] interval (so v > max would be max.)
 * @param {number} v input value
 * @param {number} min lower bound (inclusive) that we want to clamp v against.
 * @param {number} max upper bound (inclusiveP that we want to clamp v against.
 * @return {number}
*/
MathHelper.clamp = function (v, min, max) {
    "use strict";

    return (Math.min(Math.max(v, min), max));
};

/**
* Returns log of x to the specified base
* @param {number} x Value to log
* @param {number} base The base to use in the log operation
* @return {number}
*/
MathHelper.logBase = function (x, base) {
    "use strict";

    return Math.log(x) / Math.log(base);
};

/**
* Returns the ceiling of the log base 2 of the value.
* @return {number}
*/
MathHelper.ceilLog2 = function (value) {
    "use strict";

    return Math.ceil(MathHelper.logBase(value, 2));
};

/**
* Compares two values, returns <0 if v1 precedes v2, 0 if v1 == v2 and >0 if v1 follows v2
* @param {number} v1 First value
* @param {number} v2 Second value
* @return {number}
*/
MathHelper.compareTo = function (v1, v2) {
    "use strict";

    if (v1 < v2) {
        return -1;
    }
    else if (v1 === v2) {
        return 0;
    }
    else {
        return 1;
    }
};

MathHelper.divPow2RoundUp = function (value, power) {
    "use strict";

    return MathHelper.divRoundUp(value, 1 << power);
};

MathHelper.divRoundUp = function (value, denominator) {
    "use strict";

    return Math.ceil(value / denominator);
};
/**
* Creates a 4x4 matrix
* @constructor
* @param {number} m11
* @param {number} m12
* @param {number} m13
* @param {number} m14
* @param {number} m21
* @param {number} m22
* @param {number} m23
* @param {number} m24
* @param {number} m31
* @param {number} m32
* @param {number} m33
* @param {number} m34
* @param {number} m41
* @param {number} m42
* @param {number} m43
* @param {number} m44
*/
function Matrix4x4(m11, m12, m13, m14,
                   m21, m22, m23, m24,
                   m31, m32, m33, m34,
                   m41, m42, m43, m44) {
    "use strict";

    this.m11 = m11;
    this.m12 = m12;
    this.m13 = m13;
    this.m14 = m14;
    this.m21 = m21;
    this.m22 = m22;
    this.m23 = m23;
    this.m24 = m24;
    this.m31 = m31;
    this.m32 = m32;
    this.m33 = m33;
    this.m34 = m34;
    this.m41 = m41;
    this.m42 = m42;
    this.m43 = m43;
    this.m44 = m44;
}

/**
* Creates a copy of the matrix
* @param {Matrix4x4} m
* @return {Matrix4x4}
*/
Matrix4x4.createCopy = function (m) {
    "use strict";

    return new Matrix4x4(m.m11, m.m12, m.m13, m.m14,
                         m.m21, m.m22, m.m23, m.m24,
                         m.m31, m.m32, m.m33, m.m34,
                         m.m41, m.m42, m.m43, m.m44);
};

/**
* Returns an identity matrix
* @return {Matrix4x4}
*/
Matrix4x4.createIdentity = function () {
    "use strict";

    return new Matrix4x4(1, 0, 0, 0,
                         0, 1, 0, 0,
                         0, 0, 1, 0,
                         0, 0, 0, 1);
};

/**
* Returns a scaling matrix
* @param {number} sx The x scaling factor
* @param {number} sy The y scaling factor
* @param {number} sz The z scaling factor
* @return {Matrix4x4}
*/
Matrix4x4.createScale = function (sx, sy, sz) {
    "use strict";

    return new Matrix4x4(sx, 0,  0,  0,
                         0,  sy, 0,  0,
                         0,  0,  sz, 0,
                         0,  0,  0,  1);
};

/**
* Returns a translation matrix to be used with a column vector p = M * v
* @param {number} tx The x translation value
* @param {number} ty The y translation value
* @param {number} tz The z translation value
* @return {Matrix4x4}
*/
Matrix4x4.createTranslation = function (tx, ty, tz) {
    "use strict";

    return new Matrix4x4(1, 0, 0, tx,
                         0, 1, 0, ty,
                         0, 0, 1, tz,
                         0, 0, 0, 1);
};

/**
* Returns a matrix that rotates a vector around the x axis, from the origin. The rotation matrix
* is a right handed rotation, a positive angle will rotate the vector anticlockwise around the x axis
* @param {number} angle The angle to rotate in radians
* @return {Matrix4x4}
*/
Matrix4x4.createRotationX = function (angle) {
    "use strict";

    return new Matrix4x4(1, 0, 0, 0,
                         0, Math.cos(angle), -Math.sin(angle), 0,
                         0, Math.sin(angle), Math.cos(angle), 0,
                         0, 0, 0, 1);
};

/**
* Returns a matrix that rotates a vector around the y axis, from the origin. The rotation matrix
* is a right handed rotation, a positive angle will rotate the vector anticlockwise around the y axis
* @param {number} angle The angle to rotate in radians
* @return {Matrix4x4}
*/
Matrix4x4.createRotationY = function (angle) {
    "use strict";

    return new Matrix4x4(Math.cos(angle), 0, Math.sin(angle), 0,
                         0, 1, 0, 0,
                         -Math.sin(angle), 0, Math.cos(angle), 0,
                         0, 0, 0, 1);
};

/**
* Returns a matrix that rotates a vector around the z axis, from the origin. The rotation matrix
* is a right handed rotation, a positive angle will rotate the vector anticlockwise around the z axis
* @param {number} angle The angle to rotate in radians
* @return {Matrix4x4}
*/
Matrix4x4.createRotationZ = function (angle) {
    "use strict";

    return new Matrix4x4(Math.cos(angle), -Math.sin(angle), 0, 0,
                         Math.sin(angle), Math.cos(angle), 0, 0,
                         0, 0, 1, 0,
                         0, 0, 0, 1);
};

Matrix4x4.prototype =
{
    /**
    * Adds matrix m to to the current matrix and returns the result
    * @param {Matrix4x4} m The matrix which will be added to the calling matrix
    * @return {Matrix4x4}
    */
    add: function (m) {
        "use strict";

        return new Matrix4x4(this.m11 + m.m11, this.m12 + m.m12, this.m13 + m.m13, this.m14 + m.m14,
                             this.m21 + m.m21, this.m22 + m.m22, this.m23 + m.m23, this.m24 + m.m24,
                             this.m31 + m.m31, this.m32 + m.m32, this.m33 + m.m33, this.m34 + m.m34,
                             this.m41 + m.m41, this.m42 + m.m42, this.m43 + m.m43, this.m44 + m.m44);
    },

    /**
    * Adds matrix m to to the current matrix and returns the result
    * @param {Matrix4x4} m The matrix which will be added to the calling matrix
    * @return {Matrix4x4}
    */
    subtract: function (m) {
        "use strict";

        return new Matrix4x4(this.m11 - m.m11, this.m12 - m.m12, this.m13 - m.m13, this.m14 - m.m14,
                             this.m21 - m.m21, this.m22 - m.m22, this.m23 - m.m23, this.m24 - m.m24,
                             this.m31 - m.m31, this.m32 - m.m32, this.m33 - m.m33, this.m34 - m.m34,
                             this.m41 - m.m41, this.m42 - m.m42, this.m43 - m.m43, this.m44 - m.m44);
    },

    /**
    * Multiples the calling matrix by matrix m and returns the result
    * @param {Matrix4x4} m input matrix
    * @return {Matrix4x4}
    */
    multiply: function (m) {
        "use strict";

        return new Matrix4x4(this.m11 * m.m11 + this.m12 * m.m21 + this.m13 * m.m31 + this.m14 * m.m41,
                             this.m11 * m.m12 + this.m12 * m.m22 + this.m13 * m.m32 + this.m14 * m.m42,
                             this.m11 * m.m13 + this.m12 * m.m23 + this.m13 * m.m33 + this.m14 * m.m43,
                             this.m11 * m.m14 + this.m12 * m.m24 + this.m13 * m.m34 + this.m14 * m.m44,

                             this.m21 * m.m11 + this.m22 * m.m21 + this.m23 * m.m31 + this.m24 * m.m41,
                             this.m21 * m.m12 + this.m22 * m.m22 + this.m23 * m.m32 + this.m24 * m.m42,
                             this.m21 * m.m13 + this.m22 * m.m23 + this.m23 * m.m33 + this.m24 * m.m43,
                             this.m21 * m.m14 + this.m22 * m.m24 + this.m23 * m.m34 + this.m24 * m.m44,

                             this.m31 * m.m11 + this.m32 * m.m21 + this.m33 * m.m31 + this.m34 * m.m41,
                             this.m31 * m.m12 + this.m32 * m.m22 + this.m33 * m.m32 + this.m34 * m.m42,
                             this.m31 * m.m13 + this.m32 * m.m23 + this.m33 * m.m33 + this.m34 * m.m43,
                             this.m31 * m.m14 + this.m32 * m.m24 + this.m33 * m.m34 + this.m34 * m.m44,

                             this.m41 * m.m11 + this.m42 * m.m21 + this.m43 * m.m31 + this.m44 * m.m41,
                             this.m41 * m.m12 + this.m42 * m.m22 + this.m43 * m.m32 + this.m44 * m.m42,
                             this.m41 * m.m13 + this.m42 * m.m23 + this.m43 * m.m33 + this.m44 * m.m43,
                             this.m41 * m.m14 + this.m42 * m.m24 + this.m43 * m.m34 + this.m44 * m.m44);
    },

    /**
    * Multiples each element of the matrix by the scalar f and returns the result
    * @param {number} f input scalar
    * @return {Matrix4x4}
    */
    multiplyScalar: function (f) {
        "use strict";

        return new Matrix4x4(this.m11 * f, this.m12 * f, this.m13 * f, this.m14 * f,
                             this.m21 * f, this.m22 * f, this.m23 * f, this.m24 * f,
                             this.m31 * f, this.m32 * f, this.m33 * f, this.m34 * f,
                             this.m41 * f, this.m42 * f, this.m43 * f, this.m44 * f);
    },

    /**
    * Returns the transpose of the calling matrix
    * @return {Matrix4x4}
    */
    transpose: function () {
        "use strict";

        return new Matrix4x4(this.m11, this.m21, this.m31, this.m41,
                             this.m12, this.m22, this.m32, this.m42,
                             this.m13, this.m23, this.m33, this.m43,
                             this.m14, this.m24, this.m34, this.m44);
    },
    
    /**
    * Multiples the matrix by the column vector v
    * @param {Vector4} v input vector
    * @return {Vector4}
    */
    transformVector4: function (v) {
        "use strict";

        return new Vector4(this.m11 * v.x + this.m12 * v.y + this.m13 * v.z + this.m14 * v.w,
                           this.m21 * v.x + this.m22 * v.y + this.m23 * v.z + this.m24 * v.w,
                           this.m31 * v.x + this.m32 * v.y + this.m33 * v.z + this.m34 * v.w,
                           this.m41 * v.x + this.m42 * v.y + this.m43 * v.z + this.m44 * v.w);
    },
    
    /**
    * Multiples the matrix by the column vector v. It is assumed the Vector3 v value
    * is equivalent to a Vector4 instance with a w value of 0
    * @param {Vector3} v input vector
    * @return {Vector3}
    */
    transformVector3: function (v) {
        "use strict";

        return new Vector3(this.m11 * v.x + this.m12 * v.y + this.m13 * v.z,
                           this.m21 * v.x + this.m22 * v.y + this.m23 * v.z,
                           this.m31 * v.x + this.m32 * v.y + this.m33 * v.z);
    },
    
    /**
    * Returns the determinant of the calling matrix
    * @return {number}
    */
    determinant: function () {
        "use strict";

        var a, b, c, d, e, f, g, h, i, j, k, l;
        a = this.m11 * this.m22 - this.m12 * this.m21;
        b = this.m11 * this.m23 - this.m13 * this.m21;
        c = this.m11 * this.m24 - this.m14 * this.m21;
        d = this.m12 * this.m23 - this.m13 * this.m22;
        e = this.m12 * this.m24 - this.m14 * this.m22;
        f = this.m13 * this.m24 - this.m14 * this.m23;
        g = this.m31 * this.m42 - this.m32 * this.m41;
        h = this.m31 * this.m43 - this.m33 * this.m41;
        i = this.m31 * this.m44 - this.m34 * this.m41;
        j = this.m32 * this.m43 - this.m33 * this.m42;
        k = this.m32 * this.m44 - this.m34 * this.m42;
        l = this.m33 * this.m44 - this.m34 * this.m43;
        return a * l - b * k + c * j + d * i - e * h + f * g;
    },
    
    /**
    * Returns the inverse of the calling matrix.  If the matrix cannot be inverted
    * the the identity matrix is returned.
    * @return {Matrix4x4}
    */
    inverse: function () {
        "use strict";

        var a, b, c, d, e, f, g, h, i, j, k, l, determinant, invD,
            m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44;
            
        a = this.m11 * this.m22 - this.m12 * this.m21;
        b = this.m11 * this.m23 - this.m13 * this.m21;
        c = this.m11 * this.m24 - this.m14 * this.m21;
        d = this.m12 * this.m23 - this.m13 * this.m22;
        e = this.m12 * this.m24 - this.m14 * this.m22;
        f = this.m13 * this.m24 - this.m14 * this.m23;
        g = this.m31 * this.m42 - this.m32 * this.m41;
        h = this.m31 * this.m43 - this.m33 * this.m41;
        i = this.m31 * this.m44 - this.m34 * this.m41;
        j = this.m32 * this.m43 - this.m33 * this.m42;
        k = this.m32 * this.m44 - this.m34 * this.m42;
        l = this.m33 * this.m44 - this.m34 * this.m43;
        determinant =  a * l - b * k + c * j + d * i - e * h + f * g;
        if (Math.abs(determinant) < MathHelper.zeroTolerance) {
            return Matrix4x4.createIdentity();
        }
        
        m11 = this.m22 * l - this.m23 * k + this.m24 * j;
        m12 = -this.m12 * l + this.m13 * k - this.m14 * j;
        m13 = this.m42 * f - this.m43 * e + this.m44 * d;
        m14 = -this.m32 * f + this.m33 * e - this.m34 * d;
        
        m21 = -this.m21 * l + this.m23 * i - this.m24 * h;
        m22 = this.m11 * l - this.m13 * i + this.m14 * h;
        m23 = -this.m41 * f + this.m43 * c - this.m44 * b;
        m24 = this.m31 * f - this.m33 * c + this.m34 * b;
        
        m31 = this.m21 * k - this.m22 * i + this.m24 * g;
        m32 = -this.m11 * k + this.m12 * i - this.m14 * g;
        m33 = this.m41 * e - this.m42 * c + this.m44 * a;
        m34 = -this.m31 * e + this.m32 * c - this.m34 * a;
        
        m41 = -this.m21 * j + this.m22 * h - this.m23 * g;
        m42 = this.m11 * j - this.m12 * h + this.m13 * g;
        m43 = -this.m41 * d + this.m42 * b - this.m43 * a;
        m44 = this.m31 * d - this.m32 * b + this.m33 * a;
        invD = 1.0 / determinant;
        return new Matrix4x4(m11 * invD, m12 * invD, m13 * invD, m14 * invD,
                             m21 * invD, m22 * invD, m23 * invD, m24 * invD,
                             m31 * invD, m32 * invD, m33 * invD, m34 * invD,
                             m41 * invD, m42 * invD, m43 * invD, m44 * invD);
    },

    /**
    * Returns a string containing the current state of the matrix.  Useful for debugging purposes
    * @return {string}
    */
    toString: function () {
        "use strict";

        return this.m11 + ", " + this.m12 + ", " + this.m13 + ", " + this.m14 + "\n" +
               this.m21 + ", " + this.m22 + ", " + this.m23 + ", " + this.m24 + "\n" +
               this.m31 + ", " + this.m32 + ", " + this.m33 + ", " + this.m34 + "\n" +
               this.m41 + ", " + this.m42 + ", " + this.m43 + ", " + this.m44 + "\n";
    },

    /**
     * If a value in the matrix is less than the tolerance value to zero, explicitly set to 0
     */
    pullToZero: function() {
        "use strict";

        if(Math.abs(this.m11) < MathHelper.zeroTolerance) { this.m11 = 0.0; }
        if(Math.abs(this.m12) < MathHelper.zeroTolerance) { this.m12 = 0.0; }
        if(Math.abs(this.m13) < MathHelper.zeroTolerance) { this.m13 = 0.0; }
        if(Math.abs(this.m14) < MathHelper.zeroTolerance) { this.m14 = 0.0; }
        if(Math.abs(this.m21) < MathHelper.zeroTolerance) { this.m21 = 0.0; }
        if(Math.abs(this.m22) < MathHelper.zeroTolerance) { this.m22 = 0.0; }
        if(Math.abs(this.m23) < MathHelper.zeroTolerance) { this.m23 = 0.0; }
        if(Math.abs(this.m24) < MathHelper.zeroTolerance) { this.m24 = 0.0; }
        if(Math.abs(this.m31) < MathHelper.zeroTolerance) { this.m31 = 0.0; }
        if(Math.abs(this.m32) < MathHelper.zeroTolerance) { this.m32 = 0.0; }
        if(Math.abs(this.m33) < MathHelper.zeroTolerance) { this.m33 = 0.0; }
        if(Math.abs(this.m34) < MathHelper.zeroTolerance) { this.m34 = 0.0; }
        if(Math.abs(this.m41) < MathHelper.zeroTolerance) { this.m41 = 0.0; }
        if(Math.abs(this.m42) < MathHelper.zeroTolerance) { this.m42 = 0.0; }
        if(Math.abs(this.m43) < MathHelper.zeroTolerance) { this.m43 = 0.0; }
        if(Math.abs(this.m44) < MathHelper.zeroTolerance) { this.m44 = 0.0; }
    },

    /**
    * Returns the matrix as a 1D array, in column major order
    */
    flattenColumnMajor: function () {
        "use strict";

        return [this.m11, this.m21, this.m31, this.m41,
                this.m12, this.m22, this.m32, this.m42,
                this.m13, this.m23, this.m33, this.m43,
                this.m14, this.m24, this.m34, this.m44];
    },
    /**
    * Returns the matrix as a 1D array, in row major order
    */
    flattenRowMajor: function () {
        "use strict";

        return [this.m11, this.m12, this.m13, this.m14,
                this.m21, this.m22, this.m23, this.m24,
                this.m31, this.m32, this.m33, this.m34,
                this.m41, this.m42, this.m43, this.m44];
    }

};
/**
 * A plane in 3D space.  Created from the generalized plane equation coefficients
 * @param {number} a A plane coefficient of Ax + By + Cz + D = 0
 * @param {number} b B plane coefficient of Ax + By + Cz + D = 0
 * @param {number} c C plane coefficient of Ax + By + Cz + D = 0
 * @param {number} d D plane coefficient of Ax + By + Cz + D = 0
 * @param {?Vector3} point A point on the plane, can be null if not specified
 * @constructor
 */
function Plane(a, b, c, d, point) {
    "use strict";

    /**
     * The A coefficent of the generalized plane equation Ax + By + Cz + D = 0
     * @type {number}
     */
    this.a = a;

    /**
     * The B coefficent of the generalized plane equation Ax + By + Cz + D = 0
     * @type {number}
     */
    this.b = b;

    /**
     * The C coefficent of the generalized plane equation Ax + By + Cz + D = 0
     * @type {number}
     */
    this.c = c;

    /**
     * The D coefficent of the generalized plane equation Ax + By + Cz + D = 0
     * @type {number}
     */
    this.d = d;

    /**
     * The normal to the plane
     * @type {Vector3}
     */
    this.normal = new Vector3(this.a, this.b, this.c);

    /**
     * A point on the plane, can be null if not given
     * @type {?Vector3}
     */
    this.point = point;
};

/**
 * Given 3 points lying on the plane, returns a Plane instance.  The normal to the 
 * plane is normalized and is created by (p1 - p0) X (p2 - p0)
 * @param {Vector3} p0
 * @param {Vector3} p1
 * @param {Vector3} p2
 * @return {Plane}
 */
Plane.createFromPoints = function (p0, p1, p2) {
    "use strict";

    var u = p1.subtract(p0);
    var v = p2.subtract(p0);
    var n = u.cross(v);
    n = n.normalize();
    
    var d = -1 * (n.x * p0.x + n.y * p0.y + n.z * p0.z);
    return new Plane(n.x, n.y, n.z, d, null);
};

/**
 * Given the plane normal and a point on the plane returns a Plane instance
 * @param {Vector3} point A point that lies on the plane
 * @param {Vector3} normal The normal to the plane - IMPORTANT: must be normalized
 * @return {Plane}
 */
Plane.createFromPointAndNormal = function(point, normal) {
    "use strict";

    var d = -1 * (normal.x * point.x + normal.y * point.y + normal.z * point.z);
    return new Plane(normal.x, normal.y, normal.z, d, point);
};

/**
 * Performs a plane/ray intersection, if the ray and plane do intersect in the direction
 * of the ray the point will be returned, otherwise null will be returned
 * @param {Ray} ray
 * @param {Plane} plane
 * @return {?Vector3}
 */
Plane.intersectWithRay = function (ray, plane) {
    "use strict";

    if (plane.point === null) {
        throw 'requires plane.point to not equal null';
    }

    //Check to see if ray and plane are perpendicular
    var dDotn = ray.direction.dot(plane.normal);
    if (MathHelper.isZero(dDotn)) {
        return null;
    }

    var distance = plane.point.subtract(ray.origin).dot(plane.normal) / ray.direction.dot(plane.normal);
    if (distance <= 0) {
        return null;
    }

    return ray.origin.add(ray.direction.multiplyScalar(distance));
};

Plane.prototype = {

    /**
     * Transforms the plane normal by the specified transform matrix and returns a new normal
     * @param {Matrix4x4} transform A transform to apply to the plane normal
     * @return {Vector3}
     */
    transformNormal: function(transform) {
        "use strict";

        //Plane normal must be transformed by transpose(inverse(M)) to be correct
        var m = transform.inverse().transpose();
        var n = m.transformVector3(this.normal);
        return new Vector3(n.x, n.y, n.z);
    },

    /**
     * Returns a string containing the generalized plane equation coefficients, A, B, C and D
     * @return {string}
     */
    toString: function () {
        "use strict";

        return 'A:' + this.a + ', B:' + this.b + ', C:' + this.c + ', D:' + this.d;
    }
};//For more information I would recommend "Essential Mathematics For Games", Van Verth, Bishop

/**
* Quaternion
* @constructor
*/
function Quaternion(w, x, y, z) {
    "use strict";

    this.w = w;
    this.x = x;
    this.y = y;
    this.z = z;
}

/**
* Returns the identity quaternion.
* @return {Quaternion}
*/
Quaternion.createIdentity = function () {
    "use strict";

    return new Quaternion(1, 0, 0, 0);
};

/**
* Creates a Quaternion from a rotation matrix
* @param {Matrix4x4} m rotation matrix  
* @return {Quaternion} 
*/
Quaternion.fromRotationMatrix = function (m) {
    "use strict";

    //See: http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm

    /*jslint onevar: false */
    //JSLint and I don't agree, as type annotions mean we need multiple vars.

    /** @type {number} */
    var trace; 

    /** @type {number} */
    var temp; 

    /** @type {Quaternion} */
    var result;

    /** @type {number} */
    var largestIndex;

    result = new Quaternion(0, 0, 0, 0);
    trace = m.m11 + m.m22 + m.m33;
    if (trace > MathHelper.zeroTolerance) {
        result.w = Math.sqrt(trace + 1) * 0.5;
        temp = 1.0 / (4 * result.w);
        result.x = (m.m32 - m.m23) * temp;
        result.y = (m.m13 - m.m31) * temp;
        result.z = (m.m21 - m.m12) * temp;
    }
    else {
        largestIndex = 0;
        if (m.m22 > m.m11) {
            largestIndex = 1;
            if (m.m33 > m.m22) {
                largestIndex = 2;
            }
        }
        else if (m.m33 > m.m11) {
            largestIndex = 2;
        }
       
        switch (largestIndex) {
        case 0:
            result.x = 0.5 * Math.sqrt(m.m11 - m.m22 - m.m33 + 1);
            temp = 1.0 / (4 * result.x);
            result.w = (m.m32 - m.m23) * temp;
            result.y = (m.m12 + m.m21) * temp;
            result.z = (m.m13 + m.m31) * temp;
            break;
        case 1:
            result.y = 0.5 * Math.sqrt(m.m22 - m.m11 - m.m33 + 1);
            temp = 1.0 / (4 * result.y);
            result.w = (m.m13 - m.m31) * temp;
            result.x = (m.m12 + m.m21) * temp;
            result.z = (m.m23 + m.m32) * temp;
            break;
        case 2:
            result.z = 0.5 * Math.sqrt(m.m33 - m.m11 - m.m22 + 1);
            temp = 1.0 / (4 * result.z);
            result.w = (m.m21 - m.m12) * temp;
            result.x = (m.m13 + m.m31) * temp;
            result.y = (m.m32 + m.m23) * temp;
            break;
        }
    }
    return result;
};

/**
* Creates a Quaternion from an axis and an angle
* @param {Vector3} axis The rotation axis, must be a unit vector
* @param {number} angle An angle in radians.  A positive angle will rotate anticlockwise around the axis
* @return {Quaternion}
*/
Quaternion.fromAxisAngle = function (axis, angle) {
    "use strict";

    var halfAngle, s;
    halfAngle = 0.5 * angle;
    s = Math.sin(halfAngle);
    return new Quaternion(Math.cos(halfAngle), axis.x * s, axis.y * s, axis.z * s);
};

/**
* Returns a quaternion that has been slerped between source and target by t amount
* @param {number} t A value between 0.0 and 1.0 inclusive
* @param {Quaternion} source The starting quaternion value
* @param {Quaternion} target The target quaternion value
* @return {Quaternion}
*/
Quaternion.slerp = function (t, source, target) {
    "use strict";

    var cos, angle, sin, invSin, a, b;
    
    if (t === 0.0) {
        return source;
    }
    if (t >= 1.0) {
        return target;
    }
    
    cos = source.dot(target);
    angle = Math.acos(cos);

    if (Math.abs(angle) >= MathHelper.zeroTolerance) {
        sin = Math.sin(angle);
        invSin = 1.0 / sin;
        a = Math.sin((1.0 - t) * angle) * invSin;
        b = Math.sin(t * angle) * invSin;
        return source.multiplyScalar(a).add(target.multiplyScalar(b));
    }
    
    return source;
};

Quaternion.prototype = 
{
    /**
    * Returns the dot product of two Quaternions
    * @param {Quaternion} q input quaternion
    * @return {number}
    */
    dot: function (q) {
        "use strict";

        return this.w * q.w + this.x * q.x + this.y * q.y + this.z * q.z;
    },
    
    /**
    * Calculates the length of the Quaternion
    * @return {number}
    */
    length: function () {
        "use strict";

        return Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
    },
    
    /**
    * Creates a unit length version of the Quaternion
    * @return {Quaternion}
    */
    normalize: function () {
        "use strict";

        var length, inverseLength;
        
        length = this.length();
        if (length < MathHelper.zeroTolerance) {
            return new Quaternion(0.0, 0.0, 0.0, 0.0);
        }

        inverseLength = 1.0 / length;
        return new Quaternion(this.w * inverseLength,
                              this.x * inverseLength,
                              this.y * inverseLength,
                              this.z * inverseLength);
    },
    
    /**
    * Returns the inverse of the calling quaternion
    * @return {Quaternion} If the Quaternion cannot be inversed, a Quaternion with x,y,z,w == 0.0 is returned
    */
    inverse: function () {
        "use strict";

        var norm, invNorm;
        
        norm = this.w * this.w + this.x * this.x + this.y * this.y * this.z * this.z;
        if (Math.abs(norm) > MathHelper.zeroTolerance) {
            invNorm = 1.0 / norm;
            return new Quaternion(this.w * invNorm,
                                  -this.x * invNorm,
                                  -this.y * invNorm,
                                  -this.z * invNorm);
        }
        return new Quaternion(0.0, 0.0, 0.0, 0.0);
    },
    
    /**
    * Returns the conjugate of the quaternion
    * @return {Quaternion}
    */
    conjugate: function () {
        "use strict";

        return new Quaternion(this.w, -this.x, -this.y, -this.z);
    },
    
    /**
    * Applies the quaternion rotation to the input vector and returns the result
    * @param {Vector3} v input vector to be rotated
    * @return {Vector3} The rotated vector
    */
    transform: function (v) {
        "use strict";

        //See Bishop, Van Verth (make sure to look at the errata)
        var p, d, c;
        d = 2.0 * (this.x * v.x + this.y * v.y + this.z * v.z);
        c = 2.0 * this.w;
        p = c * this.w - 1.0;
        return new Vector3(p * v.x + d * this.x + c * (this.y * v.z - this.z * v.y),
                           p * v.y + d * this.y + c * (this.z * v.x - this.x * v.z),
                           p * v.z + d * this.z + c * (this.x * v.y - this.y * v.x));
    },
    
    add: function (q) {
        "use strict";

        return new Quaternion(this.w + q.w, this.x + q.x, this.y + q.y, this.z + q.z);
    },
    
    /**
    * Returns a Quaternion representing the result of multiplying the calling Quaternion by Quaternion q
    * like q2 * q1 where q1 is applied before q2
    * @param {Quaternion} q input quaternion
    * @return {Quaternion}
    */
    multiply: function (q) {
        "use strict";

        return new Quaternion(this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z,
                              this.y * q.z - this.z * q.y + this.w * q.x + q.w * this.x,
                              this.z * q.x - this.x * q.z + this.w * q.y + q.w * this.y,
                              this.x * q.y - this.y * q.x + this.w * q.z + q.w * this.z);
    },
    
    /**
    * Multiplies each element in the Quaternion by the scalar f
    * @param {number} f input scalar
    * @return {Quaternion}
    */
    multiplyScalar: function (f) {
        "use strict";

        return new Quaternion(this.w * f, this.x * f, this.y * f, this.z * f);
    },
    
    /**
    * Converts the quaternion to a rotation matrix
    * @return {Matrix4x4}
    */
    toRotationMatrix: function () {
        "use strict";

        var x, y, z, wx, wy, wz, xx, xy, xz, yy, yz, zz;
        x = 2.0 * this.x;
        y = 2.0 * this.y;
        z = 2.0 * this.z;
        wx = x * this.w;
        wy = y * this.w;
        wz = z * this.w;
        xx = x * this.x;
        xy = y * this.x;
        xz = z * this.x;
        yy = y * this.y;
        yz = z * this.y;
        zz = z * this.z;
        
        return new Matrix4x4(1.0 - (yy + zz), xy - wz, xz + wy, 0,
                             xy + wz, 1.0 - (xx + zz), yz - wx, 0,
                             xz - wy, yz + wx, 1.0 - (xx + yy), 0,
                             0, 0, 0, 1);
    },
    
    /**
    * Converts the Quaternion to an axis and an angle
    * @return {Vector4} Containing the values x,y,z,angle where angle is in radians
    */
    toAxisAngle: function () {
        "use strict";

        var lengthSquared, inverseLength;
        
        lengthSquared = this.x * this.x + this.y * this.y + this.z * this.z;
        if (lengthSquared > MathHelper.zeroTolerance) {
            inverseLength = MathHelper.invSqrt(lengthSquared);
            return new Vector4(this.x * inverseLength, this.y * inverseLength, this.z * inverseLength, 2.0 * Math.acos(this.w));
        }
        return new Vector4(1, 0, 0, 0);
    },
    
    /**
    * Returns a string containing the current state of the Quaternion
    * @return {string}
    */
    toString: function () {
        "use strict";

        return '[' + this.w + ', ' + this.x + ', ' + this.y + ', ' + this.z + ']';
    }
};
/**
 * A class representing a 3D ray
 * @param {Vector3} origin The origin of the ray
 * @param {Vector3} direction The direction vector of the ray.  IMPORTANT: must be a unit vector
 * @constructor
 */
function Ray(origin, direction) {
    "use strict";

    /**
     * The origin of the ray
     * @type {Vector3}
     */
    this.origin = origin;

    /**
     * A unit vector indicating the direction of the ray
     * @type {Vector3}
     */
    this.direction = direction;
};
/**
*@constructor
*/
function Rectangle(x, y, width, height) {
    "use strict";

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
}

Rectangle.prototype = {

    intersect: function (rect) {
        "use strict";

        if (!this.intersectsWith(rect)) {
            this.x = this.y = this.width = this.height = 0;
        }
        else {
            var num = Math.max(this.x, rect.x);
            var num2 = Math.max(this.y, rect.y);
            this.width = Math.max((Math.min((this.x + this.width), (rect.x + rect.width)) - num), 0.0);
            this.height = Math.max((Math.min((this.y + this.height), (rect.y + rect.height)) - num2), 0.0);
            this.x = num;
            this.y = num2;
        }
    },

    intersectsWith: function (rect) {
        "use strict";

        if ((this.width < 0.0) || (rect.width < 0.0)) {
            return false;
        }
        return ((((rect.x <= (this.x + this.width)) && ((rect.x + rect.width) >= this.x)) && (rect.y <= (this.y + this.height))) && ((rect.y + rect.height) >= this.y));
    },

    getLeft: function () {
        "use strict";

        return this.x;
    },

    getRight: function () {
        "use strict";

        return this.x + this.width;
    },

    getTop: function () {
        "use strict";

        return this.y;
    },

    getBottom: function () {
        "use strict";

        return this.y + this.height;
    }
};
/**
* A vector class representing two dimensional space
* @constructor
* @param {number} x
* @param {number} y
*/
function Vector2(x, y) {
    "use strict";

    this.x = x;
    this.y = y;
}

Vector2.clone = function (v) {
    "use strict";

    return new Vector2(v.x, v.y);
};

Vector2.prototype = {
    /**
    * Calculates the dot product between the calling vector and parameter v
    * @param {Vector2} v input vector
    * @return {number}
    */
    dot: function (v) {
        "use strict";

        return this.x * v.x + this.y * v.y;
    },

    /**
    * Returns a new vector that's perpendicular to this vector
    * @return {Vector2}
    */
    perp: function () {
        "use strict";

        return new Vector2(this.y, -this.x);
    },

    /**
    * Creates a unit length version of the vector, which still points in the same direction as the original vector
    * @return {Vector2}
    */
    normalize: function () {
        "use strict";

        var length, inverseLength;
        
        length = this.length();
        if (length < MathHelper.zeroTolerance) {
            return new Vector2(0.0, 0.0);
        }

        inverseLength = 1.0 / length;
        return new Vector2(this.x * inverseLength,
                           this.y * inverseLength);
    },

    /**
    * Calculates the length of the vector
    * @return {number}
    */
    length: function () {
        "use strict";

        return Math.sqrt(this.x * this.x + this.y * this.y);
    },

    /**
    * Calculates the length of the vector squared.  Useful if only a relative length
    * check is required, since this is more performant than the length() method
    * @return {number}
    */
    lengthSquared: function () {
        "use strict";

        return this.x * this.x + this.y * this.y;
    },

    /**
    * Adds vector v to the current vector and returns the result.
    * @param {Vector2} v input vector
    * @returns {Vector2} A vector containing the addition of the two input vectors
    */
    add: function (v) {
        "use strict";

        return new Vector2(this.x + v.x,
                           this.y + v.y);
    },

    /**
    * Subtracts vector v from the current vector and returns the result.
    * @param {Vector2} v input vector
    * @returns {Vector2} A vector containing the subtraction of the two input vectors
    */
    subtract: function (v) {
        "use strict";

        return new Vector2(this.x - v.x,
                           this.y - v.y);
    },

    /**
    * Multiplies each element of the vector with scalar f and returns the result
    * @param {number} f a value that will be multiplied with each element of the vector
    * @return {Vector2}
    */
    multiplyScalar: function (f) {
        "use strict";

        return new Vector2(this.x * f,
                           this.y * f);
    },

    /**
    * Checks if the calling vector is equal to parameter vector v
    * @param {Vector2} v input vector
    * @returns {boolean} A Boolean value, true if each element of the calling vector match input vector v, false otherwise
    */
    equals: function (v) {
        "use strict";

        return this.x === v.x &&
               this.y === v.y;
    },

    /**
    * Linearly interpolates between two vectors (including w component).
    * @param {Vector2} other second vector to LERP between.
    * @param {number} alpha  value between 0-1.
    * @return {Vector2} 
    */
    lerp: function(other, alpha) {
        "use strict";

        return new Vector2(this.x + alpha * (other.x - this.x),
                           this.y + alpha*(other.y - this.y));
    },


    
    /**
    * Returns a string containing the current state of the vector, useful for debugging purposes
    * @return {string}
    */
    toString: function () {
        "use strict";

        return '[' + this.x + ', ' + this.y + ']';
    }
};
/**
* A vector class representing three dimensional space
* @constructor
* @param {number} x
* @param {number} y
* @param {number} z
*/
function Vector3(x, y, z) {
    "use strict";

    this.x = x;
    this.y = y;
    this.z = z;
}

/**
* Creates a Vector3 instance from a Vector3 instance
* @param {Vector2} v A Vector2 instance
* @param {number} z The z value to return in the Vector3 instance
* @return {Vector3}
*/
Vector3.createFromVector2 = function(v, z) {
    "use strict";

    return new Vector3(v.x, v.y, z);
};

Vector3.clone = function (v) {
    "use strict";

    return new Vector3(v.x, v.y, v.z);
};

Vector3.prototype = {
    /**
    * Calculates the dot product between the calling vector and parameter v
    * @param {Vector3} v input vector
    * @return {number}
    */
    dot: function (v) {
        "use strict";

        return this.x * v.x + this.y * v.y + this.z * v.z;
    },

    /**
    * Creates a unit length version of the vector, which still points in the same direction as the original vector
    * @return {Vector3}
    */
    normalize: function () {
        "use strict";

        var length, inverseLength;
        
        length = this.length();
        if (length < MathHelper.zeroTolerance) {
            return new Vector3(0.0, 0.0, 0.0);
        }

        inverseLength = 1.0 / length;


        return new Vector3(this.x * inverseLength,
                           this.y * inverseLength,
                           this.z * inverseLength);
    },

    /**
    * Calculates the cross product of the vector and vector parameter v and returns the result
    * @param {Vector3} v input vector
    * @return {Vector3}
    */
    cross: function (v) {
        "use strict";

        return new Vector3(this.y * v.z - this.z * v.y,
                           this.z * v.x - this.x * v.z,
                           this.x * v.y - this.y * v.x);
    },

    /**
    * Calculates the length of the vector
    * @return {number}
    */
    length: function () {
        "use strict";

        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    },

    /**
    * Calculates the length of the vector squared.  Useful if only a relative length
    * check is required, since this is more performant than the length() method
    * @return {number}
    */
    lengthSquared: function () {
        "use strict";

        return this.x * this.x + this.y * this.y + this.z * this.z;
    },

    /**
    * Adds vector v to the current vector and returns the result.
    * @param {Vector3} v input vector
    * @returns {Vector3} A vector containing the addition of the two input vectors
    */
    add: function (v) {
        "use strict";

        return new Vector3(this.x + v.x,
                           this.y + v.y,
                           this.z + v.z);
    },

    /**
    * Subtracts vector v from the current vector and returns the result.
    * @param {Vector3} v input vector
    * @returns {Vector3} A vector containing the subtraction of the two input vectors
    */
    subtract: function (v) {
        "use strict";

        return new Vector3(this.x - v.x,
                           this.y - v.y,
                           this.z - v.z);
    },

    /**
    * Multiplies each element of the vector with scalar f and returns the result
    * @param {number} f a value that will be multiplied with each element of the vector
    * @return {Vector3}
    */
    multiplyScalar: function (f) {
        "use strict";

        return new Vector3(this.x * f,
                           this.y * f,
                           this.z * f);
    },

    /**
    * Checks if the calling vector is equal to parameter vector v
    * @param {Vector3} v input vector
    * @return {boolean} A Boolean value, true if each element of the calling vector match input vector v, false otherwise
    */
    equals: function (v) {
        "use strict";

        return this.x === v.x &&
               this.y === v.y &&
               this.z === v.z;
    },

    /**
    * Linearly interpolates between two vectors (including w component).
    * @param {Vector3} other second vector to LERP between.
    * @param {number} alpha  value between 0-1.
    * @return {Vector3} 
    */
    lerp: function(other, alpha) {
        "use strict";

        return new Vector3(this.x + alpha * (other.x - this.x),
                           this.y + alpha*(other.y - this.y),
                           this.z + alpha*(other.z - this.z));
    },

    /**
    * Returns a string containing the current state of the vector, useful for debugging purposes
    * @return {string}
    */
    toString: function () {
        "use strict";

        return '[' + this.x + ', ' + this.y + ', ' + this.z + ']';
    }
};
/**
* A vector class representing four dimensional space
* @constructor
* @param {number} x
* @param {number} y
* @param {number} z
* @param {number} w
*/
function Vector4(x, y, z, w) {
    "use strict";

    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
}

/**
 * Creates a Vector4 instance from a Vector3 isntance, w is set to 1.0
 * @param {Vector3} v
 * @return {Vector4}
 */
Vector4.createFromVector3 = function(v) {
    "use strict";

    return new Vector4(v.x, v.y, v.z, 1);
};

Vector4.prototype = {
    /**
    * Calculates the dot product between the calling vector and parameter v
    * @param {Vector4} v input vector
    * @return {number}
    */
    dot: function (v) {
        "use strict";

        return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
    },

    /**
    * Creates a unit length version of the vector, which still points in the same direction as the original vector
    * @return {Vector4}
    */
    normalize: function () {
        "use strict";

        var length, inverseLength;
        
        length = this.length();
        if (length < MathHelper.zeroTolerance) {
            return new Vector4(0.0, 0.0, 0.0, 0.0);
        }

        inverseLength = 1.0 / length;
        return new Vector4(this.x * inverseLength,
                           this.y * inverseLength,
                           this.z * inverseLength,
                           this.w * inverseLength);
    },

    /**
    * Calculates the length of the vector
    * @return {number}
    */
    length: function () {
        "use strict";

        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    },

    /**
    * Calculates the length of the vector squared.  Useful if only a relative length
    * check is required, since this is more performant than the length() method
    * @return {number}
    */
    lengthSquared: function () {
        "use strict";

        return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
    },

    /**
    * Adds vector v to the current vector and returns the result.
    * @param {Vector4} v input vector
    * @return {Vector4} A vector containing the addition of the two input vectors
    */
    add: function (v) {
        "use strict";

        return new Vector4(this.x + v.x,
                           this.y + v.y,
                           this.z + v.z,
                           this.w + v.w);
    },

    /**
    * Subtracts vector v from the current vector and returns the result.
    * @param {Vector4} v input vector
    * @return {Vector4} A vector containing the subtraction of the two input vectors
    */
    subtract: function (v) {
        "use strict";

        return new Vector4(this.x - v.x,
                           this.y - v.y,
                           this.z - v.z,
                           this.w - v.w);
    },

    /**
    * Multiplies each element of the vector with scalar f and returns the result
    * @param {number} f a value that will be multiplied with each element of the vector
    * @return {Vector4}
    */
    multiplyScalar: function (f) {
        "use strict";

        return new Vector4(this.x * f,
                           this.y * f,
                           this.z * f,
                           this.w * f);
    },

    /**
    * Checks if the calling vector is equal to parameter vector v
    * @param {Vector4} v input vector
    * @return {boolean} A Boolean value, true if each element of the calling vector match input vector v, false otherwise
    */
    equals: function (v) {
        "use strict";

        return this.x === v.x &&
               this.y === v.y &&
               this.z === v.z &&
               this.w === v.w;
    },

    /**
    * Linearly interpolates between two vectors (including w component).
    * @param {Vector4} other second vector to LERP between.
    * @param {number} alpha  value between 0-1.
    * @return {Vector4} 
    */
    lerp: function(other, alpha) {
        "use strict";

        return new Vector4(this.x + alpha * (other.x - this.x),
                           this.y + alpha*(other.y - this.y),
                           this.z + alpha*(other.z - this.z),
                           this.w + alpha*(other.w - this.w));
    },

    /**
    * Returns a string containing the current state of the vector, useful for debugging purposes
    * @return {string}
    */
    toString: function () {
        "use strict";

        return '[' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.w + ']';
    }
};
var Config = {
    debug: false,
    forceIERenderPath: true,
    outputMultiLODTiles: true,
    scanConvertSize: 40,
	polyInflate: 0.05
};
/**
* A utility class for common functionality
* @class
*/
var Utils = {

    /**
     * Wraps console.log for debugging.
     */
    log: function () {
        "use strict";

        if (window.console && Config.debug) {
            console.log.apply(console, arguments);
        }
    },

    /**
     * Applys prototype inheritance to the derived class, for more info see:
     * http://www.kevlindev.com/tutorials/javascript/inheritance/index.htm
     * @param {Object} derived The derived classes constructor
     * @param {Object} base The base classes constructor
     */
    extend: function (derived, base) {
        "use strict";

        /** 
        * @constructor
        * @ignore 
        */
        function Inheritance() {
        }
        Inheritance.prototype = base.prototype;

        derived.prototype = new Inheritance();
        derived.prototype.constructor = derived;
        derived.baseConstructor = base;
        derived.superClass = base.prototype;
    },

    _eventListeners : {},


    /**
     * This adds event handlers to an element. Note, you can subscribe to multiple events via space seperated list.
     */
    bind: function (element, eventName, handler, useCapture) {
        "use strict";

        var i,
            eventNames = eventName.split(' ');

        for(i = 0; i < eventNames.length; ++i) {    
            eventName = eventNames[i];

            if(!Utils._eventListeners[element]) {
                Utils._eventListeners[element] = {};
            }
            if(!Utils._eventListeners[element][eventName]) {
                Utils._eventListeners[element][eventName] = [];
            }

            // technique from:
            // http://blog.paranoidferret.com/index.php/2007/08/10/javascript-working-with-events/
            if (element.addEventListener) {
                if (eventName == 'mousewheel') {
                    element.addEventListener('DOMMouseScroll', handler, useCapture);
                }
                // we are still going to add the mousewheel -- not a mistake!
                // this is for opera, since it uses onmousewheel but needs addEventListener.
                element.addEventListener(eventName, handler, useCapture);
            } else if (element.attachEvent) {
                element.attachEvent('on' + eventName, handler);
                if (useCapture && element.setCapture) {
                    element.setCapture();
                }
            }

            Utils._eventListeners[element][eventName].push([handler, useCapture]);
        }
    },

    _unbindAll: function (element) {
        "use strict";

        if(Utils._eventListeners[element]) {
            for(var k in Utils._eventListeners[element]) {
                for(var i = 0; i <  Utils._eventListeners[element][k].length; ++i) {
                    Utils.unbind(element, k, Utils._eventListeners[element][k][i][0], Utils._eventListeners[element][k][i][1]);
                }
            }
        }
    },

    unbind: function (element, eventName, handler, useCapture) {
        "use strict";

        if(element && !eventName) {
            Utils._unbindAll(element);
        } else {
            var i, j, k, count,
                eventNames = eventName.split(' ');
            for(i = 0; i < eventNames.length; ++i) {    
                eventName = eventNames[i];

                if (element.removeEventListener) {
                    if (eventName == 'mousewheel') {
                        element.removeEventListener('DOMMouseScroll', handler, useCapture);
                    }
                    // we are still going to remove the mousewheel -- not a mistake!
                    // this is for opera, since it uses onmousewheel but needs removeEventListener.
                    element.removeEventListener(eventName, handler, useCapture);
                } else if (element.detachEvent) {
                    element.detachEvent('on' + eventName, handler);
                    if (useCapture && element.releaseCapture) {
                        element.releaseCapture();
                    }
                } 

                if(Utils._eventListeners[element] && Utils._eventListeners[element][eventName]) {
                    for(j = 0; j < Utils._eventListeners[element][eventName].length; ++j) {
                        if(Utils._eventListeners[element][eventName][j][0] === handler) {
                            Utils._eventListeners[element][eventName][j].splice(j,1);
                        }
                    }
                    if(Utils._eventListeners[element][eventName].length === 0) {
                        delete Utils._eventListeners[element][eventName];
                    }
                }
            }

            count = 0;
            if(Utils._eventListeners[element]) {
                for(k in Utils._eventListeners[element]) {
                    ++count; 
                }
                if(count === 0) {
                    delete Utils._eventListeners[element];
                }
            }
        }
    },

    /**
     * This sets the opacity which works across browsers
     */
    setOpacity: function () {
        "use strict";

        /**
         * @param {Object} elem
         * @param {number} opacity
         */
        function w3c(elem, opacity) {
                elem.style.opacity = opacity;
        }
         /**
         * @param {Object} elem
         * @param {number} opacity
         */    
        function ie(elem, opacity) {
            opacity *= 100;
            var filter;
            try {
                filter = elem.filters.item('DXImageTransform.Microsoft.Alpha');
                if (opacity < 100) {
                    filter.Opacity = opacity;
                    if (!filter.enabled) {
                        filter.enabled = true;
                    }
                } else {
                    filter.enabled = false;
                }
            }
            catch (ex) {
                if (opacity < 100) {
                    elem.style.filter = (elem.currentStyle || elem.runtimeStyle).filter + ' progid:DXImageTransform.Microsoft.Alpha(opacity=' + opacity + ')';
                }
            }		
        }
            
        var d = document.createElement('div');
        return typeof d.style.opacity !== 'undefined' && w3c
               || typeof d.style.filter !== 'undefined' && ie
               || function() {};
    }(),

    /**
     * Adds CSS to a DOM element. 
     * @param {Object} element
     * @param {Object} obj  These are key-value pairs of styles e.g. {backgroundColor: 'red'}
     */
    css: function (element, obj) {
        "use strict";

        var k;
        for(k in obj) {
            if(obj.hasOwnProperty(k)) {
                if(k === 'opacity') {
                    Utils.setOpacity(element, obj[k]);
                } else {
                    element.style[k] = obj[k];
                }
            }
        }
    },

    /**
     * Get the scroll wheel data across browsers
     * @param {Object} e
     * @return {number}
     */
    getWheelDelta: function (e) {
        "use strict";

        //Get the wheel data in a browser-agnostic way.
        //See http://www.switchonthecode.com/tutorials/javascript-tutorial-the-scroll-wheel
        return e.detail ? e.detail * -1 : e.wheelDelta / 40;
    },

    /**
     * Tests if an url is of the form "data:/mimetype/base64data"
     * @param {string} url
     * @return {boolean}
     */
    isDataUrl: function (url) {
        "use strict";

        return /^data:/.test(url);
    },

    /**
     *  Tests if the url is a relative url
     *  @param {string} url
     *  @return {boolean} 
     */
    isRelativeUrl: function (url) {
        "use strict";

        var hasProtocol = /^ftp:\/\//.test(url) || /^http:\/\//.test(url) || /^https:\/\//.test(url) || /^file:\/\//.test(url);
        return !hasProtocol;
    },

    hostnameRegexp : new RegExp('^(?:f|ht)tp(?:s)?\://([^/]+)', 'im'),
    filehostnameRegexp : new RegExp('^file\://([^/]+)', 'im'),

    /**
     * Returns the hostname 
     * @param {string} url
     * @return {string}
     */
    getHostname: function (url) {
        "use strict";

        var result =  Utils.hostnameRegexp.exec(url);
        if(!result || result.length !== 2) {
            result = Utils.filehostnameRegexp.exec(url);
        }

        if(!result || result.length !== 2) {
            return '';
        } else {
            return result[1].toString();
        }
    },

    /**
     * Determines if a pair of urls are on the same domain
     * @param {string} url1
     * @param {string} url2
     * @return  {boolean} 
     */
    areSameDomain: function (url1, url2) {
        "use strict";

        var host1 = Utils.getHostname(url1).toLowerCase(),
            host2 = Utils.getHostname(url2).toLowerCase();
        return host1 === host2;
    }
};
function extend(subclass, base) {
    "use strict";

    function f() {
    }
    f.prototype = base.prototype;
    subclass.prototype = new f();
    subclass.prototype.constructor = subclass;
    subclass.__super = base;
};

function Geometry(params) {
    "use strict";

	Geometry.__super.call(this);

	this._isDirty = true;

	this._vertices = params.vertices || [];
	this._vertexSize = params.vertexSize || 0;
	this._texCoords = params.texCoords || [];
	this._texCoordSize = params.texCoordSize || 0;
	this._indices = params.indices || [];
	this._primitiveType = params.primType || "invalid";
	this._primitiveLength = params.primLength || 0;
}

Geometry.QUADS = 1;
Geometry.TRIANGLES = 2;

extend(Geometry, Object);

function Texture(url, loadCallback, loadCallbackInfo, wrapS, wrapT, minFilter, magFilter, offsetX, offsetY, width, height) {
    "use strict";

    Texture.__super.call(this);

	this._url = url;
	this._loadCallback = loadCallback;
	this._loadCallbackInfo = loadCallbackInfo;
	this._image = null;

    this._offsetX = offsetX;
    this._offsetY = offsetY;
    this._width = width;
    this._height = height;

	this._wrapS = wrapS != null ? wrapS : Texture.Wrap.CLAMP_TO_EDGE;
	this._wrapT = wrapT != null ? wrapT : Texture.Wrap.CLAMP_TO_EDGE;

	this._minFilter = minFilter != null ? minFilter : Texture.Filter.LINEAR_MIPMAP_LINEAR;
	this._magFilter = magFilter != null ? magFilter : Texture.Filter.LINEAR;
	
	this._isReady = false;
	this._isDirty = false;
}

Texture.Wrap = {
    CLAMP_TO_EDGE: 1,
    REPEAT: 2
};

Texture.Filter = {
    NEAREST: 0,
    LINEAR: 1,
    LINEAR_MIPMAP_LINEAR: 2
};

extend(Texture, Object);

Texture.prototype.loadImageInDOM = function () {
    "use strict";

    this._image = new Image();
    var tex = this;
    this._image.onload = function () {
       if (tex._loadCallback) {
           tex._loadCallback(tex._url, tex._loadCallbackInfo, tex); 
       }
       tex._isReady = true;
       tex._isDirty = true;
    }; 

    this._image.crossOrigin = ''; //Required for webgl textures.  Must be set before setting the src property.
    this._image.src = this._url;
};

function AnimationBeginEndValues(begin, end) {
    "use strict";

	this.begin = begin;
	this.end = end;
	AnimationBeginEndValues.__super.call(this);
}
extend(AnimationBeginEndValues, Object);

function Animation() {
    "use strict";

	Animation.__super.call(this);

	this.opacity = new AnimationBeginEndValues(1,1);
	this.x = new AnimationBeginEndValues(0,0);
	this.y = new AnimationBeginEndValues(0,0);
	this.sx = new AnimationBeginEndValues(1,1);
	this.sy = new AnimationBeginEndValues(1,1);
	this.rotate = new AnimationBeginEndValues(0,0);
	this._duration = 0;
	this._startT = 0;
	this._easingMode = "linear";

	this._ended = false;
	this._endCallbackInfo = null;
	this._endCallback = null;
}
extend(Animation, Object);
Animation.prototype.initStates = function (params) {
    "use strict";

    for (var prop in params) {
        this[prop] = [params[prop], params[prop]];
    }
};

Animation.prototype.getEndStates = function () {
    "use strict";

    var ret = {};
    for (var prop in this) {
        if (this[prop] instanceof AnimationBeginEndValues) {
            ret[prop] = this[prop].end;
        }
    }
    return ret;
};

function Material() {
    "use strict";

	Material.__super.call(this);
	Material._animation = null;
	Material._animationEndStates = null;
}

extend(Material, Object);

Material.prototype.apply = function (/*context*/) {
    "use strict";

    throw "You should not have reached base Material.apply().";
};

function SingleTextureMaterial(tex) {
    "use strict";

	this._texture = tex;
	SingleTextureMaterial.__super.call(this);
}
extend(SingleTextureMaterial, Material);

function Transform() {
    "use strict";

	this._rotX = this._rotY = this._rotZ = 0;
	this._translateX = this._translateY = this._translateZ = 0;
	this._scaleX = this._scaleY = this._scaleZ = 0;
	Transform.__super.call(this);
}
extend(Transform, Matrix4x4);

Transform.prototype.apply = function (/*context*/) {
    "use strict";

    throw "You should not have reached base Transform.apply().";
};

/**
 * Renderable binds geometry (often quads or triangles), materials (textures or shaders), and 
 * transforms (typically rotation,scale,translations.).
 */
function Renderable(params) {
    "use strict";

	this._geometry = params.geometry || null;
	this._material = params.material || null;
	this._transform = params.transform || null;
}
extend(Renderable, Object);

var uniqueId = (function () {
    "use strict";

    var count = (new Date()).getTime(); 
    return function () {
        ++count;
        return count;
    };
})();


function Renderer(win) {
    "use strict";

	Renderer.__super.constructor.call(this);

	this._name = 'BaseRenderer';

	this._renderables = {};
    this._removedRenderables = {};
	this._nodes = {};
	this._window = win;
	this._rootElement = null;
	this._viewProjMatrix = Matrix4x4.createIdentity();
    this._clearColor = {r:0.0, g:0.0, b:0.0, a:1.0};
}

extend(Renderer, Object);

/**
 * Draws any renderables added to the scene. This should be invoked once per frame.
 * Platforms provide specific implementations.
 */
Renderer.prototype.render = function () {
    "use strict";

    throw 'The renderer you are using does not implement the render() method.';
    /* Usual rendering logic:
    for (renderable in _renderables) {
        apply transform;
        apply material;
        draw geometry;
    }
    */
};

/**
 * This adds a renderable to the scene. 
 * TODO Do we need this id array, would draw order flag be sufficient?
 */
Renderer.prototype.addRenderable = function (renderableArray, idArray) {
    "use strict";

    var i, uid, ids = [];
    for (i = 0; i < renderableArray.length; ++i) {
        uid = (idArray != undefined && idArray[i] != undefined) ? 
            idArray[i] : uniqueId();
        if(!renderableArray[i]) {
            throw  'Expected valid renderable';
        }
        this._renderables[uid] = renderableArray[i];
        ids.push(uid);
    }
    return ids;
};

/**
 * A helper that can be used by implementations of setClearColor.
 * @ignore 
 */
Renderer.prototype._checkClearColor = function (color) {
    "use strict";

    if(!color || color.r == null || color.g == null || color.b == null || color.a == null) {
        throw 'Color must include r,g,b,a numeric properties.';
    }
};

/**
 * Set the color to use for the initial frame buffer pixels (clearColor in GL parlance.) 
 * @param {{r:{number}, g:{number}, b:{number},a:{number}} color  The RGBA
 * components of the color between (each component should be between 0.0-1.0).
 */
Renderer.prototype.setClearColor = function (/*color*/) {
    "use strict";

    throw 'setClearColor is not implemented';
};


/**
 * @ignore
 *  Used for internal debugging of Renderer implementations.
 */
Renderer.prototype._error = function(msg) {
    "use strict";

    if (Config.debug) {
        throw new Error(msg);
        debugger;
    }
};

/**
 * This removes a node or renderable from the scene. 
 */
Renderer.prototype.remove = function(idArray) {
    "use strict";

    var i, id;
    for(i = 0; i < idArray.length; ++i) {
        id = idArray[i];
        if (this._renderables[id] != undefined) {
    		this._removedRenderables[id] = this._renderables[id];
            delete this._renderables[id];
        } else if (this._nodes[id] != undefined) {
            delete this._nodes[id];
        } else {
            this._error('Object ' + id + ' not found.');
        }
    }
};

/**
 * Enqueues an animation for execution. Try to use CSS style property names when possible. 
 * implementations should ignore properties they don't know how to animate to allow more 
 * advanced renderers to enhance the expierence when possible.
 *
 * @param {Material} renderable         The renderable whose properties/assets we'll be animating.
 * @param {Object}   startProperties    The property names (e.g.,
 *                                      'opacity','width','height') and values at the start. If this is null we
 *                                      Animate from current property state.
 * @param {Object}   endProperties      The property names (e.g.,
 *                                      'opacity','width','height') and values
 *                                      at the end of the animation.
 * @param {Number}   duration           The duration in ms.
 * @param {string?}  easing             The animation ease function, (e.g. 'linear', 'ease-in-out')
 */
Renderer.prototype.animate = function(/*renderable, 
                      startProperties, 
                      endProperties, 
                      duration,
                      easing,
					  completeCallback,
					  completeCallbackInfo*/) {
    "use strict";

    throw 'The renderer does not implement animate function';
    //Implications.
    //   (a) materials are exposed
    //        - works fine for JS , how about for SL? 
    //   (b) property/values must make sense for materials (coupling.) 
    //   should this be on the renderable instead?
};

/**
 * Sets the view projection matrix of the scene .
 */
Renderer.prototype.setViewProjectionMatrix = function (mat) {
    "use strict";

	this._viewProjMatrix = mat;
};
function GridGeometry(width, height, nSegX, nSegY, useTris) {
    "use strict";

	GridGeometry.__super.call(this, {});

	var x, y,
	gridX = nSegX || 1,
	gridY = nSegY || 1,
	gridX1 = gridX + 1,
	gridY1 = gridY + 1,
	stepX = width / gridX,
	stepY = height / gridY;
	for( y = 0; y < gridY1; y++ ) {
		for( x = 0; x < gridX1; x++ ) {
			var xx = x * stepX;
			var yy = y * stepY;
			this._vertices.push(xx, yy, 0);
		}
	}
	for( y = 0; y < gridY; y++ ) {
		for( x = 0; x < gridX; x++ ) {
			var a = x + gridX1 * y, b = x + gridX1 * ( y + 1 ),
				c = ( x + 1 ) + gridX1 * ( y + 1 ),
				d = ( x + 1 ) + gridX1 * y;
			if (! useTris) {
				this._indices.push(a, b, c, d);
				this._texCoords.push(x / gridX, y / gridY ,
						x / gridX, ( y + 1 ) / gridY,
						(x + 1 ) / gridX, ( y + 1 ) / gridY,
						(x + 1 ) / gridX, y / gridY);
			} else {
				this._indices.push(a, b, c);
				this._indices.push(a, c, d);
				this._texCoords.push(x / gridX, y / gridY ,
						x / gridX, ( y + 1 ) / gridY,
						(x + 1 ) / gridX, ( y + 1 ) / gridY);
				this._texCoords.push(x / gridX, y / gridY ,
						(x + 1 ) / gridX, ( y + 1 ) / gridY,
						(x + 1 ) / gridX, y / gridY);
			}
		}
	}

	this._texCoordSize = 2;
	this._primitiveType = useTris ? Geometry.TRIANGLES : Geometry.QUADS;
	this._primitiveLength = gridX*gridY*(useTris?2:1);
	this._isDirty = true;
};

extend(GridGeometry, Geometry);

function QuadGeometry(width, height)
{
    "use strict";

	this._vertices = [  width, height, 0,
                        0, height, 0,
                        0, 0, 0, 
                        width, 0, 0 ];

	this._texCoords = [  1, 1,   0, 1,   0, 0,   1, 0 ];
    this._indices = [  0, 1, 2,   0, 2, 3 ];

	this._texCoordSize = 2;
	this._primitiveType = Geometry.TRIANGLES;
	this._primitiveLength = 2;
	this._isDirty = true;
}

function QuadGeometryWireframe(width, height)
{
    "use strict";

	this._vertices = [  width, height, 0,
                        0, height, 0,
                        0, 0, 0, 
                        width, 0, 0 ];

	this._texCoords = [  1, 1,   0, 1,   0, 0,   1, 0 ];
    this._indices = [  0, 1, 1, 2,  2, 3, 3, 0, 0,2, 1,3 ];

	this._texCoordSize = 2;
	this._primitiveType = Geometry.TRIANGLES;
	this._primitiveLength = 2;
	this._isDirty = true;
}

extend(QuadGeometry, Geometry);

function TexturedQuadRenderable(width, height, transform, 
				textureURL, loadCallback, loadCallbackInfo, loadTextureInDOM, offsetX, offsetY) {
    "use strict";

	TexturedQuadRenderable.__super.call(this, {});
	var self = this;


    this._geometry = new QuadGeometry(width, height);
	this._transform = transform ? transform : Matrix4x4.createIdentity();

	if (textureURL) {
		var texture = new Texture(textureURL, null, loadCallbackInfo, null, null, null, null, offsetX, offsetY, width, height);
		this._material = new SingleTextureMaterial(texture);

		if (loadTextureInDOM) {
			texture.loadImageInDOM();
		}
	}
}

extend(TexturedQuadRenderable, Renderable);

/** 
 * This is a handy helper class that uses canvas to create a renderable that has fixed color
 * and a message. 
 */
function TestQuadRenderable(width, height, transform, backgroundColor, text, loadTexture) {
    "use strict";

	TexturedQuadRenderable.__super.call(this, {});
	var self = this;
    var buffer = document.createElement('canvas');
    buffer.width = width;
    buffer.height = height;
    var context = buffer.getContext('2d');
    context.clearRect(0, 0, width, height);
    context.fillStyle = backgroundColor || 'gray';
    context.fillRect(0, 0, width, height);
    context.fillStyle = 'black';
    context.font = '12pt Segoe UI,sans-serif';
    context.fillText(text, width*0.3, height*0.3);
    var textureURL = buffer.toDataURL(); //We pass this into texture below.
	var texture = new Texture(textureURL);
    if(loadTexture) {
        texture.loadImageInDOM();
    }

	self._material = new SingleTextureMaterial(texture);
	self._transform = transform ? transform : Matrix4x4.createIdentity();
    self._geometry = new QuadGeometry(width, height);
}

extend(TexturedQuadRenderable, Renderable);



//------------------------------------------------------------------------------
// <Copyright From='2004' To='2020' Company='Microsoft Corporation'> 
//		Copyright (c) Microsoft Corporation. All Rights Reserved. 
//		Information Contained Herein is Proprietary and Confidential. 
// </Copyright>
//------------------------------------------------------------------------------

/**
 * Caches arbitary key(string)/value(object) pairs
 * Cache will hold at least [minEntries] entries, but might hold more.
 * @param {number} minEntries
 * @constructor
 */
var MemoryCache = function (minEntries) {
    "use strict";

	var self = this;

    var attributePrefix = '$$';
    var Debug = {};
    Debug.assert = function() {};

	// ****************************************
	// ** PRIVATE FIELDS 

	// array of hash tables to store the marking of recently downloaded
	// Note: this logic will maintian between _maxEntries and _maxEntries * _maxHashtables entries
	var _maxEntries = minEntries;
	var _maxHashtables = 3;
	var _countKey = attributePrefix + 'count';
	var _cache = [{}];
	_cache[0][_countKey] = 0;

	var _disposer;

	// **
	// ****************************************

	// ****************************************
	// ** PRIVILEGED METHODS

	/**
     * tries to get value for provided key
	 * doesn't return anything (a.k.a. returns "undefined") if there is no match
     * @param {string} key
     * @param {boolean=} refresh
     */
	self.get = function (key, refresh) {
	    Debug.assert(typeof key === 'string', 'Argument: key');

	    var value;

	    // look for the value starting with latest hashtable
	    var i = _cache.length;
	    var latest = true;
	    while (i--) {
	        value = _cache[i][key];
	        if (value !== undefined) {
	            // refresh the value if we need to
	            if (refresh && !latest) {
	                self.insert(key, value);
	            }
	            return value;
	        }
	        latest = false;
	    }
	};

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

	/**
     * inserts given value to the cache
     * @param {string} key
     * @param {Object} value
     */
	self.insert = function (key, value) {
	    Debug.assert(typeof key === 'string', 'Argument: key');
	    Debug.assert(value !== undefined, 'Argument: value');

	    // in order to make expiration of cache preformat, use array of hashtables
	    // store they key/value pair only in the latest hashtable
	    // if the latest hasbtable is full, create a new one and drop the oldest
	    var hashtable = _cache[_cache.length - 1];
	    if (hashtable[key] === undefined) {
	        // if the entry doesn't exist
	        if (hashtable[_countKey] < _maxEntries) {
	            // and the latest hastable is not full
	            // simply increment entry count on it
	            hashtable[_countKey]++;
	        } else {
	            // if the lastest hashtable if full
	            // create a new hashtable
	            hashtable = {};
	            hashtable[_countKey] = 1;
	            _cache.push(hashtable);

	            // and if we go over limit, drop the oldest one
	            if (_cache.length > _maxHashtables) {
	                var oldHashtable = _cache.shift();
	                if (_disposer) {
	                    // Note: "var k in" syntax is bad, but for this case it seems to be lesser of evils
	                    // alternative is keeping track of all the keys in an array, which would slow down common scenarios
	                    // where MemoryCahce doesn't need to dispose it's elements
	                    for (var k in oldHashtable) {
	                        if (k !== _countKey && oldHashtable.hasOwnProperty(k))
	                        {
	                            var oldObject = oldHashtable[k];
	                            // we also need to check if that object doesn't exist in newer tables
	                            if (oldObject !== self.get(k))
	                            {
	                                _disposer(oldObject);
	                            }
	                        }
	                    }
	                }
	            }
	        }
	    }

	    // store the pair in the latest hashtable
	    hashtable[key] = value;
	};

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

	/**
     * sets a function that should be used for disposing the elements
     * @param {Function} disposer
     */
	self.useDisposer = function (disposer) {
		_disposer = disposer;
	};

    /**
     * Returns the current size of the cache
     * @return {number}
     */
    self.size = function() {
        var i,k,count = 0;
        for(i = 0; i < _cache.length; ++i) {
            if(_cache[i]) {
                for(k in _cache[i])  {
                    if(_cache[i].hasOwnProperty(k) && k !== _countKey) {
                        ++count;
                    }
                }
            }
        }
        return count;
    };

	// **
	// ****************************************
};
/** 
 * A priority tile downloader.
 * This is very simple and *doesn't* yet support grouping callbacks.
 * instead it's up to the application loop to call update and check completed array for new results.
 * @param {boolean} useCORS indicates if Cross Origin Resource Sharing image tags should be used.
 * @constructor
 */
var PriorityNetworkDownloader = function (useCORS, tileDownloadFailedCallback, tileDownloadSucceededCallback) {
    "use strict";

	var self = this;

    self.useCORS = (useCORS || false);

    var  _spacerImageUrl = 'data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';

	// if image isn't downloaded in this many milliseconds, free up the download slot
	var _downloadTimeout = 10000;
    var _maxConcurrentTileDownloads = 6;

	var _queue = [];
	var _activeDownloadsCount = 0;
	var _activeDownloads = {};

	// cached image downloads: [url] -> [<img src=url/>];
	var _downloaded = new MemoryCache(300);
	var _failed = new MemoryCache(30);
	var _allDownloadedUrls = new MemoryCache(200);

    var _succeedCount = 0;
    var _failCount = 0;

    //if no failure/success callbacks str specified, then define no-op ones
    tileDownloadFailedCallback = tileDownloadFailedCallback || function () {};
    tileDownloadSucceededCallback = tileDownloadSucceededCallback || function () { };

	// Safari (iPad and iPhone) and Android seem to leak memory when recycling images...
	if(quirks.useImageDisposer) {
		_downloaded.useDisposer(function (o) {
			if (o && o.src) {
				o.src = _spacerImageUrl; 
			}
		});
	}

	var attributePrefix = '$$';
	var _downloadRequestKey = attributePrefix + 'downloadRequest';
	var _timeoutIdKey = attributePrefix + 'timeoutid';
	var _processedKey = attributePrefix + 'processed';
    //Used when processing responses in completed.
    var _tokenKey     = 'token';

    self.completed = [];

	self.getState = function (url)
	{
		if (_downloaded.get(url)) {
			return TileDownloadState.ready;
		}
		if (_allDownloadedUrls.get(url)) {
			return TileDownloadState.cacheExpired;
		} 

		var failedState = _failed.get(url);
		if (failedState !== undefined) {
			return failedState;
		}

		if (_activeDownloads[url]) {
			return TileDownloadState.downloading;
		}

		return TileDownloadState.none;
	};

    /**
     * enqueue an image to download
     * @param {string} url
     * @param {number} priority
     * @param {Object} token
     */
	self.downloadImage = function (url, priority, token) {
        if(self.getState(url) === TileDownloadState.ready) {
            //We've got it in the cache. Make it avaible immediately.
            self.completed.push(_downloaded.get(url));
        } else {
            _queue.push({
                url: url,
                priority: priority,
                token: token
            });
        }
	};

    /**
     * Update the priority on an pending download.
     * @param {string} url
     * @param {number} priority
     */
    self.updatePriority = function(url, priority) {
        //Look for duplicates...
        var i, found = false;
        for(i = 0; i < _queue.length; ++i) {
            if(_queue.url === url) {
                found = true;
                _queue.priority = priority;
                break;
            }
        }

        if(!found) {
            throw 'Expected item to be in queue.'
        }
    };

    /**
     * Cancel a pending download.
     * @param {string} url
     */
	self.cancel = function (url) {
        var i;
        //Remove from queues.
        if(_activeDownloads[url]) {
            _endDownload(_activeDownloads[url], url);
        }

        i = self.completed.length;
        while(i--) {
            if(self.completed[i].src === url) {
                self.completed[i].splice(i,1);    
            }
        }
	};

    /**
     * Get the current size of the cache. This is
     * mainly for debugging and isn't performant.
     * @return {number}
     */
    self.getCacheSize = function() {
        return _downloaded.size();
    };

    self.currentlyDownloading = function () {
        return _activeDownloadsCount != 0;
    };

    /**
     * Call this from the run-loop of the application.
     * This will process any completed downloads and trigger new downloads.
     */
	self.update = function() {
        self.completed = [];
        _queue.sort(function(l, r) {
            return r.priority - l.priority;     
        });
		// starts downloads for highet priority images while download slots are available
		for (var i = 0; i < _queue.length; i++) {
            var downloadRequest = _queue[i];
            var url = downloadRequest.url;
            var downloadState = self.getState(url);
            switch (downloadState) {
                case TileDownloadState.none:
                case TileDownloadState.timedout:
                case TileDownloadState.cacheExpired:
                    if (_activeDownloadsCount < _maxConcurrentTileDownloads) {
                        if (!_activeDownloads[url]) {
                            _activeDownloadsCount++;
                            var img = document.createElement('img');
                            _activeDownloads[url] = img;
                            img[_downloadRequestKey] = downloadRequest;
                            img.onload = _onDownloadComplete;
                            img.onerror = _onDownloadFailed;
                            img.onabort = _onDownloadFailed;
                            img[_timeoutIdKey] = window.setTimeout((function () {
                                var closureImg = img;
                                return function () {
                                    _onDownloadTimeout.call(closureImg);
                                };
                            })(), _downloadTimeout);

                            //Cross origin flag has gotten a bit more complicated.
                            // We have to deal with a few cases.
                            // (a) data uri which doesn't note require any CORS stuff.
                            // (b) rendering with CSS, thus un-needed
                            // (c) We are getting content from the same domain or relative url thus unneeded
                            // (d) We are getting content from another domain and using webgl - thus required.
                            

                            var useCORS = false;

                            if(self.useCORS) { //case (b)
                                useCORS = !Utils.isDataUrl(url) && //case (a)
                                          !Utils.isRelativeUrl(url) && //case (c-2)
                                          !Utils.areSameDomain(url, window.location.toString()); //case (c-1)
                            }

                            if(useCORS) {
                                img.crossOrigin = '';
                            }

                            img.src = url;
                        }
                    }
                    break;
                case TileDownloadState.downloading:
                    break;
                case TileDownloadState.ready:
                    //This case can happen with the atlas image on the first frame, where it is requested multiple times in the same frame
                    self.completed.push(_queue[i].url);
                    _queue.splice(i, 1);
                    i--;
                    break;
                default:
                    break;
            }
		}
	};

	function _onDownloadComplete() {
		if (!this[_processedKey]) {
			var url = this[_downloadRequestKey].url;
			_endDownload(this, url);

			_allDownloadedUrls.insert(url, true); // DON'T store the image here. Mobile devices cannot handle too many in-memory images.
            self.completed.push(this);
            this[_tokenKey] = this[_downloadRequestKey].token;
			_downloaded.insert(url,this);
            
            _succeedCount++;
            tileDownloadSucceededCallback(_failCount, _succeedCount);
		}
	}

	function _onDownloadFailed() {
		if (!this[_processedKey]) {
			var url = this[_downloadRequestKey].url;
			_endDownload(this, url);

			if(quirks.useImageDisposer) {
				this.src = _spacerImageUrl; //TODO
			}
			_failed.insert(url, TileDownloadState.failed);
            
            _failCount++;
            tileDownloadFailedCallback(_failCount, _succeedCount);
		}
	}

	function _onDownloadTimeout() {
		if (!this[_processedKey])
		{
			var url = this[_downloadRequestKey].url;
			_endDownload(this, url);

			if(quirks.useImageDisposer) {
				this.src = _spacerImageUrl; //TODO..
			}
			_failed.insert(url, TileDownloadState.timedout);
            
            _failCount++;
            tileDownloadFailedCallback(_failCount, _succeedCount);
		}
	}

	function _endDownload(img, url) {
		img[_processedKey] = true;
		img.onload = null;
		img.onerror = null;
		img.onabort = null;
		window.clearTimeout(img[_timeoutIdKey]);
		var downloadRequest = img[_downloadRequestKey];
		var i = _queue.length;
		while (i--) {
			if (_queue[i] === downloadRequest) {
				_queue.splice(i, 1);
			}
		}

		_activeDownloadsCount--;
		delete _activeDownloads[url];

        i = self.completed.length;
        
	}
};

var TileDownloadState = {
	none: 0,
	downloading: 1,
	ready: 2,	// This means the image is decoded and in memory
	failed: 3,
	timedout: 4,
	cacheExpired: 5	// This means the image was requested at some point (so probably on disk), but not decoded and in memory
};

var PolygonTileFloodFiller = {

    floodFill: function (gridWidth, gridHeight, polygon, startingTile) {
        "use strict";

        this.cachedCrossings = {};
        if (startingTile == null) {
            if (polygon.length == 0) {
                return [];
            }
            
            startingTile = this.calculateStartingTile(gridWidth, gridHeight, polygon);
        }
    
        var tileQueue = [startingTile];
        var tilesEnqueued = new Array(gridWidth * gridHeight);
        tilesEnqueued[startingTile.y * gridWidth + startingTile.x] = true;
        //var tileGrid = [];
        var result = [];

        while (tileQueue.length > 0) {
            var tile = tileQueue.shift();
            result.push(tile);

            var neighbors = [];

            if (this.tileCenterInPolygon(tile, polygon) || this.gridCrossesPolygon(tile, polygon)) {
                neighbors.push(this.getLeftNeighbor(tile));
                neighbors.push(this.getRightNeighbor(tile));
                neighbors.push(this.getTopNeighbor(tile));
                neighbors.push(this.getBottomNeighbor(tile));
            }

            for (var i = 0; i < neighbors.length; i++) {
                var neighbor = neighbors[i];

                if (this.isValidTile(neighbor, gridWidth, gridHeight) && !tilesEnqueued[neighbor.y * gridWidth + neighbor.x]) {
                    tileQueue.push(neighbor);
                    tilesEnqueued[neighbor.y * gridWidth + neighbor.x] = true;
                }
            }
        }

        this.cachedCrossings = null;

        return result;
    },

    calculateStartingTile: function (gridWidth, gridHeight, polygon) {
        "use strict";

        var center = {x: 0, y: 0};
        for (var i = 0; i < polygon.length; i++) {
            center.x += polygon[i].x;
            center.y += polygon[i].y;
        }
        center.x /= polygon.length;
        center.y /= polygon.length;
    
        center.x = Math.floor(center.x);
        center.y = Math.floor(center.y);

        center.x = Math.max(0, center.x);
        center.y = Math.max(0, center.y);

        center.x = Math.min(gridWidth - 1, center.x);
        center.y = Math.min(gridHeight - 1, center.y);

        return center;
    },

    getLeftNeighbor: function (tile) {
        "use strict";

        return {x: tile.x - 1, y: tile.y};
    },
    
    getRightNeighbor: function (tile) {
        "use strict";

        return {x: tile.x + 1, y: tile.y};
    },
    
    getTopNeighbor: function (tile) {
        "use strict";

        return {x: tile.x, y: tile.y - 1};
    },
    
    getBottomNeighbor: function (tile) {
        "use strict";

        return {x: tile.x, y: tile.y + 1};
    },

    tileCenterInPolygon: function (tile, polygon) {
        "use strict";

        //check center of tile
        return this.pointInPolygon({x: tile.x + 0.5, y: tile.y + 0.5}, polygon);
    },

    isValidTile: function (tile, gridWidth, gridHeight) {
        "use strict";

        if (isNaN(tile.x) || isNaN(tile.y) || tile.x < 0 || tile.y < 0 || tile.x >= gridWidth || tile.y >= gridHeight) {
            return false;
        }
        return true;
    },

    normalizeNumber: function (number) {
        "use strict";

        if (number >= 0) {
            return 1;
        }
    
        return -1;
    },

    gridCrossesPolygon: function (gridUpperLeftPoint, polygon) {
        "use strict";

        //Assume gridUpperLeftPoint has x and y properties and that they are ints
        var gridUpperRightPoint = {x: gridUpperLeftPoint.x + 1, y: gridUpperLeftPoint.y};
        var gridLowerRightPoint = {x: gridUpperLeftPoint.x + 1, y: gridUpperLeftPoint.y + 1};
        var gridLowerLeftPoint = {x: gridUpperLeftPoint.x, y: gridUpperLeftPoint.y + 1};

        //var result = {};
        //
        //if (countCrossings(gridUpperLeftPoint, polygon) !== countCrossings(gridUpperRightPoint, polygon)) {
        //    result.top = true;
        //}
        //if (countCrossings(gridLowerLeftPoint, polygon) !== countCrossings(gridLowerRightPoint, polygon)) {
        //    result.bottom = true;
        //}
        //if (countCrossings(gridUpperLeftPoint, polygon, true) !== countCrossings(gridLowerLeftPoint, polygon, true)) {
        //    result.left = true;
        //}
        //if (countCrossings(gridUpperRightPoint, polygon, true) !== countCrossings(gridLowerRightPoint, polygon, true)) {
        //    result.right = true;
        //}
        //
        //return result;

        if (this.countCrossings(gridUpperLeftPoint, polygon) !== this.countCrossings(gridUpperRightPoint, polygon)) {
            return true;
        }
        else if (this.countCrossings(gridLowerLeftPoint, polygon) !== this.countCrossings(gridLowerRightPoint, polygon)) {
            return true;
        }
        else if (this.countCrossings(gridUpperLeftPoint, polygon, true) !== this.countCrossings(gridLowerLeftPoint, polygon, true)) {
            return true;
        }
        else if (this.countCrossings(gridUpperRightPoint, polygon, true) !== this.countCrossings(gridLowerRightPoint, polygon, true)) {
            return true;
        }
        else {
            return false;
        }
    },

    //Use crossing test.  If a ray going out from the point crosses an odd number of polygon line segments, then it's inside the polygon.  Else it's outside.
    //Logic is simple if we cast a ray to the right (positive x) direction
    //Short description: http://erich.realtimerendering.com/ptinpoly/
    //Longer description: Graphics Gems IV, Edited by Paul S Heckbert 1994, page 26
    pointInPolygon: function (point, polygon) {
        "use strict";

        var crossCount = this.countCrossings(point, polygon);

        //If the ray crossed an odd number of segments, then the point is inside the polygon.
        return (crossCount % 2 === 1);
    },

    //var cachedHorizontalCrossings = {};
    //var cachedVerticalCrossings = {};
    cachedCrossings: {},

    countCrossings: function (point, polygon, castRayDown) {
        "use strict";

        var adjustedPolygon = [];
        var i, j;
        var crossCount = 0;

        var hash = point.x + ',' + point.y + ((castRayDown) ? ',down' : ',right');

        if (this.cachedCrossings[hash] != null) {
            return this.cachedCrossings[hash];
        }

        if (castRayDown) {
            //if (cachedVerticalCrossings(
        
            //just switch the x and y of the polygon, then the rest of the math works out correctly
            for (i = 0; i < polygon.length; i++) {
                adjustedPolygon.push({x: polygon[i].y - point.y, y: polygon[i].x - point.x});
            }
        }
        else {
            for (i = 0; i < polygon.length; i++) {
                adjustedPolygon.push({x: polygon[i].x - point.x, y: polygon[i].y - point.y});
            }
        }

        for (i = 0; i < adjustedPolygon.length; i++) {
            j = i + 1;
            if (j >= adjustedPolygon.length) {
                j = 0;
            }

            var y0 = adjustedPolygon[i].y;
            var y1 = adjustedPolygon[j].y;
            var x0 = adjustedPolygon[i].x;
            var x1 = adjustedPolygon[j].x;

            var ySign0 = this.normalizeNumber(y0);
            var ySign1 = this.normalizeNumber(y1);
            var xSign0 = this.normalizeNumber(x0);
            var xSign1 = this.normalizeNumber(x1);
        
            if (ySign0 != ySign1) {
                //Points are on opposite sides of the ray being cast to the right, then the segment may cross.
            
                if (xSign0 === 1 && xSign1 === 1) {
                    //Points are both to the right of the point, so the segment must cross the ray.
                    crossCount++;
                }
                else if (xSign0 !== xSign1) {
                    //One point is to the right of the point and the other is to the left.  Need to actually do math to calculate if it intersects.
                    //Get line formula in format of y = mx + b, then calculate x-intercept.  Hint, it's (0 - b) / m.
                    //If the x-intercept is positive, then the segment must cross the ray.

                    //Note, since we know x0 and x1 have different signs, we don't need to check (x0-x1) for being 0
                    var m = (y0 - y1) / (x0 - x1);
                    var b = y0 - (m * x0);
                    var xInt = -b / m;
                    if (xInt >= 0) {
                        crossCount++;
                    }
                }
            }
        }

        this.cachedCrossings[hash] = crossCount;
        return crossCount;
    }
};
//Polyfill the CSS matrix
var CSSMatrix = window.CSSMatrix || window.WebKitCSSMatrix || window.MSCSSMatrix || window.MozCSSMatrix;

function RendererCSS3D(win, width, height) {
    "use strict";

    RendererCSS3D.__super.call(this, win);

	this._width = width;
	this._height = height;

    if (!RendererCheckCSS3D.isValidBrowser()) {
        throw 'css3d is not supported';
    }

    this._rootElement = document.createElement('div');
    this._rootElement.width = this._width;
    this._rootElement.height = this._height;

    this._flatten3D = document.createElement('div');
    this._flatten3D.style.width = this._width + 'px';
    this._flatten3D.style.height = this._height + 'px';
    this._flatten3D.style.position = 'absolute';
    this._flatten3D.style.webkitTransformStyle = 'flat';
    this._flatten3D.style.msTransformStyle = 'flat';
    this._flatten3D.style.mozTransformStyle = 'flat';
    this._flatten3D.style.backgroundColor = 'rgba(' + this._clearColor.r*255.0 + ',' + this._clearColor.g*255.0 + ',' + this._clearColor.b*255.0 + ',' + this._clearColor.a + ')';

    this._3dViewportDiv = document.createElement('div');
    this._3dViewportDiv.width = this._width;
    this._3dViewportDiv.height = this._height;
    this._3dViewportDiv.style.position = 'absolute';

    this._flatten3D.appendChild(this._3dViewportDiv);

    this._rootElement.appendChild(this._flatten3D);

    if(quirks.supportsPreserve3D && !Config.forceIERenderPath) {
        this._3dViewportDiv.style.webkitTransformStyle = 'preserve-3d';
        this._3dViewportDiv.style.webkitTransform = 'matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1)';

        this._3dViewportDiv.style.mozTransformStyle = 'preserve-3d';
        this._3dViewportDiv.style.mozTransform = 'matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1)';
    }

    //We do this last incase any earlier issues throw.
    win.appendChild(this._rootElement);
};
extend(RendererCSS3D, Renderer);

RendererCSS3D.prototype.ignoreEvent = function () {
    "use strict";

    return false;
};

RendererCSS3D.prototype.setStyleProperties = function (element) {
    "use strict";

	// The default transform-origin is (50%, 50%) which is just
	// fine with us.
    //element.style.webkitTransformOrigin = '0px 0px 0';
    if(quirks.supportsPreserve3D && !Config.forceIERenderPath) {
        element.style.webkitTransformStyle = 'preserve-3d';
        element.style.mozTransformStyle = 'preserve-3d';
    }
    element.style.position = 'absolute';

    //Make sure elements are not dragable, otherwise Safari will show a dragged image
    //when you mouse down and drag, which is not what we want
    //Utils.bind(element, 'dragstart', this.ignoreEvent);
};

RendererCSS3D.prototype.clearStyleProperties = function (element) {
    "use strict";

	// The default transform-origin is (50%, 50%) which is just
	// fine with us.
    //element.style.webkitTransformOrigin = '0px 0px 0';
    element.style.webkitTransformStyle = '';
    element.style.msTransformStyle = '';
    element.style.mozTransformStyle = '';
    element.style.position = '';

    //Make sure elements are not dragable, otherwise Safari will show a dragged image
    //when you mouse down and drag, which is not what we want
    //Utils.unbind(element, 'dragstart',  this.ignoreEvent);
};

RendererCSS3D.prototype.setViewportSize = function (width, height) {
    "use strict";

    this._width = width;
    this._height = height;
    this._rootElement.width = this._width;
    this._rootElement.height = this._height;
    this._flatten3D.style.width = this._width;
    this._flatten3D.style.height = this._height;
    this._3dViewportDiv.width = this._width;
    this._3dViewportDiv.height = this._height;
};

var updateCSS = function(e, t) {
    "use strict";

    //Note: If setting as a string css can't handle scientific notation e.g. 1e-4
    e.style.webkitTransform = t;
    e.style.msTransform = t;
    e.style.mozTransform = t;
};
/**
 * This updates the leave node transforms with any 
 * intermediate transforms. Note: This is only used when quirks.supportsPreserve3D = false.
 */
RendererCSS3D.prototype.updateTransforms = function (node, transform) {
    "use strict";

    var node, transform, i, identity,
    identity = new CSSMatrix();
    identity.m11 = 1.0;
    identity.m12 = 0.0;
    identity.m13 = 0.0;
    identity.m14 = 0.0;
    identity.m21 = 0.0;
    identity.m22 = 1.0;
    identity.m23 = 0.0;
    identity.m24 = 0.0;
    identity.m31 = 0.0;
    identity.m32 = 0.0;
    identity.m33 = 1.0;
    identity.m34 = 0.0;
    identity.m41 = 0.0;
    identity.m42 = 0.0;
    identity.m43 = 0.0;
    identity.m44 = 1.0;

    if(!node) {
        node = this._rootElement;
    }

    if(!transform) {
        transform = identity;
    }
    if(node['$$matrixTransform']) {
        transform = transform.multiply(node['$$matrixTransform']);
    }

    if(node.childNodes.length === 0 || node['$$isLeaf']) {
        updateCSS(node, transform);
    }
    else {
        updateCSS(node, identity);
        for(i = 0; i < node.childNodes.length; ++i) {
            this.updateTransforms(node.childNodes[i], transform);
        }
    }
};

RendererCSS3D.prototype.render = function () {
    "use strict";

    // The is needed because the CSS coordinate system is compatible with 2D page 
    // transforms.
    //                  ^
    //                 /
    //                / -z (into screen).
    //               /
    //               --------------> +x
    //               |
    //               | +y 
    //               |
    //               V
    //
    //  see: http://developer.apple.com/library/safari/#documentation/InternetWeb/Conceptual/SafariVisualEffectsProgGuide/Transforms/Transforms.html
    var invertYAxisMatrix = Matrix4x4.createScale(1, -1, 1);

    var viewportToScreenTransform = GraphicsHelper.createViewportToScreen(
                    this._width, this._height);

    var cssScreenSpaceViewProjectionTransform = viewportToScreenTransform.multiply(this._viewProjMatrix.multiply(invertYAxisMatrix));
    this.setCSS3DViewProjection(cssScreenSpaceViewProjectionTransform);


    var i, j, added;
    var imageElement, texture;

    for(var id in this._removedRenderables) {
        var imgElement, divElement = document.getElementById(id);
        if(divElement) {
            imgElement = divElement.firstChild;
            if(imgElement) {
                this.clearStyleProperties(imgElement);
                if(imgElement.parentNode) {
                    //Since the caching layer caches images, we want to de-parent to ensure 
                    //consistent state.
                    imgElement.parentNode.removeChild(imgElement);
                }
            } else {
                this._error('Expected imgElement');
            }
            if( divElement.parentNode) {
                divElement.parentNode.removeChild(divElement);
            }

        } else {
            Utils.log('Cannot find and remove element');
        }
    }
    this._removedRenderables = {}; // de-ref and remove

    for (var renderableId in this._renderables) {
        if(this._renderables.hasOwnProperty(renderableId)) {
            var renderable = this._renderables[renderableId];

            added = false;
            imageElement = null;
            texture = null;
            if (renderable._material && 
                renderable._material._texture) {
                    texture = renderable._material._texture;
                    if (texture._isReady && texture._isDirty) {
                        imageElement = renderable._material._texture._image;
                        //We use deterministic ordering based on ids.
                        //imageElement._order = renderableId;
                    } else if (renderable.transformUpdated) {
                        var img = renderable._material._texture._image;
						if (img.parentNode) {
							this.setCSS3DTransform(img.parentNode, img,
								renderable._transform, renderable._order);
							renderable.transformUpdated = false;
						}
					}
            }
            if (imageElement == null) {
                continue;
            }

		imageElement._order = renderable._order;
		imageElement.style.zIndex = renderable._order;
        if(imageElement.parentNode) {
            this._error('Expected imageElement with no parent');
        }

        this.setStyleProperties(imageElement);

    	var xformNode = document.createElement('div');
        xformNode.id = renderableId;
    	xformNode.style.position = 'absolute';
    	xformNode.style.zIndex = imageElement.style.zIndex;
        
        if(quirks.supportsPreserve3D && !Config.forceIERenderPath) {
            xformNode.style.webkitTransformOrigin = '0px 0px 0';
            xformNode.style.webkitTransformStyle = 'preserve-3d';

            xformNode.style.mozTransformOrigin = '0px 0px 0';
            xformNode.style.mozTransformStyle = 'preserve-3d';
        } else {
            xformNode['$$isLeaf'] = true;
        }

		xformNode.appendChild(imageElement);
        this.setCSS3DTransform(xformNode, imageElement, renderable._transform, renderable._order);

            for (j = 0; j < this._3dViewportDiv.childNodes.length; ++j) {
				var img = this._3dViewportDiv.childNodes[j].childNodes[0];
                if (img == undefined || img == imageElement) {
                    this._error('object state inconsistency');
                }
                if (img && imageElement._order &&
                    img._order > imageElement._order) {
                    added = true;
                    //Due to image being in the transform node, we 
                    //insert xform into the child of the div.
                    this._3dViewportDiv.insertBefore(xformNode, this._3dViewportDiv.childNodes[j]);
                    texture._isDirty = false;
                    break;
                }
            }

            //If we're missing an order parameter or we are last, we append.
            if (!added) {
                this._3dViewportDiv.appendChild(xformNode);
                texture._isDirty = false;
            }
        }
    }

    if (!quirks.supportsPreserve3D || Config.forceIERenderPath) {
        //Update the transforms top-down.
        this.updateTransforms();
    }


	var callbackRemaining = false;
	if (this._frameCallbacks) {
		for (var i=0; i<this._frameCallbacks.length; i++) {
			if (this._frameCallbacks[i].count > 0) {
				callbackRemaining = true;
            } else if (this._frameCallbacks[i].count == 0) {
				this._frameCallbacks[i].cb();
            }
			this._frameCallbacks[i].count --;
		}
		if (! callbackRemaining) {
			this._frameCallbacks = [];
        }
	}
};

RendererCSS3D.prototype.transitionEndCallback = function () {
    "use strict";

    if (this.completeCallback) {
        this.completeCallback(this.material, this.callbackInfo);
    }

    this.material._animation = { _ended : true };

    delete this.material;
    delete this.completeCallback;
    delete this.callbackInfo;

    this.removeEventListener('webkitTransitionEnd', RendererCSS3D.prototype.transitionEndCallback, false);
    this.removeEventListener('mozTransitionEnd', RendererCSS3D.prototype.transitionEndCallback, false);
    this.removeEventListener('MSTransitionEnd', RendererCSS3D.prototype.transitionEndCallback, false);
};

RendererCSS3D.prototype.animate = function(renderable, 
                      startProperties, 
                      endProperties, 
                      duration,
                      easing,
					  completeCallback,
					  completeCallbackInfo) {
    "use strict";

	function FrameCallback(cb, count) {
		this.cb = cb; this.count = count;
	}
	    
    //Utils.log(printObj(startProperties) + ' \n'+printObj(endProperties));
    //TODO.
    //   There are two cases here.
    //   (1) We are animating a CSS property on a browser that suppoerts CSS3 animations
    //   (2) We are doing something that needs a timer.

    //Right now assume it is a texture material & just use jquery .
	if (renderable &&
		renderable._material &&
		renderable._material._texture &&
		renderable._material._texture._image) {
		var material = renderable._material;
		var cssStartProps = {}, cssEndProps = {};
		for (var j=0; j<2; j++) {
			var fromProps = j==0 ? startProperties : endProperties;
			var toProps = j==0 ? cssStartProps : cssEndProps;
			var transformStr = '';
			for (var prop in fromProps) {
				if (fromProps.hasOwnProperty(prop)) {
					switch(prop) {
						case 'opacity': 
							toProps['opacity'] = fromProps['opacity'];
							break;
						case 'x':
							transformStr += 'translateX(-' +
								fromProps['x'] + 'px) ';
							break;
						case 'y':
							transformStr += 'translateY(' +
								fromProps['y'] + 'px) ';
							break;
						case 'sx':
							transformStr += 'scaleX(' +
								fromProps['sx'] + ') ';
							break;
						case 'sy':
							transformStr += 'scaleY(' +
								fromProps['sy'] + ') ';
							break;
						case 'rotate':
							transformStr += 'rotate(-' +
								fromProps['rotate'] + 'deg) ';
							break;
					}
				}
			}
			if (transformStr != '') {
				toProps['-webkit-transform'] = transformStr;
				toProps['-ms-transform'] = transformStr;
				toProps['-moz-transform'] = transformStr;
			}
		}
        if(startProperties) {
            Utils.css( material._texture._image, {
				'-webkit-transition-duration' : duration+'ms',
				'-webkit-transition-timing-function' : easing,
				'-ms-transition-duration' : duration+'ms',
				'-ms-transition-timing-function' : easing,
				'-moz-transition-duration' : duration+'ms',
				'-moz-transition-timing-function' : easing
			});
            Utils.css(material._texture._image, cssStartProps); 
        }

        //These are explicitly removed in transitionEndCallback after it's done 
        //processing them.
        material._texture._image.material = material;
        material._texture._image.callbackInfo = completeCallbackInfo;
        material._texture._image.completeCallback = completeCallback;
		material._texture._image.addEventListener( 
     		'webkitTransitionEnd', 
     		RendererCSS3D.prototype.transitionEndCallback, false);
		material._texture._image.addEventListener( 
     		'MSTransitionEnd', 
     		RendererCSS3D.prototype.transitionEndCallback, false);
		material._texture._image.addEventListener( 
     		'mozTransitionEnd', 
     		RendererCSS3D.prototype.transitionEndCallback, false);
        var renderer = this;
        var startTransition = function () {
            Utils.css(material._texture._image, cssEndProps);
        };
		if (this._frameCallbacks == undefined) {
			this._frameCallbacks = [];
        }
		this._frameCallbacks.push(new FrameCallback(startTransition, 1));
		material._animation = { _ended : false };
    }
};

RendererCSS3D.prototype.setCSS3DTransform = function (elem, image, transform) {
    "use strict";

    var invertY = Matrix4x4.createScale(1, -1, 1);
    //Use naturalHeight because IE10 doesn't report height correctly for this element.
    var height = Math.max(image.height || 0, image.naturalHeight || 0);

    var t = Matrix4x4.createTranslation(0, -height, 0);
    var preTransform = invertY.multiply(t);
    var postTransform = invertY; 

    //Local coord system has y axis pointing down, change to have y axis pointing up.  Also the
    //transform origin is at the top left of the element, so need to translate it so that it is
    //at the bottom left of the element which lines up with the transform-origin of the outer 
    //div where the view/projection matrix is applied
    var invertY = Matrix4x4.createScale(1, -1, 1);
    var t = Matrix4x4.createTranslation(0, -height, 0);
    var m = invertY.multiply(transform.multiply(invertY.multiply(t)));

    m = postTransform.multiply(transform.multiply(preTransform));
    m = m.transpose();

    var mCss = new CSSMatrix();
    mCss.m11 = m.m11;
    mCss.m12 = m.m12;
    mCss.m13 = m.m13;
    mCss.m14 = m.m14;
    mCss.m21 = m.m21;
    mCss.m22 = m.m22;
    mCss.m23 = m.m23;
    mCss.m24 = m.m24;
    mCss.m31 = m.m31;
    mCss.m32 = m.m32;
    mCss.m33 = m.m33;
    mCss.m34 = m.m34;
    mCss.m41 = m.m41;
    mCss.m42 = m.m42;
    mCss.m43 = m.m43;
    mCss.m44 = m.m44;

    if(quirks.supportsPreserve3D && !Config.forceIERenderPath) {
        elem.style.webkitTransform = mCss;
        elem.style.mozTransform = mCss;
        elem.style.msTransform = mCss;
    } else {
        //We apply this transform  in updateTransforms. 
        elem['$$matrixTransform'] = mCss;
    }
};


RendererCSS3D.prototype.setCSS3DViewProjection = function (viewProjection) {
    "use strict";

    var m = viewProjection.transpose();

    //TODO:Webkit specific, need to abstract for other browsers
    var mCss = new CSSMatrix();
    mCss.m11 = m.m11;
    mCss.m12 = m.m12;
    mCss.m13 = m.m13;
    mCss.m14 = m.m14;
    mCss.m21 = m.m21;
    mCss.m22 = m.m22;
    mCss.m23 = m.m23;
    mCss.m24 = m.m24;
    mCss.m31 = m.m31;
    mCss.m32 = m.m32;
    mCss.m33 = m.m33;
    mCss.m34 = m.m34;
    mCss.m41 = m.m41;
    mCss.m42 = m.m42;
    mCss.m43 = m.m43;
    mCss.m44 = m.m44;

    if(quirks.supportsPreserve3D && !Config.forceIERenderPath) {
        //Note: If setting as a string css can't handle scientific notation e.g. 1e-4
        this._3dViewportDiv.style.webkitTransform = mCss;
        this._3dViewportDiv.style.mozTransform = mCss;
        this._3dViewportDiv.style.msTransform = mCss;
    } else {
        //Used by updateTransforms
        this._3dViewportDiv['$$matrixTransform'] = mCss;
    }
};

RendererCSS3D.prototype.setCSS3DOpacity = function (elem, opacity, duration) {
    "use strict";

    elem.style.webkitTransition = 'opacity ' + duration + 's linear';
    elem.style.mozTransition = 'opacity ' + duration + 's linear';
    elem.style.msTransition = 'opacity ' + duration + 's linear';
    elem.style.opacity = opacity;
};

RendererCSS3D.prototype.setClearColor = function (color) {
    "use strict";

    //Does some validation of input and throws if there is an issue.
    this._checkClearColor(color); 

    this._clearColor = color;
    this._flatten3D.style.backgroundColor = 'rgba(' + this._clearColor.r*255.0 + ',' + this._clearColor.g*255.0 + ',' + this._clearColor.b*255.0 + ',' + this._clearColor.a + ')';
};
function RendererWebGL(win, width, height) {
    "use strict";

	RendererWebGL.__super.call(this, win);

	this._width = width;
	this._height = height;

	var canvas	= document.createElement('canvas');
	this._rootElement = canvas; 
	this._rootElement.width = this._width;
	this._rootElement.height = this._height;
    this._textureCache = new MemoryCache(300);

	this._gl = RendererCheckWebGL.getWebGLContext(this._rootElement);
	if (! this._gl) {
		throw "WebGL is not supported.";
	} else if(quirks.isWebGLCORSRequired && !quirks.isWebGLCORSSupported) {
        throw 'CORS image textures are not supported in this browser';
    }

	var gl = this._gl;

	gl.viewportWidth = this._width;
	gl.viewportHeight = this._height;

	gl.viewport(0, 0, this._gl.viewportWidth, this._gl.viewportHeight);
	gl.clearColor(this._clearColor.r, this._clearColor.g, this._clearColor.b, this._clearColor.a);
	this._gl.clearDepth(1.0);
	gl.disable(gl.DEPTH_TEST);
	gl.disable(gl.CULL_FACE);
	//gl.frontFace(gl.CW);

	this._textureFilterTypeMap = [];
	this._textureFilterTypeMap[Texture.Filter.NEAREST] = gl.NEAREST;
	this._textureFilterTypeMap[Texture.Filter.LINEAR] = gl.LINEAR;
	this._textureFilterTypeMap[Texture.Filter.LINEAR_MIPMAP_LINEAR] = gl.LINEAR_MIPMAP_LINEAR;

	this._textureWrapTypeMap = [];
	this._textureWrapTypeMap[Texture.Wrap.CLAMP_TO_EDGE] = gl.CLAMP_TO_EDGE;
	this._textureWrapTypeMap[Texture.Wrap.REPEAT] = gl.REPEAT;

	this.init();

    //We do this last incase any earlier issues throw.
    win.appendChild(this._rootElement);
}
extend(RendererWebGL, Renderer);

function createShader(gl, shaderType, shaderText) {
    "use strict";

	var shader;
	shader = gl.createShader(shaderType);

	gl.shaderSource(shader, shaderText);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		var error = gl.getShaderInfoLog(shader);
		Utils.log("Shader compiling error: " + error);
		gl.deleteShader(shader);
		return null;
	}

	return shader;
}

RendererWebGL.prototype.init = function () {
    "use strict";

    var vsText = '\
				 uniform mat4 u_modelViewProjMat; \
				 uniform mat4 u_localMat; \
				 uniform float u_t, u_duration; \
				 /* the following can be optimized into one vec4 */ \
				 uniform vec2 u_opacityBE, u_xBE, u_yBE, u_rotateBE; \
				 uniform vec2 u_sxBE, u_syBE; \
				 uniform float u_texW, u_texH; \
				 attribute vec4 a_pos; \
				 attribute vec4 a_texCoord; \
				 varying vec2 v_texCoord; \
				 varying float v_opacity; \
				 mat4 ident = mat4( \
					1,0,0,0, \
					0,1,0,0, \
					0,0,1,0, \
					0,0,0,1 \
				 ); \
				 void main() \
				 { \
				 	float opacity, x, y, rotate; \
					mat4 finalMat; \
					float a; \
					if (u_t >= 0.0 && u_t <= 1.0/*u_duration*/) { \
						a = u_t;/* /u_duration;*/ \
						opacity = mix(u_opacityBE[0], u_opacityBE[1], a); \
						float x = mix(u_xBE[0], u_xBE[1], a); \
						float y = mix(u_yBE[0], u_yBE[1], a); \
						float sx = mix(u_sxBE[0], u_sxBE[1], a); \
						float sy = mix(u_syBE[0], u_syBE[1], a); \
						float rotate = mix(u_rotateBE[0], u_rotateBE[1], a); \
						mat4 rotM = ident; \
						float radianRot = radians(rotate); \
						float s = sin(radianRot), c = cos(radianRot); \
						rotM[0][0] = c * sx; rotM[0][1] = s * sy; \
						rotM[1][0] = -s * sx; rotM[1][1] = c * sy; \
						mat4 preT = ident; \
						preT[3][0] = -u_texW * 0.5; \
						preT[3][1] = -u_texH * 0.5; \
						mat4 postT = ident; \
						postT[3][0] = -preT[3][0]; \
						postT[3][1] = -preT[3][1]; \
						mat4 transM = ident; \
						transM[3][0] = x; transM[3][1] = y; \
						finalMat = u_modelViewProjMat * transM * postT * rotM * preT; \
					} else { \
						finalMat = u_modelViewProjMat; \
						opacity = u_opacityBE[0]; \
					} \
					vec4 pos = finalMat * a_pos; \
					v_texCoord = a_texCoord.xy; \
					v_opacity = opacity; \
					gl_Position = pos; \
				 }';

    var psText = '\
precision mediump float; \n\
#define KERNEL_SIZE 9 \n\
uniform sampler2D u_diffuseTex; \n\
uniform vec4 u_colorMult; \n\
uniform vec2 u_kernelOffsets[9]; \n\
uniform float u_kernel[9]; \n\
varying float v_opacity; \n\
varying vec2 v_texCoord; \n\
void main() { \n\
	vec2 texCoord = vec2(v_texCoord.x, 1.0 - v_texCoord.y); \n\
	/*vec4 color = texture2D(u_diffuseTex, texCoord); */\n\
	vec4 color = vec4(0); \n\
	for(int i=0; i<9; i++ ) { \n\
		vec4 tmp = texture2D(u_diffuseTex, texCoord.st + u_kernelOffsets[i]); \n\
		color += tmp * u_kernel[i]; \n\
	} \n\
	gl_FragColor = color * vec4(1,1,1,v_opacity); \n\
}';

    var gl = this._gl;

    this._vs = createShader(gl, gl.VERTEX_SHADER, vsText);
    this._ps = createShader(gl, gl.FRAGMENT_SHADER, psText);
    if (this._vs == null || this._ps == null) {
        throw "Failure initializing webgl: shader";
    }

    this._shaderProgram = gl.createProgram();
    gl.attachShader(this._shaderProgram, this._vs);
    gl.attachShader(this._shaderProgram, this._ps);
    gl.linkProgram(this._shaderProgram);

    if (!gl.getProgramParameter(this._shaderProgram, gl.LINK_STATUS)) {
        gl.deleteProgram(this._shaderProgram);
        gl.deleteShader(this._vs);
        gl.deleteShader(this._ps);
        return null;
    }

    var numAttribs = gl.getProgramParameter(this._shaderProgram, gl.ACTIVE_ATTRIBUTES);
    this._attribs = new Array(numAttribs);
    this._attribLocations = {};
    for (var i = 0; i < numAttribs; i++) {
        var activeattrib = gl.getActiveAttrib(this._shaderProgram, i);
        this._attribs[i] = activeattrib;
        this._attribLocations[activeattrib.name] =
			gl.getAttribLocation(this._shaderProgram, activeattrib.name);
    }
    var numUniforms = gl.getProgramParameter(this._shaderProgram, gl.ACTIVE_UNIFORMS);
    this._uniforms = new Array(numUniforms);
    this._uniformLocations = {};
    for (var j = 0; j < numUniforms; j++) {
        var activeuniform = gl.getActiveUniform(this._shaderProgram, j);
        this._uniforms[j] = activeuniform;
        this._uniformLocations[activeuniform.name] = gl.getUniformLocation(
				this._shaderProgram, activeuniform.name);
    }
};


RendererWebGL.prototype.isPowerOfTwo = function (x) {
    "use strict";

    return (x & (x - 1)) == 0;
};

RendererWebGL.prototype.nextHighestPowerOfTwo = function (x) {
    "use strict";

    --x;
    for (var i = 1; i < 32; i <<= 1) {
        x = x | x >> i;
    }
    return x + 1;
};

RendererWebGL.prototype.setViewportSize = function (width, height) {
    "use strict";

	this._width = width;
	this._height = height;
	this._rootElement.width = this._width;
	this._rootElement.height = this._height;
	
    this._gl.viewportWidth = this._width;
	this._gl.viewportHeight = this._height;
	this._gl.viewport(0, 0, this._gl.viewportWidth, this._gl.viewportHeight);
};

var prevOrderedRenderables;

RendererWebGL.prototype.render = function () {
    "use strict";

	var imageElement, material, texture;
	var gl = this._gl;

    // Clean up WebGL resources associated with removed renderables.
	// Have to do this because of web browsers hold a reference to
	// such resources (through a hash table). Therefore, if not 
	// deliberately deleted, textures and such will exist forever.
	// This is sad, and against everything else in JavaScript, but true.
	// http://www.khronos.org/webgl/public-mailing-list/archives/1106/msg00105.html
	//
    for (var id in this._removedRenderables) {
		var r = this._removedRenderables[id];
		if (r._geometry.__gl_posBuffer) {
		    gl.deleteBuffer(r._geometry.__gl_posBuffer);
		}

		if (r._geometry.__gl_indexBuffer) {
		    gl.deleteBuffer(r._geometry.__gl_indexBuffer);
		}

		if (r._material._texture.__gl_texture) {
		    gl.deleteTexture(r._material._texture.__gl_texture);
		}

		if (r._geometry.__gl_texCoordBuffer) {
		    gl.deleteBuffer(r._geometry.__gl_texCoordBuffer);
		}
    }
    this._removedRenderables = {}; 

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// set shader
	gl.useProgram(this._shaderProgram);

	/* Gaussian kernel
	   1 2 1
	   2 4 2
	   1 2 1
	   var _kernel = [1.0/16.0, 2.0/16.0, 1.0/16.0,
	   2.0/16.0, 4.0/16.0, 2.0/16.0,
	   1.0/16.0, 2.0/16.0, 1.0/16.0];
	   */
	/* Laplacian kernel (sharpen)
	   -1 -1 -1 
	   -1  8 -1
	   -1 -1 -1 
	     
	var NORMFACTOR = 8;
	var _kernel = [-1/NORMFACTOR,-1/NORMFACTOR,-1/NORMFACTOR,
		-1/NORMFACTOR,17/NORMFACTOR,-1/NORMFACTOR,
		-1/NORMFACTOR,-1/NORMFACTOR,-1/NORMFACTOR];
	*/

	/* don't run a filter. */
	var _kernel = [0, 0, 0,
	    		   0, 1, 0,
	    		   0, 0, 0];
	var kernel = new Float32Array(_kernel);

	// sort by Renderable._order
	var orderedRenderables = [];
	for (var renderableId in this._renderables) {
		orderedRenderables.push(this._renderables[renderableId]);
	}
	orderedRenderables.sort( function(a, b) {
	    if (a._order && b._order) {
	        return a._order - b._order;
	    }
	    else if (!a._order && !b._order) {
	        return 0;
	    }
	    else if (!a._order) {
	        return -1;
	    }
	    else {
	        return 1;
	    }
	});

	if (prevOrderedRenderables) {
	    if (prevOrderedRenderables.length != orderedRenderables.length) {
	        //Utils.log("*****prev=" + prevOrderedRenderables.length + "; current="+orderedRenderables.length+"****");
	        for (var i = 0; i < prevOrderedRenderables.length; i++) {
	            var j;
	            for (j = 0; j < orderedRenderables.length; j++) {
	                if (prevOrderedRenderables[i].entityId == orderedRenderables[j].entityId) {
	                    break;
	                }
	            }
	            //if (j == orderedRenderables.length)
	            //	Utils.log("render removed: "+prevOrderedRenderables[i].entityId);
	        }
	        for (var i = 0; i < orderedRenderables.length; i++) {
	            var j;
	            for (j = 0; j < prevOrderedRenderables.length; j++) {
	                if (orderedRenderables[i].entityId == prevOrderedRenderables[j].entityId) {
	                    break;
	                }
	            }
	            //if (j == prevOrderedRenderables.length)
	            //	Utils.log("render added: "+orderedRenderables[i].entityId);
	        }
	    }
	    else {
	        for (var i = 0; i < orderedRenderables.length; i++) {
	            //if (!prevOrderedRenderables[i] || orderedRenderables[i].entityId != prevOrderedRenderables[i].entityId)
	            //	Utils.log("!!! diff: cur=" + orderedRenderables[i].entityId + " prev=" + prevOrderedRenderables[i].entityId);
	        }
	    }
	}
	prevOrderedRenderables = orderedRenderables;

	for (var pass = 0; pass < 2; pass++) {
	    if (pass == 1) {
	        gl.enable(gl.BLEND);
	        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	    }
	    else {
	        gl.disable(gl.BLEND);
	    }

		//for (var renderableId in this._renderables) {
		for (var i=0; i<orderedRenderables.length; i++) {
			//var renderable = this._renderables[renderableId];
			var renderable = orderedRenderables[i];
			imageElement = null;
			texture = null;
			if (renderable._material && 
					renderable._material._texture &&
					renderable._material._texture) { 
				material = renderable._material;
				texture = renderable._material._texture;
				if (texture._isReady) {
				    imageElement = renderable._material._texture._image;
				}
			}
			if (imageElement == null || renderable._geometry == null) {
			    continue;
			}

			// render opaque in pass 0, transparent in pass 1; assume transparent if there
			// is an animation on opacity. Because animation is done in shader, here we
			// don't know what the current opacity value is
			var isOpaque = true;
			if (material._animation && !material._animation._ended) { 
				var opq = material._animation.opacity; 
				if ((opq.begin != 1 || opq.end != 1)) {
				    isOpaque = false;
				}
			} else if (material._animatableStates) {
			    if (material._animatableStates.opacity < 1) {
			        isOpaque = false;
			    }
			}

			if (pass==0 && !isOpaque) {
			    continue;
			}
			if (pass == 1 && isOpaque) {
			    continue;
			}

			if (renderable._geometry._isDirty) {
			    if (renderable._geometry.__gl_posBuffer) {
			        gl.deleteBuffer(renderable._geometry.__gl_posBuffer);
			    }
				renderable._geometry.__gl_posBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, renderable._geometry.__gl_posBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, 
						new Float32Array(renderable._geometry._vertices),
						gl.STATIC_DRAW);

				if (renderable._geometry.__gl_texCoordBuffer) {
				    gl.deleteBuffer(renderable._geometry.__gl_texCoordBuffer);
				}
				renderable._geometry.__gl_texCoordBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, renderable._geometry.__gl_texCoordBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, 
						new Float32Array(renderable._geometry._texCoords),
						gl.STATIC_DRAW);

				if (renderable._geometry._indices) {
				    if (renderable._geometry.__gl_indexBuffer) {
				        gl.deleteBuffer(renderable._geometry.__gl_indexBuffer);
				    }
					renderable._geometry.__gl_indexBuffer = gl.createBuffer();
					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, 
							renderable._geometry.__gl_indexBuffer);
					gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, 
							new Uint16Array(renderable._geometry._indices),
							gl.STATIC_DRAW);
				}

				renderable._geometry._isDirty = false;
			}

			if (renderable._material._texture._isDirty) {
			    if (renderable._material._texture.__gl_texture) {
			        gl.deleteTexture(renderable._material._texture.__gl_texture);
			    }
				renderable._material._texture.__gl_texture = gl.createTexture();
				// At this point we're sure the image is ready because of
				// the preceding logic
				gl.bindTexture(gl.TEXTURE_2D, renderable._material._texture.__gl_texture);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, 
						this._textureFilterTypeMap[renderable._material._texture._magFilter]);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
						this._textureFilterTypeMap[renderable._material._texture._minFilter]);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,
						this._textureWrapTypeMap[renderable._material._texture._wrapS]);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,
						this._textureWrapTypeMap[renderable._material._texture._wrapT]);

				try {
					if (!this.isPowerOfTwo(imageElement.width) || !this.isPowerOfTwo(imageElement.height)) {
						var canvas = this._textureCache.get(renderable.entityId);
                        
                        if (canvas == null) {
                            canvas = document.createElement("canvas");
						    canvas.width = this.nextHighestPowerOfTwo(imageElement.width);
						    canvas.height = this.nextHighestPowerOfTwo(imageElement.height);
						    var ctx = canvas.getContext("2d");
						    ctx.drawImage(imageElement,
								    0, 0, imageElement.width, imageElement.height,
								    0, 0, canvas.width, canvas.height);

                            this._textureCache.insert(renderable.entityId, canvas);
						}
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
					}
                    else {
						gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageElement);
					}
				} catch (e) {
					//If the correct headers aren't set on the image tiles, the gl.texImage2D() call will throw a security exception.
					//Don't bother trying to draw this tile, but still attempt to draw the rest if possible.
					continue;
				}

				gl.generateMipmap(gl.TEXTURE_2D);
				renderable._material._texture._isDirty = false;
			}

			// set matrix
			var finalMat = this._viewProjMatrix.multiply(renderable._transform);
			var glFinalMat = new Float32Array(finalMat.flattenColumnMajor()); 
			gl.uniformMatrix4fv(this._uniformLocations["u_modelViewProjMat"], false, glFinalMat);

			var stepW = 1.0 / imageElement.width;
			var stepH = 1.0 / imageElement.height;
			var _offsets =[-stepW, -stepH,  0.0, -stepH,  stepW, -stepH,
					-stepW, 0.0,  0.0, 0.0,  stepW, 0.0, 
					-stepW, stepH,  0.0, stepH,  stepW, stepH];
			var offsets = new Float32Array(_offsets); 

			gl.uniform2fv(this._uniformLocations["u_kernelOffsets[0]"], offsets);
			gl.uniform1fv(this._uniformLocations["u_kernel[0]"], kernel);
			if (material._animation && !material._animation._ended) {
				// set animation parameters
				var anim = material._animation;
				gl.uniform2f(this._uniformLocations["u_opacityBE"], 
						anim["opacity"].begin, anim["opacity"].end);
				gl.uniform2f(this._uniformLocations["u_xBE"], 
						anim["x"].begin, anim["x"].end);
				gl.uniform2f(this._uniformLocations["u_yBE"], 
						anim["y"].begin, anim["y"].end);

				gl.uniform2f(this._uniformLocations["u_sxBE"], 
						anim["sx"].begin, anim["sx"].end);
				gl.uniform2f(this._uniformLocations["u_syBE"], 
						anim["sy"].begin, anim["sy"].end);

				gl.uniform2f(this._uniformLocations["u_rotateBE"], 
						anim["rotate"].begin, anim["rotate"].end);
				gl.uniform1f(this._uniformLocations["u_texW"], imageElement.width); 
				gl.uniform1f(this._uniformLocations["u_texH"], imageElement.height); 
				var d = new Date;
				if (anim._startT == -1) {
				    anim._startT = d.getTime();
				}
				var t = d.getTime() - anim._startT;
				if (t >= anim._duration) {
					t = anim._duration;
					// animation ended, save end state and kill animation
					material._animatableStates = anim.getEndStates();
					if (anim._endCallback) {
						anim._endCallback(material, anim._endCallbackInfo);
					}
					material._animation._ended = true; // animation ended
				}

                //TODO: add easing back in at some point
				var t_ease = t/anim._duration;
				gl.uniform1f(this._uniformLocations["u_t"], t_ease);

			}
			else if (material._animatableStates) {
				var as = material._animatableStates;
				gl.uniform2f(this._uniformLocations["u_opacityBE"], as["opacity"], as["opacity"]);
				gl.uniform2f(this._uniformLocations["u_xBE"], as["x"], as["x"]);
				gl.uniform2f(this._uniformLocations["u_yBE"], as["y"], as["y"]);
				gl.uniform2f(this._uniformLocations["u_sxBE"], as["sx"], as["sx"]);
				gl.uniform2f(this._uniformLocations["u_syBE"], as["sy"], as["sy"]);
				gl.uniform2f(this._uniformLocations["u_rotateBE"], as["rotate"], as["rotate"]);
				gl.uniform1f(this._uniformLocations["u_texW"], imageElement.width); 
				gl.uniform1f(this._uniformLocations["u_texH"], imageElement.height); 
				gl.uniform1f(this._uniformLocations["u_t"], 1);
				//gl.uniform1f(this._uniformLocations["u_duration"], 1);
			}
			else { // .animate has never been called on this material
				var as = material._animatableStates || {opacity:1.0};
				var o = as["opacity"];
				gl.uniform2f(this._uniformLocations["u_opacityBE"], o, o);
				gl.uniform1f(this._uniformLocations["u_t"], -1);
			}

			gl.enableVertexAttribArray(this._attribLocations["a_pos"]);
			gl.enableVertexAttribArray(this._attribLocations["a_texCoord"]);

			// set position source
			gl.bindBuffer(gl.ARRAY_BUFFER, renderable._geometry.__gl_posBuffer);
			gl.vertexAttribPointer(this._attribLocations["a_pos"], 3, gl.FLOAT, false, 0, 0);

			// set texture coords source
			gl.bindBuffer(gl.ARRAY_BUFFER, renderable._geometry.__gl_texCoordBuffer);
			gl.vertexAttribPointer(this._attribLocations["a_texCoord"],
					renderable._geometry._texCoordSize, gl.FLOAT, false, 0, 0);

			if (renderable._geometry._indices) {
			    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, renderable._geometry.__gl_indexBuffer);
			}

			// set texture
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, renderable._material._texture.__gl_texture);
			gl.uniform1i(this._uniformLocations["u_diffuseTex"], 0);

			gl.drawElements(gl.TRIANGLES, renderable._geometry._indices.length, gl.UNSIGNED_SHORT, 0);
		}
	} // pass
};

var reqAnimStep = (function () {
    "use strict";

	return  window.requestAnimationFrame       || 
	window.webkitRequestAnimationFrame || 
	window.mozRequestAnimationFrame    || 
	window.oRequestAnimationFrame      || 
	window.msRequestAnimationFrame     || 
	function(callback){
		window.setTimeout(callback, 1000 / 60);
	};
})();

function requestAnimation(duration, callback) {
    "use strict";

	var startTime;
	if(window.mozAnimationStartTime) {
		startTime = window.mozAnimationStartTime;
	} else if (window.webkitAnimationStartTime) {
		startTime = window.webkitAnimationStartTime;
	} else {
		startTime = new Date().getTime();
	}

	var lastTimestamp = startTime;

	function timerProc(timestamp){
		if(!timestamp) {
			timestamp = new Date().getTime();
		}

		if(callback({
			startTime: startTime,
			curTime: timestamp,
			duration: duration
		}) !== false) {
			//reqAnimStep(timerProc, element);
			window.setTimeout(timerProc, 1000.0/60);
		}
	};

	timerProc(startTime);
};


/**
 * Enqueues an animation for execution. Try to use CSS style property names when possible. 
 * implementations should ignore properties they don't know how to animate to allow more 
 * advanced renderers to enhance the expierence when possible.
 *
 * @param {Material} material           The material we'll be animating.
 * @param {Object}   startProperties    The property names (e.g.,
 *                                      'opacity','width','height') and values at the start. If this is null we
 *                                      Animate from current property state.
 * @param {Object}   endProperties      The property names (e.g.,
 *                                      'opacity','width','height') and values
 *                                      at the end of the animation.
 * @param {Number}   duration           The duration in ms.
 */
RendererWebGL.prototype.animate1 = function (material, 
		startProperties, 
		endProperties, 
		duration) {
    "use strict";

	function step(params) {
		var x = (params.curTime - params.startTime)/params.duration;
		x = x > 1 ? 1 : (x<0 ? 0 : x);
		// we'll worry about better interpolation + easing later
		material._opacity = 
			startProperties.opacity*(1-x) +
			endProperties.opacity*x;
		if (x >= 1) {
		    return false;
		}
		else {
		    return true;
		}
	}

	if(material && material._texture && material._texture._image) {

		material._opacity = startProperties.opacity;
		requestAnimation(duration, step, material._texture._image);
	}
};

RendererWebGL.prototype.animate = function(renderable, 
		startProperties, 
		endProperties, 
		duration,
		easing,
		endCallback,
		endCallbackInfo) {
    "use strict";

	if (renderable &&
		renderable._material &&
		renderable._material._texture &&
		renderable._material._texture._image) {
		var material = renderable._material;
		var anim = material._animation = new Animation;
		if (material._animatableStates) {
		    anim.initStates(material._animatableStates);
		}
		else {
		    material._animatableStates = anim.getEndStates();
		}
		for (var prop in startProperties) {
			if (startProperties.hasOwnProperty(prop)) {
				if (prop in anim) {
					anim[prop].begin = startProperties[prop];
				}
			}
		}
		for (var prop in endProperties) {
			if (endProperties.hasOwnProperty(prop)) {
				if (prop in anim) {
					anim[prop].end = endProperties[prop];
				}
			}
		}
		// The timer for animation only starts after the
		// renderable is ready. If animate() is called on a
		// renderable that is not ready, it's animation's
		// _startT is set to -1.
		var d = new Date;
		if (material._texture._isReady) {
		    anim._startT = d.getTime();
		}
		else {
		    anim._startT = -1;
		}
		anim._duration = duration;
		anim._easingMode = easing;

		if (endCallback) {
		    anim._endCallback = endCallback;
		}
		if (endCallbackInfo) {
		    anim._endCallbackInfo = endCallbackInfo;
		}
	}
};


RendererWebGL.prototype.CSSMatrixToMatrix4x4 = function (cssMat, image) {
    "use strict";

    var m = new Matrix4x4(
		cssMat.m11, cssMat.m12, cssMat.m13, cssMat.m14,
		cssMat.m21, cssMat.m22, cssMat.m23, cssMat.m24,
		cssMat.m31, cssMat.m32, cssMat.m33, cssMat.m34,
		cssMat.m41, cssMat.m42, cssMat.m43, cssMat.m44);

    var invertY_inv = Matrix4x4.createScale(1, -1, 1);
    var t_inv = Matrix4x4.createTranslation(0, image.height, 0);
    var preTransform_inv = t_inv.multiply(invertY_inv);
    var postTransform_inv = invertY_inv;
    var m4x4 = postTransform_inv.multiply(m.transpose()).multiply(preTransform_inv);
    return m4x4;
};

RendererWebGL.prototype.setClearColor = function(color) {
    "use strict";

    //Does some validation of input and throws if there is an issue.
    this._checkClearColor(color); 

    this._clearColor = color;
    this._gl.clearColor(this._clearColor.r, this._clearColor.g, this._clearColor.b, this._clearColor.a);
};
/**
* Represents a viewport into the 3D scene
* @param {number} width The width of the viewport in pixels
* @param {number} height The height of the viewport in pixels
* @param {number} nearDistance The distance to the near plane
* @param {number} farDistance The distance to the far plane
* @constructor
*/
function Viewport(width, height, nearDistance, farDistance) {
    "use strict";

    /**
    * @private
    * @type {number}
    */
    this._width = width;

    /**
    * @private
    * @type {number}
    */
    this._height = height;

    /**
    * @private
    * @type {number}
    */
    this._aspectRatio = this._width / this._height;

    /**
    * @private
    * @type {number}
    */
    this._nearDistance = nearDistance;

    /**
    * @private
    * @type {number}
    */
    this._farDistance = farDistance;
}

/**
* Converts a horizontal fov to a vertical fov
* @param {number} aspectRatio The aspect ratio of the viewport
* @param {number} fov The horizontal fov to convert in radians
* @return {number} Vertical fov in radians
*/
Viewport.convertHorizontalToVerticalFieldOfView = function (aspectRatio, fov) {
    "use strict";

    var focalLength = 0.5 / Math.tan(fov * 0.5);
    return 2 * Math.atan((0.5 * 1.0 / aspectRatio) / focalLength);
};

/**
* Converts a vertical fov to a horizontal fov
* @param {number} aspectRatio The aspect ratio of the viewport
* @param {number} fov The vertical fov to convert in radians
* @return {number} Horizontal fov in radians
*/
Viewport.convertVerticalToHorizontalFieldOfView = function (aspectRatio, fov) {
    "use strict";

    var focalLength = (0.5 * 1.0 / aspectRatio) / Math.tan(fov * 0.5);
    return 2 * Math.atan(0.5 / focalLength);
};

Viewport.prototype = {

    /**
    * Returns the width of the viewport
    * @return {number}
    */
    getWidth: function () {
        "use strict";

        return this._width;
    },

    /**
    * Returns the height of the viewport in pixels
    * @return {number}
    */
    getHeight: function () {
        "use strict";

        return this._height;
    },

    /**
    * Returns the aspect ratio of the viewport
    * @return {number}
    */
    getAspectRatio: function () {
        "use strict";

        return this._aspectRatio;
    },

    /**
    * Returns the near plane distance
    * @return {number}
    */
    getNearDistance: function () {
        "use strict";

        return this._nearDistance;
    },

    /**
    * Returns the far plane distance
    * @return {number}
    */
    getFarDistance: function () {
        "use strict";

        return this._farDistance;
    }
};
function PerspectiveCameraPose(viewport, digitalPan, position, up, look, fieldOfView) {
    "use strict";

    this.width = (viewport) ? viewport.getWidth() : 0;
    this.height = (viewport) ? viewport.getHeight() : 0;
    //this.digitalPan = Vector2.clone(digitalPan);
    //this.position = Vector3.clone(position);
    this.up = Vector3.clone(up);
    this.look = Vector3.clone(look);
    this.fieldOfView = fieldOfView;

    var fuzzyEquals = function (v1, v2, tolerance) {
        //assumes v1 and v2 are unit vectors
        //assumes tolerance is specified in radians
        var dotProduct = v1.dot(v2);

        if (dotProduct > 1.0) {
            dotProduct = 1.0;
        }
        else if (dotProduct < -1.0) {
            dotProduct = -1.0;
        }

        var difference = Math.acos(dotProduct);
        return difference < tolerance;
    };

    this.isFuzzyEqualTo = function (pose, toleranceInPixels) {
        //viewport width/height are discrete, so use exact equality
        if (this.width !== pose.width || this.height !== pose.height) {
            return false;
        }

        //get tolerance equal to the angle one pixel multiplied by the given tolerance
        var tolerance = toleranceInPixels * this.fieldOfView / this.height;

        if (Math.abs(this.fieldOfView - pose.fieldOfView) > tolerance) {
            return false;
        }

        if (!fuzzyEquals(this.up, pose.up, tolerance)) {
            return false;
        }

        if (!fuzzyEquals(this.look, pose.look, tolerance)) {
            return false;
        }

        //TODO: Compare position and digital pan.  Are they used anywhere?

        return true;
    };
}

/**
* Represents a camera that applies perspective distortion to a scene
* @constructor
*/
function PerspectiveCamera() {
    "use strict";

    /**
    * @private
    * @type {Viewport}
    */
    this._viewport = null;

    /**
    * @private
    * @type {Vector2}
    */
    this._digitalPan = new Vector2(0, 0);

    /**
    * @private
    * @type {Vector3}
    */
    this._position = new Vector3(0, 0, 0);

    /**
    * @private
    * @type {Vector3}
    */
    this._up = new Vector3(0, 1, 0);

    /**
    * @private
    * @type {Vector3}
    */
    this._look = new Vector3(0, 0, -1);

    /**
    * @private
    * @type {number}
    */
    this._fieldOfView = Math.PI / 2;

    /**
    * @private
    * @type {number}
    */
    this._focalLength = -1;

    /**
    * @private
    * @type {Matrix4x4}
    */
    this._viewTransform = Matrix4x4.createIdentity();

    /**
    * @private
    * @type {Matrix4x4}
    */
    this._projectionTransform = Matrix4x4.createIdentity();

    /**
    * @private
    * @type {boolean}
    */
    this._isDirty = true;
}

PerspectiveCamera.prototype = {
    
    getPose: function () {
        "use strict";

        return new PerspectiveCameraPose(this._viewport, this._digitalPan, this._position, this._up, this._look, this._fieldOfView);
    },

    /**
    * When called marks the camera as being dirty
    * @ignore
    */
    _setDirty: function () {
        "use strict";

        this._isDirty = true;
    },

    /**
    * Sets the viewport on the camera
    * @param {Viewport} viewport
    */
    setViewport: function (viewport) {
        "use strict";

        this._viewport = viewport;
        this._setDirty();
    },

    /**
    * Returns the viewport associated with the camera
    * @return {Viewport}
    */
    getViewport: function () {
        "use strict";

        return this._viewport;
    },

    /**
    * Sets the position of the camera
    * @param {Vector3} position
    */
    setPosition: function (position) {
        "use strict";

        this._position = position;
        this._setDirty();
    },

    /**
    * Returns the position of the camera
    * @return {Vector3}
    */
    getPosition: function () {
        "use strict";

        return this._position;
    },

    /**
    * Sets the vertical field of view of the camera
    * @param {number} fieldOfView Angle in radians
    */
    setVerticalFov: function (fieldOfView) {
        "use strict";

        this._fieldOfView = fieldOfView;
        this._setDirty();
    },

    /**
    * Returns the vertical field of view of the camera
    * @return {number}
    */
    getVerticalFov: function () {
        "use strict";

        return this._fieldOfView;
    },

    /**
    * Returns the focal length of the camera
    * @return {number}
    */
    getFocalLength: function () {
        "use strict";

        if (this._isDirty) {
            this._updateTransforms();
        }
        return this._focalLength;
    },

    /**
    * Sets the look direction of the camera
    * @param {Vector3} look A unit look vector
    */
    setLook: function (look) {
        "use strict";

        this._look = look;
        this._setDirty();
    },

    /**
    * Returns the current look vector of the camera
    * @return {Vector3}
    */
    getLook: function () {
        "use strict";

        return this._look;
    },

    /**
    * Sets the up direction of the camera
    * @param {Vector3} up A unit up vector
    */
    setUp: function (up) {
        "use strict";

        this._up = up;
        this._setDirty();
    },

    /**
    * Returns the current up vector of the camera
    * @return {Vector3}
    */
    getUp: function () {
        "use strict";

        return this._up;
    },

    /**
    * Sets the current digital pan on the camera
    * @param {Vector2} pan The digital pan.  Values are in viewport space, meaning
    * a value of 0.5 for the width or height will shift the entire contents of the viewport
    * by half of the dimension of the viewport
    */
    setDigitalPan: function (pan) {
        "use strict";

        this._digitalPan = pan;
        this._setDirty();
    },

    /**
    * Returns the current digital pan
    * @return {Vector2}
    */
    getDigitalPan: function() {
        "use strict";

        return this._digitalPan;
    },

    /**
    * Returns the current view transform
    * @return {Matrix4x4}
    */
    getViewTransform: function () {
        "use strict";

        if (this._isDirty) {
            this._updateTransforms();
        }
        return this._viewTransform;
    },

    /**
    * Returns the current projection transform
    * @return {Matrix4x4}
    */
    getProjectionTransform: function () {
        "use strict";

        if (this._isDirty) {
            this._updateTransforms();
        }
        return this._projectionTransform;
    },

    /**
    * Returns the view projection transform.
    * @return {Matrix4x4}
    */
    getViewProjectionTransform: function () {
        "use strict";

        if (this._isDirty) {
            this._updateTransforms();
        }
        return this._projectionTransform.multiply(this._viewTransform);
    },

    /**
    * Projects a 3D point to 2D. Notes points behind the camera will get back projected,
    * up to the caller to make sure the points passed to this function are infront of the camera
    * @param {Vector3} point A point in 3D
    * @return {Vector4} The z component gives the depth of the point.
    */
    projectTo2D: function (point) {
        "use strict";

        if (this._isDirty) {
            this._updateTransforms();
        }

        //TODO: Cache all this

        var halfWidth = this._viewport.getWidth() * 0.5;
        var halfHeight = this._viewport.getHeight() * 0.5;
        var projected = this._projectionTransform.multiply(this._viewTransform).transformVector4(Vector4.createFromVector3(point));
        projected.x /= projected.w;
        projected.y /= projected.w;
        projected.z = projected.w = 1;
        return (new Matrix4x4(halfWidth, 0, halfWidth, 0,
                               0, -halfHeight, halfHeight, 0,
                              0, 0, 1, 0,
                               0, 0, 0, 1)).transformVector4(projected);
    },

    /**
    * When called updates the view and projection transforms based on the current state of the system
    * @ignore
    */
    _updateTransforms: function () {
        "use strict";

        var denom = Math.tan(0.5 * this._fieldOfView);
        if (denom === 0.0) {
            this._focalLength = 1.0;
        }
        else {
            this._focalLength = 1.0 / denom;
        }

        this._viewTransform = GraphicsHelper.createLookAtRH(this._position, this._look, this._up);
        this._projectionTransform = GraphicsHelper.createPerspectiveOGL(this._fieldOfView,
                                                                        this._viewport.getAspectRatio(),
                                                                        this._viewport.getNearDistance(),
                                                                        this._viewport.getFarDistance(),
                                                                        this._digitalPan);
        this._isDirty = false;
    }
};
/**
* Provides an exponential spring for animations
* @constructor
* @param {number} springConstant
* @param {number} damperConstant
* @param {boolean} allowOvershoot
*/
function ClassicSpring(springConstant, damperConstant, allowOvershoot) {
    "use strict";

    /**
    * @private
    * @type {number}
    */
    this._springConstant = springConstant;

    /**
    * @private
    * @type {number}
    */
    this._damperConstant = damperConstant;

    /**
    * @private
    * @type {boolean}
    */
    this._allowOvershoot = allowOvershoot;

    /**
    * @private
    * @type {number}
    */
    this._current = 0;

    /**
    * @private
    * @type {number}
    */
    this._target = 0;

    /**
    * @private
    * @type {number}
    */
    this._velocity = 0;

    /**
    * @private
    * @type {number}
    */
    this._t = -1;

    /**
    * @private
    * @type {boolean}
    */
    this._isSettled = false;
}

ClassicSpring.prototype = {

    /**
    * When called updates the springs current value based on the current app time
    * @param {number} elapsedMilliseconds
    * @return {boolean} If the spring has settled true is returned, false otherwise
    */
    step: function (elapsedMilliseconds) {
        "use strict";

        if (this._isSettled) {
            return true;
        }

        var delta = 0.0,
            curTargDiff,
            isSettled,
            dt,
            maxDelta,
            epsilon;

        if (this._t >= 0) {
            dt = elapsedMilliseconds - this._t;
            if (dt > 0) {
                curTargDiff = this._current - this._target;
                this._velocity += -this._springConstant * curTargDiff - this._damperConstant * this._velocity;
                delta = this._velocity * dt;

                if (!this._allowOvershoot) {
                    maxDelta = -curTargDiff;
                    if ((delta > 0.0 && maxDelta > 0.0 && maxDelta < delta) ||
                       (delta < 0.0 && maxDelta < 0.0 && maxDelta > delta)) {
                        delta = maxDelta;
                        this._velocity = 0.0;
                    }
                }

                this._current += delta;
            }
        }

        curTargDiff = this._current - this._target;
        epsilon = 0.0000001;
        if ((curTargDiff < epsilon && curTargDiff > -epsilon) && (delta < epsilon && delta > -epsilon)) {
            isSettled = true;
            this.setCurrentToTarget();
        }
        else {
            isSettled = false;
            this._t = elapsedMilliseconds;
        }

        this._isSettled = isSettled;
        return isSettled;
    },

    /**
    * Returns true if the spring has completely settled
    * @return {boolean}
    */
    isSettled: function () {
        "use strict";

        return this._isSettled;
    },

    /**
    * Set a new target value
    * @param {number} target The new target
    */
    setTarget: function (target) {
        "use strict";

        if (this.target == target) {
            return;
        }

        this._target = target;
        this._isSettled = false;
    },

    /**
    * Sets a new current value
    * @param {number} current
    */
    setCurrent: function (current) {
        "use strict";

        this._current = current;
        this._isSettled = false;
    },

    /**
    * Sets the current value and also sets the target to the new current value
    * @param {number} target
    */
    setCurrentAndTarget: function (target) {
        "use strict";

        this._target = target;
        this.setCurrentToTarget();
    },

    /**
    * Sets the current value to the target value immediately
    */
    setCurrentToTarget: function () {
        "use strict";

        this._current = this._target;
        this._velocity = 0.0;
        this._isSettled = true;
        this._t = -1;
    },

    /**
    * Returns the current target value
    * @return {number} the current target value
    */
    getTarget: function () {
        "use strict";

        return this._target;
    },

    /**
    * Returns the current value
    * @return {number} The current value
    */
    getCurrent: function () {
        "use strict";

        return this._current;
    }
};
//Takes two points and the slope (called k) of the line at each of those points.
//Math is taken from http://en.wikipedia.org/wiki/Spline_interpolation on 7/18/2012
function SimpleSpline(x1, x2, y1, y2, k1, k2) {
    "use strict";

    var x2MinusX1 = x2 - x1;
    var y2MinusY1 = y2 - y1;

    var a = (k1 * x2MinusX1) - y2MinusY1;
    var b = y2MinusY1 - (k2 * x2MinusX1);

    this.getValue = function (x) {
        var t = (x - x1) / x2MinusX1;
        var oneMinusT = 1 - t;

        var result = (oneMinusT * y1) + (t * y2) + (t * oneMinusT * ((a * oneMinusT) + (b * t)));

        return result;
    }
}

function CompositeSpline(xArray, yArray, kArray) {
    "use strict";

    if (xArray.length !== yArray.length || xArray.length !== kArray.length || xArray.length < 2) {
        throw "CompositeSpline constructor requires three arrays of identical length of 2 or greater.";
    }
    
    var splines = [];
    var i;

    for (i = 0; i < xArray.length - 1; i++) {
        var iPlusOne = i + 1;
        splines.push(new SimpleSpline(xArray[i], xArray[iPlusOne], yArray[i], yArray[iPlusOne], kArray[i], kArray[iPlusOne]));
    }

    this.getValue = function (x) {
        //first pick which simple spline to use to get the value
        i = 0;
        while (i < xArray.length - 2 && x > xArray[i + 1]) {
            i++;
        }

        //then actually call that simple spline and return the value
        return splines[i].getValue(x);
    }
}
var objectCollection = {
    loop: function (obj, propertyName, keyCollectionFunction) {
        "use strict";

        var k;
        for(k in obj[propertyName]) {
            if(obj[propertyName].hasOwnProperty(k)) {
                keyCollectionFunction(k, obj[propertyName][k]);
            }
        }
    },

    loopByType : function(obj, keyCollectionFunction) {
        "use strict";

        objectCollection.loop(obj, 'byType', keyCollectionFunction);
    }
};

/** 
 * This holds RML which is being renderer. It does not do any IO. 
 * The update frame loop will compute a series of additions
 * and removals of entities and applies them to this datastructure.
 */
var RMLStore = function () {
    "use strict";

    var self = this;

    /** 
     *  Holds arrays of entities indexed by id
     */
    self.byId = {};

    /**
     * Holds arrays of entities indexed by the entity type 
     */
    self.byType = {};

    /**
     * Adds an entity to the scene. 
     * It also updates book keeping structures (byId,byType,byName)
     */
    self.add = function (itemToAdd) {
        if(itemToAdd.id == null) {
            throw 'expected id property on the item';
        }  
        if(!itemToAdd.type) {
            throw 'expected type property on the item';
        }

        self.byId[itemToAdd.id] = itemToAdd;
        self.byType[itemToAdd.type] = self.byType[itemToAdd.type] || [];
        self.byType[itemToAdd.type].push(itemToAdd);
    };

    /** 
     * This removes entity from the scene. 
     */
    self.remove  = function (itemToRemoveId) {
        var obj;
        if (typeof (itemToRemoveId) === 'number') {
            obj = self.byId[itemToRemoveId];
            self.byType[obj.type].remove(obj);
            if (self.byType[obj.type].length === 0) {
                delete self.byType[obj.type];
            }
            delete self.byId[itemToRemoveId];
        }
        else {
            throw 'Expected a single ID';
        }
    };

    /** 
     * Given an object of the form
     * {
     *   added: [{..},{..}]
     *   removed: [] //entityIds
     * }
     * This updates the scene accordingly.
     */
    self.update =  function(delta) {
        var i;
        if(delta.added) {
            for(i = 0; i < delta.added.length; ++i) {
                self.add(delta.added[i]);
            }
        } 

        if(delta.removed) {
            for(i = 0; i < delta.removed.length; ++i) {
                self.remove(delta.removed[i]);
            }
        }
    };
 };

function BallisticPath(pitch1, heading1, fov1, pitch2, heading2, fov2, maxAllowedFov) {
    "use strict";

    //Approximate a field of view that will show both centerpoints at once but never have the middlepoint fov smaller than either fov1 or fov2
    var middleFov = Math.abs(pitch1 - pitch2) + Math.abs(heading1 - heading2);

    var minFov = Math.min(fov1, fov2);
    var maxFov = Math.max(fov1, fov2);

    var minDuration = 0.5;

    var pitchSpline, headingSpline, fovSpline;

    if (middleFov > maxFov) {
        //zoom out in the middle of the animation
        
        //Don't zoom out beyond the max allowable fov
        middleFov = Math.min(middleFov, maxAllowedFov);

        var fovDelta = (middleFov / maxFov) + (middleFov / minFov);
        var duration = (minDuration + Math.log(fovDelta)) * 700;

        pitchSpline = new SimpleSpline(0, duration, pitch1, pitch2, 0, 0);
        headingSpline = new SimpleSpline(0, duration, heading1, heading2, 0, 0);
        fovSpline = new CompositeSpline([0, duration / 2, duration], [fov1, middleFov, fov2], [0, 0, 0]);
    }
    else {
        //no mid-animation zoom-out

        var fovDelta = maxFov / minFov;
        var duration = (minDuration + Math.log(fovDelta)) * 700;

        pitchSpline = new SimpleSpline(0, duration, pitch1, pitch2, 0, 0);
        headingSpline = new SimpleSpline(0, duration, heading1, heading2, 0, 0);
        fovSpline = new SimpleSpline(0, duration, fov1, fov2, 0, 0);
    }

    this.getDuration = function () {
        return duration;
    };

    this.getCurrentPitch = function (time) {
        return pitchSpline.getValue(time);
    };

    this.getCurrentHeading = function (time) {
        return headingSpline.getValue(time);
    };

    this.getCurrentFov = function (time) {
        return fovSpline.getValue(time);
    };
}

"use strict";

/**
* This controls camera
* @constructor
*/
function RotationalFixedPositionCameraController(camera, upperPitchLimit, lowerPitchLimit, upperHeadingLimit, lowerHeadingLimit, dimension) {
    "use strict";

    this._camera = camera;
    this._upperPitchLimit = (upperPitchLimit == null) ? MathHelper.degreesToRadians(90) : upperPitchLimit;
    this._lowerPitchLimit = (lowerPitchLimit == null) ? MathHelper.degreesToRadians(-90) : lowerPitchLimit;
    this._upperHeadingLimit = (upperHeadingLimit == null) ? MathHelper.degreesToRadians(360) : MathHelper.normalizeRadian(upperHeadingLimit);
    this._lowerHeadingLimit = (lowerHeadingLimit == null) ? MathHelper.degreesToRadians(0) : MathHelper.normalizeRadian(lowerHeadingLimit);
    this._pitchSpring = new ClassicSpring(0.01, 0.6, false);
    this._headingSpring = new ClassicSpring(0.01, 0.6, false);
    this._fieldOfViewSpring = new ClassicSpring(0.0033, 0.6, false);
    this._sourcePitch = 0;
    this._sourceHeading = 0;
    this._targetPitch = 0;
    this._targetHeading = 0;
    this.panoramaWorldTransform = Matrix4x4.createIdentity();
    this.panoramaLocalTransform = Matrix4x4.createIdentity();
    this.deviceRotation = Matrix4x4.createIdentity();
    this.initInverseDeviceRotation = Matrix4x4.createIdentity();
    this._orientationTransform = Matrix4x4.createIdentity();
    this._targetUp = new Vector3(0, 1, 0);

    this._worldLook = new Vector3(0, 0, -1);
    this._worldUp = new Vector3(0, 1, 0);
    this._worldSide = new Vector3(1, 0, 0);

    var pitchAndHeading = this.getPitchAndHeading();
    this._pitchSpring.setCurrentAndTarget(pitchAndHeading[0]);
    this._headingSpring.setCurrentAndTarget(pitchAndHeading[1]);
    this._fieldOfViewSpring.setCurrentAndTarget(this._camera.getVerticalFov());

    this._maxPixelScaleFactor = 2; //Set max zoom such that each source pixel is expanded to 2x2 screen pixels
    this._dimension = dimension;
    this._minFieldOfView = MathHelper.degreesToRadians(20);
    this._maxFieldOfView = MathHelper.degreesToRadians(80);
    this.setViewportSize(this._camera.getViewport().getWidth(), this._camera.getViewport().getHeight());

    //Used for state tracking. If this grows beyond the bool & point.
    //we should refactor to use a state machine (see TouchController.js)

    this._startingPitchandHeading = null;
    this._startingPosition = null;
    this._isRotating = false;
    this._lastMovePoint = null;
    this._lastGestureScale = null;
    this._zoomCenter = null;
}

RotationalFixedPositionCameraController.prototype = {

    hasCompleted: function () {
        "use strict";

        return this._pitchSpring.isSettled() &&
               this._headingSpring.isSettled() &&
               this._fieldOfViewSpring.isSettled() &&
               this._ballisticPath == null &&
               !this._autoplay;
    },

    calculatePitchAndHeadingDelta: function (dx,
                                            dy,
                                            viewportWidth,
                                            viewportHeight,
                                            focalLength) {
        "use strict";

        var pitch, heading;
        var aspectRatio = viewportWidth / viewportHeight;

        if (dx === 0) {
            heading = 0;
        }
        else {
            heading = 2 * Math.atan((aspectRatio * (dx / viewportWidth)) / focalLength);
        }

        if (dy === 0) {
            pitch = 0;
        }
        else {
            //Using a -dy because dy is in screen space ie. 0,0 top left to w,h at the
            //bottom right, so a negative dy actually means a positive value in terms of pitch
            pitch = 2 * Math.atan((-dy / viewportHeight) / focalLength);
        }

        return [pitch, heading];
    },

    animateToPose: function (pitch, heading, fov, callback, simplePathOnly) {
        "use strict";

        if (this._ballisticPathCallback) {
            //if an existing path is in motion, signal to the caller that it has stopped and that it did not reach the destination.
            this._ballisticPathCallback(false);
        }

        var maxFov = this._maxFieldOfView;
        if (simplePathOnly) {
            maxFov = Math.max(this._fieldOfViewSpring.getCurrent(), fov);
        }

        var sourceHeading = MathHelper.pickStartHeadingToTakeShortestPath(this._headingSpring.getCurrent(), heading);
        this._ballisticPath = new BallisticPath(this._pitchSpring.getCurrent(), sourceHeading, this._fieldOfViewSpring.getCurrent(), pitch, heading, fov, maxFov);
        this._ballisticStartTime = (new Date()).getTime();
        this._ballisticDuration = this._ballisticPath.getDuration();
        this._ballisticEasingSpline = new SimpleSpline(0, this._ballisticDuration, 0, this._ballisticDuration, 0.5, 0);
        this._ballisticPathCallback = callback;
    },

    _cancelCameraMovements: function (reachedDestination) {
        "use strict";

        this._autoplay = false;
        
        if (this._ballisticPathCallback) {
            this._ballisticPathCallback(reachedDestination);
        }

        this._ballisticPath = null;
        this._ballisticStartTime = null;
        this._ballisticDuration = null;
        this._ballisticEasingSpline = null;
        this._ballisticPathCallback = null;
    },

    _constrainHeading: function (heading) {
        "use strict";

        var constrainedHeading = MathHelper.normalizeRadian(heading);

        if (MathHelper.isZero(this._upperHeadingLimit - this._lowerHeadingLimit)) {
            //Special case.  If 0 and 360 are passed in, they get normalized to the same value.
            //In this case, heading is completely unconstrained. (but it IS normalized)
            return constrainedHeading;
        }

        var distToLower, distToUpper;

        if (this._lowerHeadingLimit > this._upperHeadingLimit) {
            //Allowed region shown with equal signs
            // 0   up      low   2PI
            // |====|-------|====|
            if (constrainedHeading >= this._lowerHeadingLimit || constrainedHeading <= this._upperHeadingLimit) {
                return constrainedHeading;
            }
            else {
                distToLower = this._lowerHeadingLimit - constrainedHeading;
                distToUpper = constrainedHeading - this._upperHeadingLimit;
            }
        }
        else {
            //Allowed region shown with equal signs
            // 0   low     up    2PI
            // |----|=======|----|
            if (constrainedHeading >= this._lowerHeadingLimit && constrainedHeading <= this._upperHeadingLimit) {
                return constrainedHeading;
            }
            else if (constrainedHeading < this._lowerHeadingLimit) {
                distToLower = this._lowerHeadingLimit - constrainedHeading;
                distToUpper = constrainedHeading + MathHelper.twoPI - this._upperHeadingLimit;
            }
            else { //(constrainedHeading > this._upperHeadingLimit)
                distToLower = this._lowerHeadingLimit - (constrainedHeading + MathHelper.twoPI);
                distToUpper = constrainedHeading - this._upperHeadingLimit;
            }
        }

        return (distToLower < distToUpper) ? this._lowerHeadingLimit : this._upperHeadingLimit;
    },

    setAutoplay: function (autoplay) {
        "use strict";

        this._autoplay = autoplay;
        this._prevUpdateTime = null;

        var timeToMoveByOneScreen = 4500; //experimentally determined to look pretty good.

        this._autoplayRadiansPerMillisecond = this._fieldOfViewSpring.getCurrent() / timeToMoveByOneScreen;
    },

    setOrientationTransform: function (orientationTransform) {
        "use strict";

        this._orientationTransform = orientationTransform;
        this.updateCameraProperties();
    },

    setPitchAndHeading: function (pitch, heading, animate) {
        "use strict";

        this._cancelCameraMovements(false);

        var constrainedPitch = pitch;
        if (constrainedPitch > this._upperPitchLimit) {
            constrainedPitch = this._upperPitchLimit - 0.0001;
        }

        if (constrainedPitch < this._lowerPitchLimit) {
            constrainedPitch = this._lowerPitchLimit + 0.0001;
        }

        var constrainedHeading = this._constrainHeading(heading);

        if (animate) {
            this._pitchSpring.setTarget(constrainedPitch);
            
            var currentHeading = this._headingSpring.getCurrent();
            currentHeading = MathHelper.pickStartHeadingToTakeShortestPath(currentHeading, constrainedHeading);

            this._headingSpring.setCurrent(currentHeading);
            this._headingSpring.setTarget(constrainedHeading);
        }
        else {
            this._pitchSpring.setCurrentAndTarget(constrainedPitch);
            this._headingSpring.setCurrentAndTarget(constrainedHeading);
            this.updateCameraProperties();
        }
    },

    getPitchAndHeading: function () {
        "use strict";

        var pitchAndHeading = [this._pitchSpring.getCurrent(), this._headingSpring.getCurrent()];
        return pitchAndHeading;
    },

    getTargetPitchAndHeading: function () {
        "use strict";

        return [this._pitchSpring.getTarget(), this._headingSpring.getTarget()];
    },

    getVerticalFovLimits: function () {
        "use strict";

        return { minimum: this._minFieldOfView, maximum: this._maxFieldOfView };
    },

    setVerticalFov: function (fov, animate) {
        "use strict";

        this._cancelCameraMovements(false);

        var clampedFov = MathHelper.clamp(fov, this._minFieldOfView, this._maxFieldOfView);

        if (animate) {
            this._fieldOfViewSpring.setTarget(clampedFov);
        }
        else {
            this._fieldOfViewSpring.setCurrentAndTarget(clampedFov);
        }
        this.updateCameraProperties();
    },

    getVerticalFov: function () {
        "use strict";

        return this._fieldOfViewSpring.getCurrent();
    },

    getMinVerticalFov: function () {
        "use strict";

        return this._minFieldOfView;
    },

    getMaxVerticalFov: function () {
        "use strict";

        return this._maxFieldOfView;
    },

    getRelativeTarget: function (startingPitch,
                                startingHeading,
                                dx,
                                dy,
                                viewportWidth,
                                viewportHeight,
                                deltaMultiplier) {
        "use strict";

        dx *= deltaMultiplier;
        dy *= deltaMultiplier;

        var focalLength = this._camera.getFocalLength();
        var relativePitch;
        var relativeHeading;
        var pitchAndHeading = this.calculatePitchAndHeadingDelta(dx,
                                                                 dy,
                                                                 viewportWidth,
                                                                 viewportHeight,
                                                                 focalLength);

        relativePitch = pitchAndHeading[0];
        relativeHeading = pitchAndHeading[1];

        //use - heading because if the user swiped from left to right, they get a positive
        //heading value but a right to left swipe would mean we need to turn the camera
        //in the opposite direction
        var targetHeading = MathHelper.normalizeRadian(startingHeading - relativeHeading);

        //We use - for relative pitch because a positive relative pitch means the user
        //must have had a negative movement in screen space it a swipe up, which means we 
        //actually want to rotate down
        var targetPitch = startingPitch - relativePitch;

        var sourcePitchAndHeading = [this._pitchSpring.getCurrent(), this._headingSpring.getCurrent()];
		var sourceHeading = sourcePitchAndHeading[1];
        sourceHeading = MathHelper.pickStartHeadingToTakeShortestPath(sourceHeading, targetHeading);

		return {
			fromPitch: sourcePitchAndHeading[0],
			fromHeading: sourceHeading,
			toPitch: targetPitch,
			toHeading: targetHeading
		}
    },

    setRelativeTarget: function (startingPitch,
                                startingHeading,
                                dx,
                                dy,
                                viewportWidth,
                                viewportHeight,
                                deltaMultiplier) {
        "use strict";

        dx *= deltaMultiplier;
        dy *= deltaMultiplier;

        var focalLength = this._camera.getFocalLength();
        var relativePitch;
        var relativeHeading;
        var pitchAndHeading = this.calculatePitchAndHeadingDelta(dx,
                                                                 dy,
                                                                 viewportWidth,
                                                                 viewportHeight,
                                                                 focalLength);

        relativePitch = pitchAndHeading[0];
        relativeHeading = pitchAndHeading[1];

        //use - heading because if the user swiped from left to right, they get a positive
        //heading value but a right to left swipe would mean we need to turn the camera
        //in the opposite direction
        this._targetHeading = this._constrainHeading(startingHeading - relativeHeading);

        //We use - for relative pitch because a positive relative pitch means the user
        //must have had a negative movement in screen space it a swipe up, which means we 
        //actually want to rotate down
        this._targetPitch = startingPitch - relativePitch;

        //The caller can specify the upper and lower limits of rotation, we need to honor them
        if (this._targetPitch > this._upperPitchLimit) {
            this._targetPitch = this._upperPitchLimit - 0.0001;
        }
        if (this._targetPitch < this._lowerPitchLimit) {
            this._targetPitch = this._lowerPitchLimit + 0.0001;
        }

        var worldToLocalTransform = this.deviceRotation.inverse().multiply(this.panoramaLocalTransform.multiply(this.panoramaWorldTransform.inverse()));
        var sourcePitchAndHeading = [this._pitchSpring.getCurrent(), this._headingSpring.getCurrent()];
        this._sourcePitch = sourcePitchAndHeading[0];
        this._sourceHeading = sourcePitchAndHeading[1];

        this._sourceHeading = MathHelper.pickStartHeadingToTakeShortestPath(this._sourceHeading, this._targetHeading);

        this._pitchSpring.setCurrent(this._sourcePitch);
        this._pitchSpring.setTarget(this._targetPitch);
        this._headingSpring.setCurrent(this._sourceHeading);
        this._headingSpring.setTarget(this._targetHeading);
    },

    calculateLookFromPitchAndHeading: function (pitch, heading, worldLook, worldUp, worldSide, applyHeadingBeforePitch) {
        "use strict";

        //Need to negate heading because the quaternion rotates using the right hand rule
        //and we want positive heading to rotate to the right.
        var pitchRotation = Quaternion.fromAxisAngle(worldSide, pitch);
        var headingRotation = Quaternion.fromAxisAngle(worldUp, -heading);

        if (applyHeadingBeforePitch) {
            return pitchRotation.multiply(headingRotation).transform(worldLook);
        }
        else {
            return headingRotation.multiply(pitchRotation).transform(worldLook);
        }
    },

    tryPitchHeadingToPixel: function (pitch, heading) {
        "use strict";

        //rotate vector to point at the correct pitch/heading
        var look = this.calculateLookFromPitchAndHeading(pitch, heading, this._worldLook, this._worldUp, this._worldSide);

        //check to make sure it's in front of the view and not behind
        if (this._camera.getLook().dot(look) <= 0) {
            return null;
        }

        //now project into 2d viewport space
        var projectedPoint = this._camera.projectTo2D(look);

        //don't want to return a depth because it'll always be 1, so create a vector2 to return
        return new Vector2(projectedPoint.x, projectedPoint.y);
    },

    tryPixelToPitchHeading: function (pixel) {
        "use strict";

        var viewport = this._camera.getViewport();
        var focalLength = this._camera.getFocalLength();

        var halfWidth = viewport.getWidth() / 2;
        var halfHeight = viewport.getHeight() / 2;
        var adjustedFocalLength = focalLength * halfHeight;

        var x = pixel.x - halfWidth;
        var y = pixel.y - halfHeight;

        var pitchDelta = -Math.atan2(y, adjustedFocalLength);
        var headingDelta = Math.atan2(x, adjustedFocalLength);

        //Calculate look by adding pitch and heading from current look/up/side
        var look = this.calculateLookFromPitchAndHeading(pitchDelta, headingDelta, this._look, this._up, this._side, true);

        var upComponent = look.dot(this._worldUp);
        var sideComponent = look.dot(this._worldSide);
        var forwardComponent = look.dot(this._worldLook);

        //Now determine the pitch/heading off from the world look
        var pitch = Math.atan2(upComponent, Math.max(0, Math.sqrt(1 - upComponent * upComponent)));
        var heading = MathHelper.normalizeRadian(Math.atan2(sideComponent, forwardComponent));

        if (isNaN(pitch) || isNaN(heading)) {
            return null;
        }

        return { pitch: pitch, heading: heading };
    },

    update: function () {
        "use strict";

        if (this.hasCompleted()) {
            return;
        }

        //Need this to be MS for classic spring
        var t = (new Date()).getTime();

        if (this._ballisticPath != null) {
            var timeDelta = t - this._ballisticStartTime;
            if (timeDelta > this._ballisticDuration) {
                this._cancelCameraMovements(true);
            }
            else {
                var easedTimeDelta = this._ballisticEasingSpline.getValue(timeDelta);

                this._pitchSpring.setCurrentAndTarget(this._ballisticPath.getCurrentPitch(easedTimeDelta));
                this._headingSpring.setCurrentAndTarget(this._ballisticPath.getCurrentHeading(easedTimeDelta));
                this._fieldOfViewSpring.setCurrentAndTarget(Math.min(this._ballisticPath.getCurrentFov(easedTimeDelta), this._maxFieldOfView));
            }
        }

        if (this._autoplay && this._prevUpdateTime) {
            var heading = this._headingSpring.getCurrent();

            var headingDelta = this._autoplayRadiansPerMillisecond * (t - this._prevUpdateTime);

            heading += headingDelta;
            heading = MathHelper.normalizeRadian(heading);

            var constrainedHeading = this._constrainHeading(heading);

            if (constrainedHeading != heading) {
                //Went off the edge.  Need to reverse the direction of the autoplay and back up the heading for this frame.
                heading -= 2 * headingDelta;

                this._autoplayRadiansPerMillisecond = -this._autoplayRadiansPerMillisecond;
            }

            this._headingSpring.setCurrentAndTarget(heading);
        }

        this._prevUpdateTime = t;

        if (this._ballisticPath == null) {
            this._pitchSpring.step(t);
            this._headingSpring.step(t);
            this._fieldOfViewSpring.step(t);
        }

        this.updateCameraProperties();
    },

    zoom: function (scaleFactor, fromTarget, optionalZoomCenter) {
        "use strict";

        this._cancelCameraMovements(false);

        var proposedFov = (fromTarget) ? this._fieldOfViewSpring.getTarget() : this._fieldOfViewSpring.getCurrent();
        proposedFov *= scaleFactor;
        var targetFov = MathHelper.clamp(proposedFov, this._minFieldOfView, this._maxFieldOfView);

        this._zoomCenter = optionalZoomCenter;
        this._fieldOfViewSpring.setTarget(targetFov);
    },

    zoomToggle: function () {
        "use strict";

        var mid = (this._minFieldOfView + this._maxFieldOfView) / 2.0;
        if (this._camera.getVerticalFov() > mid) {
            this._fieldOfViewSpring.setTarget(this._minFieldOfView);
        } else {
            this._fieldOfViewSpring.setTarget(this._maxFieldOfView);
        }
    },

    discreteZoomFactor: 0.7,

    zoomIn: function (optionalZoomCenter) {
        "use strict";

        this._cancelCameraMovements(false);

        this._zoomCenter = optionalZoomCenter;
        this._fieldOfViewSpring.setTarget(Math.max(this._minFieldOfView, this._camera.getVerticalFov() * this.discreteZoomFactor));
    },

    zoomOut: function (optionalZoomCenter) {
        "use strict";

        this._cancelCameraMovements(false);
        
        this._zoomCenter = optionalZoomCenter;
        this._fieldOfViewSpring.setTarget(Math.min(this._maxFieldOfView, this._camera.getVerticalFov() / this.discreteZoomFactor));
    },

    updateCameraProperties: function () {
        "use strict";

        var pitch = this._pitchSpring.getCurrent();
        var heading = this._headingSpring.getCurrent();
        var fov = this._fieldOfViewSpring.getCurrent();

        // If we're zooming about a point, update the pitch and heading to keep
        // that point fixed within the viewport.
        if (this._zoomCenter) {
            // Calculate the scale factor due to the change in field of view.
            var initialFov = this._camera.getVerticalFov();
            var initialViewPlaneDepth = 0.5 / Math.tan(initialFov / 2);
            var targetViewPlaneDepth = 0.5 / Math.tan(fov / 2);
            var scaleFactor = targetViewPlaneDepth / initialViewPlaneDepth;

            // Find the difference between the zoom center and the viewport center.
            var viewport = this._camera.getViewport();
            var viewportWidth = viewport.getWidth();
            var viewportHeight = viewport.getHeight();
            var aspectRatio = viewport.getAspectRatio();
            var diffFromCenterX = (this._zoomCenter.x / viewportWidth - 0.5) * aspectRatio;
            var diffFromCenterY = this._zoomCenter.y / viewportHeight - 0.5;

            // Find the difference between the zoom center and the viewport center
            // after we apply the scale factor.
            var diffFromCenterWithTargetZoomX = diffFromCenterX * scaleFactor;
            var diffFromCenterWithTargetZoomY = diffFromCenterY * scaleFactor;

            // Figure out how much the horizontal angles have changed.
            var originalXOffsetAngle = Math.atan(diffFromCenterX / targetViewPlaneDepth);
            var newXOffsetAngle = Math.atan(diffFromCenterWithTargetZoomX / targetViewPlaneDepth);
            var angleDiffX = newXOffsetAngle - originalXOffsetAngle;

            // Figure out how much the vertical angles have changed.
            var originalYOffsetAngle = Math.atan(diffFromCenterY / targetViewPlaneDepth);
            var newYOffsetAngle = Math.atan(diffFromCenterWithTargetZoomY / targetViewPlaneDepth);
            var angleDiffY = newYOffsetAngle - originalYOffsetAngle;

            // Update the heading and pitch. (Pitch increases upward, while Y increases downward.)
            heading += angleDiffX;
            pitch -= angleDiffY;

            // Set the current and target values of the springs to ensure that the zoom
            // center remains stationary.
            this._headingSpring.setCurrentAndTarget(heading);
            this._pitchSpring.setCurrentAndTarget(pitch);
        }

        //If the spring is not constrained to a target it might go over the allowable limits
        //so we want to make sure this doesn't happen
        if (pitch > this._upperPitchLimit) {
            pitch = this._upperPitchLimit - 0.0001;
        }
        if (pitch < this._lowerPitchLimit) {
            pitch = this._lowerPitchLimit + 0.0001;
        }

        heading = this._constrainHeading(heading);

        //Need - pitch because the math library uses left handed rotations, i.e.
        //a positive angle in the case of the x axis rotation will rotate down
        //(1,0,0) using left hand rule, but a positive pitch in the bubble means
        //that we want to look up so we need to negate this value.
        var pitchRotation = Matrix4x4.createRotationX(pitch);
        var headingRotation = Matrix4x4.createRotationY(-heading);

        var rotation = headingRotation.multiply(pitchRotation);

        this._look = rotation.transformVector3(this._worldLook);
        this._up = rotation.transformVector3(this._worldUp);
        this._side = rotation.transformVector3(this._worldSide);

        if (this._orientationTransform) {
            this._look = this._orientationTransform.transformVector3(this._look);
            this._up = this._orientationTransform.transformVector3(this._up);
            this._side = this._orientationTransform.transformVector3(this._side);
        }

        var worldPosition = new Vector3(0, 0, 0);
        this._camera.setPosition(worldPosition);
        this._camera.setLook(this._look);
        this._camera.setUp(this._up);

        this._camera.setVerticalFov(fov);

        if (this.viewChangeCallback != null) {
            this.viewChangeCallback();
        }
    },

    onDiscreteZoom: function (e) {
        "use strict";

        var zoomCenter = new Vector2(e.layerX, e.layerY);
        if (e.direction > 0) {
            this.zoomIn(zoomCenter);
        }
        else {
            this.zoomOut(zoomCenter);
        }
    },

    onGestureStart: function (e) {
        "use strict";

        this._zoomCenter = null;
        this._lastGestureScale = 1;
        this.beginRotation(e.screenX, e.screenY);
		this._gestureChanged = false;
    },

    onGestureEnd: function (e) {
        "use strict";

        if (this._isRotating) {
            this._lastGestureScale = null;
            this.endRotation();

            if (! this._gestureChanged ||
                (this._startingPosition[0]==e.screenX &&
                this._startingPosition[1]==e.screenY)) {
                // this is a click (mouse down and up without move)
                this.pick(e);
            }
        }
    },

    onGestureChange: function (e) {
        "use strict";

        if (this._isRotating) {
            this._gestureChanged = true;
            var scaleDelta = this._lastGestureScale / e.scale;

            if (scaleDelta !== 1) {
                var zoomCenter = new Vector2(e.layerX, e.layerY);
                this.zoom(scaleDelta, true, zoomCenter);
            }
            else {
                this._zoomCenter = null;
            }

            this._lastGestureScale = e.scale;

            this._lastMovePoint = new Vector2(this._startingPosition[0] + e.translationX, this._startingPosition[1] + e.translationY);
        }
    },

    beginRotation: function (x, y) {
        "use strict";

        this._isRotating = true;
        this._startingPosition = [x, y];
        this._startingPitchandHeading = this.getPitchAndHeading();
    },

    endRotation: function () {
        "use strict";

        this._isRotating = false;
        this._lastMovePoint = null;
    },

    updateRotation: function () {
        "use strict";

        if (this._camera === null) {
            return;
        }

        if (this._lastMovePoint == null) {
            return;
        }

        if (!this._isRotating) {
            return;
        }

        if (this._zoomCenter) {
            return;
        }

        var sx = this._lastMovePoint.x;
        var sy = this._lastMovePoint.y;
        var viewport = this._camera.getViewport();
        var deltaMultiplier = 1.1;
        var dx = sx - this._startingPosition[0];
        var dy = sy - this._startingPosition[1];

        this.setRelativeTarget(this._startingPitchandHeading[0],
                                                      this._startingPitchandHeading[1],
                                                      dx,
                                                      dy,
                                                      viewport.getWidth(),
                                                      viewport.getHeight(),
                                                      deltaMultiplier);
    },

    pick: function (e) {
        "use strict";

		// compute heading and pitch for mouse position
    	var w = this._camera.getViewport().getWidth(),
			h = this._camera.getViewport().getHeight();
		e.clientX -= 8; e.clientY -= 8;
		if (e.clientX < 0 || e.clientY < 0) {
		    console.log("bad");
		}

        var ph = this.getRelativeTarget(this._startingPitchandHeading[0],
                               this._startingPitchandHeading[1],
                               -(e.clientX-w/2), (h-1-e.clientY)-h/2, w, h, 1);
		ph.toHeading = MathHelper.normalizeRadian(ph.toHeading);
	},

    deltaAngles: function (a1, a2) {
        "use strict";

        var value = a1 - a2;

        while (value < -Math.PI) {
            value += 2 * Math.PI;
        }

        while (value >= Math.PI) {
            value -= 2 * Math.PI;
        }

        return value;
    },

    deltaThreshold: 0.01 * 0.01 + 0.01 * 0.01,

    isLargeChange: function (d1, d2) {
        "use strict";

        return d1 * d1 + d2 * d2 > this.deltaThreshold;
    },

    userInputing: false,

    _userInteracted: function () {
        "use strict";

        if (this.userInteractionCallback) {
            this.userInteractionCallback();
        }
    },

    control: function (originalCamera, unprocessedEvents) {
        "use strict";

        var now = new Date();
        var i, e;

        for (i = 0; i < unprocessedEvents.length; ++i) {
            e = unprocessedEvents[i];
            switch (e.type) {
                case 'gestureStart':
                    this.userInputing = true;
                    this._cancelCameraMovements(false);
                    this._userInteracted();
                    this.stopMovingCamera();
                    this.onGestureStart(e);
                    break;
                case 'gestureChange':
                    this.onGestureChange(e);
                    break;
                case 'gestureEnd':
                    this.userInputing = false;
                    this.onGestureEnd(e);
                    break;
                case 'discreteZoom':
                    this._cancelCameraMovements(false);
                    this._userInteracted();
                    this.onDiscreteZoom(e);
                    break;
                case 'keydown':
                    this.userInputing = true;
                    this._cancelCameraMovements(false);
                    this._userInteracted();
                    this.onKeyDown(e);
                    break;
                case 'keyup':
                    this.userInputing = false;
                    this.onKeyUp(e);
                    break;
                default:
                    break;
            }
        }

        if (this._gyrometer) {
            var gyroReading = this._gyrometer.getCurrentReading();
            
            if (gyroReading &&
               this.prevGyroReading &&
               gyroReading.timestamp != this.prevGyroReading.timestamp &&
               !this.userInputing &&
               this._ballisticPath == null &&
               this.prevFrameTime) {
                var pitchHeadingDelta = this.processGyrometerReading(gyroReading, now - this.prevFrameTime);
                
                if (pitchHeadingDelta[0] !== 0 || pitchHeadingDelta[1] !== 0) {
                    var pitchHeadingTarget = this.getTargetPitchAndHeading();
                    var pitch = pitchHeadingTarget[0] + pitchHeadingDelta[0];
                    var heading = pitchHeadingTarget[1] - pitchHeadingDelta[1];

                    this.setPitchAndHeading(pitch, heading, true);
                }
            }

            this.prevGyroReading = gyroReading;
        }

        this.update();
        this.updateRotation();
        this.prevFrameTime = now;
        
        return this._camera;
    },

    setGyrometer: function (gyrometer) {
        "use strict";

        this._gyrometer = gyrometer;
    },

    processGyrometerReading: function (reading, timeDelta) {
        "use strict";

        var threshold = (this.prevGyrometerReadingNonZero) ? 2 : 2;

        if (reading == null) {
            this.prevGyrometerReadingNonZero = false;
            return [0,0];
        }

        if (Math.abs(reading.angularVelocityX) < threshold &&
            Math.abs(reading.angularVelocityY) < threshold &&
            Math.abs(reading.angularVelocityZ) < threshold) {
            //if the rotation is below some threshold, then it's probably sensor drift, so just ignore.
            this.prevGyrometerReadingNonZero = false;
            return [0,0];
        }

        this.prevGyrometerReadingNonZero = true;

        //Value is given in degrees per second.  Convert to radians per millisecond.
        //Also adjust to current FOV.  If we didn't do this, then the camera goes crazy when zoomed in far.
        var multiplier = 1.5 * MathHelper.degreesToRadians(timeDelta / 1000) * Math.sin(this.getVerticalFov());

        var headingDelta = reading.angularVelocityY * multiplier;
        var pitchDelta = reading.angularVelocityX * multiplier;

        var currentOrientation = null;

        if (Windows && Windows.Graphics && Windows.Graphics.Display && Windows.Graphics.Display.DisplayProperties) {
            currentOrientation = Windows.Graphics.Display.DisplayProperties.currentOrientation;
        }

        if (Windows.Graphics.Display.DisplayProperties.nativeOrientation == Windows.Graphics.Display.DisplayOrientations.landscape) {
            if (currentOrientation == null || currentOrientation === Windows.Graphics.Display.DisplayOrientations.none || currentOrientation === Windows.Graphics.Display.DisplayOrientations.landscape) {
                return [pitchDelta, headingDelta];
            }
            else if (currentOrientation === Windows.Graphics.Display.DisplayOrientations.portrait) {
                return [headingDelta, -pitchDelta];
            }
            else if (currentOrientation === Windows.Graphics.Display.DisplayOrientations.landscapeFlipped) {
                return [-pitchDelta, -headingDelta];
            }
            else if (currentOrientation === Windows.Graphics.Display.DisplayOrientations.portraitFlipped) {
                return [-headingDelta, pitchDelta];
            }
        } else { // Windows.Graphics.Display.DisplayProperties.nativeOrientation == Windows.Graphics.Display.DisplayOrientations.portrait
            if (currentOrientation == null || currentOrientation === Windows.Graphics.Display.DisplayOrientations.none || currentOrientation === Windows.Graphics.Display.DisplayOrientations.portrait) {
                return [pitchDelta, headingDelta];
            }
            else if (currentOrientation === Windows.Graphics.Display.DisplayOrientations.landscapeFlipped) {
                return [headingDelta, -pitchDelta];
            }
            else if (currentOrientation === Windows.Graphics.Display.DisplayOrientations.portraitFlipped) {
                return [-pitchDelta, -headingDelta];
            }
            else if (currentOrientation === Windows.Graphics.Display.DisplayOrientations.landscape) {
                return [-headingDelta, pitchDelta];
            }
        }
    },

    _updateMinFov: function () {
        "use strict";

        if (this._dimension) {
            this._minFieldOfView = this._height * MathHelper.degreesToRadians(90) / (this._dimension * this._maxPixelScaleFactor); //let them zoom in until each pixel is expanded to 2x2
        }
    },

    setMaxPixelScaleFactor: function (factor) {
        "use strict";

        if (factor < 1) {
            throw "Max pixel scale factor must be 1 or greater";
        }

        this._maxPixelScaleFactor = factor;
        this._updateMinFov();
    },
    
    setViewportSize: function (width, height) {
        "use strict";

        this._height = height;
        this._updateMinFov();
    },

    scrollSpeedX: 0,
    scrollSpeedY: 0,
    scrollAccX: 0,
    scrollAccY: 0,
    motionHandle: 0,

    onKeyDown: function (e) {
        "use strict";

        if (e.keyCode == '37') { //left arrow
            this.startRotateHeading(-1);
            }
        else if (e.keyCode == '38') { //up arrow
            this.startRotatePitch(1);
        }
        else if (e.keyCode == '39') { //right arrow
            this.startRotateHeading(1);
        }
        else if (e.keyCode == '40') { //down arrow
            this.startRotatePitch(-1);
        }
        else if (e.keyCode == '107' || e.keyCode == '187') { //+ keypad or +/=
            this.zoomIn();
        }
        else if (e.keyCode == '109' || e.keyCode == '189') { //- keypad or -/_
            this.zoomOut();
        }
    },

    onKeyUp: function (e) {
        "use strict";

        if (e.keyCode == '37' || e.keyCode == '39') { //left or right arrow
            this.stopRotateHeading();
        }
        else if (e.keyCode == '38' || e.keyCode == '40') { //up or down arrow
            this.stopRotatePitch();
        }
    },

    startRotatePitch: function (acc) {
        "use strict";

        this.scrollAccY = acc;
        this.moveCamera();
    },

    stopRotatePitch: function () {
        "use strict";

        this.scrollAccY = 0;
    },

    startRotateHeading: function (acc) {
        "use strict";

        this.scrollAccX = acc;
        this.moveCamera();
    },

    stopRotateHeading: function () {
        "use strict";

        this.scrollAccX = 0;
    },

    moveCamera: function () {
        "use strict";

        var that = this;
        if (!this.motionHandle) {
            this.motionHandle = setInterval(function () {

                //Apply acceleration
                that.scrollSpeedX += that.scrollAccX;
                that.scrollSpeedY += that.scrollAccY;

                //Apply dampener
                that.scrollSpeedX *= 0.8;
                that.scrollSpeedY *= 0.8;

                var ph = that.getPitchAndHeading();

                //Modify pitch and heading
                var camFov = that._camera.getVerticalFov();
                var camAspect = that._camera.getViewport().getAspectRatio();
                var minFov = Math.min(camFov, camFov * camAspect);
                ph[0] += that.scrollSpeedY * minFov / 100;
                ph[1] += that.scrollSpeedX * minFov / 100;
                that.setPitchAndHeading(ph[0], ph[1]);

                //Came to a stop - remove motion handler
                if (Math.abs(that.scrollSpeedX) < 0.1 && Math.abs(that.scrollSpeedY) < 0.1) {
                    that.stopMovingCamera();
                    return;
                }
            }, 33); //cap at 30 fps
        }
    },

    stopMovingCamera: function () {
        "use strict";

        if( this.motionHandle) {
            clearInterval(this.motionHandle);
            this.motionHandle = 0;
            this.scrollSpeedX = 0;
            this.scrollSpeedY = 0;
        }
    }
};
/**
 * @fileoverview This contains utilies for computed tiled image level of detail.
 */

var TileId = function (levelOfDetail, x, y) {
    "use strict";

    var self = this;
    self.x = Math.floor(x);
    self.y = Math.floor(y);
    self.levelOfDetail = Math.floor(levelOfDetail);
};

TileId.prototype = {
    hasParent: function () {
        "use strict";

        return this.levelOfDetail > 0;
    },

    getParent: function () {
        "use strict";

        if(!this.hasParent()) {
            throw '0 level does not have a parent';
        }
        return new TileId(this.levelOfDetail - 1, this.x >> 1, this.y >> 1); 
    },

    getChildren: function () {
        "use strict";

        var childX  = this.x << 1,
            childY  = this.y << 1;
        return [new TileId(this.levelOfDetail + 1, childX,     childY) ,
                new TileId(this.levelOfDetail + 1, childX + 1, childY) ,
                new TileId(this.levelOfDetail + 1, childX,     childY + 1), 
                new TileId(this.levelOfDetail + 1, childX + 1, childY + 1)];
    },

    isChildOf: function (other) {
        "use strict";

        if (this.levelOfDetail < other.levelOfDetail) {
            return false;
        } 

        return (this.x >> this.levelOfDetail) === other.x &&
               (this.y >> this.levelOfDetail) === other.y;
    },

    equals: function (other) {
        "use strict";

        return this.x === other.x && this.y === other.y && this.levelOfDetail  === this.levelOfDetail;
    },

    toString: function () {
        "use strict";

        return '(' + this.x + ',' + this.y + ',' + this.levelOfDetail + ')';
    }
};


/**
 * This class has all the math around determining LOD and rendering tiled
 * content. Note here baseImage dimensions are of the original imagery at the
 * finest level of detail (the base of the mip-map pyramid.) Here tileWidth and
 * tileHeight are dimensions of source pixels in tiles thus do not include
 * overlap or borders.
 */
var TiledImagePyramid = function (name, baseImageWidth, baseImageHeight, tileWidth, tileHeight, minimumLod, tileOverlap, tileBorder, atlasImage) {
    "use strict";

    if (!baseImageWidth || !baseImageHeight || !tileWidth || !tileHeight) {
        throw 'Expected baseImageWidth baseImageHeight tileWidth tileHeight as positive integer arguments';
    }

    this.baseImageWidth = baseImageWidth;
    this.baseImageHeight = baseImageHeight;
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.minimumLod = minimumLod || 0;
    this.finestLod = MathHelper.ceilLog2(Math.max(baseImageWidth, baseImageHeight));
    this.tileOverlap = tileOverlap || 0;
    this.tileBorder = tileBorder || 0;

    this.atlasImage = atlasImage;

    this.name = name;

    this.lodHistory = {};
    this.callCount = 0;
};

var debugReturnedTiles = false;
var prevReturnedTiles = {};

TiledImagePyramid.prototype = {
    isAtlasTile: function (tileId) {
        "use strict";

        return (this.atlasImage && tileId.levelOfDetail == this.minimumLod && tileId.x == 0 && tileId.y == 0);
    },
    
    allowTileToBeSubdivided: function (tileId) {
        return tileId.levelOfDetail <= this.minimumLod + 1;
    },

    getLodWidthInTiles: function (lod) {
        "use strict";

        return MathHelper.divRoundUp(MathHelper.divPow2RoundUp(this.baseImageWidth,  this.finestLod - lod), this.tileWidth);    
    },

    getLodHeightInTiles: function (lod) {
        "use strict";

        return MathHelper.divRoundUp(MathHelper.divPow2RoundUp(this.baseImageHeight,  this.finestLod - lod), this.tileHeight);    
    },

    getLodWidth: function (lod) {
        "use strict";

        return MathHelper.divPow2RoundUp(this.baseImageWidth, this.finestLod - lod);
    },

    getLodHeight: function (lod) {
        "use strict";

        return MathHelper.divPow2RoundUp(this.baseImageHeight, this.finestLod - lod);
    },

    getEdgeFlags: function (tileId) {
        "use strict";

        return {
            isLeft  : tileId.x === 0 ,
            isRight : tileId.x === this.getLodWidthInTiles(tileId.levelOfDetail) - 1,
            isTop : tileId.y === 0 ,
            isBottom : tileId.y === this.getLodHeightInTiles(tileId.levelOfDetail) - 1 
        };
    },

    //Returns a Vector2 of the actual tile size.
    getTileDimensions: function (tileId) {
        "use strict";

        //(1) We first compute what size (not including overlap) 
        //(2) We add overlap + border to compute physical size of the image.
        var lodWidth = this.getLodWidth(tileId.levelOfDetail);
        var lodHeight = this.getLodHeight(tileId.levelOfDetail);
        
        var width, height;

        if (this.isAtlasTile(tileId)) {
            width = lodWidth + (2 * this.tileBorder);
            height = lodHeight + (2 * this.tileBorder);
        }
        else {
            var edgeFlags = this.getEdgeFlags(tileId);

            //Max X assuming full tile width.
            var xMax = tileId.x * this.tileWidth + this.tileWidth - 1;
            //Take into account fractional tiles on boundary.
            width = (xMax < lodWidth)? this.tileWidth : this.tileWidth - (xMax - lodWidth);
            if(edgeFlags.isLeft || edgeFlags.isRight) {
                width += this.tileOverlap;
                width += this.tileBorder;
            }  else {
                //Interior tile.
                width += 2*this.tileOverlap;
            }

            var yMax = tileId.y*this.tileHeight + this.tileHeight - 1;
            height = (yMax < lodHeight)? this.tileHeight: this.tileHeight - (yMax - lodHeight);

            if(edgeFlags.isTop || edgeFlags.isBottom) {
                height += this.tileOverlap;
                height += this.tileBorder;
            } else {
                height += 2*this.tileOverlap;
            }
        }

        //Takes into acount border & overlap thus is the real texture size.
        var tileDimension = new Vector2(width, height);

        return tileDimension;
    },

    /**
     * Get the transform from tile's coordinates to base-image coordinates (uniform scale + translation.)
     */
    getTileTransform: function (tileId) {
        "use strict";

        var scale = 1 << (this.finestLod - tileId.levelOfDetail); 

        var edgeFlags = this.getEdgeFlags(tileId);

        //Single Image Texture upsampled to Base Image Texture Space. 
        var scaleTransform = Matrix4x4.createScale(scale, scale, 1.0);
        var xPos = tileId.x * this.tileWidth;
        
        var lodHeight = this.getLodHeight(tileId.levelOfDetail);
        var yMax = tileId.y*this.tileHeight + this.tileHeight;
        var height = (yMax < lodHeight)? this.tileHeight: this.tileHeight - (yMax - lodHeight);
        //We flip but have to take into account partial tiles at the bottom . We don't do any factoring for overlap.
        var yPos = lodHeight - (height + tileId.y * this.tileHeight);

        var overlapTransform = Matrix4x4.createTranslation(edgeFlags.isLeft? -this.tileBorder: -this.tileOverlap,
                                                           edgeFlags.isTop?  -this.tileBorder: -this.tileOverlap,
                                                           0.0);

        //Position the tile in base image texture space.
        var translation = Matrix4x4.createTranslation(xPos, yPos, 0.0);

        return scaleTransform.multiply(translation.multiply(overlapTransform));
    },
    
    /**
     * Computes the level detail given a ratio of texels to pixels.
     */
    getLodFromTexelToPixelRatio: function (texelToPixelRatio) {
        "use strict";

        return this.finestLod - MathHelper.logBase(texelToPixelRatio,2);
    },

    /**
     * Calculates the finest level of detail to use based on the render level of detail.
     */
    getDiscreteLod: function (lod) {
        "use strict";

        // Round to the nearest LOD based on area, rather than rounding in log space. This means
        // rounding about N + Log_2(3/2) instead of N + 0.5.
        var renderLod = (lod - Math.floor(lod) < 0.5849625) ? Math.floor(lod) : Math.ceil(lod);


        // Clamp to [coarsestLod, this.finestLod], which causes the coarsest LOD to be shown even if it's being downsampled
        // by several levels.
        return MathHelper.clamp(renderLod, this.minimumLod, this.finestLod);

    },
    /**
     * The approach taken here is to average the texel/pixel ratio across all
     * of the line segments of the polygon.
     */ 
    getTexelRatio: function (screenSpacePolygon, textureSpacePolygon) {
        "use strict";

        if(screenSpacePolygon.length !== textureSpacePolygon.length) {
            throw 'expected two equal length arrays';
        }

        var v0Idx = screenSpacePolygon.length - 1;
        var minTexelToPixelRatio = Number.MAX_VALUE;
        var maxTexelToPixelRatio = -Number.MAX_VALUE;
        var numberOfSegments = 0;
        var totalTexelToPixelRatio = 0;
		var texelLengths = [];
		var pixelLengths = [];
        for(var v1Idx = 0; v1Idx < screenSpacePolygon.length; ++v1Idx) {
            var baseImageSpaceV0X = textureSpacePolygon[v0Idx].x; //coords in base image
            var baseImageSpaceV0Y = textureSpacePolygon[v0Idx].y;
            var baseImageSpaceV1X = textureSpacePolygon[v1Idx].x; 
            var baseImageSpaceV1Y = textureSpacePolygon[v1Idx].y;

            //ndc goes [-1,-1]x[1,1]
            var screenSpaceV0X = screenSpacePolygon[v0Idx].x; //coords in display window
            var screenSpaceV0Y = screenSpacePolygon[v0Idx].y; 
            var screenSpaceV1X = screenSpacePolygon[v1Idx].x; 
            var screenSpaceV1Y = screenSpacePolygon[v1Idx].y; 

            var dx = screenSpaceV1X - screenSpaceV0X;
            var dy = screenSpaceV1Y - screenSpaceV0Y;

            var du = baseImageSpaceV1X - baseImageSpaceV0X;
            var dv = baseImageSpaceV1Y - baseImageSpaceV0Y;

			var texelLength = Math.sqrt(du*du + dv*dv);
			var pixelLength = Math.sqrt(dx*dx + dy*dy);
            if (pixelLength != 0) {
                var texelToPixelRatio = texelLength / pixelLength;
                minTexelToPixelRatio = Math.min(minTexelToPixelRatio, texelToPixelRatio);
                maxTexelToPixelRatio = Math.max(maxTexelToPixelRatio, texelToPixelRatio);
                totalTexelToPixelRatio += texelToPixelRatio;
                ++numberOfSegments;
            }
			texelLengths.push(texelLength);
			pixelLengths.push(pixelLength);
            v0Idx = v1Idx;
        }
        return {
            meanTexelToPixelRatio: totalTexelToPixelRatio/numberOfSegments,
            minTexelToPixelRatio: minTexelToPixelRatio,
			maxTexelToPixelRatio: maxTexelToPixelRatio,
			texelLengths: texelLengths,
			pixelLengths: pixelLengths
        };
    },

    _isInvalidNdcSpacePolygon: function (poly) {
        "use strict";

        if (poly.length < 3) {
            return true;
        }

        if (!poly[0].equals) {
            return true;
        }

        for (var i = 1; i < poly.length; i++) {
            if (!poly[0].equals(poly[1])) {
                return false;
            }
        }

        return true;
    },

    /**
     * Returns the list of visible tiles. 
     */
    getVisibleTiles: function (getModelTransform, viewProjectionTransform, viewportWidth, viewportHeight, textureSpaceClipRect, useLowerLod) {
        "use strict";

        var viewportTransform = GraphicsHelper.createViewportToScreen(viewportWidth, viewportHeight);
        var visibleTiles = [];
        //This will project and clip the polygon and provide NDC and texture space versions of the clipped polygon.
        var clippedPolygon = this.getClippedPolygon(getModelTransform, viewProjectionTransform);


        if(this._isInvalidNdcSpacePolygon(clippedPolygon.ndcSpacePolygon)) {
            return {
                visibleTiles: visibleTiles,
                textureSpacePolygon: clippedPolygon.textureSpacePolygon
            };
        }

        var textureSpacePolygon = [];
        var screenSpacePolygon = [];
        for(var i = 0; i < clippedPolygon.ndcSpacePolygon.length; ++i) {
            //After we've clipped we don't use W (or Z for that matter).
            clippedPolygon.textureSpacePolygon[i].x /= clippedPolygon.textureSpacePolygon[i].w;
            clippedPolygon.textureSpacePolygon[i].y /= clippedPolygon.textureSpacePolygon[i].w;
            clippedPolygon.textureSpacePolygon[i].z /= clippedPolygon.textureSpacePolygon[i].w;
            clippedPolygon.textureSpacePolygon[i].z = 0.0;
            clippedPolygon.textureSpacePolygon[i].w = 1.0;

            //This gets reused and mutated when we do tile grid rasterization.        
            textureSpacePolygon.push(new Vector2(clippedPolygon.textureSpacePolygon[i].x, clippedPolygon.textureSpacePolygon[i].y));

            //Again we only use NDC x,y. 
            clippedPolygon.ndcSpacePolygon[i].x /= clippedPolygon.ndcSpacePolygon[i].w;
            clippedPolygon.ndcSpacePolygon[i].y /= clippedPolygon.ndcSpacePolygon[i].w;
            clippedPolygon.ndcSpacePolygon[i].z /= clippedPolygon.ndcSpacePolygon[i].w;
            clippedPolygon.ndcSpacePolygon[i].w = 1.0;

            //Convert to screenspace TODO opt.
            var screenSpacePoint = viewportTransform.transformVector4(clippedPolygon.ndcSpacePolygon[i]);
            screenSpacePolygon.push(new Vector2(screenSpacePoint.x, screenSpacePoint.y));
        }

        //We apply clip rect , this is done by clipping
        // the texture space polygon with our texture space rectangle.
        if(textureSpaceClipRect) {
            var poly = convexPolygonClipper.clip(new Vector4(textureSpaceClipRect.getLeft(),textureSpaceClipRect.getTop(), 0) ,
                                                 new Vector4(textureSpaceClipRect.getRight(), textureSpaceClipRect.getBottom(), 0), clippedPolygon.textureSpacePolygon);
            textureSpacePolygon = [];
            //TODO optimize
            for(var i = 0; i < poly.length; ++i) {
                textureSpacePolygon.push(poly[i]);
            }
        } else {
            textureSpacePolygon = clippedPolygon.textureSpacePolygon;
        }

		var texelRatio = this.getTexelRatio(screenSpacePolygon, clippedPolygon.textureSpacePolygon);
        
		var preciseLod = this.getLodFromTexelToPixelRatio(texelRatio.meanTexelToPixelRatio);
        if (useLowerLod) {
            preciseLod -= 1.0;
        }
		var renderedLod = this.getDiscreteLod(preciseLod);

		var tileGridWidth = this.getLodWidthInTiles(renderedLod);
		var tileGridHeight = this.getLodWidthInTiles(renderedLod);

        if(tileGridWidth === 1 && tileGridHeight === 1) {
            visibleTiles.push(new TileId(renderedLod,0,0));
        } else {
			var modelTransform = getModelTransform(this.baseImageWidth, this.name);
			var modelViewProjection = viewProjectionTransform.multiply(modelTransform);
			var visibleTiles;
			if (Config.outputMultiLODTiles) {
				visibleTiles = this.intersectClippedPolyWithTileGrid_multiLOD2(modelViewProjection,
						viewportWidth, viewportHeight,
						textureSpacePolygon,
						screenSpacePolygon,
						tileGridWidth, 
						tileGridHeight, 
						this.tileWidth, 
						this.tileHeight);
			} else {
				visibleTiles = this.intersectClippedPolyWithTileGrid(modelViewProjection,
						textureSpacePolygon, 
						textureSpacePolygon.length, 
						this.finestLod, 
						renderedLod, 
						tileGridWidth, 
						tileGridHeight, 
						this.tileWidth, 
						this.tileHeight);
			}
        }

        return {
            visibleTiles: visibleTiles,
            lod: renderedLod,
            preciseLod: preciseLod,
            finestRenderedLod: this.getLodFromTexelToPixelRatio(texelRatio.minTexelToPixelRatio),
            textureSpacePolygon: clippedPolygon.textureSpacePolygon
        };
    },

    /**
     * Transforms a polygon in NDC space into
     * texture space , accounting for the projection.
     */
    projectPolygonFromNDCToTexture: function (imageSpaceEye, modelViewProjection, ndcPolygon, imageDim) {
        "use strict";

        var inverseModelViewProjection = modelViewProjection.inverse();
        var polygonProjectedOntoImage = [];
        for (var i = 0; i < ndcPolygon.length; ++i) {
            var vImageSpace = inverseModelViewProjection.transformVector4(ndcPolygon[i]); 
            vImageSpace.x /=vImageSpace.w;
            vImageSpace.y /= vImageSpace.w;
            vImageSpace.z /= vImageSpace.w;
            vImageSpace.w = 1.0;
            vImageSpace.y = imageDim-1 - vImageSpace.y; //Convert to from image space (Y-up) to texture space (Y-down).
            polygonProjectedOntoImage.push(vImageSpace); 
        }

        return polygonProjectedOntoImage;
    },

    /**
     * Returns the homogenous clipped NDC and Texture Space polygon
	 * When very large images, such as a map whose dimensions are 2^27,
	 * the inverse of the model matrix cannot be reliably computed if
	 * it's a matrix for the entire original resolution. Therefore, we
	 * do clipping on a low resolution of 1024 and scaling the results
	 * to actual dimensions
     */
    getClippedPolygon: function (getModelTransform, viewProjectionTransform) {
        "use strict";

		var clipDim = 1024;
		var clipModelTransform = getModelTransform(clipDim, this.name);
        var ndcPolygon = [],
            i,
            clippedNDCPolygon,
            backProjectedPolygon,
            inverseModelTransform =  clipModelTransform.inverse(),
            projectorPosition = inverseModelTransform.transformVector4(new Vector4(0,0,0,1)),
            modelViewProjection = viewProjectionTransform.multiply(clipModelTransform),
            imageCorners = [
            new Vector4(0,0,0,1),
            new Vector4(0,clipDim,0,1),
            new Vector4(clipDim,clipDim,0,1),
            new Vector4(clipDim,0,0,1)
        ];

        for(i = 0; i < imageCorners.length; ++i) {
            ndcPolygon.push(modelViewProjection.transformVector4(imageCorners[i]));
        }

        var clippedNDCPolygon = convexPolygonClipper.clip(new Vector4(-1,-1,-1) , new Vector4(1, 1, 1), ndcPolygon);    
        var backProjectedPolygon = this.projectPolygonFromNDCToTexture(projectorPosition, modelViewProjection, clippedNDCPolygon, clipDim);

		var ratio = this.baseImageHeight / clipDim;
        for(var i = 0; i < backProjectedPolygon.length; ++i) {
			backProjectedPolygon[i].x *= ratio;
			backProjectedPolygon[i].y = this.baseImageHeight-1-
				(clipDim-1-backProjectedPolygon[i].y)*ratio;
		}

        return {
            ndcSpacePolygon : clippedNDCPolygon,
            textureSpacePolygon : backProjectedPolygon
        };
    },

    /**
     * Tests if an oriented bounding box intersects an axis-aligned bounding box.
     * @param {Vector2} orientedBBox0 One endpoint of the oriented bounding box.
     * @param {Vector2} orientedBBox1 Second endpoint of the oriented bounding box.
     * @param {number} orientedBBoxWidth The width of the oriented bounding box, perpendicular to the line connecting the endpoints.
     * @param {Rectangle} axisAlignedBBox The aabox you are testing against.
     * @return {bool}
     */
    orientedBoundingBoxRectIntersecion: function (orientedBBox0, orientedBBox1, orientedBBoxWidth, axisAlignedBBox) {
        "use strict";

        if (orientedBBoxWidth <= 0)
        {
            throw 'box must have positive width';
        }

        var norm = orientedBBox1.subtract(orientedBBox0).normalize();
        norm =  norm.multiplyScalar(orientedBBoxWidth * 0.5) ;
        var perp = new Vector2(-norm.y, norm.x);

        var boxCorners = [[
                orientedBBox0.add(perp).subtract(norm),
                orientedBBox1.add(perp).add(norm),
                orientedBBox1.subtract(perp).add(norm),
                orientedBBox0.subtract(perp).subtract(norm)
            ], [
                new Vector2(axisAlignedBBox.getLeft(), axisAlignedBBox.getTop()),
                new Vector2(axisAlignedBBox.getRight(), axisAlignedBBox.getTop()),
                new Vector2(axisAlignedBBox.getRight(), axisAlignedBBox.getBottom()),
                new Vector2(axisAlignedBBox.getLeft(), axisAlignedBBox.getBottom())
            ]
        ];

        var boxCorners0 = boxCorners[0];
        var boxCorners1 = boxCorners[1];

        // First we test if one OBB intersects another OBB 'one-way', then reverse and test again.
        for (var direction = 0; direction < 1; direction++)
        {
            var axis1 = boxCorners0[1].subtract(boxCorners0[0]);
            var axis2 = boxCorners0[3].subtract(boxCorners0[0]);
            axis1 = axis1.multiplyScalar( (1.0 / axis1.lengthSquared())) ;
            axis2 = axis2.multiplyScalar((1.0 / axis2.lengthSquared()));
            var origin1 = boxCorners0[0].dot(axis1);
            var origin2 = boxCorners0[0].dot(axis2);

            for (var a = 0; a < 2; a++)
            {
                var axis = ((a == 0) ? axis1 : axis2);
                var origin = ((a == 0) ? origin1 : origin2);
                var tMin = Number.MAX_VALUE;
                var tMax = Number.MIN_VALUE;

                var t = boxCorners1[0].dot(axis);
                if (t < tMin) {
                    tMin = t;
                }
                if (t > tMax) {
                    tMax = t;
                }
                t = boxCorners1[1].dot(axis);
                if (t < tMin) {
                    tMin = t;
                }
                if (t > tMax) {
                    tMax = t;
                }
                t = boxCorners1[2].dot(axis);
                if (t < tMin) {
                    tMin = t;
                }
                if (t > tMax) {
                    tMax = t;
                }
                t = boxCorners1[3].dot(axis);
                if (t < tMin) {
                    tMin = t;
                }
                if (t > tMax) {
                    tMax = t;
                }

                if ((tMin - origin) > 1.0 || (tMax - origin) < 0.0) {
                    return false;
                }
            }

            var tmp = boxCorners0;
            boxCorners0 = boxCorners1;
            boxCorners1 = tmp;
        }
        return true;
    },

    /**
     * Returns the square of the minimum distance between the point p and the line
     * passing through points line0 and line1. 
     *
     * inLineSegment in the output object is true if the point on the line that is closest to p is within the line segment [line0,line1].
     * @param {Vector2} line0 
     * @param {Vector2} line1
     * @param {Vector2} point
     * @return {{inLineSegment: boolean, distanceSquared: number}}
     */
    linePointDistanceSquared: function (line0, line1, point) {
        "use strict";

        var distanceSquared = line0.subtract(line1).lengthSquared();
        var alpha = ((point.x - line0.x) * (line1.x - line0.x) + (point.y - line0.y) * (line1.y - line0.y)) / distanceSquared;

        var inLineSegment = alpha >= 0.0 && alpha <= 1.0;

        // This point is the intersection of the line with the tangent to the line that passes through the point p.
        var pIntersection = line0.lerp(line1, alpha);

        return {
            distanceSquared: pIntersection.subtract(point).lengthSquared(),
            inLineSegment: inLineSegment
        }
    },

	pointInPoly : function(points, x, y) {
	    "use strict";

		var i, j, c = false;
		for (i = 0, j = points.length-1; i < points.length; j = i++) {
		    if ((((points[i].y <= y) && (y < points[j].y)) ||
						((points[j].y <= y) && (y < points[i].y))) &&
					(x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x)) {
		        c = !c;
		    }
		}
		return c;
	},

	intersectClippedPolyWithTileGrid_multiLOD2: function (modelViewProjection, viewportWidth, viewportHeight, texSpacePoly, scrSpacePoly) {
	    "use strict";

	    var scrVert,
	        width,
	        height,
	        texX,
	        texY,
	        lodDiff;

		if (scrSpacePoly.length != texSpacePoly.length) {
			scrSpacePoly = [];
			for (var k=0; k<texSpacePoly.length; k++) {
				var vert = new Vector4(texSpacePoly[k].x, this.baseImageHeight-1-texSpacePoly[k].y, 0, 1);
				scrVert = modelViewProjection.transformVector4(vert);
				scrVert.x /=  scrVert.w;
				scrVert.y /=  scrVert.w;
				scrVert.x = (scrVert.x + 1) * 0.5 * viewportWidth; 
				scrVert.y = (scrVert.y + 1) * 0.5 * viewportHeight; 
				scrSpacePoly.push(scrVert);
			}
		}
													
		var texelRatio = this.getTexelRatio(scrSpacePoly, texSpacePoly);
		var preciseLod = this.getLodFromTexelToPixelRatio(texelRatio.meanTexelToPixelRatio);
		var renderedLod = this.getDiscreteLod(preciseLod);

		var tileGridWidth = this.getLodWidthInTiles(renderedLod);
		var tileGridHeight = this.getLodWidthInTiles(renderedLod);
		var tiles = this.intersectClippedPolyWithTileGrid(modelViewProjection,
						texSpacePoly, 
						texSpacePoly.length, 
						this.finestLod, 
						renderedLod, 
						tileGridWidth, 
						tileGridHeight, 
						this.tileWidth, 
						this.tileHeight);

		var changed = true;
		var newTiles;
		while (changed) {
			changed = false;

			var newTiles = [];
			for (var i=0; i<tiles.length; i++) {
				var tileId = tiles[i];

				var texSpaceClippedQuad;

				// sanity check
				lodDiff = this.finestLod - tileId.levelOfDetail;
				texX = (tileId.x << lodDiff) * this.tileWidth;
				texY = (tileId.y << lodDiff) * this.tileHeight;
				width = this.tileWidth << lodDiff; 
				height = this.tileWidth << lodDiff; 
				texSpaceClippedQuad = convexPolygonClipper.clip(
						new Vector4(texX, texY, 0),
						new Vector4(texX+width, texY+height,0),
						texSpacePoly);
				if (! texSpaceClippedQuad.length) {
					//It's possible that a tile declared visible by
					//intersectClippedPolyWithTileGrid() is foudn not actually
					//visible because scan-conversion in that function use
					//a inflate factor to offset scan conversion inaccuracies
					continue;
				}

				if (tileId.noSubdiv || tileId.levelOfDetail==this.finestLod) {
					newTiles.push(tileId);
					continue;
				}

				//subdivide
				var children = tileId.getChildren();
				var numNewLod = 0, numClippedOut = 0;
				for (var c=0; c<children.length; c++) {
					// see if children are visible
					var childTileId = children[c];
					lodDiff = this.finestLod - childTileId.levelOfDetail;
					texX = (childTileId.x << lodDiff) * this.tileWidth;
					texY = (childTileId.y << lodDiff) * this.tileHeight;
					width = this.tileWidth << lodDiff; 
					height = this.tileWidth << lodDiff; 
					var tolerance = 0.01;
					texX += tolerance;
					texY += tolerance;
					width -= tolerance;
					height -= tolerance;

					var fullyContained = true;
					for (var m = 0; m <= 1 && fullyContained; m++) {
					    for (var n = 0; n <= 1 && fullyContained; n++) {
					        if (!this.pointInPoly(texSpacePoly, texX + m * width, texY + n * height)) {
					            fullyContained = false;
					        }
					    }
					}

					texSpaceClippedQuad = [];
					if (! fullyContained) {
						texSpaceClippedQuad = convexPolygonClipper.clip(
							new Vector4(texX, texY, 0),
							new Vector4(texX+width, texY+height,0),
							texSpacePoly);
					}
					else {
						texSpaceClippedQuad.push(new Vector4(texX, texY, 0, 1));
						texSpaceClippedQuad.push(new Vector4(texX+width, texY, 0, 1));
						texSpaceClippedQuad.push(new Vector4(texX+width, texY+height, 0, 1));
						texSpaceClippedQuad.push(new Vector4(texX, texY+height, 0, 1));
					}

					if (texSpaceClippedQuad.length > 0) {
					    var scrSpaceClippedQuad = [];
					    for (var v = 0; v < texSpaceClippedQuad.length; v++) {
					        var vert = new Vector4(texSpaceClippedQuad[v].x,
									this.baseImageHeight - 1 - texSpaceClippedQuad[v].y, 0, 1);
					        scrVert = modelViewProjection.transformVector4(vert);
					        scrVert.x /= scrVert.w;
					        scrVert.y /= scrVert.w;
					        scrVert.x = (scrVert.x + 1) * 0.5 * viewportWidth;
					        scrVert.y = (scrVert.y + 1) * 0.5 * viewportHeight;
					        scrSpaceClippedQuad.push(scrVert);
					    }

					    var texelRatio = this.getTexelRatio(scrSpaceClippedQuad, texSpaceClippedQuad);
					    var preciseLod = this.getLodFromTexelToPixelRatio(texelRatio.meanTexelToPixelRatio);
					    var renderedLod = this.getDiscreteLod(preciseLod);
					    var maxPixelLengths = 0;
					    for (var l = 0; l < texelRatio.pixelLengths.length; l++) {
					        if (texelRatio.pixelLengths[l] > maxPixelLengths) {
					            maxPixelLengths = texelRatio.pixelLengths[l];
					        }
					    }
					    if (renderedLod > tileId.levelOfDetail ||
							maxPixelLengths > this.tileWidth) {
					        newTiles.push(childTileId);
					        numNewLod++;
					        changed = true;
					    }
					}
					else {
					    numClippedOut++;
					}
				}
				if (numNewLod < children.length - numClippedOut) {
					// at least one child areas has the same lod requirement as parent, and
					// as a result it was not necessary to refine to that child tile; in this
					// case, the parent tile is still useful
					tileId.noSubdiv = true;
					newTiles.push(tileId);
				}
			}

			if (changed) {
			    tiles = newTiles;
			}
		}
		return tiles;
   },


    /**
     * Calculates the tiles in the specified LOD that intersect the visible 
     * region, which is provided as the UVs in clippedVerticesSS.
     * @param {Array.<Vector2>} clippedVerticesSSTexCoords
     * @param {number} nClippedVerticesSS
     * @param {number} finestLod
     * @param {number} lod
     * @param {number} tileGridWidth
     * @param {number} tileGridHeight
     * @param {number} tileWidth
     * @param {number} tileHeight
     * @return {Array.<TileId>}
     */
	intersectClippedPolyWithTileGrid: function (modelViewProjection, clippedVerticesSSTexCoords, nClippedVerticesSS, finestLod, lod, tileGridWidth, tileGridHeight, tileWidth, tileHeight) {
	    "use strict";

        // Transform UVs to LOD's tile space and find bounding box
        var xScale = (1.0 / ((1) << (finestLod - lod))) / tileWidth;
        var yScale = (1.0 / ((1) << (finestLod - lod))) / tileHeight;

		var tileIdCoords = new Array(nClippedVerticesSS);
        for (var i = 0; i < nClippedVerticesSS; i++) {
            tileIdCoords[i] = {x: clippedVerticesSSTexCoords[i].x * xScale,
				y: clippedVerticesSSTexCoords[i].y * yScale};
        }

        var tileOffsets = PolygonTileFloodFiller.floodFill(tileGridWidth, tileGridHeight, tileIdCoords);

        var tiles = [];
        for (var i = 0; i < tileOffsets.length; i++) {
            tiles.push(new TileId(lod, tileOffsets[i].x, tileOffsets[i].y));
        }

        return tiles;
    }
};
//
// This class manages walking up and down quad tree of tiles to compute what tiles are 
// overlapping with deeper levels of the image pyramid.

var TiledImagePyramidCoverageMap = function(minimumLevelOfDetail, maximumLevelOfDetail) {
    "use strict";

    var self = this,
        lod;

    if(minimumLevelOfDetail < 0) {
        throw 'minimumLevelOfDetail needs to be non negative';
    }
    if(maximumLevelOfDetail < 0) {
        throw 'maximimLevelOfDetail needs to be non negative';
    }
    if(!(minimumLevelOfDetail <= maximumLevelOfDetail)) {
        throw 'min should be less than or equal max lod';
    }

	self.x0 = -1;
    self.y0 = -1;
    self.x1 = -1;
    self.y1 = -1;
    self.levelOfDetail = maximumLevelOfDetail;
    self.minimumLevelOfDetail = minimumLevelOfDetail;
    self.occluderFlags = [];
    self.occludedFlags = [];

    for (lod = 0; lod <= self.levelOfDetail; ++lod) {
			self.occluderFlags.push({});
			self.occludedFlags.push({});
	}
};

TiledImagePyramidCoverageMap.prototype = {
    //Initializes with a new tile grid.
    initialize: function (levelOfDetail, x0, y0, x1, y1) {
        "use strict";

		if (!(levelOfDetail >= 0)) {
            throw 'Expected ' + '(levelOfDetail >= 0)';
        }
		if (!(levelOfDetail <= this.occluderFlags.length - 1)) {throw 'Expected ' + '(levelOfDetail <= occluderFlags.length - 1)';}
		if (!(x0 < x1)) {throw 'Expected ' + '(x0 < x1)';}
		if (!(y0 < y1)) {throw 'Expected ' + '(y0 < y1)';}

		this.levelOfDetail = levelOfDetail;
		this.x0 = x0;
		this.y0 = y0;
		this.x1 = x1;
		this.y1 = y1;
	},

	// Marks a tile as an occluder.
    markAsOccluder: function (tileId, occluder) {
        "use strict";

		this.setOccluderFlag(tileId.toString(), occluder);
	},

	// Must be called after initialize and before doing occlusion queries.
    calculateOcclusions: function () {
        "use strict";

        var lod, x, y, bounds, occluded, tileId;
		for (lod = this.levelOfDetail; lod >= this.minimumLevelOfDetail; lod--) {
			if (lod != this.levelOfDetail) {
				bounds = this.getTileBoundsAtLod(lod);

				for (y = bounds.lodY0; y < bounds.lodY1; y++) {
					for (x = bounds.lodX0; x < bounds.lodX1; x++) {							
						tileId = new TileId(lod, x, y);

						if (this.getOccluderFlag(tileId) !== undefined) {
							occluded =
								this.isChildIrrelevantOrOccluder(tileId, 0) &&
								this.isChildIrrelevantOrOccluder(tileId, 1) &&
								this.isChildIrrelevantOrOccluder(tileId, 2) &&
								this.isChildIrrelevantOrOccluder(tileId, 3);

							if (occluded) {
								this.setOccludedFlag(tileId, true);
								this.setOccluderFlag(tileId, true);
							} else {
								this.setOccludedFlag(tileId, false);
								this.setOccluderFlag(tileId, false);
							}
						}
					}
				}
			}
		}
	},

	//Returns true if the given tile is occluded by its descendents.
    isOccludedByDescendents: function (tileId) {
        "use strict";

		return this.getOccludedFlag(tileId);
	},

    isChildIrrelevantOrOccluder: function (tileId, childIdx) {
        "use strict";

		if (!((childIdx >= 0 && childIdx < 4))) {throw 'Expected ' + '(childIdx >= 0 && childIdx < 4)';}

		var childTileId = new TileId(tileId.levelOfDetail + 1, (tileId.x << 1) + childIdx % 2, (tileId.y << 1) + childIdx / 2);

		var bounds = this.getTileBoundsAtLod(childTileId.levelOfDetail);

		if (childTileId.x >= bounds.lodX0 && childTileId.x < bounds.lodX1 &&
			childTileId.y >= bounds.lodY0 && childTileId.y < bounds.lodY1) {
			var occluderFlag = this.getOccluderFlag(childTileId);
			return (occluderFlag === undefined) || occluderFlag;
		}
		else {
			// Child is off the grid, so it's clearly irrelevant.
			return true;
		}
	},

    getOccluderFlag: function (tileId) {
        "use strict";

		return this.occluderFlags[tileId.levelOfDetail][tileId];
	},

    setOccluderFlag: function (tileId, occluderFlag) {
        "use strict";

		this.occluderFlags[tileId.levelOfDetail][tileId] = occluderFlag;
	},

    getOccludedFlag: function (tileId) {
        "use strict";

		return this.occludedFlags[tileId.levelOfDetail][tileId];
	},

    setOccludedFlag: function (tileId, occludedFlag) {
        "use strict";

		this.occludedFlags[tileId.levelOfDetail][tileId] = occludedFlag;
	},

    getTileBoundsAtLod: function (lod) {
        "use strict";

		var lodDiff = this.levelOfDetail - lod;

        return {
            lodX0 : this.x0 >> lodDiff,
            lodY0 : this.y0 >> lodDiff,
            lodX1 : MathHelper.divPow2RoundUp(this.x1, lodDiff),
            lodY1 : MathHelper.divPow2RoundUp(this.y1, lodDiff)
        };
	},

    getDescendents: function (tileId) {
        "use strict";

        var lod, bounds, tileId, result=[];
		for (lod = tileId.levelOfDetail+1; lod <= this.levelOfDetail; lod++) {
			bounds = this.getTileBoundsAtLod(lod);
			for (var tileid in this.occluderFlags[lod]) {
			    if (bounds.lodX0 <= tileid.x && tileid.x <= bounds.lodX1 &&
					bounds.lodY0 <= tileid.y && tileid.y <= bounds.lodY1) {
			        result.push(tileId.toString());
			    }
			}
					
		}
		return result;
	}
};
// This is a helper class that computes the incremental change
// in visible tiles for the present model-view-projection and 
// viewport setups. The actually culling and LOD determination
// is done by TiledImagePyramid.getVisibleTiles(), but this 
// helper does the rest by figuring out the incremental changes,
// keeping old tiles alive before new and proper tiles become 
// available and faded in, etc
//
var TiledImagePyramidCuller = function () {
    "use strict";
};

var tileDebugPrint = false;
var prevVisibleTiles = {};

TiledImagePyramidCuller.prototype = {

    isTileBehindCamera: function (camera, corners)
    {
        "use strict";

        var result = {
            areAnyCornersBehind: false,
            cornersNotBehind: []
        };

        var look = camera.getLook();
        var cameraPosition = camera.getPosition().add(look.multiplyScalar(camera.getViewport().getNearDistance()));

        for (var i = 0; i < corners.length; i++) {
            var corner = new Vector3(corners[i].x / corners[i].w,
                                     corners[i].y / corners[i].w,
                                     corners[i].z / corners[i].w);

            //get position relative to camera position (ie, a vector from that position)
            var relativePosition = corner.subtract(cameraPosition);

            if (relativePosition.dot(look) < 0) {
                result.areAnyCornersBehind = true;
            }
            else {
                result.cornersNotBehind.push(i);
            }
        }
        return result;
    },

    createSubTileId: function (tile, quadrant) {
        var id = tile.id;
        switch (quadrant) {
            case 0: //bottom left
                id += "_bottomleft";
                break;
            case 1: //top left
                id += "_topleft";
                break;
            case 2: //top right
                id += "_topright";
                break;
            case 3: //bottom right
                id += "_bottomright";
                break;
        }

        return id;
    },

    createSubTile: function (tile, quadrant) {

        var id = this.createSubTileId(tile, quadrant);

        var width = tile.tileWidth;
        var height = tile.tileHeight;

        var subdivideX = Math.floor(width / 2);
        var subdivideY = Math.floor(height / 2);

        var translateX;
        var translateY;
        var subdividePixelWidth;
        var subdividePixelHeight;

        //Due to borders, left tiles go from 0 to subdivideX+1
        //               right tiles go from subdivideX to width
        //Similarly, top and bottom tiles overlap by 1 px
        switch (quadrant) {
            case 0: //bottom left
                subdividePixelWidth = subdivideX + 1;
                subdividePixelHeight = height - subdivideY;
                translateX = 0;
                translateY = subdivideY;
                break;
            case 1: //top left
                subdividePixelWidth = subdivideX + 1;
                subdividePixelHeight = subdivideY + 1;
                translateX = 0;
                translateY = 0;
                break;
            case 2: //top right
                subdividePixelWidth = width - subdivideX;
                subdividePixelHeight = subdivideY + 1;
                translateX = subdivideX;
                translateY = 0;
                break;
            case 3: //bottom right
                subdividePixelWidth = width - subdivideX;
                subdividePixelHeight = height - subdivideY;
                translateX = subdivideX;
                translateY = subdivideY;
                break;
        }

        var translation = Matrix4x4.createTranslation(translateX, height - translateY - subdividePixelHeight, 0.0);
        var transform = tile.transform.multiply(translation);

        return {
            type: tile.type,
            id: id,
            tileWidth: tile.tileWidth,
            tileHeight: tile.tileHeight,
            tileId: tile.tileId,
            transform: transform,
            tilePyramid: tile.tilePyramid,
            lastTouched: tile.lastTouched,
            face: tile.face,
            priority: tile.priority,
            url: tile.url,
            subdivide: {
                x: translateX,
                y: translateY,
                width: subdividePixelWidth,
                height: subdividePixelHeight
            }
        };
    },

	cull: function(tilePyramid,
				  tileCoverage,
				  getModelTransform,
                  camera,
				  clip,
				  visibleSet,
				  prefix,
				  tileSource,
                  isTileAvailable,
				  frameCount,
                  useLowerLod,
                  subdivideTiles) {
	    "use strict";

	    var viewProjection = camera.getViewProjectionTransform();
	    var viewportWidth = camera.getViewport().getWidth();
	    var viewportHeight = camera.getViewport().getHeight();

        var delta = { added: [], updated:[], removed: [] };
        var tileResult = tilePyramid.getVisibleTiles(getModelTransform,
                                                     viewProjection,
                                                     viewportWidth,
                                                     viewportHeight, 
                                                     clip,
                                                     useLowerLod);

		if (tileDebugPrint) {
			if (prevVisibleTiles && prevVisibleTiles[prefix]) {
				for (var i=0; i<prevVisibleTiles[prefix].length; i++) {
					var j;
					for (j = 0; j < tileResult.visibleTiles.length; j++) {
					    if (tileResult.visibleTiles[j].toString() == prevVisibleTiles[prefix][i].toString()) {
					        break;
					    }

					    if (j == tileResult.visibleTiles.length) {
					        Utils.log("frame=" + frameCount + " getVisibleTiles remove " + prefix + ":" + prevVisibleTiles[prefix][i]);
					    }
					}
				}
				for (var i=0; i<tileResult.visibleTiles.length; i++) {
					var j;
					for (j = 0; j < prevVisibleTiles[prefix].length; j++) {
					    if (tileResult.visibleTiles[i].toString() == prevVisibleTiles[prefix][j].toString()) {
					        break;
					    }
					    if (j == prevVisibleTiles[prefix].length) {
					        Utils.log("frame=" + frameCount + " getVisibleTiles added " + prefix + ":" + tileResult.visibleTiles[i]);
					    }
					}
				}
			}
			prevVisibleTiles[prefix] = tileResult.visibleTiles.slice();
		}

        //Early out and don't bother computing occulder grid logic.
        if (tileResult.visibleTiles.length === 0) {
            //Remove tiles that now out of view. 
            for (var i = 0; i < visibleSet.length; ++i) {
                var tile = visibleSet[i];
                if (tile.lastTouched !== frameCount && tile.tilePyramid === tilePyramid) {
                    delta.removed.push({ id: visibleSet[i].id });
                }
            }
            return delta;
        }

        //Used for LOD priority
		var modelTransform = getModelTransform(tilePyramid.baseImageWidth, tilePyramid.name);

        var visibleTiles = [];
        visibleTiles.byId = {};
        for (var i = 0; i < tileResult.visibleTiles.length; ++i) {
            var tileId = tileResult.visibleTiles[i];
			tileId.isTemp = false;
            tileId.isLowerLod = useLowerLod;
            tileId.cached = isTileAvailable(tileId.x, tileId.y, tileId.levelOfDetail);

            var priority = 0; 
            visibleTiles.push(tileId);
            visibleTiles[visibleTiles.length-1].priority = priority;
            visibleTiles.byId[tileId.toString()] = true;
            
			// Add ancestors just in case that they can be available before the
			// proper tile, e.g. the proper tile is not downloaded yet but an
			// ancestor is already in the cache. TODO: actually we have all the
			// information to make it entirely deterministic: we know which tiles
			// are available in the memory cache, it's just that the object that
			// holds such info is not passed down to this level. Also, the
			// MemoryCache object uses url as keys, not tileIds, and the mechanism
			// to go from tileIds to URLs is also upper level, not here. We should
			// pass such info down here, maybe through a isTileAvailable() callback
			// function, so that we be more intelligent here: when proper tile is
			// also in MemoryCache, we just use it, and don't animate it in; if
			// not, and if some ancestors are in cache, or even some
			// descendents are in cache and provide full coverage, we can use them
			// too. These are better than adding ancestors blindly as a preemptive
			// measure.
			// Add ancestors ONLY IF this is a new tile not in the current visibleSet yet
			// Otherwise this ancestors will be repeated added every frame
            if (! visibleSet.byId[prefix + tileId.toString()]) {
				var ancestorId = tileId;
				var maxDepth = 1, depth=1;
				while (ancestorId.levelOfDetail > tilePyramid.minimumLod
						&& depth++ <= maxDepth) {
					ancestorId = ancestorId.getParent();
					if (!visibleTiles.byId[ancestorId.toString()]) {
						// This is a temp (i.e. temoprary) tile because this is
						// not exactly what we want; however if it's available
						// we'll use it temporarily until the proper tile comes
						// in
						ancestorId.isTemp = true;
						visibleTiles.push(ancestorId);
						visibleTiles.byId[ancestorId.toString()] = true;
						visibleTiles[visibleTiles.length-1].priority = priority;
                        ancestorId.cached = isTileAvailable(ancestorId.x, ancestorId.y, ancestorId.levelOfDetail);
					}
				}
			}
        }

        visibleTiles.byId = null;

        for (var i = 0; i < visibleTiles.length; ++i) {
            var tileId = visibleTiles[i];
            var id = prefix + tileId.toString();
            if (!visibleSet.byId[id]) {
                var tileDimension = tilePyramid.getTileDimensions(tileId);
                var tileTransform = tilePyramid.getTileTransform(tileId);
                var tileTransformModelSpace = modelTransform.multiply(tileTransform);
                //Compute the center for transform purposes.

                var tileUrl = tileSource(tileId.x, tileId.y, tileId.levelOfDetail);

                delta.added.push({
                    type: 'tile',
                    id: id,
                    tileWidth: tileDimension.x,
                    tileHeight: tileDimension.y,
                    tileId: tileId,
                    transform: tileTransformModelSpace,
                    tilePyramid: tilePyramid,
                    lastTouched: tileId.isTemp?-1:frameCount,
                    face:prefix,
                    priority:priority,
                    url: tileUrl
                });
            } else {
                visibleSet.byId[id].lastTouched = tileId.isTemp?-1:frameCount;
                visibleSet.byId[id].priority = Math.max(tileId.priority, visibleSet.byId[id].priority);
                delta.updated.push(id);
            }
        }

		var old_and_new = (delta.added || []).concat(visibleSet || []);

		var boundAtLod = [];
        var maxLOD = Number.MIN_VALUE;
		var minLOD = Number.MAX_VALUE;
		for (var i = 0; i < old_and_new.length; ++i) {
		    var tile = old_and_new[i];
		    if (tile.tilePyramid === tilePyramid) {
		        var tileId = tile.tileId;
                var lod = tileId.levelOfDetail;
                if (! boundAtLod[lod]) {
                    boundAtLod[lod] = {};
                    boundAtLod[lod].x0 = Number.MAX_VALUE;
                    boundAtLod[lod].y0 = Number.MAX_VALUE;
                    boundAtLod[lod].x1 = Number.MIN_VALUE;
                    boundAtLod[lod].y1 = Number.MIN_VALUE;
                }
                var b  = boundAtLod[lod];
                b.x0 = Math.min(b.x0, tileId.x);
                b.y0 = Math.min(b.y0, tileId.y);
                b.x1 = Math.max(b.x1, tileId.x + 1);
                b.y1 = Math.max(b.y1, tileId.y + 1);
                maxLOD = Math.max(maxLOD, tileId.levelOfDetail);
                minLOD = Math.min(minLOD, tileId.levelOfDetail);

                if (Math.abs(b.x0 - b.x1) > 100) {
                    debugger;
                }

                var tileTransformModelSpace = tile.transform;

                if (subdivideTiles && tile.tilePyramid.allowTileToBeSubdivided(tile.tileId) && tile.subdivide == null) {

                    var width = tile.tileWidth;
                    var height = tile.tileHeight;

                    //Why does the multiplier need to go from 0.5 to -1.5?
                    //The transforms used seem strange but they are unwound in 
                    var x0 = width * -0.5;
                    var x1 = width * 1.5;
                    var y0 = height * -0.5;
                    var y1 = height * 1.5;

                    //Corners are in this order, bottom left, top left, top right, bottom right.
                    //Order is important because the index in this array is used to determine which corners are visible.
                    var corners = [
                        tileTransformModelSpace.transformVector4(new Vector4(x0, y0, 0, 1)),
                        tileTransformModelSpace.transformVector4(new Vector4(x0, y1, 0, 1)),
                        tileTransformModelSpace.transformVector4(new Vector4(x1, y1, 0, 1)),
                        tileTransformModelSpace.transformVector4(new Vector4(x1, y0, 0, 1))
                    ];

                    var subDivideResult = this.isTileBehindCamera(camera, corners);

                    if (subDivideResult.areAnyCornersBehind) {
                        //subdivide tile
                        for (var j = 0; j < subDivideResult.cornersNotBehind.length; j++) {
                            var corner = subDivideResult.cornersNotBehind[j];

                            var subTileId = this.createSubTileId(tile, corner);

                            var subTileAlreadyInScene = false;

                            //if the subtile is slated to be removed, cancel the removal
                            for (var k = 0; k < delta.removed.length; k++) {
                                if (delta.removed[k].id === subTileId) {
                                    delta.removed.splice(k, 1);
                                    break;
                                }
                            }

                            //if the subtile is not already added or in the scene, then add it now.
                            for (var k = 0; k < old_and_new.length; k++) {
                                if (old_and_new[k].id === subTileId) {
                                    //mark subtile as touched so it will not be culled
                                    old_and_new[k].lastTouched = frameCount;
                                    subTileAlreadyInScene = true;
                                    break;
                                }
                            }

                            //if it's not already in the scene, add it now
                            if (!subTileAlreadyInScene) {
                                var subTile = this.createSubTile(tile, corner);
                                delta.added.push(subTile);
                            }
                        }
                    }
                }
			}
        }
		// create bound at max lod
		var x0 = Number.MAX_VALUE;
		var y0 = Number.MAX_VALUE;
		var x1 = Number.MIN_VALUE;
		var y1 = Number.MIN_VALUE;
		for (var l = minLOD; l <= maxLOD; l++) {
			if (boundAtLod[l]) {
				var b = boundAtLod[l];
				var diff = maxLOD - l;
            	x0 = Math.min(b.x0<<diff, x0);
            	y0 = Math.min(b.y0<<diff, y0);
            	x1 = Math.max(b.x1<<diff, x1);
            	y1 = Math.max(b.y1<<diff, y1);
			}
		}

        tileCoverage.initialize(maxLOD, x0, y0, x1, y1);

        for (var i = 0; i < old_and_new.length; ++i) {
            var tile = old_and_new[i];

            if (tile.tilePyramid === tilePyramid && tile.lastTouched === frameCount) {
				// This is a tile that's proper for the current frame.
				if (! tile.fullyOpaque && ! tile.tileId.isTemp) {
					// If a proper tile is not yet loaded, or is not fully opaque, then
					// we'll still need tiles that previously covered its location to 
					// keep the space filled, until the proper tiles becomes fully
					// available and opaque. In other words, a proper tile that is not
					// yet fully opaque keeps its ancestors and descendents alive.
					var descendents = tileCoverage.getDescendents(tile.tileId,
						function(tileIdStr) {
							return visibleSet.byId[prefix+tileIdStr]==undefined?false:true;
						});
					// Sanity check
					/*
					for (var k=0; k<descendents.length; k++) {
						if (visibleSet.byId[prefix+descendents[k]].lastTouched===frameCount)
							throw "crazy";
					}
					*/
					// the correct tile is not fully in or is being loaded,
					// so we still need its descendent to cover for it
					for (var k=0; k<descendents.length; k++) {
						visibleSet.byId[prefix+descendents[k]].keep = true;
                    }

					// Keep ancestors alive
					var ancestorId = tile.tileId;
					while (ancestorId.levelOfDetail > tilePyramid.minimumLod) {
						ancestorId = ancestorId.getParent();
						if (visibleSet.byId[prefix+ancestorId] != undefined) {
							visibleSet.byId[prefix+ancestorId].keep = true;
						}
					}
				}
            }
        }

		// Signal removal of all tiles in the visible set that are not proper for
		// current view AND not kept alive by proper tiles that are not ready yet
        for (var idStr in visibleSet.byId) {
            var tile = visibleSet.byId[idStr];
            if (!tile.keep && tile.lastTouched !== frameCount && tile.tilePyramid === tilePyramid) {
				var justAdded = false;
            	for(var j = 0; j < delta.added.length;++j) {
                	if(delta.added[j] === idStr) {
                    	delete delta.added[j];
						justAdded = true;
						break;
                	}
            	}
				
				if (! justAdded) {
                	delta.removed.push({ id: idStr });
					for (var u=0; u<delta.updated.length; u++) {
					    if (idStr == delta.updated[i]) {
					        debugger;
					    }
					}
				}
            }
            if (tile.keep) {
				tile.keep = false;
            }
        }

        return delta;
    } 
};
function JsonDownloadFailedError(message, innerException) {
    "use strict";

    this.message = message;
    this.innerException = innerException;
}

function JsonMalformedError(message, innerException) {
    "use strict";

    this.message = message;
    this.innerException = innerException;
}

var PhotosynthTileSource = function (baseUrl, atlasImage) {
    "use strict";

    this.getTileUrl = function (x, y, lod) {
        if (lod === 7 && x === 0 && y === 0) {
            return atlasImage;
        }
        return baseUrl + lod + '/' + x + '_' + y + '.jpg';
    };
};

var PartnerPanoramaTileSource = function (tileImageUriFormatString, width, height, tileSize, finestLod, numberOfLods, atlasImage) {
    "use strict";

    var defaultFinestLod = Math.ceil(Math.log(Math.max(width, height)) / Math.LN2);
    var lodDelta = defaultFinestLod - finestLod;
    var singleTileLod = Math.ceil(Math.log(tileSize) / Math.LN2);

    var minLod = finestLod - numberOfLods;

    var horizontalTileCountMultiplier = width / Math.pow(2, defaultFinestLod);
    var verticalTileCountMultiplier = height / Math.pow(2, defaultFinestLod);

    this.getTileUrl = function (x, y, lod) {
        var normalizedLod = lod - lodDelta;

        if (normalizedLod == minLod && atlasImage && x == 0 && y == 0) {
            //special case for atlas image, if present
            return atlasImage;
        }

        if (normalizedLod > finestLod || normalizedLod <= minLod) {
            return null;
        }

        //determine number of tiles at this lod
        var numHorizontalTilesAtLod = Math.ceil(Math.pow(2, lod - singleTileLod) * horizontalTileCountMultiplier);
        var numVerticalTilesAtLod = Math.ceil(Math.pow(2, lod - singleTileLod) * verticalTileCountMultiplier);

        return PhotosynthRml.partialDotNetStringFormat(tileImageUriFormatString, normalizedLod, x, y);
    };
};

var swapUrlBase = function (originalUri, newBaseUri) {
    if (newBaseUri == null) {
        return originalUri;
    }
    var originalParts = originalUri.split('/');
    var newParts = newBaseUri.split('/');
    for (var i in newParts) {
        originalParts[i] = newParts[i];
    }
    return originalParts.join('/');
};

var PhotosynthRml = {
    faceNames: ['front', 'right', 'back', 'left', 'top', 'bottom'],
    defaultPhotosynthServer: 'http://photosynth.net',
    defaultHttpsPhotosynthServer: 'https://photosynth.net',
    httpsOverrideListUri: 'https://ssl-cdn.ps1.photosynth.net/httpsOverrideList.json',
    uriRegex: new RegExp("^(\\w+)://([^/]+)(/.*)$"),
    jsonWrapper: '/jsonproxy.psfx?jsonUrl={0}',
    timeout: 10000, //10 seconds
    jsonpWrapperParam: '&jsCallback={0}',

    addScriptElement: function (url) {
        "use strict";
        var scriptElement = document.createElement('script');
        scriptElement.type = 'text/javascript';
        scriptElement.language = 'javascript';
        scriptElement.src = url;
        document.getElementsByTagName('head')[0].appendChild(scriptElement);
    },

    getUriWithCors: function (uri, succeedCallback, failCallback) {
        var request = new XMLHttpRequest();
        if ("withCredentials" in request) {
            //CORS + XmlHttpRequest is supported

            request.onload = function () {
                succeedCallback(request.responseText);
            };

            request.ontimeout = request.onabort = request.onerror = function () {
                failCallback();
            };

            request.open("GET", uri, true);
            request.send();
        }
        else {
            //Browser does not support CORS with XmlHttpRequest
            //Caveat, IE9 and older support a non-standard way of doing it, but the viewer already does not support IE9.

            failCallback();
        }
    },

    getHttpsOverrideList: function (succeedCallback, failCallback) {
        PhotosynthRml.getUriWithCors(PhotosynthRml.httpsOverrideListUri,
            function (responseText) {
                try {
                    var httpsOverrideList = JSON.parse(responseText);
                    succeedCallback(httpsOverrideList);
                }
                catch (ex) {
                    failCallback();
                }
            },
            failCallback
        );
    },

    overrideHost: function (uriHost, httpsOverrideList) {
        for (var i = 0; i < httpsOverrideList.length; i++) {
            var rootHost = httpsOverrideList[i][0];
            var overrideHost = httpsOverrideList[i][1];

            //if uriHost ends with the value in rootHost, then return overrideHost
            if (uriHost.slice(-rootHost.length) === rootHost) {
                return overrideHost;
            }
        }

        //if no override in the list matched, then return the original host unaltered.
        return uriHost;
    },

    forceToHttps: function (uri, httpsOverrideList) {
        var parts = PhotosynthRml.uriRegex.exec(uri);

        if (parts == null || parts.length < 4) {
            //This string does not appear to be a fully qualified uri.
            //It may be a local path or may be an error.  Return it unaltered.
            return uri;
        }

        var domain = parts[2];
        var path = parts[3];

        domain = PhotosynthRml.overrideHost(domain, httpsOverrideList);

        return "https://" + domain + path;
    },

    /// jsonUri: url pointing to json
    /// callback: called when the viewer has loaded the json and started
    /// options
    /// - imageTileUrlSuffix: suffix to append to every image tile url.  Used for cachebusting purposes.
    /// - photosynthServer: url to photosynth.net
    /// - contentBaseuri: base url of content.  Needed for Photosynth/ICE panos.  Not needed for partner panos.
    /// - forceHttps: if true, forces all requests to go through https.  httpsOverideList mappings will be used for all requests.
    /// - httpsOverrideList: list of http domain to https domain mappings
    createFromJsonUri: function (jsonUri, callback, options) {
        "use strict";

        options = (options) ? options : {};

        if (window.WinJS) {
            PhotosynthRml.createFromFullUrl(jsonUri, callback, options);
        }
        else {
            if (!options.photosynthServer) {
                options.photosynthServer = (options.forceHttps) ? PhotosynthRml.defaultHttpsPhotosynthServer : PhotosynthRml.defaultPhotosynthServer;
            }

            PhotosynthRml.createFromFullUrl(options.photosynthServer +
                PhotosynthRml.jsonWrapper.replace('{0}', encodeURIComponent(jsonUri)), callback, jsonUri, options);
        }
    },

    /// jsonUri: url pointing to json
    /// callback: called when the viewer has loaded the json and started
    /// options
    /// - imageTileUrlSuffix: suffix to append to every image tile url.  Used for cachebusting purposes.
    /// - forceHttps: if true, forces all requests to go through https.  httpsOverideList mappings will be used for all requests.
    /// - httpsOverrideList: list of http domain to https domain mappings
    createFromSameDomainJsonUri: function (jsonUri, callback, options) {
        "use strict";

        options = (options) ? options : {};

        if (options.forceHttps) {
            if (options.httpsOverrideList == null) {
                PhotosynthRml.getHttpsOverrideList(
                    function (httpsOverrideList) {
                        //got the list, recursively call this function again with the updated options
                        options.httpsOverrideList = httpsOverrideList;
                        PhotosynthRml.createFromSameDomainJsonUri(jsonUri, callback, options);
                    },
                    function () {
                        //failed to get list, report failure to the caller
                        callback(null, new JsonDownloadFailedError("Failed to download https domain override list"));
                    }
                );

                return;
            }

            jsonUri = PhotosynthRml.forceToHttps(jsonUri, options.httpsOverrideList);
        }

        var request = new XMLHttpRequest();
        request.open("GET", jsonUri, true);
        request.onreadystatechange = function () {
            if (request.readyState == 4) {
                if (request.status == 200) {
                    PhotosynthRml.createFromJsonString(request.responseText, callback, jsonUri, options);
                }
                else {
                    callback(null, new JsonDownloadFailedError("Response status is not 200"));
                }
            }
        };

        request.send();
    },

    /// jsonString: string containing json
    /// callback: called when the viewer has loaded the json and started
    /// options
    /// - imageTileUrlSuffix: suffix to append to every image tile url.  Used for cachebusting purposes.
    /// - contentBaseuri: base url of content.  Needed for Photosynth/ICE panos.  Not needed for partner panos.
    /// - forceHttps: if true, forces all requests to go through https.  httpsOverideList mappings will be used for all requests.
    /// - httpsOverrideList: list of http domain to https domain mappings
    createFromJsonString: function (jsonString, callback, jsonUri, options) {
        "use strict";

        options = (options) ? options : {};

        //Don't need to do anything with options.forceHttps or options.httpsOverrideList because a lower down function will use them.

        var json = null;

        try {
            json = JSON.parse(jsonString);
        }
        catch (ex) {
            callback(null, new JsonMalformedError("The data returned for the pano is not valid json", ex));
            return;
        }

        var rml = PhotosynthRml.createFromJson(json, jsonUri, options);

        if (rml == null) {
            callback(null, new JsonMalformedError("The data returned for the pano is valid json but is not valid panorama data"));
        }
        else {
            callback(rml);
        }
    },

    /// url: where to get the json (this can differ from originalJsonUri because it goes through a JSONP service)
    /// callback: called when the viewer has loaded the json and started
    /// originalJsonUri: url pointing to json
    /// options
    /// - imageTileUrlSuffix: suffix to append to every image tile url.  Used for cachebusting purposes.
    /// - contentBaseuri: base url of content.  Needed for Photosynth/ICE panos.  Not needed for partner panos.
    /// - forceHttps: if true, forces all requests to go through https.  httpsOverideList mappings will be used for all requests.
    /// - httpsOverrideList: list of http domain to https domain mappings
    createFromFullUrl: function (url, callback, originalJsonUri, options) {
        "use strict";

        options = (options) ? options : {};

        if (options.forceHttps) {
            if (options.httpsOverrideList == null) {
                PhotosynthRml.getHttpsOverrideList(
                    function (httpsOverrideList) {
                        //got the list, recursively call this function again with the updated options
                        options.httpsOverrideList = httpsOverrideList;
                        PhotosynthRml.createFromFullUrl(url, callback, originalJsonUri, options);
                    },
                    function () {
                        //failed to get list, report failure to the caller
                        callback(null, new JsonDownloadFailedError("Failed to download https domain override list"));
                    }
                );

                return;
            }

            url = PhotosynthRml.forceToHttps(url, options.httpsOverrideList);
            originalJsonUri = PhotosynthRml.forceToHttps(originalJsonUri, options.httpsOverrideList);
        }

        if (window.WinJS) {
            //Windows app; allowed to download x-domain json but not allowed to add x-domain script tags
            WinJS.xhr({ url: url }).then(function (response) {
                if (response.status === 200) {
                    PhotosynthRml.createFromJsonString(response.responseText, callback, originalJsonUri || url, options);
                }
                else {
                    callback(null, new JsonDownloadFailedError("Response status is not 200"));
                }
            },
            function (error) {
                callback(null, new JsonDownloadFailedError("The url specified for the pano json data did not return a 200 success", error));
            });
        }
        else {
            //Not a windows app; not allowed to download x-domain json but allowed to add x-domain script tags

            //TODO: add error handling logic for non-WinJS case

            //Pick a new name each time.  In most cases, it will be PhotosynthCallback0 unless there's currently an active download.
            //This should have good caching behaviors when hitting things through a cdn.
            var globalCallbackName = 'PhotosynthCallback';
            var i = 0;
            while (window[globalCallbackName + i] != null) {
                i++;
            }
            globalCallbackName = globalCallbackName + i;

            //set up a timeout in case the file silently fails to download.
            var timeout = window.setTimeout(function () {
                callback(null, new JsonDownloadFailedError("Download of the panorama json file timed out after " + PhotosynthRml.timeout + " milliseconds"));
                delete window[globalCallbackName];
            }, PhotosynthRml.timeout);

            window[globalCallbackName] = function (json) {
                callback(PhotosynthRml.createFromJson(json, originalJsonUri || url, options));
                window.clearTimeout(timeout);
                delete window[globalCallbackName];
            };

            PhotosynthRml.addScriptElement(url + PhotosynthRml.jsonpWrapperParam.replace('{0}', globalCallbackName));
        }
    },

    /// url: where to get the json (this can differ from originalJsonUri because it goes through a JSONP service)
    /// callback: called when the viewer has loaded the json and started
    /// originalJsonUri: url pointing to json
    /// options
    /// - imageTileUrlSuffix: suffix to append to every image tile url.  Used for cachebusting purposes.
    /// - contentBaseuri: base url of content.  Needed for Photosynth/ICE panos.  Not needed for partner panos.
    /// - forceHttps: if true, forces all requests to go through https.  httpsOverideList mappings will be used for all requests.
    /// - httpsOverrideList: list of http domain to https domain mappings
    createFromJson: function (json, jsonUri, options) {
        "use strict";

        options = (options) ? options : {};

        //Here's an overview of all photosynth-related formats
        // http://sharepoint/sites/ipe/AR/AR%20Team%20Wiki/Photosynth%20Data%20Formats.aspx

        var rml;

        if (options.forceHttps) {
            jsonUri = PhotosynthRml.forceToHttps(jsonUri, options.httpsOverrideList);
        }

        try {
            if (json._json_synth && json._json_synth >= 1.01) {
                //Photosynth Panorama
                // http://sharepoint/sites/ipe/AR/Shared%20Documents/Human%20Scale/ICE%20Panorama%20Format.docx
                // http://micropedia/Pages/Photosynth%20JSON%20representation.aspx

                //Note: The format allows for short and long names for some elements.
                //      In practice only the short names are used so that's all that's supported here at the current time.

                var root, propertyName;

                //there's only one element in json.l, and the name of it is the cid of the pano
                for (propertyName in json.l) {
                    if (json.l.hasOwnProperty(propertyName)) {
                        root = json.l[propertyName];
                        break;
                    }
                }

                var coordSystem = root.x[0];
                var cubemap = coordSystem.cubemaps[0];
                var bounds = cubemap.field_of_view_bounds;
                var projector = coordSystem.r[0];
                var rotationNode = projector.j;
                var startRotationNode = projector.start_relative_rotation;
                var startingPitch = 0;
                var startingHeading = 0;

                var author = root.b;
                var attributionUrl = root.attribution_url;
                var licenseUrl = root.c;

                if (startRotationNode != null) {
                    //calculate initial look direction
                    var lookVector = new Vector3(0, 0, 1);
                    var rotation = PhotosynthRml.parseQuaternion(rotationNode[4], rotationNode[5], rotationNode[6]);
                    var startRelativeRotation = PhotosynthRml.parseQuaternion(startRotationNode[0], startRotationNode[1], startRotationNode[2]);
                    var combinedRotations = rotation.multiply(startRelativeRotation);
                    var startVector = combinedRotations.transform(lookVector);

                    startingPitch = MathHelper.halfPI - Math.acos(startVector.y);
                    startingHeading = Math.atan2(startVector.z, startVector.x);
                }

                var highlights = null;
                if (root.highlight_map && root.highlight_map.default_highlight) {
                    highlights = root.highlight_map.default_highlight;
                }

                if (options.contentBaseUri != null) {
                    jsonUri = swapUrlBase(jsonUri, options.contentBaseUri);

                    if (options.forceHttps) {
                        jsonUri = PhotosynthRml.forceToHttps(jsonUri, options.httpsOverrideList);
                    }
                }

                var atlasImage = null;
                if (cubemap.u && jsonUri) {
                    //Assume jsonUri ends in "/0.json" and remove everything after the slash
                    //If options.forceHttps is true, then the baseUrl here will already be overridden to https.
                    var baseUrl = jsonUri.substring(0, jsonUri.length - 6);

                    atlasImage = baseUrl + cubemap.u;
                }

                rml = {
                    id: 'panorama' + propertyName,
                    type: 'panorama',
                    source: {
                        'attribution': {
                            'author': author,
                            'attributionUrl': attributionUrl,
                            'licenseUrl': licenseUrl
                        },
                        'dimension': 0, //set to zero initially, then get the max from the cube faces below
                        'tileSize': 254,
                        'tileOverlap': 1,
                        'tileBorder': 1,
                        'minimumLod': (atlasImage != null) ? 7 : 8,
                        'bounds': {
                            'left': MathHelper.degreesToRadians(bounds[0]),
                            'right': MathHelper.degreesToRadians(bounds[1]),
                            'top': MathHelper.degreesToRadians(bounds[2]),
                            'bottom': MathHelper.degreesToRadians(bounds[3])
                        },
                        'startingPitch': startingPitch,
                        'startingHeading': startingHeading,
                        'projectorAspectRatio': 1,
                        'projectorFocalLength': 0.5,
                        'highlights': highlights,
                        'atlasImage': atlasImage
                    }
                };

                var orientation = cubemap.orientation;
                if (orientation) {
                    rml.source.orientation = PhotosynthRml.parseQuaternion(orientation[0], orientation[1], orientation[2]);
                }

                for (var i = 0; i < PhotosynthRml.faceNames.length; i++) {
                    var faceName = PhotosynthRml.faceNames[i];
                    var face = cubemap[faceName];
                    if (face != null) {
                        var baseUri = swapUrlBase(face.u, options.contentBaseUri);

                        if (options.forceHttps) {
                            baseUri = PhotosynthRml.forceToHttps(baseUri, options.httpsOverrideList);
                        }

                        rml.source[faceName + 'Face'] = {
                            tileSource: (new PhotosynthTileSource(baseUri, atlasImage)).getTileUrl,
                            //TODO: This assumes a single loop of 4 vertices.  Technically the format allows arbitrary loops, but in practice it's not used that way.
                            clip: face.clip.vertices
                        };
                        rml.source.dimension = Math.max(rml.source.dimension, face.d[0], face.d[1]);
                    }
                }
            }
            else if (json.json_pano) {
                //Partner Panorama
                // http://sharepoint/sites/IPE/AR/Shared%20Documents/PartnerPanoJson.docx

                //If null or undefined, defaults to 1.  Only 0 if explicitly set to false.
                var tileOverlap = (json.tile_overlap_borders === false) ? 0 : 1;

                var author = json.author;
                var attributionUrl = PhotosynthRml.partialDotNetStringFormat(json.attribution_uri_format_string, 0, 0);
                var licenseUrl = null; //Always mark partner panoramas as copyright.
                var publisher = json.publisher;

                var atlas = json.atlas_image;

                if (options.forceHttps && atlas != null) {
                    atlas = PhotosynthRml.forceToHttps(atlas, options.httpsOverrideList);
                }

                rml = {
                    id: 'panorama' + propertyName,
                    type: 'panorama',
                    source: {
                        'attribution': {
                            'author': author,
                            'attributionUrl': attributionUrl,
                            'licenseUrl': licenseUrl,
                            'publisher': publisher
                        },
                        'dimension': 0, //set to zero initially, then get the max from the cube faces below
                        'tileSize': json.tile_size,
                        'tileOverlap': tileOverlap,
                        'tileBorder': tileOverlap,
                        'minimumLod': Math.ceil(Math.log(json.tile_size / Math.LN2)), //default values here, in case they're not specified in the data
                        'bounds': { //default values here, in case they're not specified
                            'left': 0,
                            'right': MathHelper.twoPI,
                            'top': -MathHelper.halfPI,
                            'bottom': MathHelper.halfPI
                        },
                        'startingPitch': 0,
                        'startingHeading': 0,
                        'projectorAspectRatio': 1,
                        'projectorFocalLength': 0.5,
                        'atlasImage': atlas
                    }
                };

                if (json.atlas_image != null && options.imageTileUriSuffix != null) {
                    rml.source.atlasImage += options.imageTileUriSuffix;
                }

                if (json.hot_spots) {
                    var convertPitchHeading = function (pitchHeadingDegreesArray) {
                        return {
                            pitch: MathHelper.degreesToRadians(pitchHeadingDegreesArray[0]),
                            //The data format uses a different convention for heading direction, so we have to negate, then normalize it.
                            heading: MathHelper.normalizeRadian(MathHelper.degreesToRadians(-pitchHeadingDegreesArray[1]))
                        };
                    };

                    rml.hotspots = [];
                    for (var i = 0; i < json.hot_spots.length; i++) {
                        var hotspotJson = json.hot_spots[i];
                        var hotspot = {
                            title: hotspotJson.title,
                            location: convertPitchHeading(hotspotJson.location),
                            target: hotspotJson.target
                        };
                        
                        if (hotspotJson.transition) {
                            var transitionJson = hotspotJson.transition;

                            hotspot.transition = {
                                startLookDirection: convertPitchHeading(transitionJson.start_look_direction),
                                endLookDirection: convertPitchHeading(transitionJson.end_look_direction)
                            };

                            if (transitionJson.media) {
                                var mediaJson = transitionJson.media;
                                hotspot.transition.media = {
                                    type: mediaJson.type,
                                    uri: mediaJson.uri,
                                    verticalFov: MathHelper.degreesToRadians(mediaJson.vertical_field_of_view),
                                    dimensions: mediaJson.dimensions
                                };
                            }
                        }

                        rml.hotspots.push(hotspot);
                    }
                }

                if (json.field_of_view_bounds) {
                    rml.source.bounds = {
                        'left': MathHelper.degreesToRadians(json.field_of_view_bounds[0]),
                        'right': MathHelper.degreesToRadians(json.field_of_view_bounds[1]),
                        'top': MathHelper.degreesToRadians(json.field_of_view_bounds[2]),
                        'bottom': MathHelper.degreesToRadians(json.field_of_view_bounds[3])

                    };
                }

                if (json.initial_look_direction) {
                    rml.source.startingPitch = MathHelper.degreesToRadians(json.initial_look_direction[0]);
                    rml.source.startingHeading = MathHelper.degreesToRadians(json.initial_look_direction[1]);
                }

                for (var i = 0; i < PhotosynthRml.faceNames.length; i++) {
                    var faceName = PhotosynthRml.faceNames[i];
                    var face = json[faceName];
                    if (face != null) {
                        var clip;
                        if (face.clip && face.clip.vertices) {
                            clip = face.clip.vertices;
                        }
                        else {
                            clip = [
                                0, 0,
                                0, face.dimensions[1],
                                face.dimensions[0], face.dimensions[1],
                                face.dimensions[0], 0
                            ];
                        }

                        var tileFormatString = face.tile_image_uri_format_string;

                        if (options.imageTileUriSuffix != null) {
                            tileFormatString += options.imageTileUriSuffix;
                        }

                        if (options.forceHttps) {
                            tileFormatString = PhotosynthRml.forceToHttps(tileFormatString, options.httpsOverrideList);
                        }

                        rml.source[faceName + 'Face'] = {
                            tileSource: (new PartnerPanoramaTileSource(tileFormatString, face.dimensions[0], face.dimensions[1], json.tile_size, face.finest_lod, face.number_of_lods, rml.source.atlasImage)).getTileUrl,
                            //TODO: This assumes a single loop of 4 vertices.  Technically the format allows arbitrary loops, but in practice it's not used that way.
                            clip: clip
                        };
                        rml.source.dimension = Math.max(rml.source.dimension, face.dimensions[0], face.dimensions[1]);

                        if (face.finest_lod != null && face.number_of_lods != null) {
                            var defaultFinestLod = Math.ceil(Math.log(rml.source.dimension) / Math.LN2);

                            rml.source.minimumLod = defaultFinestLod - face.number_of_lods + 1;
                        }

                    }

                }

                if (rml.source.atlasImage != null) {
                    rml.source.minimumLod--;
                }

            } else if (json.face_size) {
            	var root, propertyName;

                //there's only one element in json.l, and the name of it is the cid of the pano
                for (propertyName in json.l) {
                    if (json.l.hasOwnProperty(propertyName)) {
                        root = json.l[propertyName];
                        break;
                    }
                }

                var jsonPath=jsonUri.substr(0, jsonUri.lastIndexOf("/"));
                var coordSystem = JSON.parse('{"0":{"cubemaps":{"0":{"back":{"clip":{"loops":[[0,1,2,3]],"vertices":[0,0,0,'+json.face_size+','+json.face_size+','+json.face_size+','+json.face_size+',0]},"d":['+json.face_size+','+json.face_size+'],"u":"'+jsonPath+'/back/"},"bottom":{"clip":{"loops":[[0,1,2,3]],"vertices":[0,0,0,'+json.face_size+','+json.face_size+','+json.face_size+','+json.face_size+',0]},"d":['+json.face_size+','+json.face_size+'],"u":"'+jsonPath+'/bottom/"},"d":[606,101],"field_of_view_bounds":[-180,180,-90,90],"front":{"clip":{"loops":[[0,1,2,3]],"vertices":[0,0,0,'+json.face_size+','+json.face_size+','+json.face_size+','+json.face_size+',0]},"d":['+json.face_size+','+json.face_size+'],"u":"'+jsonPath+'/front/"},"left":{"clip":{"loops":[[0,1,2,3]],"vertices":[0,0,0,'+json.face_size+','+json.face_size+','+json.face_size+','+json.face_size+',0]},"d":['+json.face_size+','+json.face_size+'],"u":"'+jsonPath+'/left/"},"right":{"clip":{"loops":[[0,1,2,3]],"vertices":[0,0,0,'+json.face_size+','+json.face_size+','+json.face_size+','+json.face_size+',0]},"d":['+json.face_size+','+json.face_size+'],"u":"'+jsonPath+'/right/"},"top":{"clip":{"loops":[[0,1,2,3]],"vertices":[0,0,0,'+json.face_size+','+json.face_size+','+json.face_size+','+json.face_size+',0]},"d":['+json.face_size+','+json.face_size+'],"u":"'+jsonPath+'/top/"},"u":"atlas.jpg"}},"k":["",0],"m":{"0":{"cubemap":0,"i":[0]}},"r":{"0":{"j":[-1,0,0,0,-0.5,0.5,-0.5,1,0.5],"n":[-1,-1,-1,-1,-1,-1,0,0,0,0],"start_relative_rotation":[-3.49066e-8,0,0]}}}}')[0];
                var cubemap = coordSystem.cubemaps[0];
                var bounds = cubemap.field_of_view_bounds;
                var projector = coordSystem.r[0];
                var rotationNode = projector.j;
                var startRotationNode = projector.start_relative_rotation;
                var startingPitch = 0;
                var startingHeading = 0;

                var author = '';
                var attributionUrl = '';
                var licenseUrl = '';

                if (startRotationNode != null) {
                    //calculate initial look direction
                    var lookVector = new Vector3(0, 0, 1);
                    var rotation = PhotosynthRml.parseQuaternion(rotationNode[4], rotationNode[5], rotationNode[6]);
                    var startRelativeRotation = PhotosynthRml.parseQuaternion(startRotationNode[0], startRotationNode[1], startRotationNode[2]);
                    var combinedRotations = rotation.multiply(startRelativeRotation);
                    var startVector = combinedRotations.transform(lookVector);

                    startingPitch = MathHelper.halfPI - Math.acos(startVector.y);
                    startingHeading = Math.atan2(startVector.z, startVector.x);
                }

                var highlights = null;/*
                if (root.highlight_map && root.highlight_map.default_highlight) {
                    highlights = root.highlight_map.default_highlight;
                }*/

                if (options.contentBaseUri != null) {
                    jsonUri = swapUrlBase(jsonUri, options.contentBaseUri);

                    if (options.forceHttps) {
                        jsonUri = PhotosynthRml.forceToHttps(jsonUri, options.httpsOverrideList);
                    }
                }

                var atlasImage = null;
                if (cubemap.u && jsonUri) {
                    //Assume jsonUri ends in "/0.json" and remove everything after the slash
                    //If options.forceHttps is true, then the baseUrl here will already be overridden to https.
                    var baseUrl = jsonUri.substring(0, jsonUri.length - 6);

                    atlasImage = baseUrl + cubemap.u;
                }

                rml = {
                    id: 'panorama' + propertyName,
                    type: 'panorama',
                    source: {
                        'attribution': {
                            'author': author,
                            'attributionUrl': attributionUrl,
                            'licenseUrl': licenseUrl
                        },
                        'dimension': 0, //set to zero initially, then get the max from the cube faces below
                        'tileSize': json.tile_size || 254,
                        'tileOverlap': 1,
                        'tileBorder': 1,
                        'minimumLod': (atlasImage != null) ? 7 : 8,
                        'bounds': {
                            'left': MathHelper.degreesToRadians(bounds[0]),
                            'right': MathHelper.degreesToRadians(bounds[1]),
                            'top': MathHelper.degreesToRadians(bounds[2]),
                            'bottom': MathHelper.degreesToRadians(bounds[3])
                        },
                        'startingPitch': startingPitch,
                        'startingHeading': startingHeading,
                        'projectorAspectRatio': 1,
                        'projectorFocalLength': 0.5,
                        'highlights': highlights,
                        'atlasImage': atlasImage
                    }
                };

                var orientation = cubemap.orientation;
                if (orientation) {
                    rml.source.orientation = PhotosynthRml.parseQuaternion(orientation[0], orientation[1], orientation[2]);
                }

                for (var i = 0; i < PhotosynthRml.faceNames.length; i++) {
                    var faceName = PhotosynthRml.faceNames[i];
                    var face = cubemap[faceName];
                    if (face != null) {
                        var baseUri = swapUrlBase(face.u, options.contentBaseUri);

                        if (options.forceHttps) {
                            baseUri = PhotosynthRml.forceToHttps(baseUri, options.httpsOverrideList);
                        }

                        rml.source[faceName + 'Face'] = {
                            tileSource: (new PhotosynthTileSource(baseUri, atlasImage)).getTileUrl,
                            //TODO: This assumes a single loop of 4 vertices.  Technically the format allows arbitrary loops, but in practice it's not used that way.
                            clip: face.clip.vertices
                        };
                        rml.source.dimension = Math.max(rml.source.dimension, face.d[0], face.d[1]);
                    }
                }

            } else {
                return null;
            }
        }
        catch (e) {
            //If the data isn't valid, an exception will get thrown.  Just return null to indicate parsing failure.
            if (window.console) {
                Utils.log(e);
            }
            return null;
        }

        return rml;
    },

    parseQuaternion: function (qx, qy, qz) {
        "use strict";

        //Since we know this is a unit quaternion we can calculate w
        var wSquared = 1.0 - (qx * qx + qy * qy + qz * qz);
        if (wSquared < MathHelper.zeroTolerance) {
            wSquared = 0.0;
        }
        return new Quaternion(Math.sqrt(wSquared), qx, qy, qz);
    },

    partialDotNetStringFormat: function (formatString) {
        "use strict";

        //This function implements a small subset of the .NET string.format method

        //Assumptions:
        // - All arguments (excluding the formatString) are positive integers
        // - The only allowed values after the colon inside braces are an uppercase 'X' or a string of zeros

        //Sample allowed values
        //partialDotNetStringFormat("{0} asdf {1}", 10, 2)      => "10 asdf 2"
        //partialDotNetStringFormat("{0:X} asdf {1}", 10, 2)    => "A asdf 2"
        //partialDotNetStringFormat("{0:000} asdf {1}", 10, 2)  => "010 asdf 2"

        if (arguments.length === 0) {
            return "";
        }
        if (arguments.length === 1) {
            return formatString;
        }

        var result = "";
        var i = 0;
        while (i < formatString.length) {
            //First, output up to the next brace, then slice off the string enclosed in the braces
            var leftBrace = formatString.indexOf('{');
            if (leftBrace === -1) {
                return result + formatString;
            }
            result += formatString.substr(0, leftBrace);
            formatString = formatString.substr(leftBrace);
            var rightBrace = formatString.indexOf('}');
            if (rightBrace < 2) {
                //TODO: Something wrong.  Throw an exception? 
            }
            var numberFormat = formatString.substr(1, rightBrace - 1);
            formatString = formatString.substr(rightBrace + 1);

            //Now, figure out what to do with the part in the braces
            var numberFormatParts = numberFormat.split(':');

            //Determine which arg is represented by this format string
            var arg = arguments[parseInt(numberFormatParts[0]) + 1];

            if (numberFormatParts.length === 1) {
                //nothing special, just output the arg
                result += arg.toString();
            }
            else if (numberFormatParts[1] === 'X') {
                //hex, output the number in hex form
                result += arg.toString(16).toUpperCase();
            }
            else {
                //Assume that numberFormatParts[1] contains only zeros
                //prepend zeros in front of the number to match the number of zeros passed in
                var out = arg.toString();
                while (out.length < numberFormatParts[1].length) {
                    out = '0' + out;
                }
                result += out;
            }
        }

        return result;
    }
};
var Panorama = function () {
    "use strict";

    var self = this;
    self.frameCount = 0;
	self.culler = new TiledImagePyramidCuller;
    self.outputMultiLODTiles = false;
    self.scanConvertSize = 20;
    self.prevViewTransform = null;
    self.prevProjectionTransform = null;
};

Panorama.prototype = {
    animationDurationMS: 250,
    
    cullCubeTiles: function (
        cubeSource,
        camera,
        visibleSet,
        isCachedUrl,
        useLowerLod,
        requiresTileOverlap,
        subdivideTiles) {
        "use strict";

        var delta = { added: [], removed: [] },
            faceDelta, i, propertyName,
            faceNames = ['front', 'left', 'right', 'back', 'bottom', 'top'];

        for (i = 0; i < faceNames.length; ++i) {
            propertyName = faceNames[i] + 'Face';
            if (cubeSource[propertyName]) {
                faceDelta = this.cullFace(
                    cubeSource.dimension,
                    cubeSource.tileSize,
                    cubeSource.minimumLod,
                    cubeSource.tileOverlap,
                    cubeSource.tileBorder,
                    cubeSource[propertyName],
                    faceNames[i],
                    camera,
                    visibleSet,
                    isCachedUrl,
                    useLowerLod,
                    requiresTileOverlap,
                    cubeSource.atlasImage,
                    subdivideTiles);
                delta.added = delta.added.concat(faceDelta.added);
                delta.removed = delta.removed.concat(faceDelta.removed);
            }
        }
        return delta;
    },

    cullFace: function (
        dimension,
        tileSize,
        minimumLod,
        tileOverlap,
        tileBorder,
        face,
        name,
        camera,
        visibleSet,
        isCachedUrl,
        useLowerLod,
        requiresTileOverlap,
        atlasImage,
        subdivideTiles) {
        "use strict";

        if (!face.tilePyramid) {
            face.tilePyramid = new TiledImagePyramid(name, dimension, dimension, tileSize, tileSize, minimumLod, (requiresTileOverlap) ? 1 : tileOverlap, (requiresTileOverlap) ? 1 : tileBorder, atlasImage);

            if (requiresTileOverlap && tileOverlap == 0) {
                //TODO: handle case where tileOverlap doesn't equal tileBorder
                face.tilePyramid.fakeTileOverlaps = true;
            }
        }
        if (!face.tileCoverage) {
            face.tileCoverage = new TiledImagePyramidCoverageMap(face.tilePyramid.minimumLod, face.tilePyramid.finestLod);
        }
        if (!face.tileSource) {
            throw 'rml cube face requires tile source per face';
        }

        if(!face.isCachedTile){
            face.isCachedTile = function(x,y,lod) {
                return isCachedUrl(face.tileSource(x,y,lod));
            };
        }

        var faceClipBounds = this.getClipBounds(face.clip);

        var delta = this.culler.cull(
            face.tilePyramid,
            face.tileCoverage,
            this.getFaceTransform,
            camera,
            faceClipBounds,
            visibleSet,
            name,
            face.tileSource,
            face.isCachedTile,
            this.frameCount,
            useLowerLod,
            subdivideTiles);

        this.removeRenderablesBeingProcessed(delta);

        return delta;
    },

    removeRenderablesBeingProcessed: function(delta)  {
        "use strict";

        if (this._renderablesBeingLoaded) {
			this.removeCancelled(this._renderablesBeingLoaded, delta);
        }

		if (this._renderablesBeingAnimated) {
			this.removeCancelled(this._renderablesBeingAnimated, delta);
        }
    },

    removeCancelled: function (list, delta) {
        "use strict";

        for (var i = 0; i < delta.removed.length; i++) {
            var id = delta.removed[i].id;
            if (list[id]) {
                delete list[id];
            }
        }
    },

    getFaceTransform: function (dimension, name) {
        "use strict";

        var centerUnitImageBaseImageResolution = Matrix4x4.createTranslation(-0.5, -0.5, 0).multiply(Matrix4x4.createScale(1.0 / dimension, 1.0 / dimension, 1.0));
        var distanceFromCenterOfBubble = 0.5;
        var faceTransformBaseImageResolution;

        switch (name) {
            case 'front':
                faceTransformBaseImageResolution = Matrix4x4.createTranslation(0, 0, -distanceFromCenterOfBubble).multiply(centerUnitImageBaseImageResolution);
                break;

            case 'back':
                faceTransformBaseImageResolution = Matrix4x4.createTranslation(0, 0, distanceFromCenterOfBubble).multiply(Matrix4x4.createRotationY(MathHelper.degreesToRadians(180)).multiply(centerUnitImageBaseImageResolution));
                break;

            case 'left':
                faceTransformBaseImageResolution = Matrix4x4.createTranslation(-distanceFromCenterOfBubble, 0, 0).multiply(Matrix4x4.createRotationY(MathHelper.degreesToRadians(90)).multiply(centerUnitImageBaseImageResolution));
                break;

            case 'right':
                faceTransformBaseImageResolution = Matrix4x4.createTranslation(distanceFromCenterOfBubble, 0, 0).multiply(Matrix4x4.createRotationY(MathHelper.degreesToRadians(-90)).multiply(centerUnitImageBaseImageResolution));
                break;

            case 'top':
                faceTransformBaseImageResolution = Matrix4x4.createTranslation(0, distanceFromCenterOfBubble, 0).multiply(Matrix4x4.createRotationX(MathHelper.degreesToRadians(90)).multiply(centerUnitImageBaseImageResolution));
                break;

            case 'bottom':
                faceTransformBaseImageResolution = Matrix4x4.createTranslation(0, -distanceFromCenterOfBubble, 0).multiply(Matrix4x4.createRotationX(MathHelper.degreesToRadians(-90)).multiply(centerUnitImageBaseImageResolution));
                break;
            default:
                throw 'unexpected cube face name';
                break;
        }
        return faceTransformBaseImageResolution;
    },

    //Figure out the region where tiles are available in a cube face
    getClipBounds: function (vertices) {
        "use strict";

        if (vertices == null) {
            return null;
        }

        var minX = 999999;
        var minY = 999999;
        var maxX = -9999999;
        var maxY = -9999999;
        for (var i = 0; i < vertices.length; i += 2) {
            var x = vertices[i];
            var y = vertices[i + 1];

            if (x < minX) { minX = x; }
            if (x > maxX) { maxX = x; }
            if (y < minY) { minY = y; }
            if (y > maxY) { maxY = y; }
        }
        return new Rectangle(minX, minY, maxX - minX, maxY - minY);
    },

    /**
    * Initialize Camera Controller.
    */
    createController: function (initialPanoramaEntities, camera) {
        "use strict";

        var cameraController = new RotationalFixedPositionCameraController(camera);
        if (initialPanoramaEntities && initialPanoramaEntities[0]) {
            //TODO: Ideally we'd do something smart for multiple cubes.
            var cubeSource = initialPanoramaEntities[0].source;

            var leftBound = cubeSource.bounds.left;
            var rightBound = cubeSource.bounds.right;
            var topBound = cubeSource.bounds.top;
            var bottomBound = cubeSource.bounds.bottom;
            var leftRightDelta = rightBound - leftBound;
            while (leftRightDelta <= 0) {
                leftRightDelta += 2 * MathHelper.PI;
            }
            var borderBufferPercentage = 1.05;

            var maxAllowedFov = MathHelper.degreesToRadians(90);
            var maxHorizontalFov = Math.min(maxAllowedFov, leftRightDelta * borderBufferPercentage);
            var maxVerticalFov = Math.min(maxAllowedFov, (bottomBound - topBound) * borderBufferPercentage);
            var finalFov = Math.max(maxVerticalFov,
                                          Math.min(maxAllowedFov,
                                                         Viewport.convertHorizontalToVerticalFieldOfView(camera.getViewport().getAspectRatio(),
                                                                                                         maxHorizontalFov)));

            //Make sure we check that if the final vertical fov when converted to horizontal is > 90 that we
            //make the vertical fov smaller.  Don't want horizontal or vertical fov to be > 90
            var maxFovAsHorizontal = Viewport.convertVerticalToHorizontalFieldOfView(camera.getViewport().getAspectRatio(), finalFov);
            finalFov = Viewport.convertHorizontalToVerticalFieldOfView(camera.getViewport().getAspectRatio(),
                                                                       Math.min(maxAllowedFov, maxFovAsHorizontal));

            //negative top and bottom because rml uses a different convention than the camera controller
            cameraController = new RotationalFixedPositionCameraController(camera, -topBound, -bottomBound, rightBound, leftBound, cubeSource.dimension);
            cameraController.setVerticalFov(finalFov);

            if (cubeSource.startingPitch != undefined) {
                cameraController.setPitchAndHeading(cubeSource.startingPitch,
                                                                cubeSource.startingHeading);
            }

            if (cubeSource.orientation) {
                cameraController.setOrientationTransform(cubeSource.orientation.toRotationMatrix());
            }
        }
        return cameraController;
    },

    /**
    * Implements the logic to cull panorama entities and emit tiles.
    */
    cull: function (
        panoramaEntities,
        camera,
        visibleSet,
        isCachedUrl,
        useLowerFidelity,
        requiresTileOverlap,
        subdivideTiles) {
        "use strict";

        var i, panoramaTiles,
            result = { added: [], removed: [] };
        for (i = 0; i < panoramaEntities.length; ++i) {
            //TODO deal with multple panorama entities correctly.

            panoramaTiles = this.cullCubeTiles(
                panoramaEntities[i].source,
                camera,
                visibleSet,
                isCachedUrl,
                useLowerFidelity,
                requiresTileOverlap,
                subdivideTiles);
            result.added = result.added.concat(panoramaTiles.added);
            result.removed = result.removed.concat(panoramaTiles.removed);
        }
        ++this.frameCount;
        return result;
    },

    /**
     * Creates renderables for tiles
     */
    generateRenderables: function (visibleEntities) {
        "use strict";

		var self = this;
        var i, renderable,  renderables = [];
		if (! this._renderablesBeingLoaded) {
			this._renderablesBeingLoaded = {};
        }

        var faceAtlasOffsets = {
            "front": 0,
            "right": 1,
            "back": 2,
            "left": 3,
            "bottom": 4,
            "top": 5
        };

        for(i = 0; i < visibleEntities.length; ++i) {
			(function() {
				var entity = visibleEntities[i];
				
                var offsetX = 0;
                var offsetY = 0;

                if (entity.tilePyramid.isAtlasTile(entity.tileId)) {
                    offsetX = faceAtlasOffsets[entity.face] * entity.tileWidth;
                }
                
                renderable = new TexturedQuadRenderable(entity.tileWidth, 
					entity.tileHeight,
					entity.transform,
					entity.url,
					null,
					null,
                    false,
                    offsetX,
                    offsetY);
				renderable._entity = entity;
				renderable.entityId = entity.id;
				renderable._order = entity.tileId.levelOfDetail;
				// We don't fade temp tiles or cached ones.
				if ( entity.tileId.isTemp  || entity.tileId.cached) {
					entity.fullyOpaque = true;
                } else {
					entity.fullyOpaque = false;
                }
				entity.loaded = false;
				renderables.push(renderable);
				self._renderablesBeingLoaded[entity.id] = renderable;
			} ());
        }
        return renderables;
    },

    /**
     * Update rendering state 
     */
    updateRenderableStates: function (renderer) {
        "use strict";

		var animateTileEntry = true;

		if (! this._renderablesBeingAnimated) {
			this._renderablesBeingAnimated = {};
        }

		if (this._renderablesBeingLoaded) {
			var toDelete = [];
			for (var id in this._renderablesBeingLoaded) {
				var r = this._renderablesBeingLoaded[id];
                var entity = r._entity;
                var tileId = entity.tileId;

				if (r._material._texture._isReady) {
					//Don't animate if tile is temporary (lower lod tile put in scene because higher lod isn't downloaded yet)
				    //Don't animate if we're rendering in lower lod mode (used when rotating to achieve better framerate)
                    //Don't animate subdivided tiles, since they need to immediately show over their parent
                    if (animateTileEntry && !tileId.isTemp && !tileId.isLowerLod && entity.subdivide == null) {
						renderer.animate(r,
								{opacity:0.0}, 
								{opacity:1.0}, 
								this.animationDurationMS,
								'ease-in-out');
                        entity.fullyOpaque = false;
						this._renderablesBeingAnimated[id] = r;
					} else {
                        entity.fullyOpaque = true;
                    }
					toDelete.push(id);
				}
			}
			for (var i=0; i<toDelete.length; i++) {
				delete this._renderablesBeingLoaded[toDelete[i]];
            }
		}

		if (this._renderablesBeingAnimated) {
			var toDelete = [];
			for (var id in this._renderablesBeingAnimated) {
				var r = this._renderablesBeingAnimated[id];
				if (r._material._animation._ended) {
					toDelete.push(id);
					r._entity.fullyOpaque = true;
				}
			}
			for (var i=0; i<toDelete.length; i++) {
				delete this._renderablesBeingAnimated[toDelete[i]];
            }
		}
	},

    fetch: function (entities, downloader) {
        "use strict";

        var i;
        if(entities.removed) {
            // assumes 1 download per item.
            for(i = 0; i < entities.removed.length; ++i) {
                downloader.cancel(entities.removed[i].id);
            }
        } 

        if(entities.updated) {
            //Update any pending downloads
            for(i = 0; i < entities.updated.length; ++i) {
                downloader.updatePriority(entities.updated[i].url, entities.added[i].priority);
            }
        }

        if(entities.added) {
            //Enqueue downloads.
            for(i = 0; i < entities.added.length; ++i) {
                downloader.downloadImage(entities.added[i].url, entities.added[i].priority, entities.added[i].id);
            }
        }
    },

    _drawBorders: function (currentTileContext, currentImage, neighborTexture, xOffset, yOffset) {
        "use strict";

        var neighborSourceImage = neighborTexture._sourceImage;
        var neighborCanvas = neighborTexture._image;
        
        if (neighborSourceImage == null || neighborCanvas == null) {
            return;
        }
        
        var neighborContext = neighborCanvas.getContext('2d');

        currentTileContext.drawImage(neighborSourceImage, 1 + xOffset, 1 + yOffset);

        neighborContext.drawImage(currentImage, 1 - xOffset, 1 - yOffset);
    },

    _neighborOffsets: [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [-1, 0]],

    _processDownload: function (img, renderable, entityIdToRenderable, renderer) {
        "use strict";

        var texture = renderable._material._texture;
        var entity = renderable._entity;
        var tilePyramid = entity.tilePyramid;
        var tileId = entity.tileId;

        if (texture._image != null) {
            //already been processed
            return;
        }

        if (tilePyramid.isAtlasTile(tileId)) {
            var dimensions = tilePyramid.getTileDimensions(tileId);

            var offsetX = texture._offsetX;
            var offsetY = texture._offsetY;
            var width = texture._width;
            var height = texture._height;
            var canvasWidth = dimensions.x;
            var canvasHeight = dimensions.y;

            var canvas = document.createElement('canvas');
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            var context = canvas.getContext('2d');

            context.drawImage(img, offsetX, offsetY, width, height,
                                   0, 0, canvas.width, canvas.height);
            
            if (tilePyramid.fakeTileOverlaps) {
                context.drawImage(img, offsetX, offsetY, width, height,
                                       1, 1, canvas.width - 1, canvas.height - 1);
            }
            
            texture._image = canvas;
            texture._sourceImage = img;
        }
        else if (tilePyramid.fakeTileOverlaps) {
            //TODO: handle case where tileOverlap != tileBorder
            var canvas = document.createElement('canvas');
            canvas.width = tilePyramid.tileWidth + 2;
            canvas.height = tilePyramid.tileHeight + 2;
            var context = canvas.getContext('2d');
                    
            //First draw a stretched out version of the tile on the canvas to fill in the border with pixels from its own borders
            context.drawImage(img, 0, 0, tilePyramid.tileWidth + 2, tilePyramid.tileHeight + 2);
                    
            //Next draw the tile centered in the canvas.
            context.drawImage(img, 1, 1);
                    
            //Now iterate through the list of possible neighbors for this element.  For each, draw borders on this canvas and the neighbor canvas
            for (var j = 0; j < this._neighborOffsets.length; j++) {
                var neighborOffset = this._neighborOffsets[j];
                var neighbor = new TileId(tileId.levelOfDetail, tileId.x + neighborOffset[0], tileId.y + neighborOffset[1]);
                var neighborEntityId = entity.face + neighbor.toString();
                var neighborRenderableId = entityIdToRenderable[neighborEntityId];
                if (neighborRenderableId && renderer._renderables[neighborRenderableId]) {
                    var neighborTexture = renderer._renderables[neighborRenderableId]._material._texture;
                    this._drawBorders(context, img, neighborTexture, tilePyramid.tileWidth * neighborOffset[0], tilePyramid.tileHeight * neighborOffset[1]);
                }
            }

            texture._image = canvas;
            texture._sourceImage = img;
        }
        else {
            texture._image = img;
        }

        if (renderable._entity.subdivide != null) {
            //Tile needs to be subdivided into one quadrant of the original
            //Perform this subdivision after all other chopping (atlas tile or fake overlap) has been done.
            var subdivide = renderable._entity.subdivide;
            var offsetX = subdivide.x;
            var offsetY = subdivide.y;
            var width = subdivide.width;
            var height = subdivide.height;
            var canvasWidth = subdivide.width;
            var canvasHeight = subdivide.height;

            var canvas = document.createElement('canvas');
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            var context = canvas.getContext('2d');

            context.drawImage(texture._image, offsetX, offsetY, width, height,
                                   0, 0, canvas.width, canvas.height);

            texture._image = canvas;
            texture._sourceImage = img;
        }

        texture._isReady = true;
        texture._isDirty = true;
    },

    processDownloads: function (completed, entityIdToRenderable, renderer) {
        "use strict";

        for(var i = 0; i < completed.length; ++i) {
            var img = completed[i];
            var renderableId = entityIdToRenderable[img.token];
            if(renderableId && renderer._renderables[renderableId]) {
                //Should we be reaching down directly to the renderer this way?
                
                var renderable = renderer._renderables[renderableId];
                var entity = renderable._entity;

                if (entity.tilePyramid.isAtlasTile(entity.tileId)) {
                    //set up the atlas image to allow processing of the atlas for all faces below
                    this.atlasImage = img;
                }
                else if (entity.tilePyramid.allowTileToBeSubdivided(entity.tileId)) {
                    if (this.subdivideImages == null) {
                        this.subdivideImages = {};
                    }
                    this.subdivideImages[img.src] = img;
                }
                else {
                    //process this renderable
                    this._processDownload(img, renderable, entityIdToRenderable, renderer);
                }
            } else {
                Utils.log('error renderableId : ' + renderableId + 'is not in the scene');
            }
        }

        if (this.atlasImage || this.subdivideImages != null) {
            //process any tiles that are atlas images
            for (var entityId2 in entityIdToRenderable) {
                var renderableId2 = entityIdToRenderable[entityId2];
                var renderable2 = renderer._renderables[renderableId2];
                if (renderable2 && renderable2._entity) {
                    var entity2 = renderable2._entity;

                    if (entity2.tilePyramid.isAtlasTile(entity2.tileId)) {
                        if (this.atlasImage) {
                            this._processDownload(this.atlasImage, renderable2, entityIdToRenderable, renderer);
                        }
                    }
                    else if (entity2.tilePyramid.allowTileToBeSubdivided(entity2.tileId)) {
                        if (this.subdivideImages != null && this.subdivideImages[entity2.url] != null) {
                            this._processDownload(this.subdivideImages[entity2.url], renderable2, entityIdToRenderable, renderer);
                        }
                    }
                }
            }
        }
    },

    parseQuaternion: function (qx, qy, qz) {
        "use strict";

        //Since we know this is a unit quaternion we can calculate w
        var wSquared = 1.0 - (qx * qx + qy * qy + qz * qz);
        if (wSquared < MathHelper.zeroTolerance) {
            wSquared = 0.0;
        }
        return new Quaternion(Math.sqrt(wSquared), qx, qy, qz);
    }
};

Config.PanoramaExists = true;
/**
 * This is a simple control for showing image attribution 
 * with creative common copyrights. It surfaces links to those
 * licenses, if no attribution is set, nothing is visible.
 * @constructor
 * @param {HTMLElement}  parentDiv 
 */
var AttributionControl = function (parentDiv) {
    "use strict";

    var self = this;
    self.lastAttribution = null;

    var createElement = function (tagName, id, className, parentNode) {
        var element = document.createElement(tagName);
        element.id = id;
        element.className = className;

        if (parentNode) {
            parentNode.appendChild(element);
        }

        return element;
    };

    //This control is laid out as follows
    // 
    // ---------------------------------------------------------------------------------------------------------------
    // |   ByIcon  | NC_icon  | ND_icon  | SA_Icon | PD_icon | Copyright_icon  |  Author Link Text - Publisher Text  |
    // ---------------------------------------------------------------------------------------------------------------
    //
    // Depending on license we going to toggle the visiblity of the icons. 
    // We also update links to point to the creative commons website
    //
    
    var controlDiv = createElement('div', 'attributionControl', 'panoramaAttributionControl panoramaAttributionControlContainer', parentDiv);
    var iconLinkNode = createElement('a', 'icon_anchor', 'panoramaAttributionControl', controlDiv);
    createElement('div', 'by_icon', 'panoramaAttributionControl panoramaAttributionControlIcon', iconLinkNode);
    createElement('div', 'nc_icon', 'panoramaAttributionControl panoramaAttributionControlIcon', iconLinkNode);
    createElement('div', 'nd_icon', 'panoramaAttributionControl panoramaAttributionControlIcon', iconLinkNode);
    createElement('div', 'sa_icon', 'panoramaAttributionControl panoramaAttributionControlIcon', iconLinkNode);
    createElement('div', 'pd_icon', 'panoramaAttributionControl panoramaAttributionControlIcon', iconLinkNode);
    createElement('div', 'copyright_icon', 'panoramaAttributionControl panoramaAttributionControlIcon', controlDiv);
    var testLinkNode = createElement('a', 'authorTextAnchor', 'panoramaAttributionControl', controlDiv);
    createElement('span', 'authorText', 'panoramaAttributionControl panoramaAttributionControlText', testLinkNode);
    createElement('span', 'authorTextNoAnchor', 'panoramaAttributionControl panoramaAttributionControlText', controlDiv);
    var dashSpan = createElement('span', 'attributionDash', 'panoramaAttributionControl panoramaAttributionControlText', controlDiv);
    dashSpan.innerText = ' - ';
    createElement('span', 'publisherText', 'panoramaAttributionControl panoramaAttributionControlText', controlDiv);

    var domAttributePrefix = "$$$$";

    // All of the code below should use jQuery instead of these mickymouse grade helpers.
    // However -- some partner teams don't want the dependency.
    var hide = function(element) {
        if(!element[domAttributePrefix + 'displayValue']) {
            element[domAttributePrefix + 'displayValue'];
        }
        Utils.css(element, {display:'none'});        
    };

    var show = function(element) {
        var originalValue = element[domAttributePrefix + 'displayValue'] || ((element.tagName === 'A' || element.tagName === 'SPAN')? 'inline': 'inline-block');
        Utils.css(element, {display:originalValue});
        self.updatePosition();
    };

    this.updatePosition = function () {
        var top = parentDiv.offsetHeight - controlDiv.offsetHeight - 10;
        controlDiv.style.top = top + "px";
    };

    var qs = function(id, rootElement) {
        if(!rootElement) {
            rootElement = document;
        }
        return rootElement.querySelector(id);
    };

    var text = function(element, value) {
        element.innerHTML = value;        
    };

    Utils.css(controlDiv, {'display':'block'});
    hide(controlDiv);

    //We use these table to populate
    //the Creative Commons related icons and links.
    var allIcons = ['pd_icon', 'by_icon', 'sa_icon', 'nc_icon', 'nd_icon', 'copyright_icon'];

    var ccAttributionType = {
        publicDomain : {
            pattern:'/publicdomain/',
            text:'This work is identified as Public Domain.',
            url:'http://creativecommons.org/licenses/publicdomain/',
            iconsToShow: ['pd_icon']
        },
        by : {
            pattern:'/by/',
            text: 'This work is licensed to the public under the Creative Commons Attribution license.',
            url:'http://creativecommons.org/licenses/by/3.0/',
            iconsToShow: ['by_icon']
        },
        bySa : {
            pattern:'/by-sa/',
            text:'This work is licensed to the public under the Creative Commons Attribution-ShareAlike license.',
            url:'http://creativecommons.org/licenses/by-sa/3.0/',
            iconsToShow: ['by_icon','sa_icon']
        },
        byNd : {
            pattern:'/by-nd/',
            text:'This work is licensed to the public under the Creative Commons Attribution-NoDerivatives license.',
            url:'http://creativecommons.org/licenses/by-nd/3.0/',
            iconsToShow: ['by_icon','nd_icon']
        },
        byNc : {
            pattern:'/by-nc/',
            text:'This work is licensed to the public under the Creative Commons Attribution-Non-commercial license.',
            url:'http://creativecommons.org/licenses/by-nc/3.0/',
            iconsToShow: ['by_icon','nc_icon']
        },
        byNcSa : {
            pattern:'/by-nc-sa/',
            text: 'This work is licensed to the public under the Creative Commons Attribution-Non-commercial-ShareAlike license.',
            url:'http://creativecommons.org/licenses/by-nc-sa/3.0/',
            iconsToShow: ['by_icon','nc_icon','sa_icon']
        },
        byNcNd : {
            pattern:'/by-nc-nd/',
            text:'This work is licensed to the public under the Creative Commons Attribution-Non-commercial-NoDerivatives license.',
            url:'http://creativecommons.org/licenses/by-nc-nd/3.0/',
            iconsToShow: ['by_icon','nc_icon','nd_icon']
        },
        copyright: {
            pattern:'',
            text:'This work is copyrighted.',
            url:'',
            iconsToShow: ['copyright_icon']
        }
    };

    var hideUI = function() {
        hide(controlDiv);
    };

    var updateUI = function(attribution) {
        var k,
            i,
            icon, el,
            attributionType = ccAttributionType.copyright;

        hide(controlDiv);

        //Hide all text.
        el = qs('#publisherText', controlDiv);
        hide(el);
        text(el, '');
        
        el = qs('#authorText', controlDiv);
        hide(el);
        text(el, '');
        
        el = qs('#authorTextAnchor', controlDiv);
        hide(el);
        el.title = '';
        el.href = '';
        
        el = qs('#authorTextNoAnchor', controlDiv);
        hide(el);
        text(el, '');

        el = qs('#attributionDash', controlDiv);
        hide(el);

        //Hide all icons
        for(i = 0 ; i < allIcons.length; ++i) {
            el = qs('#'+allIcons[i], controlDiv);
            hide(el);
        }
        el = qs('#icon_anchor', controlDiv);
        el.href = '';
        el.title = '';

        for(k in ccAttributionType) {
            if (ccAttributionType.hasOwnProperty(k)) {
                if (attribution &&
                   attribution.licenseUrl &&
                   attribution.licenseUrl.indexOf(ccAttributionType[k].pattern) != -1) {
                    attributionType = ccAttributionType[k];
                    break;
                }
            }
        }

        for(i = 0; i < attributionType.iconsToShow.length; ++i) {
            icon = attributionType.iconsToShow[i];
            el = qs('#' + icon, controlDiv);
            show(el);
        }
        el = qs('#icon_anchor', controlDiv);
        el.title = attributionType.text;
        el.href  = attributionType.url || attribution.attributionUrl;

        if(!attribution.author && attribution.publisher) {
            el = qs('#publisherText', controlDiv);
            hide(el);
            text(el, '');
            if(attribution.attributionUrl) {
                el = qs('#authorText', controlDiv);
                show(el);
                text(el, attribution.publisher);

                el = qs('#authorTextAnchor', controlDiv);
                show(el);
                el.href = attribution.attributionUrl;
                el.title = attribution.attributionUrl;
            } else {
                el = qs('#authorTextNoAnchor', controlDiv);
                show(el);
                text(el, attribution.publisher);
            }
        } else  {
            if(attribution.publisher) {
                el = qs('#publisherText', controlDiv);
                show(el);   
                text(el, attribution.publisher);
                el = qs('#attributionDash', controlDiv);
                show(el);
            } else {
                el = qs('#publisherText', controlDiv);
                hide(el);
                text(el, '');
            }
            if(attribution.author) {
                if(attribution.attributionUrl) {
                    el = qs('#authorText', controlDiv);
                    show(el);
                    text(el, attribution.author);
                    el = qs('#authorTextAnchor', controlDiv);
                    show(el);
                    el.href = attribution.attributionUrl;
                    el.title = attribution.attributionUrl;
                } else {
                    el = qs('#authorTextNoAnchor', controlDiv);
                    show(el);
                    text(el, attribution.author);
                }
            }
        }
        show(controlDiv);
    };

    /** 
     * This updates the attribution information
     * @param {{author:string, publisher:string,attributionUrl:string, licenseUrl:string}} attribution 
     */
    self.setAttribution = function(attribution) {
        if((self.lastAttribution != null &&
            attribution.author === self.lastAttribution.author &&
            attribution.publisher === self.lastAttribution.publisher &&
            attribution.attributionUrl === self.lastAttribution.attributionUrl &&
            attribution.licenseUrl === self.lastAttribution.licenseUrl) || 
            self.lastAttribution === null) {
            updateUI(attribution);
            self.lastAttribution = attribution;
        }
    };

    /**
     * clear the attribution UI state.
     */
    self.clearAttribution = function() {
        self.lastAttribution = null;
        hideUI();
    };

    /** 
     * Removed the UI from the DOM and cleans up. 
     */
    self.dispose = function() {
        if(controlDiv && controlDiv.parentNode) {
            controlDiv.parentNode.removeChild(controlDiv);
            controlDiv = null;
        }
    }
};

//The intent of this class is to encapsulate various forms of touch and mouse input supported by 
//different browsers and then fire a consistent set of events that can be used to control a camera.

//Instantiate it with an input element and options.
//The events are modelled after IE 10 events:
//   gestureStart - pointerCount, layerX/Y (with respect to the input element), clientX/Y
//   gestureChange - translationX/Y, layerX/Y , clientX/Y, scale
//   gestureEnd - translationX/Y, layerX/Y , clientX/Y, scale, pointersStillDown
//   discreteZoom - direction (positive value means zoom in), layerX/Y , clientX/Y
//   keyDown
//   keyUp

function GestureHelper(elem, options) {
    "use strict";

    var elem = elem;
    var gestureStartCallback = options.gestureStart || function () {};
    var gestureChangeCallback = options.gestureChange || function () {};
    var gestureEndCallback = options.gestureEnd || function () {};
    var discreteZoomCallback = options.discreteZoom || function () {};
    var keyDownCallback = options.keyDown || function () {};
    var keyUpCallback = options.keyUp || function () {};
    var enabled = false;
    var msGesture;
    var self = this;

    function onGestureStart(e) {
        e.type = 'gestureStart';
        gestureStartCallback(e);
    }

    function onGestureChange(e) {
        e.type = 'gestureChange';
        gestureChangeCallback(e);
    }

    function onGestureEnd(e) {
        e.type = 'gestureEnd';
        gestureEndCallback(e);

        self.focusKeyboardElement();
    }

    function onDiscreteZoom(e) {
        e.type = 'discreteZoom';
        discreteZoomCallback(e);
    }

    function onKeyDown(e) {
        keyDownCallback(e);
    }

    function onKeyUp(e) {
        keyUpCallback(e);
    }

    //var msGestureGoing = false;
    var msPointerCount = 0;
    
    function _getLayerXY(e) {
        //TODO: Possible perf improvement here:
        //      Walk up tree once then store result.  Will also need to set up (and later tear down) events
        //      to notify when the tree or scroll or offset has changed of any ancestors.

        //Note: Even if the event contains layerX/Y, we cannot use them because the mouseMove events are bound to the document rather than the input element.
        //      This was done to ensure the view continues to update if the user drags from inside the viewer to outside of the viewer.

        //Walk up tree to calculate offset from clientX/Y values
        var offsetX = 0;
        var offsetY = 0;
        var offsetElem = elem;

        var fullscreenElem = document.fullscreenElement || document.msFullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement;

        while (offsetElem != null && offsetElem != fullscreenElem && !isNaN(offsetElem.offsetLeft) && !isNaN(offsetElem.offsetTop)) {
            offsetX += offsetElem.offsetLeft - offsetElem.scrollLeft;
            offsetY += offsetElem.offsetTop - offsetElem.scrollTop;
            offsetElem = offsetElem.offsetParent;
        }


        var layerX = e.clientX - offsetX;
        var layerY = e.clientY - offsetY;

        return { x: layerX, y: layerY };
    }

    function msPointerDown(e) {
        //for IE10, we have to tell the gesture engine which pointers to use (all of them for our uses).

        if (e.pointerType === "mouse" && e.button !== 0) {
            // For our purposes, we only care about the left mouse button.  Ignore other mouse buttons.
            return;
        }

        try {
            msGesture.addPointer(e.pointerId);
            elem.msSetPointerCapture(e.pointerId);

            var layerXY = _getLayerXY(e);

            msPointerCount++;

            if (msPointerCount > 1) {
                onGestureEnd({
                    layerX: layerXY.x,
                    layerY: layerXY.y,
                    screenX: e.screenX,
                    screenY: e.screenY,
                    translationX: totalTranslationX,
                    translationY: totalTranslationY,
                    scale: totalScale,
                    pointersStillDown: true
                });

            }

            onGestureStart({
                layerX: layerXY.x,
                layerY: layerXY.y,
                screenX: e.screenX,
                screenY: e.screenY,
                pointerCount: msPointerCount
            });

            totalTranslationX = 0;
            totalTranslationY = 0;
            totalScale = 1;
        } catch (e) {
            // e.code === 11, "InvalidStateError" happens when touch and click happens at the same time.
        }
    }

    function msPointerUp(e) {
        msPointerCount--;

        if (msPointerCount < 0) {
            //This can happen if the user drags a pointer/finger from outside the viewer into the viewer, then releases
            msPointerCount = 0;
        }

        var layerXY = _getLayerXY(e);

        //TODO: do we still want to use msPointerCount?  It causes an extra GestureStart/End to be fired on mouse up
        //var pointersStillDown = msGestureGoing || msPointerCount > 0;
        var pointersStillDown = msPointerCount > 0;

        onGestureEnd({
            layerX: layerXY.x,
            layerY: layerXY.y,
            screenX: e.screenX,
            screenY: e.screenY,
            translationX: totalTranslationX,
            translationY: totalTranslationY,
            scale: totalScale,
            pointersStillDown: pointersStillDown
        });

        if (pointersStillDown) {
            onGestureStart({
                layerX: layerXY.x,
                layerY: layerXY.y,
                screenX: e.screenX,
                screenY: e.screenY,
                pointerCount: msPointerCount
            });

            totalTranslationX = 0;
            totalTranslationY = 0;
            totalScale = 1;
        }
    }

    var totalTranslationX;
    var totalTranslationY;
    var totalScale;

    function msGestureStart(/*e*/) {
        //msGestureGoing = true;
    }

    function msGestureChange(e) {
        //if (msGestureGoing) {
        if (msPointerCount > 0) {
            totalTranslationX += e.translationX;
            totalTranslationY += e.translationY;
            totalScale *= e.scale;

            var layerXY = _getLayerXY(e);

            if (e.detail & e.MSGESTURE_FLAG_INERTIA) {
                //inertia phase

                onGestureEnd({
                    layerX: layerXY.x,
                    layerY: layerXY.y,
                    screenX: e.screenX,
                    screenY: e.screenY,
                    translationX: totalTranslationX,
                    translationY: totalTranslationY,
                    scale: totalScale
                });

                //msGestureGoing = false;
            }
            else {
                onGestureChange({
                    layerX: layerXY.x,
                    layerY: layerXY.y,
                    screenX: e.screenX,
                    screenY: e.screenY,
                    translationX: totalTranslationX,
                    translationY: totalTranslationY,
                    scale: totalScale
                });
            }
        }
    }

    function msGestureEnd(e) {
        //if (msGestureGoing) {
        if (msPointerCount > 0) {
            var layerXY = _getLayerXY(e);

            onGestureEnd({
                layerX: layerXY.x,
                layerY: layerXY.y,
                screenX: e.screenX,
                screenY: e.screenY,
                translationX: totalTranslationX,
                translationY: totalTranslationY,
                scale: totalScale
            });
        }
    }

    var mouseDownPos = null;

    function mouseDown(e) {
        if (e.button !== 0) {
            // For our purposes, we only care about the left mouse button.  Ignore other mouse buttons.
            return;
        }

        var layerXY = _getLayerXY(e);

        onGestureStart({
            layerX: layerXY.x,
            layerY: layerXY.y,
            screenX: e.screenX,
            screenY: e.screenY,
            pointerCount: 1
        });

        mouseDownPos = {
            x: layerXY.x,
            y: layerXY.y
        };

        e.preventDefault();

        document.addEventListener('mousemove', mouseMove, false);
        document.addEventListener('mouseup', mouseUp, false);
    }

    function mouseMove(e) {
        if (mouseDownPos != null) {
            var layerXY = _getLayerXY(e);

            onGestureChange({
                layerX: layerXY.x,
                layerY: layerXY.y,
                screenX: e.screenX,
                screenY: e.screenY,
                translationX: layerXY.x - mouseDownPos.x,
                translationY: layerXY.y - mouseDownPos.y,
                scale: 1
            });

            e.preventDefault();
        }
    }

    function mouseUp(e) {
        if (mouseDownPos != null) {
            var layerXY = _getLayerXY(e);

            onGestureEnd({
                layerX: layerXY.x,
                layerY: layerXY.y,
                screenX: e.screenX,
                screenY: e.screenY,
                translationX: layerXY.x - mouseDownPos.x,
                translationY: layerXY.y - mouseDownPos.y,
                scale: 1
            });

            mouseDownPos = null;

            e.preventDefault();

            document.removeEventListener('mousemove', mouseMove, false);
            document.removeEventListener('mouseup', mouseUp, false);
        }
    }

    function mouseWheel(e) {
        //Get the wheel data in a browser-agnostic way.
        //See http://www.switchonthecode.com/tutorials/javascript-tutorial-the-scroll-wheel
        var wheelDelta =  e.detail ? e.detail * -1 : e.wheelDelta / 40;

        var direction;
        if (wheelDelta > 0) {
            direction = 1;
        }
        else if (wheelDelta < 0) {
            direction = -1;
        }

        var layerXY = _getLayerXY(e);

        onDiscreteZoom({
            layerX: layerXY.x,
            layerY: layerXY.y,
            screenX: e.screenX,
            screenY: e.screenY,
            direction: direction
        });

        e.preventDefault();
    }

    function doubleClick(e) {
        var layerXY = _getLayerXY(e);

        onDiscreteZoom({
            layerX: layerXY.x,
            layerY: layerXY.y,
            screenX: e.screenX,
            screenY: e.screenY,
            direction: 1
        });

        e.preventDefault();
    }

    var touchStartPos = null;
    var touchStartDist = null;
    var touchLastEvent = null;
    var touchesInUse = { primary: null, secondary: null };

    //sets the first two touches in the list to be primary and secondary
    function setCurrentTouchPair(touches) {
        if (touches.length === 0) {
            touchesInUse = { primary: null, secondary: null };
        }
        if (touches.length === 1) {
            touchesInUse = { primary: touches[0].identifier, secondary: null };
        }
        else if (touches.length == 2) {
            touchesInUse = { primary: touches[0].identifier, secondary:touches[1].identifier };
        }
    }

    function getCurrentTouchPair(touches) {
        if (touchesInUse == null) {
            return null;
        }

        var touchPair = { primary: null, secondary: null };

        for (var i = 0; i < touches.length; i++) {
            var touch = touches[i];

            if (touch.identifier == touchesInUse.primary) {
                touchPair.primary = touch;
                touchPair.primary.layerXY = _getLayerXY(touch);
            }
            else if (touch.identifier == touchesInUse.secondary) {
                touchPair.secondary = touch;
                touchPair.secondary.layerXY = _getLayerXY(touchPair.secondary);
            }

            if (touchPair.primary != null && touchPair.secondary != null) {
                //early exit
                return touchPair;
            }
        }

        return touchPair;
    }

    function calculateTouchPairEventArgs(touchPair, includeMoveArgs) {
        var primary = touchPair.primary;
        var secondary = touchPair.secondary;

        var layerX = (primary.layerXY.x + secondary.layerXY.x) / 2;
        var layerY = (primary.layerXY.y + secondary.layerXY.y) / 2;
        var screenX = (primary.screenX + secondary.screenX) / 2;
        var screenY = (primary.screenY + secondary.screenY) / 2;

        var deltaX = primary.layerXY.x - secondary.layerXY.x;
        var deltaY = primary.layerXY.y - secondary.layerXY.y;

        var touchDist = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));

        var eventArgs = {
            layerX: layerX,
            layerY: layerY,
            screenX: screenX,
            screenY: screenY,
            pointerCount: (touchPair.secondary == null) ? 1 : 2
        };

        if (includeMoveArgs) {
            eventArgs.translationX = layerX - touchStartPos.x;
            eventArgs.translationY = layerY - touchStartPos.y;
            eventArgs.scale = touchDist / touchStartDist;
        }
        else {
            touchStartPos = { x: layerX, y: layerY };
            touchStartDist = touchDist;
        }

        return eventArgs;
    }

    function onTouchGestureStart(e) {
        onGestureStart(e);

        touchLastEvent = e;
        touchLastEvent.translationX = 0;
        touchLastEvent.translationY = 0;
        touchLastEvent.scale = 1;
    }

    function onTouchGestureChange(e) {
        onGestureChange(e);
        touchLastEvent = e;
    }

    function onTouchGestureEnd(e, pointersStillDown) {
        e.pointersStillDown = pointersStillDown;
        onGestureEnd(e);
    }

    function touchStart(e) {
        e.preventDefault();

        if (e.targetTouches.length === 1) {
            //first finger down

            setCurrentTouchPair(e.targetTouches);
            var touchPair = getCurrentTouchPair(e.targetTouches);

            onTouchGestureStart({
                layerX: touchPair.primary.layerXY.x,
                layerY: touchPair.primary.layerXY.y,
                screenX: touchPair.primary.screenX,
                screenY: touchPair.primary.screenY,
                pointerCount: (touchPair.secondary == null) ? 1 : 2
            });

            touchStartPos = {
                x: touchPair.primary.layerXY.x,
                y: touchPair.primary.layerXY.y
            };
        }
        else if (e.targetTouches.length === 2) {
            //second finger down

            var touchPair = getCurrentTouchPair(e.targetTouches);
            
            onTouchGestureEnd(touchLastEvent, true);

            setCurrentTouchPair(e.targetTouches);
            touchPair = getCurrentTouchPair(e.targetTouches);

            onTouchGestureStart(calculateTouchPairEventArgs(touchPair, false));
        }
    }

    function touchMove(e) {
        e.preventDefault();

        var touchPair = getCurrentTouchPair(e.targetTouches);

        if (touchPair == null || touchPair.primary == null) {
            //unexpected - error condition

            //TODO: is this needed?  Will it work?

            //console.warn("touchchange event when we show no touches down");
            //return;
            touchStart(e);
            touchPair = getCurrentTouchPair(e.targetTouches);
        }

        if (touchPair.secondary == null) {
            //one finger

            onTouchGestureChange({
                layerX: touchPair.primary.layerXY.x,
                layerY: touchPair.primary.layerXY.y,
                screenX: touchPair.primary.screenX,
                screenY: touchPair.primary.screenY,
                translationX: touchPair.primary.layerXY.x - touchStartPos.x,
                translationY: touchPair.primary.layerXY.y - touchStartPos.y,
                scale: 1
            });
        }
        else {
            //two fingers
            
            onTouchGestureChange(calculateTouchPairEventArgs(touchPair, true));
        }
    }

    function touchEnd(e) {
        e.preventDefault();

        if (e.targetTouches.length === 0) {
            //last finger up

            setCurrentTouchPair(e.targetTouches);

            onTouchGestureEnd(touchLastEvent);

            touchStartPos = null;
            touchStartDist = null;
            //touchLastEvent = null;
        }
        else if (e.targetTouches.length === 1) {
            //second finger up

            onTouchGestureEnd(touchLastEvent, true);

            setCurrentTouchPair(e.targetTouches);
            var touchPair = getCurrentTouchPair(e.targetTouches);

            var primaryTouch = touchPair.primary;

            onTouchGestureStart({
                layerX: primaryTouch.layerXY.x,
                layerY: primaryTouch.layerXY.y,
                screenX: primaryTouch.screenX,
                screenY: primaryTouch.screenY,
                pointerCount: (touchPair.secondary == null) ? 1 : 2
            });

            touchStartPos = {
                x: primaryTouch.layerXY.x,
                y: primaryTouch.layerXY.y
            };
        }
        else {
            //one finger out of 3+ lifted up

            var currentTouches = getCurrentTouchPair(e.targetTouches);

            if (currentTouches.primary == null || currentTouches.secondary == null) {
                //the primary or secondary finger was lifted.  Finish this gesture and start a new one.

                onTouchGestureEnd(touchLastEvent, true);

                setCurrentTouchPair(e.targetTouches);
                var touchPair = getCurrentTouchPair(e.targetTouches);

                onTouchGestureStart(calculateTouchPairEventArgs(touchPair, false));
            }
        }
    }

    var attachHandlers;
    var detachHandlers;

    if (window.navigator.msPointerEnabled && window.MSGesture) {
    //IE10+.  Mouse, touch, and pen events all fire as MSPointer and MSGesture
        attachHandlers = function () {
            msGesture = new MSGesture();
            msGesture.target = elem;
            
            elem.addEventListener("MSPointerDown", msPointerDown, false);
            elem.addEventListener("MSPointerUp", msPointerUp, false);
            elem.addEventListener('MSGestureStart', msGestureStart, true);
            elem.addEventListener('MSGestureChange', msGestureChange, true);
            elem.addEventListener('MSGestureEnd', msGestureEnd, true);
            elem.addEventListener('dblclick', doubleClick, false);
            elem.addEventListener('mousewheel', mouseWheel, false);
        };

        detachHandlers = function () {
            elem.removeEventListener("MSPointerDown", msPointerDown, false);
            elem.removeEventListener("MSPointerUp", msPointerUp, false);
            elem.removeEventListener('MSGestureStart', msGestureStart, true);
            elem.removeEventListener('MSGestureChange', msGestureChange, true);
            elem.removeEventListener('MSGestureEnd', msGestureEnd, true);
            elem.removeEventListener('dblclick', doubleClick, false);
            elem.removeEventListener('mousewheel', mouseWheel, false);

            msGesture = null;
        };
        
    }
    else {
        //Browser doesn't support MSPointer and MSGesture, fall back to wc3 touch and mouse events
        attachHandlers = function () {
            elem.addEventListener('touchstart', touchStart, false);
            elem.addEventListener('touchmove', touchMove, false);
            elem.addEventListener('touchend', touchEnd, false);

            elem.addEventListener('mousedown', mouseDown, false);
            elem.addEventListener('mousewheel', mouseWheel, false);
            elem.addEventListener('DOMMouseScroll', mouseWheel, false);
            elem.addEventListener('dblclick', doubleClick, false);

            if (window.parent && window != window.parent) {
                //If we're in a frame or iframe, then we won't get proper events when the mouse goes outside the frame, so just count it as a mouseup.
                document.addEventListener('mouseout', mouseUp, false);
            }
        };

        detachHandlers = function () {
            elem.removeEventListener('touchstart', touchStart, false);
            elem.removeEventListener('touchmove', touchMove, false);
            elem.removeEventListener('touchend', touchEnd, false);

            elem.removeEventListener('mousedown', mouseDown, false);

            //Note: mousemove and mouseup are attached from the mousedown handler; not the attacheHandlers function.
            //      But we still disable them here in case they are attached.
            elem.removeEventListener('mousemove', mouseMove, false);
            elem.removeEventListener('mouseup', mouseUp, false);

            elem.removeEventListener('mousewheel', mouseWheel, false);
            elem.removeEventListener('DOMMouseScroll', mouseWheel, false);
            elem.removeEventListener('dblclick', doubleClick, false);

            if (window.parent && window != window.parent) {
                document.removeEventListener('mouseout', mouseUp, false);
            }
        };
    }

    var keyboardFocusElement = document.createElement('input');
    keyboardFocusElement.readOnly = true;
    keyboardFocusElement.style.width = "0px";
    keyboardFocusElement.style.height = "0px";
    keyboardFocusElement.style.opacity = 0;

    function attachKeyboardHandlers() {
        elem.appendChild(keyboardFocusElement);

        keyboardFocusElement.addEventListener('keydown', onKeyDown, false);
        keyboardFocusElement.addEventListener('keyup', onKeyUp, false);
    };

    function detachKeyboardHandlers() {
        keyboardFocusElement.removeEventListener('keydown', onKeyDown, false);
        keyboardFocusElement.removeEventListener('keyup', onKeyUp, false);

        if (keyboardFocusElement.parentNode) {
            keyboardFocusElement.parentNode.removeChild(keyboardFocusElement);
        }
    };

    //public interface
    this.enable = function () {
        attachHandlers();
        attachKeyboardHandlers();
        enabled = true;
    };

    this.disable = function () {
        detachHandlers();
        detachKeyboardHandlers();
        enabled = false;
    };

    this.isEnabled = function () {
        return enabled;
    };

    this.userCurrentlyInteracting = function () {
        //Intentionally exclude keyboard and mouse input.  Only care about touch input here.
        return msPointerCount > 0;
    };

    this.focusKeyboardElement = function () {
        keyboardFocusElement.focus();
    };
}
//The intent of this class is to encapsulate various forms of touch and mouse input supported by 
//different browsers and then fire a consistent set of events that can be used to control a camera.

function QueuedGestureHelper(elem) {
    "use strict";

    var eventQueue = [];

    function eventHandler(e) {
        eventQueue.push(e);
    }

    var gestureHelper = new GestureHelper(elem, {
        gestureStart: eventHandler,
        gestureChange: eventHandler,
        gestureEnd: eventHandler,
        discreteZoom: eventHandler,
        keyDown: eventHandler,
        keyUp: eventHandler
    });

    this.enable = function () {
        gestureHelper.enable();
    };

    this.disable = function () {
        gestureHelper.disable();
    };

    this.isEnabled = function () {
        return gestureHelper.isEnabled();
    };

    this.getQueuedEvents = function () {
        var temp = eventQueue;
        eventQueue = [];
        return temp;
    };

    this.userCurrentlyInteracting = function () {
        return gestureHelper.userCurrentlyInteracting();
    };

    this.focusKeyboardElement = function () {
        gestureHelper.focusKeyboardElement();
    };
}

// TODO:
//   Get contract patching stuff instead of using self.mediaType[k] stuff.

/**
 * Prototype RML viewer.
 */
var RwwViewer = function (parentDiv, options) {
    "use strict";

    var requestAnimationFrame = window.requestAnimationFrame ||
                                window.msRequestAnimationFrame ||
                                window.mozRequestAnimationFrame ||
                                window.oRequestAnimationFrame ||
                                window.webkitRequestAnimationFrame ||
                                function (callback) {
                                    window.setTimeout(callback, 1000 / 30);
                                };

    var self = this,
        options = options || {},
        attributionChanged = options.attributionChanged || function() {} ,
        animating = true,
        rootElement = document.createElement('div'),
    	eventCapturingElement = document.createElement('div'),
        scene = new RMLStore(),
        showDebugMessages = true,
        showDebugRenderables = false,
        showLowerFidelityWhileMoving = true;
       
    //This is a member just for testing purposes.
    self.mediaType = {};
    if (Config.PanoramaExists) {
        self.mediaType['panorama'] = new Panorama();
    }
    if (Config.StreetsidePanoramaExists) {
        self.mediaType['streetsidePanorama'] = new StreetsidePanorama();
    }
	if (Config.MapExists) {
		self.mediaType['map'] = new Map();
	}
    
    if(!parentDiv) {
        throw 'expected div argument';
    }

    if (options.url) {
        //Load RML from an url.
        ///TODO
    } else if (options.rml) {
        //Use RML that is passed in.    
        scene.add(options.rml);
    } else {
        throw 'expected either url or rml property passed in the options object';
    }

    var width = options.width || parentDiv.offsetWidth;
    var height = options.height || parentDiv.offsetHeight;

    var commonStyles = {
        width: width + 'px',
        height: height + 'px',
        position: 'absolute',
        overflow: 'hidden',
        '-ms-user-select': 'none',
        '-moz-user-select': '-moz-none',
        '-webkit-user-select': 'none',
        'user-select': 'none',
        '-ms-touch-action': 'none'
    };
    
    Utils.css(parentDiv, { direction: 'ltr' });
    Utils.css(rootElement, commonStyles);
    Utils.css(rootElement, { backgroundColor: 'rgba(0,0,0,1)', direction: 'ltr' });
    Utils.css(eventCapturingElement, commonStyles);
    Utils.css(eventCapturingElement, { backgroundColor: 'rgba(0,0,0,0)', webkitTapHighlightColor: 'rgba(0,0,0,1)', tabIndex: 0 });
    var renderer;
	// in order to be able to get close enough in the map case (still not
	// enough. TODO: dynamically manage near and far in MapCameraController)
    var near = 0.00001;
    var far  = 4;
		
    var requiresCORS = false;
    var requiresTileOverlap = false;
    var subdivideTiles = false;
    switch (options.renderer) {
        case 'css':
            renderer = new RendererCSS3D(rootElement, width, height);
            requiresTileOverlap = true;
            if (quirks.cssRequiresTileSubdivision) {
                subdivideTiles = true;
            }
            break;
        case 'webgl':
            renderer = new RendererWebGL(rootElement, width, height);
            requiresCORS = true;
            break;
        default:
            //We try webgl first then css.
            try {
                renderer = new RendererWebGL(rootElement, width, height);
                requiresCORS = true;
            } catch (ex) {
                try {
                    if (rootElement.parentNode) {
                        rootElement.parentNode.removeChild(rootElement);
                    }
                    renderer = new RendererCSS3D(rootElement, width, height);
                    requiresTileOverlap = true;
                    if (quirks.cssRequiresTileSubdivision) {
                        subdivideTiles = true;
                    }

                } catch (ex2) {
                    if (rootElement.parentNode) {
                        rootElement.parentNode.removeChild(rootElement);
                    }
                    renderer = null;
                }
            }

            if (renderer == null) {
                throw 'Could not create CSS3 or webgl renderer' + options.renderer;
            }
            break;
    }

    //Only attach event handlers and wire up the DOM etc.. when we know we won't throw on renderer creation.
    parentDiv.appendChild(rootElement);
    parentDiv.appendChild(eventCapturingElement);
    var gestureHelper = new QueuedGestureHelper(eventCapturingElement);
    gestureHelper.enable();

    if (options.backgroundColor) {
        renderer.setClearColor(options.backgroundColor);
    }

    var attributionControl = null;
    //Setup overlay UI. 
    if(!options.hideAttribution && options.rml.source && options.rml.source.attribution) {
        attributionControl = new AttributionControl(parentDiv);
        attributionControl.setAttribution(options.rml.source.attribution);
    } 

    if(options.rml.source && options.rml.source.attribution) {
        attributionChanged(options.rml.source.attribution);
    }

    var alreadyFiredLoadedEvent = false;
    var tileDownloadFailed = function (failCount, successCount) {
        if (downloader.customFailFunc) {
            downloader.customFailFunc();
        }
        if (options.tileDownloadFailed) {
            options.tileDownloadFailed(failCount, successCount);
        }
        if (Config.tileDownloadFailed) {
            Config.tileDownloadFailed();
        }
    };
    var tileDownloadSucceeded = function (failCount, successCount) {
        if (options.tileDownloadSucceeded) {
            options.tileDownloadSucceeded(failCount, successCount);
        }

        if (!alreadyFiredLoadedEvent && options.loaded && !downloader.currentlyDownloading()) {
            options.loaded();
            alreadyFiredLoadedEvent = true;
        }
    };
    var downloader = new PriorityNetworkDownloader(requiresCORS, tileDownloadFailed, tileDownloadSucceeded);

    var viewport = new Viewport(width, height, near, far);
    var camera = new PerspectiveCamera();
    camera.setViewport(viewport);
    var cameraParameters = options.cameraParameters || {
        verticalFov: MathHelper.degreesToRadians(80),
        position: new Vector3(0, 0, 0),
        look: new Vector3(0, 0, -1),
        //Use the following for testing a more general initial view
        //look: (new Vector3(-1, 0, -1)).normalize(),
        up: new Vector3(0, 1, 0),
        side: new Vector3(1, 0, 0)
    };

    camera.setPosition(cameraParameters.position);
    camera.setLook(cameraParameters.look);
    camera.setUp(cameraParameters.up);
    camera.setVerticalFov(cameraParameters.verticalFov);
    var activeController;

    //Give any initially loaded media a chance to override our default controller. Last one wins.
    objectCollection.loopByType(scene, function (k, entities) {
        if (entities.length > 0 && self.mediaType[k] && self.mediaType[k].createController) {
            activeController = self.mediaType[k].createController(entities, camera, cameraParameters);
            if (self.mediaType[k].outputMultiLODTiles != null) {
                Config.outputMultiLODTiles = self.mediaType[k].outputMultiLODTiles;
            }
            if (self.mediaType[k].scanConvertSize != null) {
                Config.scanConvertSize = self.mediaType[k].scanConvertSize;
            }
        }
    });

    var entityIdToRenderable = {};
    var visibleSet = { byType: {} };

    var prevFrame = new Date();
    var prevSmoothedFrame = new Date();
    var smoothedFrameCount = 0;
    var smoothedFramerate = 0;

    var isCachedUrl = function(url) {
        var state = downloader.getState(url);
        return (state === TileDownloadState.ready);
    };

    //This is the main processing loop. 
    var hasBlockingDownload = false;
    var blockingDownloadTargetCount = -1,
        blockingDownloadSuccessCount = 0,
        blockingDownloadFailureCount = 0,
        blockingDownloadProgressCallback = null,
        blockingDownloadFinishCallback = null;
    var prefetchedTiles = {};

    this.getEntities = function (entityType) {
        return scene.byType[entityType];
    };

    var updateFrame = function () {
        if (hasBlockingDownload) {
            blockingDownloadSuccessCount += downloader.completed.length;
            downloader.update();
            blockingDownloadProgressCallback(blockingDownloadSuccessCount);
            if (blockingDownloadSuccessCount + blockingDownloadFailureCount ==
                    blockingDownloadTargetCount) {
                blockingDownloadFinishCallback(blockingDownloadSuccessCount,
                        blockingDownloadFailureCount);

                // reset
                self._resetDownloadAll();
            } else {
                if (animating) {
                    ++frameCount;
                    requestAnimationFrame(updateFrame);
                }
                return;
            }
        }
        var i,
        deltaVisibleSet = { byType: {} };

        /**
        * Update our RML graph based on network input 
        */
        var networkUpdate = { added: [], removed: [] }; //TODO use socket.io
        for (i = 0; i < networkUpdate.removed.length; ++i) {
            var obj = scene.byId[networkUpdate.removed[i]];
            deltaVisibleSet.byType[obj.type].removed = deltaVisibleSet.byType[obj.type].removed || [];
            deltaVisibleSet.byType[obj.type].removed.push(obj.id);
        };


        /**
        * Update our camera pose based on user input
        */
        camera = activeController.control(camera, gestureHelper.getQueuedEvents());

        var pose = camera.getPose();
        var toleranceInPixels = (self.prevCameraMoving) ? 0.1 : 1;

        var userInteracting = gestureHelper.userCurrentlyInteracting();
        var cameraMoving = (self.prevPose != null && !self.prevPose.isFuzzyEqualTo(pose, toleranceInPixels));

        var userInteractingWaitTime = 1000;

        if (userInteracting) {
            self.userInteractingTime = null;
        }
        else if (self.prevUserInteracting) {
            var now = (new Date()).valueOf();
            if (self.userInteractingTime == null) {
                self.userInteractingTime = now + userInteractingWaitTime;
            }

            if (self.userInteractingTime > now) {
                //still waiting for high fidelity time
                userInteracting = true;
            }
            else {
                self.userInteractingTime = null;
            }
        }

        var useLowerFidelity = showLowerFidelityWhileMoving && (userInteracting || cameraMoving);
        var fidelityChanged = (useLowerFidelity !== self.prevUseLowerFidelity);

        var doWorkThisFrame = fidelityChanged || useLowerFidelity || downloader.currentlyDownloading() || !self.prevPose.isFuzzyEqualTo(pose, 0.0001);

        var doWorkWaitTime = 500;

        if (doWorkThisFrame) {
            self.doWorkTime = null;
        }
        else if (self.prevDoWorkThisFrame) {
            var now = (new Date()).valueOf();
            if (self.doWorkTime == null) {
                self.doWorkTime = now + doWorkWaitTime;
            }

            if (self.doWorkTime > now) {
                //still doing work for a bit more in case I've missed anything
                doWorkThisFrame = true;
            }
            else {
                self.doWorkTime = null;
            }
        }

        self.prevPose = pose;
        self.prevUserInteracting = userInteracting;
        self.prevCameraMoving = cameraMoving;
        self.prevUseLowerFidelity = useLowerFidelity;
        self.prevDoWorkThisFrame = doWorkThisFrame;
        
        if (doWorkThisFrame) {
            objectCollection.loopByType(scene, function (k, entities) {
                if (entities.length > 0 && self.mediaType[k] && self.mediaType[k].cull) {
                    //Should this API take a view frustum or view projection matrix instead of camera?
                    visibleSet.byType[k] = visibleSet.byType[k] || [];
                    if (!visibleSet.byType[k].byId) {
                        visibleSet.byType[k].byId = {};
                    }
                    deltaVisibleSet.byType[k] = self.mediaType[k].cull(
                        entities,
                        camera,
                        visibleSet.byType[k],
                        isCachedUrl,
                        useLowerFidelity,
                        requiresTileOverlap,
                        subdivideTiles);
                }
            });

            //Enqueue any new downloads and cancel downloads.
            objectCollection.loopByType(deltaVisibleSet, function (k, entities) {
                if (self.mediaType[k] && self.mediaType[k].fetch) {
                    self.mediaType[k].fetch(entities, downloader);
            }});

            var renderableToRemove = [];
            var renderableToAdd = [];
            objectCollection.loopByType(deltaVisibleSet, function (k, entities) {
                var i = 0, id;
                if (entities.removed) {
                    for (i = 0; i < entities.removed.length; ++i) {
                        var id = entities.removed[i].id;
                        renderableToRemove.push(entityIdToRenderable[id]);
                    }
                }

                if (entities.added && self.mediaType[k] && self.mediaType[k].generateRenderables) {
                    renderableToAdd = renderableToAdd.concat(self.mediaType[k].generateRenderables(entities.added, renderer));
                }
            });

            //Add the renderables to the scene.
            var renderableId = renderer.addRenderable(renderableToAdd);
            for (i = 0; i < renderableToAdd.length; ++i) {
                entityIdToRenderable[renderableToAdd[i].entityId] = renderableId[i];
            }

            //Process any downloaded resources and let renderables know.
            objectCollection.loopByType(deltaVisibleSet, function (k) {
                if (self.mediaType[k] && self.mediaType[k].processDownloads) {
                    //NOTE we'll need to revisit this with multiple entity types.
                    self.mediaType[k].processDownloads(downloader.completed, entityIdToRenderable, renderer);
            }});


            //Allow downloader to process any updates.
            downloader.update();

            //Do any animations that are required.
            objectCollection.loopByType(deltaVisibleSet, function (k/*, entities*/) {
                if (self.mediaType[k] && self.mediaType[k].updateRenderableStates) {
                    self.mediaType[k].updateRenderableStates(renderer);
                }
            });

            //Remove old renderables.
            for (i = 0; i < renderableToRemove.length; ++i) {
                for (var k in entityIdToRenderable) { //TODO opt.
                    if (entityIdToRenderable[k] === renderableToRemove[i]) {
                        delete entityIdToRenderable[renderableToRemove[i]];
                    }
                }
            }
            renderer.remove(renderableToRemove);

            //Do the actual Render.
            renderer.setViewProjectionMatrix(camera.getViewProjectionTransform());
            renderer.render(useLowerFidelity);

            //Update visible set
            objectCollection.loopByType(deltaVisibleSet, function (k, entities) {
                var i, j, element, updatedSet = [];
                visibleSet.byType[k] = visibleSet.byType[k] || [];
                visibleSet.byType[k] = visibleSet.byType[k].concat(entities.added);
            
                for(j = 0; j < visibleSet.byType[k].length; ++j) {
				    var removed = false;
            	    for( i = 0; i < entities.removed.length; ++i) {
                        if (visibleSet.byType[k][j].id == entities.removed[i].id) {
						    removed = true;
						    break;
					    }
				    }
            	    if (!removed) {
            	        updatedSet.push(visibleSet.byType[k][j]);
            	    }
			    }
                visibleSet.byType[k] = updatedSet;

                //build an index by id.
                visibleSet.byType[k].byId = {};
                for (i = 0; i < visibleSet.byType[k].length; ++i) {
                    element = visibleSet.byType[k][i];
                    visibleSet.byType[k].byId[element.id] = element;
                }
            });

            if (showDebugMessages) {
                var debugText = document.getElementById('debugText');
                if (debugText) {
                    var numberOfRenderables = 0;
                    for (var k in renderer._renderables) {
                        if (renderer._renderables.hasOwnProperty(k)) {
                            ++numberOfRenderables;
                        }
                    }

                    var now = new Date();

                    smoothedFrameCount++;
                    if ((now - prevSmoothedFrame) >= 500) {
                        smoothedFramerate = smoothedFrameCount / 0.5;
                        smoothedFrameCount = 0;
                        prevSmoothedFrame = now;
                    }

                    var message = ' frame count:' + frameCount + '  #renderables:' + numberOfRenderables + ' framerate:' + (1000 / (now - prevFrame)).toFixed(0) + ' smoothedFramerate:' + smoothedFramerate.toFixed(0);
                    debugText.innerHTML = message;

                    prevFrame = now;
                }
            }

            if (showDebugRenderables) {
                var debugRender = document.getElementById("debugRender");

                if (debugRender) {
                    var entityIds = [];

                    for (var k in renderer._renderables) {
                        if (renderer._renderables.hasOwnProperty(k)) {
                            entityIds.push(renderer._renderables[k].entityId);
                        }
                    }

                    entityIds.sort();
                    debugRender.innerHTML = entityIds.join(" <br/> ");
                }
            }
        }

        if (animating) {
            ++frameCount;
            requestAnimationFrame(updateFrame);
        }

    };

    var frameCount = 0;
    //Kick off render loop.
    requestAnimationFrame(updateFrame);

    self.dispose = function () {
        gestureHelper.disable();
        if (rootElement.parentNode) {
            rootElement.parentNode.removeChild(rootElement);
        }
        if (eventCapturingElement.parentNode) {
            eventCapturingElement.parentNode.removeChild(eventCapturingElement);
        }
        if(attributionControl) {
            attributionControl.dispose();
        }
        animating = false;
    };

    self.getOverlayElement = function () {
        return eventCapturingElement;
    };

    self.getHitTestInvisibleOverlayElement = function () {
        return rootElement;
    };

    self.getActiveCameraController = function () {
        return activeController;
    };

    self.focusKeyboardElement = function () {
        gestureHelper.focusKeyboardElement();
    };

    self.setViewportSize = function (width, height) {
        Utils.css(rootElement, { width: width + 'px', height: height + 'px' });
        Utils.css(eventCapturingElement, { width: width + 'px', height: height + 'px' });
        renderer.setViewportSize(width, height);
        camera.setViewport(new Viewport(width, height, camera.getViewport().getNearDistance(), camera.getViewport().getFarDistance()));

        if (activeController.setViewportSize) {
            activeController.setViewportSize(width, height);
        }

        if (attributionControl) {
            attributionControl.updatePosition();
        }
    };

    self.getViewportSize = function () {
        return new Vector2(camera.getViewport().getWidth(), camera.getViewport().getHeight());
    };

    self.getViewState = function() {
        return {
            verticalFov: camera.getVerticalFov(),
            position: camera.getPosition(),
            look: camera.getLook(),
            up: camera.getUp(),
            side: camera.getLook().cross(camera.getUp())
        };
    };

    self.setShowLowerFidelityWhileMoving = function (enabled) {
        showLowerFidelityWhileMoving = enabled;
    };

    self.projectOntoFaces = function (dimension, vector) {
        var results = [];
        self.doWorkPerFace(dimension, function (cam, faceName) {
            if (cam.getLook().dot(vector) <= 0) {
                return null;
            }

            //now project into 2d viewport space
            var projectedPoint = cam.projectTo2D(vector);

            //don't want to return a depth because it'll always be 1, so create a vector2 to return
            results.push({ face: faceName, point: new Vector2(projectedPoint.x, projectedPoint.y) });
        });

        return results;
    };

    self.doWorkPerFace = function (dimension, worker) {
        var cameraLookAndUps = [
            { look: new Vector3(0, 0, -1), up: new Vector3(0, 1, 0) },
            { look: new Vector3(0, 0, 1), up: new Vector3(0, 1, 0) },
            { look: new Vector3(0, -1, 0), up: new Vector3(0, 0, 1) },
            { look: new Vector3(0, 1, 0), up: new Vector3(0, 0, 1) },
            { look: new Vector3(-1, 0, 0), up: new Vector3(0, 1, 0) },
            { look: new Vector3(1, 0, 0), up: new Vector3(0, 1, 0) }
        ];
        var faceNames = [ "front", "back", "bottom", "top", "left", "right" ];

        var vp = new Viewport(Math.floor(dimension), Math.floor(dimension), near, far);
        var cam = new PerspectiveCamera();
        cam.setViewport(vp);

        cam.setPosition(new Vector3(0, 0, 0));
        cam.setVerticalFov(MathHelper.degreesToRadians(90));

        for (var i = 0; i < cameraLookAndUps.length; i++) {
            cam.setLook(cameraLookAndUps[i].look);
            cam.setUp(cameraLookAndUps[i].up);

            worker(cam, faceNames[i]);
        }
    };

    // Downloads all assets of the mediaType at the view setup as specified
    // by cameraParameters. Since runtime LOD calculations (computing the
    // average LODs for pano faces under perspective projection) can result
    // in more than one LOD levels, a set of multipliers can be specified
    // such that assets are fetched to cover the multiple runtime LODs.
    // A typical set of multipliers are [0.9, 1.2],
    // which correspond to 0.9x and 1.2x of viewport resolution, respectively
    self.downloadAll = function (mediaTypeName, multiplierArray, progressCallback, finishCallback, atLowLod) {
        hasBlockingDownload = true;

        var multipliers = multiplierArray || [1.0];

        var allTiles = {};

        for (var m=0; m<multipliers.length; m++) {
            var scale = Math.tan(MathHelper.degreesToRadians(90)/2) / Math.tan(camera.getVerticalFov()/2) * multipliers[m];
            var dimension = viewport.getHeight()*scale;

            self.doWorkPerFace(dimension, function (cam, faceName) {
                var visibleSet = { byId : {} };
                var tiles = self.mediaType[mediaTypeName].cull(scene.byType[mediaTypeName], cam, visibleSet, isCachedUrl, atLowLod, requiresTileOverlap);
                if (tiles.added.length) {
                    var newTiles = tiles.added;
                    
                    var i = 0;
                    while (i < newTiles.length) {
                        if (newTiles[i].face === faceName) {
                            i++;
                        }
                        else {
                            //TODO: these tiles shouldn't be here in the first place, but it's easier at this point to just remove them instead of 
                            newTiles.splice(i, 1);
                        }
                    }
                    
                    newTiles.sort( function(a, b) { return b.tileId.levelOfDetail - a.tileId.levelOfDetail } );
                    var lod = newTiles[0].tileId.levelOfDetail;
                    for (var i = 0; i < newTiles.length; i++) {
                        if (newTiles[i].tileId.levelOfDetail == lod) {
                            allTiles[newTiles[i].id] = newTiles[i];
                        }
                        else {
                            break;
                        }
                    }
                }
            });
        }

        blockingDownloadSuccessCount = blockingDownloadFailureCount = 0;
        downloader.customFailFunc = function (/*failCount, successCount*/) {
            blockingDownloadFailureCount++;
        };
        var count = 0;
        for(var i in allTiles) {
            downloader.downloadImage(allTiles[i].url, allTiles[i].priority, allTiles[i].id);
            count++;
        }
        blockingDownloadTargetCount = count;

        blockingDownloadProgressCallback = progressCallback;
        blockingDownloadFinishCallback = finishCallback;

        prefetchedTiles = allTiles;

        return count;
	};

    self.cancelDownloadAll = function() {
        for (var t in prefetchedTiles) {
            if (!isCachedUrl(prefetchedTiles[t].url)) {
                downloader.cancel(prefetchedTiles[t].url);
            }
        }
        self._resetDownloadAll();
    };

    self._resetDownloadAll = function() {
        blockingDownloadTargetCount = 0;
        blockingDownloadSuccessCount = blockingDownloadFailureCount = 0;
        hasBlockingDownload = false;
        downloader.customFailFunc = null;
        blockingDownloadProgressCallback = null;
        blockingDownloadFinishCallback = null;
    };
};
