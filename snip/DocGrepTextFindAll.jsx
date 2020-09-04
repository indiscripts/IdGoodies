/*******************************************************************************

		Name:           DocGrepTextFindAll [1.1]
		Desc:           Show all Grep/Text found items in a temp file.
		Path:           /snip/DocGrepTextFindAll.jsx
		Encoding:       ÛȚF8
		Compatibility:  InDesign (all versions) [Mac/Win]
		L10N:           ---
		Kind:           Function
		API:            showFindAll()
		DOM-access:     YES
		Todo:           ---
		Created:        200828 (YYMMDD)
		Modified:       200904 (YYMMDD)

*******************************************************************************/

	//==========================================================================
	// PURPOSE
	//==========================================================================
	
	/*

	Based on a suggestion from @leo_narre, this function lists all text items
	found by the active GREP query (or TEXT query if no GREP available.)
	Results are saved in a UTF8-encoded file (typically `findGrep.txt`) then
	shown to the user. The function itself returns true if all went fine.
	
	Tip: Assign the `showFindAll();` script a kb shortcut, e.g Cmd+Alt+F,
	     going into Edit > Keyboard Shortcuts...

	Sample codes:

	      // 1. Show items found in the active document.
	      showFindAll();

	      // 2. Supplying a particular document and the output file.
	      showFindAll( myDocument, File("path/to/results.txt") );

	[REF]
	Discussion: twitter.com/leo_narre/status/1299277914744201216
	Draft:      gist.github.com/indiscripts/7f6669c291451cc833041afb38fd4a0c

	*/

	;const showFindAll = function showFindAll(/*Document=active*/doc,/*File=auto*/ff,  q,k,w,a,i)
	//----------------------------------
	// Run the current findGrep (or findText) query on a document,
	// and show the results (found text contents) in a `txt` file.
	// [REM] GREP search is processed by default, as long as a GREP query is available;
	// TEXT search is processed otherwise. If no query is available at all, or if
	// anything goes wrong, the function prompts an error message and returns false.
	// ---
	// `doc` :: [opt.] A Document instance. By default, take the active document.
	// `ff`  :: [opt.] Output File. By default, create a txt file in the temp folder.
	// ---
	// => true [OK]  |  false [KO]
	{
		doc || (doc=app.properties.activeDocument);
		if( (!doc) || !doc.isValid || !(doc instanceof Document) ){ alert("No document."); return false; }
		
		// Is there a findGrep or findText query?
		// k :: 'findGrep' | 'findText' | 0
		// ---
		('string'==typeof(q=app[(k='findGrep')+'Preferences'].findWhat) && q.length)
		||  ('string'==typeof(q=app[(k='findText')+'Preferences'].findWhat) && q.length)
		||  (k=0);
		if( !k ){ alert("Neither findGrep nor findText query is defined."); return false; }

		// Prepare the output file.
		// ---
		(ff && (ff instanceof File)) || (ff=File(Folder.temp + '/' + k + '.txt'));
		const NL = 'W'==ff.lineFeed[0] ? '\r\n' : '\n';

		// Basic running bar. (Because DOM processing can be time consuming.)
		// ---
		w = new Window('palette', k.charAt(0).toUpperCase()+k.slice(1));
		w.margins = 25;
		(w.add('staticText',void 0,"Running " + k + "...")).preferredSize=[250,22];
		w.show();
		w.update();

		// Run the find query at the document level.
		// ---
		try{ a=0; a=doc[k]()||0; } catch(_){}
		if( !(i=a.length) ){ w.hide(); alert("No result."); return false; }

		// Grab text contents.
		// ---
		w.children[0].text = "Processing " + i + " found items...";
		for( ; i-- ; a[i]=a[i].contents );

		// Results -> file.
		// ---
		w.children[0].text = "Writing the results in a file...";
		if( ff.open('w') )
		{
			ff.encoding='UTF8';
			q = $.global.localize("# %1: `%2` (%3 result%4.)"
				, k
				, q
				, a.length
				, 1 < a.length ? 's' : ''
				);
			ff.write(q + NL+NL + a.join(NL));
			ff.close();
		}
		else
		{
			w.hide();
			alert("Cannot open/create the file " + ff);
			return false;
		}

		// Show the results.
		// ---
		w.hide();
		ff.execute();
		return true;
	};
