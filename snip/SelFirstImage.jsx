/*******************************************************************************

		Name:           SelFirstImage [1.0]
		Desc:           Select and return the (top+left)most image container on a page.
		Path:           /snip/SelFirstImage.jsx
		Encoding:       ÛȚF8
		Compatibility:  InDesign (all versions) [Mac/Win]
		L10N:           ---
		Kind:           Function
		API:            ---
		DOM-access:     YES
		Todo:           ---
		Created:        210618 (YYMMDD)
		Modified:       210618 (YYMMDD)

*******************************************************************************/

	//==========================================================================
	// PURPOSE
	//==========================================================================
	
	/*
	
	Given a target page (and optionally a target layer) this snippet identifies
	and returns the 'top-left-most' SplineItem containing a Graphic object.
	By 'top-left-most', we mean the object whose (top+left) coordinate is minimal.
	On average, this determines what the user perceives as the 'first' geometric
	container of the page.
	
	[REF] community.adobe.com/
	      t5/indesign/script-how-to-select-most-top-left-object/td-p/12116280

	*/

	;function selFirstImage(/*?Layer|str*/ly,/*?Document*/doc,/*?Page*/pg,  t,a,b,c,i,iBest,xyMin)
	//----------------------------------
	// Select and return the (top+left)most image container on a page.
	// `ly`   : Target layer or layer name (opt.)
	// `doc`  : Target document (default=active.)
	// `pg`   : Target page (default=active.)
	// ---
	// E.g.   `selectFirstImage('Layer 1');`
	//        `selectFirstImage('Layer 1', myDoc, myDoc.pages[123]);`
	// ---
	// => SplineItem [OK]  |  false [KO]
	{
		// Checkpoint -> doc, pg
		// ---
		doc || (doc=app.properties.activeDocument||0);
		if( !doc.isValid || 'Document' != doc.constructor.name ) return false;
		
		pg || ((pg=app.properties.activeWindow)&&(pg=pg.properties.activePage)) || (pg=doc.pages[0]);
		if( !pg.isValid || 'Page' != pg.constructor.name ) return false;
		
		// Layer filter (optional.)
		// ---
		'string'==typeof ly && ly.length && (ly=doc.layers.itemByName(ly));
		( ly && 'Layer'==ly.constructor.name && ly.isValid ) || (ly=void 0);
		
		// Browse the SplineItems collection.
		// ---
		t = pg.splineItems.everyItem();
		if( !t.isValid ) return false;
		a = t.getElements();
		b = ly ? t.itemLayer : [];
		
		// Identify the object having the minimal (x+y) sum.
		// ---
		for
		(
			i=a.length, iBest=false, xyMin=1/0 ;
			i-- ;
			ly===b[i] && (t=a[i]).graphics.length && (t=t.geometricBounds)
			&& xyMin > (t=t[0]+t[1]) && (xyMin=t, iBest=i)
		);
		
		return false !== iBest && (app.select(t=a[iBest]), t);
	}
