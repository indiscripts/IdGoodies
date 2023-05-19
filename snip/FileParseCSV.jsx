/*******************************************************************************

		Name:           FileParseCSV [draft]
		Desc:           Parse a CSV file or stream.
		Path:           /snip/FileParseCSV.jsx
		Encoding:       ÛȚF8
		Compatibility:  ExtendScript (all versions) [Mac/Win]
		L10N:           ---
		Kind:           Function
		API:            ---
		DOM-access:     NO
		Todo:           ---
		Created:        230519 (YYMMDD)
		Modified:       230519 (YYMMDD)

*******************************************************************************/

	//==========================================================================
	// PURPOSE
	//==========================================================================
	
	/*
	
	A simple CSV parser. Supports comma-separated data of various forms including
	items enclosed in double quotes, e.g "xxx, yyy". Escape sequences like `""`,
	`\"`, etc, are parsed as well.
	
	Example with three columns:

	    itemA1,itemB1,itemC1
	    itemA2,,itemC2
	    "itemA3,etc","item""B3","item\"C3"
	    "item,A4","item\,B4",itemC4
	
	The function `parseCSV` takes a File (or the full CSV content as a string)
	and returns an array of rows. By default, each row is an array of strings,
	e.g `["itemA1", "itemB1", "itemC1"]`. Set the `header` argument to TRUE to
	get every row parsed as an object (based on the labels of the first row).
	
	Sample code:
	
	    var uri = "C:/Documents/test.csv";
	    var data = parseCSV( new File(uri) );
	    alert( data.join('\r') );

	[REF] community.adobe.com/t5/indesign/
	      what-s-the-least-inelegant-way-to-ingest-csv-w-js/td-p/13799042

	*/

	;function parseCSV(/*str|File*/input,/*bool=0*/header,  r,i,s,a,m,n,o,j)
	//----------------------------------
	// Pass in a string or a `File(path/to/file.csv)` argument.
	// If `header` is truthy, parses the 1st line as providing field names
	// and returns an array of objects {<name1>:<val1>, <name2>:<val2>, ...}
	// Otherwise, returns an array of arrays. If no data can be found,
	// returns an empty array.
	// => str[][]  |  obj[]
	{
		// Input.
		if( !input ) return [];
		if( input instanceof File )
		{
			if( !(input.exists && input.length) ) return [];
			input = input.open('r','UTF8') && [input.read(),input.close()][0];
		}
		if( !('string' == typeof input && input.length) ) return [];

		// Get lines.
		r = input.split(/(?:\r\n|\r|\n)/g);

		// Get fields.
		const reFld = /(,|^)(?:"((?:\\.|""|[^\\"])*)"|([^,"]*))/g;  // $1 :: `,`|undef  ;  $2 :: `<in-quotes>`|undef  ;  $3 :: `<simple>`|undef
		const reEsc = /[\\"](.)/g;                                  // $1 :: `<esc>`
		for( i=r.length ; i-- ; a.length ? (r[i]=a) : r.splice(i,1) )
		{
			s = r[i];
			if( -1 == s.indexOf('"') )
			{
				a = s.length ? s.split(',') : [];
				continue;
			}

			for
			(
				a = 0x2C==s.charCodeAt(0) ? [""] : [] ;
				m=reFld.exec(s) ;
				a[a.length] = 'undefined' != typeof m[2] ? m[2].replace(reEsc,'$1') : m[3]
			);
		}
		if( !header ) return r;

		// Header -> convert rows to objects.
		m = r.shift();
		n = m.length;
		for( i=-1 ; ++i < r.length ; r[i]=o )
		for( o={}, a=r[i], j=-1 ; ++j < n ; o[m[j]]=a[j]||'' );
		return r;
	}
