/*******************************************************************************

		Name:           SelPlacePDFPage (1.0)
		Desc:           Simple interface for changing placed PDF page.
		Path:           /full/SelPlacePDFPage.jsx
		Encoding:       ÛȚF8
		Compatibility:  InDesign (all versions) [Mac/Win]
		L10N:           ---
		Kind:           Script
		API:            ---
		DOM-access:     YES
		Todo:           ---
		Created:        230116 (YYMMDD)
		Modified:       230122 (YYMMDD)

*******************************************************************************/

	//==========================================================================
	// PURPOSE
	//==========================================================================
	
	/*
	
	Need to easily change the page of a placed PDF?
	Just select the graphic container and run this script.
	Source: https://adobe.ly/3HoxrZ2

	*/

	;(function selPlacePDFPage(  dt,doc,sel,t,ok,ff)
	//----------------------------------
	// Simple interface for changing page in placed PDF.
	// (Just select the PDF container and run.)
	{
		dt = +new Date;
		try
		{
			doc = app.properties.activeDocument;
			if( !doc ) throw "No active document.";

			sel = doc.properties.selection;
			if( !(sel && sel.length) ) throw "No selection.";
			if( !(sel=sel[0]).isValid ) throw "Invalid selection.";

			for( t=sel ; 'PDF' != t.constructor.name ; t=t[0] )
			{
				ok = t.hasOwnProperty('contentType')
				&& ContentType.graphicType == t.properties.contentType
				&& 1 == (t=t.properties.allGraphics||[]).length;
				if( !ok ) throw "The selection has no direct PDF content.";
			}
			
			ff = (t=t.properties.itemLink||0).isValid && (t.properties.filePath||0);
			if( !(ff && File(ff).exists) ) throw "PDF File is missing. You probably should relink.";

			// Runtime error if canceled by the user (hence the `dt` timer.)
			// ---
			sel.place(ff, true);
			
			alert( "PDF page sucessfully placed!" );
		}
		catch( e )
		{
			dt = +new Date - dt;        // full delay, in ms.
			if( 500 > dt ) alert( e );  // Only display instant error.
		}
	});

