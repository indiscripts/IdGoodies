/*******************************************************************************

		Name:           BookUpdateTOCs [1.0]
		Desc:           Update all Tables of Contents in the active Book.
		Path:           /full/BookUpdateTOCs.jsx
		Encoding:       ÛȚF8
		Compatibility:  InDesign CC/CS6/CS5/CS4 [Mac/Win]
		L10N:           ---
		Kind:           Script
		API:            ---
		DOM-access:     YES
		Todo:           ---
		Created:        220726 (YYMMDD)
		Modified:       220726 (YYMMDD)

*******************************************************************************/

	//==========================================================================
	// PURPOSE
	//==========================================================================
	
	/*

	You may find convenient to batch-update all TOCs present in a book, since
	InDesign doesn't seem to provide such feature. The present script inspects
	every chapter and runs the UpdateTableOfContents command if available.
	
	Note: chapters that aren't presently visible are temporarily opened, saved,
	and closed.
	
	Then the script displays a basic report at the end of the process.

	*/

	function updateBookTocs(  ret,msg,nme,mna,bk,ff,closeBook,K,a,i,j,pp,x,closeDoc,uri,doc,S,t)
	//----------------------------------
	// Update TOCs in Book.
	// => str[] | false
	{
		mna = app.menuActions.itemByName('$ID/UpdateTableOfContentsCmd');
		if( !mna.isValid ){ return ["Update TOC action unavailable."]; }

		// Some constants.
		// ---
		const BCS_USE = +BookContentStatus.DOCUMENT_IN_USE;
		const BCS_MISS = +BookContentStatus.MISSING_DOCUMENT;
		const BCS_OPEN = +BookContentStatus.DOCUMENT_IS_OPEN;
		const TOC_TYPE = +StoryTypes.TOC_STORY;
		const SAVE_YES = +SaveOptions.YES;

		// Open the target Book (if not already active.)
		// ---
		closeBook = 0;
		if( !(bk=app.properties.activeBook) )
		{
			ff = File.openDialog("Choose the BOOK File", "INDB:*.indb", false);
			if( !ff ) return false;
			ff = File(ff);
			if( !ff.exists ) return false;
			bk = app.open(ff);
			closeBook = 1;
		}

		// Loop in chapters.
		// ---
		ret = Array();
		a = bk.bookContents.everyItem().getElements();
		for( K=app.documents, i=a.length ; i-- ; (msg&&ret[ret.length]=msg), (closeDoc&&doc.close(SAVE_YES)) )
		{
			closeDoc = 0;
			msg = '';
			pp = a[i].properties;
			x = +pp.status;
			
			// Filter out missing/locked/error chapters.
			// ---
			if( (!x) || BCS_USE===x || BCS_MISS===x ) continue;
			ff = File(pp.fullName);
			if( !ff.exists ) continue;
			
			// Set the chapter as target document --> doc
			// ---
			if( BCS_OPEN===x )
			{
				uri = ff.absoluteURI;
				for( j=K.length ; j-- && uri !== (K[j].properties.fullName||0).absoluteURI ; );
				if( 0 > j ) continue;
				doc = K[j].getElements()[0];
			}
			else
			{
				doc = app.open(ff);
				closeDoc = 1;
			}
			
			// Is there a TOC story here?
			// ---
			nme = doc.properties.name;
			msg = "No TOC found in " + nme;
			S = doc.stories;
	 		for( t=S.everyItem().storyType, j=t.length ; j-- && TOC_TYPE !== +t[j] ; );
	 		if( 0 > j ) continue;
			if( !(t=S[j]).isValid ) continue;   // t :: Story
			t = (t.textContainers||0)[0]||0;    // t :: TextFrame | falsy
			if( !t.isValid ) continue;
			
			// Select the frame and invoke the menu action.
			// ---
			doc===app.properties.activeDocument || (app.activeDocument = doc);
			
			msg = "Couldn't update TOC in " + nme;
			try
			{
				app.select(t);
				if( mna.enabled )
				{
					mna.invoke();
					msg = "TOC updated in " + nme;
				}
			}
			catch(e){ msg = nme + ': ' + e }
		}
		
		// Terminate.
		// ---
		if( closeBook ) bk.close(SAVE_YES);
		return ret;
	};

	// Run me.
	// ---
	(function(  prf,bkp,r)
	{
		const UI_NEVER = +UserInteractionLevels.NEVER_INTERACT;

		prf = app.scriptPreferences;
		bkp = +prf.userInteractionLevel;
		prf.userInteractionLevel = UI_NEVER;
		
		r = updateBookTocs();

		prf.userInteractionLevel = bkp;

		if( bkp !== UI_NEVER && r && r.length )
		{
			alert( r.slice(0,25).join('\r') );
		}
	})();
