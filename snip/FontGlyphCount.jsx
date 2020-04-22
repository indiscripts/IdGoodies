/*******************************************************************************

		Name:           FontGlyphCount [1.0]
		Desc:           Fast Glyph Counter for InDesign Font
		Path:           /snip/FontGlyphCount.jsx
		Require:        ---
		Encoding:       ÛȚF8
		Core:           YES
		Kind:           Method (extends Font.prototype)
		API:            Font.prototype.glyphCount()
		DOM-access:     Font
		Todo:           ---
		Created:        200421 (YYMMDD)
		Modified:       200422 (YYMMDD)

*******************************************************************************/

	//==========================================================================
	// PURPOSE
	//==========================================================================
	
	/*
	
	This snippet adds a `glyphCount` method to Font instances. You can use it
	in scripts that need to know how many glyphs are available in a font, in
	particular those which handle GID. (Plural specifier are supported.)
	
	Sample codes:

	      // 1. Get the max glyphID in a font.
	      var n = myText.appliedFont.glyphCount();
	      alert( "Highest GlyphID: " + (n-1) );

	      // 2. Running on a plural spec.
	      // ---
	      alert( app.fonts.itemByRange(200,300).glyphCount() );

	*/

	;Font.prototype.glyphCount = function glyphCount(  a,B,K,i,n,t,p,x,s)
	//----------------------------------
	// Return the number of glyphs contained in this Font. If the
	// underlying file cannot be parsed, return 0. This method
	// support plural specifiers: in such case an array is returned,
	// possibly with zero value(s) whenever the process fails.
	// Each returned count is a uint16: 0 <= N <= 65535. (If N!=0,
	// the highest GID is very likely N-1.)
	// ---
	// => uint | uint[] | 0
	{
		if( !this.isValid ) return 0;
		
		// Plural specifier support.
		// ---
		a = 1 < (a=this.getElements()).length
		? this.location
		: [a[0].properties.location];

		if( !(i=a.length) ) return 0;
		for( B=0xFF, K='charCodeAt' ; i-- ; a[i]=n )
		{
			// Get the font file as a binary stream (str).
			// ---
			n = 'string' == typeof(t=a[i]) && (t=File(t)).exists
				&& (t.encoding='BINARY') && t.open('r')
				&& (t=[t.read(),t.close()][0]).length;
			if( !(n>>>=0) ) continue;

			// Raw parser: locate the `maxp` table and read numGlyph.
			// ---
			for( p=-1 ; 0 <= (p=t.indexOf('maxp',1+p)) ; )
			{
				x = ((B&t[K](8+p))<<24) | ((B&t[K](9+p))<<16)
				  | ((B&t[K](10+p))<<8) | (B&t[K](11+p));
				if( 6+(x>>>=0) > n ){ p=-1; break; }
				
				s = t.slice(x,4+x);
				if( '\0\0\x50\0' != s && '\0\x01\0\0' !=s ) continue;
				n = ((B&t[K](4+x))<<8) | (B&t[K](5+x));
				break;
			}
			0 > p && (n=0);
		}

		return 1 < a.length ? a : a[0];
	};

