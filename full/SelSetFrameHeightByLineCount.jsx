/*******************************************************************************

		Name:           SelSetFrameHeightByLineCount (1.2)
		Desc:           Change frame(s) height to match some line count.
		Path:           /full/SelSetFrameHeightByLineCount.jsx
		Encoding:       ÛȚF8
		Compatibility:  InDesign CC/CS6 [Mac/Win]
		L10N:           ---
		Kind:           Script
		API:            ---
		DOM-access:     YES
		Todo:           Test clinical cases (infinite loop?)
		Created:        250216 (YYMMDD)
		Modified:       250217 (YYMMDD)

*******************************************************************************/

	//==========================================================================
	// PURPOSE
	//==========================================================================
	
	/*
	
	1. DESCRIPTION
	____________________________________________________________________________
	
	Instead of resizing a text frame to a certain defined height, you may need
	to specify a *number of lines*, e.g. “All frames in the selection should
	have 25 lines available”, whatever the particular text, text size, leading,
	paragraph spacing, inset... they undergo.”
	
	By ‘available lines’, we mean the number of lines the text frame actually
	displays or would display if it were full, regardless of whether it is
	empty, partially filled, threaded or overloaded (overset text). In some
	ways, this number of available lines indirectly specifies a height.
	
	The present script offers you a tool to resize the height of one or more
	text frames in this way. A prompt box allows you to enter the “Desired
	Line Count” from 1 to 80.
	
	Changes are undo-able (Cmd Z).

	2. LIMITATIONS & TECH NOTES
	____________________________________________________________________________

	- This program will SKIP *multicolumn* and/or *autosizing* text frames.

	- When a frame is resized, the transformation is processed w.r.t its
	  top edge. You can change the AP_TOP anchor point to get a different
	  behaviour (bottom or center origin.)
	
	- The maximum Line Count (80) can be easily increased or reduced.

	[REM] Idea taken from the discussion "How to resize a text frame to
	a given value" -> community.adobe.com/t5/indesign-discussions/
	how-to-resize-a-text-frame-to-a-given-value/td-p/15155617

	*/

	;(function setFrameHeightByLineCount(  ask,NL,tf,dup,sto,mul,a,i,t,n,k,L)
	//--------------------------------------------------------------------
	// Select one or more textframes (or have the insertion pt in a frame),
	// enter the desired line number when prompted.
	{
		const UID_ENV = 'SetFrameHeightByLineCount';
		const LN_MIN  = 1;
		const LN_MAX  = 80;
		// ---
		const SZOF    = +AutoSizingTypeEnum.OFF;
		const FITC    = +FitOptions.FRAME_TO_CONTENT;
		// ---
		const CS_IN   = +CoordinateSpaces.INNER_COORDINATES;
		const AP_TOP  = +AnchorPoint.TOP_CENTER_ANCHOR;
		const RM_MUL  = +ResizeMethods.MULTIPLYING_CURRENT_DIMENSIONS_BY;
		// ---
		const WARN    = '\u26A0';
		const __      = $.global.localize;

		a = app.properties.selection||0;
		if( !a )
		{
			alert("No selection.")
			return;
		}

		// Inner text -> parent frame.
		1==a.length
		&& (t=a[0]).hasOwnProperty('horizontalOffset')
		&& (a=t.parentTextFrames||[]);

		// Preparatory loop: compute mult factors.
		// ---
		ask = __("Desired Line Count?\r(%1 to %2)", LN_MIN, LN_MAX);
		for( NL=1/0, i=a.length ; i-- ; 1==mult ? a.splice(i,1) : a[i]=[a[i],mult] )
		{
			tf = a[i];
			mult = 1;

			if( !(tf||0).isValid ) continue;
			if( tf.constructor.name.slice(-9) != 'TextFrame' ) continue;
			t = tf.textFramePreferences.properties;
			if( +t.autoSizingType != SZOF ) continue;
			if( t.textColumnCount != 1 ) continue;

			while( ask )
			{
				// [REM] Values managed through $.setenv/getenv are
				// session persistent, even in the 'main' engine.
				t = $.getenv(UID_ENV) || String(tf.lines.length);
				NL = prompt(ask, t, "Set Height by Line Count");

				if( null===NL ) return;
				NL = parseInt(NL, 10);

				isFinite(NL) && NL >= LN_MIN && NL <= LN_MAX
				? ( ask=false, $.setenv(UID_ENV,String(NL)) )
 				: ( -1==ask.indexOf(WARN) && ask=ask.split('\r').join('\r'+WARN+' ') );
			}

			(dup = tf.duplicate()).properties = { ignoreWrap:true };

			// Make sure we have enough 'potential' lines in the story.
			sto = dup.parentStory;
			t = Array(2+NL).join('\r.');
			do{ sto.texts[0].contents += t; } while( !sto.overflows );

			for
			(
				t=-1, L=dup.lines ;
				t != (n=L.length) && NL != n ;
				dup.resize( CS_IN, AP_TOP, RM_MUL, [1,k=(NL/(t=n))] ),
				mult *= k
			);

			dup.remove();
		}
		
		if( !a.length )
		{
			alert( "No change done." );
			return;
		}

		// Makes hot process undoable.
		// ---
		app.doScript
		(
			function(){ while(t=a.pop())(tf=t[0]).isValid&&tf.resize(CS_IN,AP_TOP,RM_MUL,[1,t[1]]) },
			void 0, void 0, UndoModes.ENTIRE_SCRIPT, 'Set Frame Height'
		);

	})();

