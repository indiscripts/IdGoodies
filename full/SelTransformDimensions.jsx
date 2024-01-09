/*******************************************************************************

		Name:           SelTransformDimensions (1.1)
		Desc:           Displays the dimensions of the selection as in the Transform panel.
		Path:           /full/SelTransformDimensions.jsx
		Encoding:       ÛȚF8
		Compatibility:  InDesign (all versions) [Mac/Win]
		L10N:           ---
		Kind:           Script
		API:            ---
		DOM-access:     YES
		Todo:           ---
		Created:        240108 (YYMMDD)
		Modified:       240109 (YYMMDD)

*******************************************************************************/

	//==========================================================================
	// PURPOSE
	//==========================================================================
	
	/*
	
	Given a *single* selected object (frame, group, image, etc), the Transform
	panel displays its Width (W) and Height (H) with respect to its current
	transform state, using user's ruler units and taking into account the pre-
	ference `Dimensions Include Stroke Weight`.
	
	Those W and H attributes are not available in the DOM but can be computed.
	The present script determines and shows them.
	
	[REM] Idea taken from the discussion "Transform properties width"
	-> community.adobe.com/t5/indesign-discussions/transform-properties-width/td-p/14333981

	[REF] Coordinate Spaces & Trasnformations in InDesign
	-> indiscripts.com/tag/CST

	*/

	;(function selTransformDimensions(  sel,VP,BBL,CS_IN,CS_PB,tl,br,mx,rw,rh,wu,hu,a)
	//----------------------------------
	// Display the dimensions of the selection (W,H) as shown in the Transform panel.
	// (If multiple objects are selected, the 1st one is considered.)
	// [FIX240109] Now supporting Shear X angle.
	{
		const PRECISION = 1e4;

		sel = (app.selection||0)[0]||0;
		if( !sel.hasOwnProperty('resolve') ) return;

		VP = app.properties.activeDocument.viewPreferences;

		// Boring enums.
		BBL = +BoundingBoxLimits
		[
			app.transformPreferences.dimensionsIncludeStrokeWeight
			? 'OUTER_STROKE_BOUNDS'
			: 'GEOMETRIC_PATH_BOUNDS'
		];
		CS_IN = +CoordinateSpaces.innerCoordinates;
		CS_PB = +CoordinateSpaces.pasteboardCoordinates;

		// Inner bounding box corners -> inner dims (in pt)
		tl = sel.resolve([ [0,0], BBL, CS_IN ], CS_IN)[0];
		br = sel.resolve([ [1,1], BBL, CS_IN ], CS_IN)[0];
		w = br[0] - tl[0];
		h = br[1] - tl[1];

		// Apply the scale factors (relative to PB).
		mx = sel.transformValuesOf(CS_PB)[0];
		w *= mx.horizontalScaleFactor;
		h *= mx.verticalScaleFactor;
		
		// [FIX240109] Apply the shear X angle (relative to PB).
		(a=mx.clockwiseShearAngle) && (h/=Math.cos(a*Math.PI/180));

		// Use horiz./vert. ruler units (instead of pt)
		tl = sel.resolve( [[0,0],0], CS_PB, true)[0];
		br = sel.resolve( [[1,1],0], CS_PB, true)[0];
		rw = br[0]-tl[0];
		rh = br[1]-tl[1];

		// Final message.
		wu = 'W: ' + Math.round((PRECISION*w)/rw)/PRECISION
			  + ' ' + VP.horizontalMeasurementUnits.toString();
		hu = 'H: ' + Math.round((PRECISION*h)/rh)/PRECISION
			  + ' ' + VP.verticalMeasurementUnits.toString();
		alert( [wu,hu].join('\r') );

	})();
