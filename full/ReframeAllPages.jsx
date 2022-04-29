/*******************************************************************************

		Name:           ReframeAllPages [1.0]
		Desc:           Reframe the pages of the active document w.r.t item bounds
		Path:           /full/ReframeAllPages.jsx
		Encoding:       ÛȚF8
		Compatibility:  InDesign CC/CS6/CS5 [Mac/Win]
		L10N:           ---
		Kind:           Script
		API:            ---
		DOM-access:     YES
		Todo:           ---
		Created:        220429 (YYMMDD)
		Modified:       220429 (YYMMDD)

*******************************************************************************/

	//==========================================================================
	// PURPOSE
	//==========================================================================
	
	/*

	Considering the active document, this script scans the page items of each
	page, determines the overall bounding box and 'reframe' the page so it
	exactly fits the area. Page margins are reset to zero too.
	
	The script is undo-able and displays a short report.

	*/

	function reframePages(  doc,CS_IN,MG,GB,errs,pages,pg,K,a,gb,t)
	//----------------------------------
	// Reframe all pages w.r.t. page items bounds.
	{
		// Checkpoint.
		// ---
		if( !(doc=app.properties.activeDocument) )
		{
			alert( "Open a document." );
			return;
		}

		// Set up the document metrics.
		// ---
		app.scriptPreferences.measurementUnit = MeasurementUnits.POINTS;
		doc.zeroPoint = [0,0];
		doc.viewPreferences.rulerOrigin = RulerOrigin.PAGE_ORIGIN;

		// Misc.
		// ---
		CS_IN = +CoordinateSpaces.INNER_COORDINATES;
		MG = { top:0, left:0, bottom:0, right:0 };
		GB = Array(4);
		errs = [];

		// Loop.
		// ---
		pages = doc.pages.everyItem().getElements().slice();
		for each( pg in pages )
		{
			K = pg.pageItems;
			if( !K.length ) continue; // Empty page -> noop
			
			// Calculate the overall [T,L,B,R] thru min/max.
			// ---
			GB[0]=GB[1]=1/0 ; GB[2]=GB[3]=-1/0;
			a = K.everyItem().geometricBounds.slice();
			for each( gb in a )
			{
				(t=gb[0]) < GB[0] && (GB[0]=t);
				(t=gb[1]) < GB[1] && (GB[1]=t);
				(t=gb[2]) > GB[2] && (GB[2]=t);
				(t=gb[3]) > GB[3] && (GB[3]=t);
			}
			
			// Reframe the page.
			// ---
			pg.marginPreferences.properties = MG;
			t = [ [GB[1],GB[0]], [GB[3],GB[2]] ];
			try
			{
				pg.reframe(CS_IN, t);
			}
			catch(e)
			{
				errs.push("[" + pg.name + "] " + e);
			}
		}
		
		// Report.
		// ---
		if( errs.length )
		{
			alert( "Couldn't reframe the following page(s):\r\r"
			+ errs.slice(0,20).join('\r') );
		}
		else
		{
			alert( pages.length + " pages were reframed." );
		}
	};

	app.doScript
	(
		reframePages,
		void 0,
		void 0,
		+UndoModes.ENTIRE_SCRIPT,
		'Reframe Pages',
	);
