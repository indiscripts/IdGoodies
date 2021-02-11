/*******************************************************************************

		Name:           SelFlattenTransform [1.0]
		Desc:           Flatten the transformations of the selection.
		Path:           /snip/SelFlattenTransform.jsx
		Encoding:       ÛȚF8
		Compatibility:  InDesign (all versions) [Mac/Win]
		L10N:           ---
		Kind:           Function + Undoable Script
		API:            ---
		DOM-access:     YES
		Todo:           ---
		Created:        210211 (YYMMDD)
		Modified:       210211 (YYMMDD)

*******************************************************************************/

	//==========================================================================
	// PURPOSE
	//==========================================================================
	
	/*
	
	This snippet operates on the selection. It clears the transformation
	attributes of every SplineItem while keeping path points in place. At
	the end of the process the objects look the same but they no longer
	undergo any scaling/rotation/shear component.
	
	[REM] The present implementation does not scan inner items from groups,
	      MSOs, etc.
	
	*/

	;function flattenTransform(/*PageItem[]=auto*/sel,/*bool=0*/MUTE,  z,i,t,PS,eps,j)
	//----------------------------------
	{
		sel || (sel=app.properties.selection);
		if( (!sel) || !sel.length )
		{
			if( !MUTE ) alert("No selection.");
			return 0;
		}
		
		for( z=0, i=sel.length ; i-- ; )
		{
			if( !(t=sel[i]).hasOwnProperty('paths') ) continue;
			eps = (PS=t.paths).everyItem().entirePath;
			t.clearTransformations();
			for( j=eps.length ; j-- ; PS[j].entirePath=eps[j] );
			++z;
		}
		
		if( MUTE ) return z;
		switch( z )
		{
			case 0: alert("No path available."); break;
			case 1: break;
			default: alert(z + " items processed.");
		}
	}

	app.doScript(flattenTransform, void 0, void 0, UndoModes.ENTIRE_SCRIPT, "Flatten Transform");
