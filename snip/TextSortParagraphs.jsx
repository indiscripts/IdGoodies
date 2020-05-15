/*******************************************************************************

		Name:           TextSortParagraphs [1.0]
		Desc:           Fast sort of InDesign paragraphs.
		Path:           /snip/TextSortParagraphs.jsx
		Encoding:       ÛȚF8
		Compatibility:  InDesign (all versions) [Mac/Win]
		L10N:           ---
		Kind:           Function
		API:            sortParagraphs()
		DOM-access:     YES
		Todo:           ---
		Created:        200515 (YYMMDD)
		Modified:       200515 (YYMMDD)

*******************************************************************************/

	//==========================================================================
	// PURPOSE
	//==========================================================================
	
	/*
	
	This snippet re-orders a range of paragraphs according to a sort function.
	By default `Array.prototype.sort` is applied to the contents, but the client
	code can supply a custom function as 2nd argument.
	
	In InDesign, sorting and reordering text elements is a complex task, as this
	involves time-consuming DOM commands and must be done with respect to the
	particular character styles and text attributes that the range may contain.
	Usually, it is not possible to sort the strings in JS and then simply re-
	assign the paragraphs: all text attributes would be puzzled.
	
	The present implementation provides a mechanism that actually reorders the
	paragraphs once sorted and preserves individual character attributes. This
	is done by 'moving' text ranges at the DOM level (no extra text container is
	created during the process.) The algorithm has been optimized to reduce the
	necessay moves to the strict minimum, so this function should run fast on
	average cases.
	
	Sample codes:

	      // 1. Sort the paragraphs of the selection.
	      sortParagraphs(app.selection[0]);

	      // 2. Sort an entire story.
	      // ---
	      sortParagraphs(myStory);

	*/

	;const sortParagraphs = function sortParagraphs(/*Text|TextContainer*/input,/*fct=auto*/sortFunc,  F,T,A,pev,c,host,n,X,Z,order,i,a,k,x,dx,xi,t,j)
	//----------------------------------
	// `input` :: a Text object -- for example a Paragraphs.itemByRange(...) specifier -- or a text container
	//            (Story, TextFrame, Cell...) In case a TextFrame is supplied, the whole parent story is
	//            targeted. If the input Text is a partial range, only the containing paragraphs are treated.
	// `sortFunc` :: [opt.] Custom function taking an array of strings and returning that very array sorted.
	//            If not supplied, strigns are sorted based on toLowerCase() and Array.sort().
	//            WARNING: if you supply a custom sort function, make sure it doesn't alter the strings
	//            passed through the array (sortParagraphs adds a special suffix for indexing purpose.)
	// [REM] At most 65,535 paragraphs can be treated by this function.
	// ---
	// => undef
	{
		// Checkpoints.
		// ---
		if( 'function' != typeof(F=callee.RUN) ) throw "The RUN routine is missing."
		const CHR = String.fromCharCode;
		const MTH = 'function' == typeof sortFunc ? 'toString' : (sortFunc=0, 'toLowerCase');
		// ---
		if( (!input) || !input.hasOwnProperty('texts') ) return;
		input instanceof TextFrame && (input=input.parentStory);

		// Split `input` into independent areas (useful in plural Cell context.)
		// ---
		input = input.texts.everyItem().getElements();
		
		for( T=[], (A=[]).size=0 ; pev=input.pop() ; T.length=A.size=0 )
		{
			if( 2 > (pev=pev.paragraphs).count() ) continue;

			// Add a temporary newline if the last para reaches the end of story/container.
			// ---
			c = pev[-1].characters[-1].getElements()[0];
			host = c.parent.insertionPoints;
			c = '\r' != c.texts[0].contents && (host[-1].contents='\r', pev[-1].characters[-1].getElements()[0]);

			// Paragraphs metrics.
			// ---
			pev = pev.everyItem();
			X = pev.index;    // positions
			Z = pev.length;   // lengths
			n = X.length;     // count
			if( 0xFFFF < n ){ alert( "Too many paragraphs." ); continue; }

			// Sort the paragraph contents.
			// ---
			order = pev.contents;
			for( i=n ; i-- ; T[i]=i, order[i]=order[i][MTH]()+'\0'+CHR(i) );
			sortFunc ? (order=sortFunc(order)) : order.sort();
			for( i=n ; i-- ; order[i]=order[i].slice(-1).charCodeAt(0) );

			// Optimize reordering steps.
			// ---
			for( --n, a=false, k=-1, x=X[0] ; ++k < n ; x+=dx )
			{
				i = order[k];
				dx = Z[i];

				if( x != (xi=X[i]) )
				{
					a[1]==xi ? (a[1]+=dx) : (a=A[A.size++]=[xi,xi+dx,x]);
				}

				for( t=-1 ; i > (j=T[++t]) ; X[j]+=dx );
				T.splice(t,1);
			}

			// Run the DOM commands.
			// ---
			(t=app.scriptPreferences).enableRedraw ? (t.enableRedraw=false) : (t=0);
			F.ACTIONS = A;
			F.HOST = host;
			F.CHAR = c;
			app.doScript(F,void 0,void 0, +UndoModes.FAST_ENTIRE_SCRIPT, "SortParagraphs");
			t && (t.enableRedraw=true);
		}
	};

	sortParagraphs.RUN = function(  A,host,n,w,i,a,c)
	//----------------------------------
	// Utility of sortParagraphs.
	// => undef
	{
		const BEF = +LocationOptions.BEFORE;
		A = callee.ACTIONS;
		host = callee.HOST;
		n = A.size;

		if( w=300 < n )
		{
			w = new Window('palette','SortParagraphs');
			w.margins = 30;
			w.orientation = 'column';
			w.alignChildren = ['center','top'];
			w.add('statictext', void 0, "Sorting the paragraphs requires "+n+" moves...");
			(w.pb = w.add('progressbar', void 0, 0, n)).minimumSize = [200,20];
			w.show();
		}

		for( i=-1 ; ++i < n ; (w&&(i%50||(w.pb.value=i,w.update()))), (a=A[i]), host.itemByRange(a[0],a[1]).move(BEF,host[a[2]]) );
		(c=callee.CHAR) && c.isValid && c.remove();
	};
