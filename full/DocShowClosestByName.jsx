/*******************************************************************************

		Name:           DocShowClosestByName [1.0]
		Desc:           Makes the 'closest' document active (w.r.t name.)
		Path:           /full/DocShowClosestByName.jsx
		Encoding:       ÛȚF8
		Compatibility:  InDesign CC/CS6/CS5 [Mac/Win]
		L10N:           ---
		Kind:           Script
		API:            ---
		DOM-access:     YES
		Todo:           ---
		Created:        220623 (YYMMDD)
		Modified:       220623 (YYMMDD)

*******************************************************************************/

	//==========================================================================
	// PURPOSE
	//==========================================================================
	
	/*

	Based on a discussion of the InDesign Scripting forum, "Javascript to find a
	similar filename among all open documents" (https://adobe.ly/3HJfSS9),
	this script automatically selects the document having the most similar
	filename based on the Levenshtein distance.
	
	A custom RegExp can be supplied to the showClosestDocByName function in
	order to filter out specific name parts that must be ignored anyway
	(typically, shared suffixes among your set of documents.)
	
	*/

	// ADJUST THIS REGEX TO YOUR NEEDS -- OR COMMENT THE LINE!
	// (It defines a shared suffix that will be ignored and fits
	// the particular example discussed in the InDesign forum.)
	// ---
	const MY_DROP_REGEX = /_spec-sheet-[a-z0-9]+_v\d+\.indd$/i;


	function dist(/*str*/a,/*str*/b,  x,y,t,p,Q,i,j,c,r,q)
	//----------------------------------
	// Measures the difference between two strings `a` and `b`
	// using the Levenshtein distance algorithm.
	// [REF] en.wikipedia.org/wiki/Levenshtein_distance
	// Implementation from IdExtenso:
	// github.com/indiscripts/IdExtenso/blob/master/core/Ext/$$.string.jsxinc
	// => uint
	{
		if( a === b ) return 0;
		x = a.length||0;
		y = b.length||0;
		if( !(x&&y) ) return x||y;

		while( a.charAt(--x)===b.charAt(--y) );                  // R-trim => (x,y)::maxIds
		(t=x) <= y || (x=y,y=t, t=a,a=b,b=t);                    // Symm.  => x <= y
		for( p=-1 ; ++p <= x && a.charAt(p)===b.charAt(p) ; );   // L-trim => p::startId
		if( p >= x ) return 1+y-p;

		// Loop.
		// ---
		for( Q=Array(1+x), j=p ; j <= y ; ++j )
		for( c=b.charAt(j), r=1+(t=j-p), i=p ; i <= x ; t=q, Q[i++]=r )
		{
			c!==a.charAt(i) && ++t;
			q = Q[i]||(Q[i]=1+i-p);
			r = (q=Q[i]) > r
				? ( t > r ? (1+r) : t)
				: ( t > q ? (1+q) : t);
		}
		return r;
	}

	function showClosestDocByName(/*?RegExp*/dropRegex,/*?Document*/doc,  re,ini,D,a,i,t)
	//----------------------------------
	// Makes active the 'closest' document based on Levenshtein
	// distance AND ignoring name part(s) captured by `dropRegex`.
	// - If set, `dropRegex` tells wich part of a doc name should
	//   be entirely ignored by the algo. Default is /\.indd$/i
	// - If supplied, `doc` is the input document. Default is the
	//   active one.
	// ---
	// => undef
	{
		const CHR = String.fromCharCode;

		// Checkpoint.
		// ---
		doc || doc=app.properties.activeDocument;
		if( !doc ){ alert("No document available."); return; }
		
		re = 'function'==typeof dropRegex && 'RegExp'==dropRegex.__class__
		? dropRegex
		: /\.indd$/i;

		// Create a reference key for the input doc name.
		// ---
		i = doc.properties.index; // 0 if active
		ini = CHR(i) + doc.properties.name.replace(re,'');
		
		// Get a reference keys for all available documents.
		// ---
		D = app.documents;
		a = D.length && D.everyItem().name;
		if( 2 > (0|a.length) ) return;
		for( i=a.length ; i-- ; a[i]=CHR(i)+a[i].replace(re,'') );

		// Sort the keys relative to `ini`, based on `dist()`.
		// ---
		a.sort( function(x,y){ return dist(ini,x)-dist(ini,y)} );

		// [REM] a[0] is ini ; the closest key is a[1].
		// ---
		t = D[a[1].charCodeAt(0)];
		if( !t.visible )
		{
			alert("The closest document is " + t.name + " but it is not visible.");
		}
		else
		{
			app.activeDocument = t;
		}
	}

	showClosestDocByName(MY_DROP_REGEX);
