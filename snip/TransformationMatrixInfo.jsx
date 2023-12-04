/*******************************************************************************

		Name:           TransformationMatrixInfo [1.0]
		Desc:           Display clean attributes of a TransformationMatrix
		Path:           /snip/TransformationMatrixInfo.jsx
		Encoding:       ÛȚF8
		Compatibility:  InDesign (all versions) [Mac/Win]
		L10N:           ---
		Kind:           Method (extends TransformationMatrix.prototype)
		API:            TransformationMatrix.prototype.info()
		DOM-access:     TransformationMatrix
		Todo:           ---
		Created:        231203 (YYMMDD)
		Modified:       231204 (YYMMDD)

*******************************************************************************/

	//==========================================================================
	// PURPOSE
	//==========================================================================
	
	/*
	
	This snippet adds a `info` method to TransformationMatrix instances. Calling
	myMatrix.info("Some title") prompts useful data about the matrix, e.g

	      Matrix
	      ≈ [ 0.97 | -0.26 | 0.26 | 0.97 ] + [ 33.85 | 51.94 ]

	      (Sx,Sy) ≈ 1.00 | 1.00
	      (H) ≈ 0.00 CW
	      (R) ≈ 15.00 CCW
	      (Tx,Ty) ≈ 33.85 | 51.94

	[REM] The '≈' symbol indicates that values are rounded for readability.

	Sample code:

	      // Show the transform matrix of the selection
	      // relative to the parent spread.
	      // ---
	      var myObj = app.selection[0]; // asumming a PageItem is selected
	      var mx = myObj.transformValuesOf(CoordinateSpaces.spreadCoordinates)[0];
	      mx.info("Spread Matrix of " + myObj);

	[RES] See also: https://indiscripts.com/tag/CST

	*/

	;TransformationMatrix.prototype.info = function(/*?str*/title,  pp,mx,sx,sy,rot,shr,tx,ty,i)
	//----------------------------------
	// Call `alert(...)` with a human-readable message reporting matrix attributes,
	// all rounded to 2 decimal digits.
	//    ==================================
	//    Matrix
	//    ≈ [ a | b | c | d ] + [ tx | ty ]   ; all six components in matrixValues order
	//    
	//    (Sx,Sy) ≈ <sx>, <sy>                ; scaling factors
	//    (H) ≈ <shear> CW                    ; shear angle (clockwise)
	//    (R) ≈ <rot> CCW                     ; rotation angle (counterclockwise)
	//    (Tx,Ty) ≈ <tx> | <ty>               ; translation attributes
	//    ==================================
	// If supplied, the `title` argument is used as alert's 2nd arg.
	// ---
	// => undef
	{
		const MR = Math.round;
		const DG = 2; // Rounding parameter (decimal digits)
		const EP = Math.pow(10,DG);

		pp = this.properties;
		mx = pp.matrixValues;
		for( i=mx.length ; i-- ; mx[i]=(MR(EP*mx[i])/EP).toFixed(DG) );

		sx = (MR(EP*pp.horizontalScaleFactor)/EP).toFixed(DG);
		sy = (MR(EP*pp.verticalScaleFactor)/EP).toFixed(DG);

		tx = mx[4];
		ty = mx[5];

		rot = (MR(EP*pp.counterclockwiseRotationAngle)/EP).toFixed(DG);
		shr = (MR(EP*pp.clockwiseShearAngle)/EP).toFixed(DG);

		alert(
		[
			'Matrix\r\u2248 [ ' + mx.slice(0,4).join(' | ') + ' ] + [ ' +mx.slice(4,6).join(' | ') + ' ]\r'
			,
			'(Sx,Sy) \u2248 ' + [sx,sy].join(' | ')
			,
			'(H) \u2248 ' + shr + ' CW'
			,
			'(R) \u2248 ' + rot + ' CCW'
			,
			'(Tx,Ty) \u2248 ' + [tx,ty].join(' | ')
		].join('\r'), title||void 0);
	};
