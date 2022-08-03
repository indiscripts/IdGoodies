/*******************************************************************************

		Name:           TableCellBox (v.2)
		Desc:           Create a box enclosing a cell (or cell range).
		Path:           /snip/TableCellBox.jsx
		Encoding:       ÛȚF8
		Compatibility:  InDesign CC [Mac/Win]
		L10N:           ---
		Kind:           Function
		API:            ---
		DOM-access:     YES
		Todo:           ---
		Created:        220731 (YYMMDD)
		Modified:       220803 (YYMMDD)

*******************************************************************************/

	//==========================================================================
	// PURPOSE
	//==========================================================================
	
	/*

	Takes a table cell (single or plural specifier) and creates a Rectangle object
	that encloses the area, with respect to cell stroke(s) and existing transformations.
	
	This snippet is a 'proof of concept' following this technical discussion:
	https://www.hilfdirselbst.ch/gforum/gforum.cgi?post=584008#584008
	
	The code illustrates and extends an idea from Uwe Laubender. Although
	of no particular interest to the end-user, the method might help scripters
	to access cell or cell-range coordinates for further processing...
	
	Update (220803):
	- The present implementation deals with various InDesign issues, in particular
	  the `obj.duplicate()` bug that affects GraphicCell's inner object. The
	  `duplicate` method is no longer invoked at all and the obj/spread matrix
	  relationship is now purely computed 'from scratch'.
	- The code supports the case of MSO or Button in the graphic cell.
	- It can generate multiple cell boxes if the incoming cell range runs
	  across different spreads (threaded frames.)
	  
	Note. For a good understanding of the transformations, matrices, and coordinate
	spaces involved here, see https://indiscripts.com/tag/CST

	*/

	;function cellBox(/*Cell|PageItem*/target,/*?str*/fillColor,/*?Document*/doc,    bkStrokeMu,wrk,K,cell,pp,t,i,q,r)
	//----------------------------------
	// Create a rectangle that exactly (?) matches the `target` object
	// (single or plural specifier) w.r.t to transform states and
	// stroke weight. Return a { box, left, top, right, bottom }
	// structure, `box` being the created Rectangle. The coordi-
	// nates (in pt) are all given in the INNER space.
	// [REM] Master items not supported!
	// [ADD220803] `target` can be the cell's pageitem as well; the
	// client code can provide `doc` if the host document is already
	// known.
	// [ADD220801] Added `innerWidth`, `innerHeight` props.
	// ---
	// Based on:
	// 1. Discussed suggestion at HDS: 
	//    Koordinaten einer Tabellenzelle (25. Jul 2022, 12:23)
	//    www.hilfdirselbst.ch/gforum/gforum.cgi?post=584008#584008 
	// 2. Uwe Laubender's code (25. Jul 2022, 17:57)
	// ---
	// => { box: new Rectangle, ... }  [OK]  |  false [KO]
	{
		// Boring enums.
		// ---
		const MX = callee.MX || (callee.MX=
		{
			muPT  : +MeasurementUnits.POINTS,
			ctGC  : +CellTypeEnum.GRAPHIC_TYPE_CELL,
			ctTX  : +CellTypeEnum.TEXT_TYPE_CELL,
			loBEG : +LocationOptions.AT_BEGINNING,
			// ---
			apTL  : +AnchorPoint.TOP_LEFT_ANCHOR,
			apBR  : +AnchorPoint.BOTTOM_RIGHT_ANCHOR,
			apCC  : +AnchorPoint.CENTER_ANCHOR,
			// ---
			bbVIS : +BoundingBoxLimits.OUTER_STROKE_BOUNDS,
			// ---
			csPB  : +CoordinateSpaces.PASTEBOARD_COORDINATES,
			csSP  : +CoordinateSpaces.SPREAD_COORDINATES,
			csPR  : +CoordinateSpaces.PARENT_COORDINATES,
			csIN  : +CoordinateSpaces.INNER_COORDINATES,
			// ---
			mcSHR : [+(t=MatrixContent).scaleValues, +t.shearValue, +t.rotationValue],
		});

		// Checkpoint and settings.
		// ---
		if( !(target||0).isValid )
		{
			return false;
		}
		if( 'Document' != (doc||0).constructor.name )
		{
			t = 'function' == typeof(target.toSpecifier) && target.toSpecifier();
			if( 'string' != typeof t ) return false;
			t = t.split('//')[0];
			try{ doc = resolve( 0===t.indexOf('(') ? t.slice(1) : t ) }
			catch(_){ doc=0 }
			if( !doc.isValid ) return false;
		}
		if( 'Cell' != target.constructor.name && 'Cell' != (target=target.parent||0).constructor.name )
		{
			return false;
		}
		( 'string' == typeof fillColor && (doc.colors.itemByName(fillColor).isValid||doc.swatches.itemByName(fillColor).isValid) )
		|| (fillColor='Black');
		callee.BOX_PROPS =
		{
			strokeColor: 'None',
			fillColor:   fillColor,
			// Add safety attributes: corner options, etc
		};

		// Temporarily force stroke weights in PT.
		// ---
		MX.muPT == (bkStrokeMu=+doc.viewPreferences.strokeMeasurementUnits)
		? ( bkStrokeMu = false )
		: ( doc.viewPreferences.strokeMeasurementUnits=MX.muPT );

		// Supports multiple cells.
		// ---
		for( wrk={}, K=target.cells, i=K.length ; i-- ; )
		{
			pp = (cell=K[i]).properties;
			t = callee[MX.ctGC == +pp.cellType ? 'GRAC' : 'TEXC'];
			t.call(callee,wrk,doc,cell,pp,MX);
		}
		
		// Apply final reframe and format result.
		// ---
		r = [];
		for( t in wrk )
		{
			if( !wrk.hasOwnProperty(t) ) continue;
			q = wrk[t];
			q.box.reframe(MX.csIN, [ [q.L,q.T] , [q.R,q.B] ]);
			r[r.length] =
			{
				box:    q.box,
				top:    q.T,
				left:   q.L,
				bottom: q.B,
				right:  q.R,
				innerWidth:  q.R-q.L,
				innerHeight: q.B-q.T,
			}
		}

		// Restore stroke unit if necessary.
		// ---
		bkStrokeMu && (doc.viewPreferences.strokeMeasurementUnits=bkStrokeMu);

		return 0 < (t=r.length) && (1 < t ? r : r[0]);
	};

	cellBox.TEXC = function(/*Work&*/wrk,/*Document*/doc,/*Cell&*/cell,/*CellProp*/pp,/*Enums*/MX,  reGrow,sto,tf,bx)
	//----------------------------------
	// (Process-Text-Cell.) `cell` is a regular Cell.
	// this :: cellBox (fct)
	// => {} [OK]  |  false [KO]
	{
		(reGrow=pp.autoGrow)&&(cell.autoGrow=false);

		sto=(tf=doc.textFrames.add()).parentStory;               // Dummy frame/story.
		cell.texts[0].move(MX.loBEG, sto);                       // Assert: Cell is now empty.
		cell.convertCellType(MX.ctGC);                           // Assert: Cell.pageItems[0] is a Rectangle.

		bx = this.GRAC(wrk,doc,cell,pp,MX);

		cell.convertCellType(MX.ctTX);                           // Restore Text cell.
		sto.move(MX.loBEG,cell.texts[0].insertionPoints[0]);     // Restore contents.
		tf.remove();                                             // Remove dummy fame.
		
		reGrow && (cell.autoGrow=true);                          // Restore autoGrow if necessary.
		return bx;
	};

	cellBox.GRAC = function(/*Work&*/wrk,/*Document*/doc,/*Cell*/cell,/*CellProp*/pp,/*Enums*/MX,  gco,spd,bx,q,k,t,m,lt,rb)
	//----------------------------------
	// (Process-Graphic-Cell.) `cell` is a GC.
	// this :: cellBox (fct)
	// => {} [OK]  |  false [KO]
	{
		const myTL = callee.LOC_TL||(callee.LOC_TL=[MX.apTL,MX.bbVIS,MX.csPR]);
		const myBR = callee.LOC_BR||(callee.LOC_BR=[MX.apBR,MX.bbVIS,MX.csPR]);

		// 1. Determine the destination SPREAD.
		// ---
		gco = cell.pageItems[0];                                      // Could be any kind of PageItem (incl. Button, MSO etc.)
		if( !gco.properties.visibleBounds ) return false;             // Make sure `gco` is not a 'ghost'.
		t = gco.resolve(MX.apCC,MX.csPB)[0][1];                       // Y-coord of the center point *in PASTEBOARD space*.
		spd = this.Y2SP(t,doc,MX);                                    // Host spread.

		// 2. Get/create the box (SPREAD item).
		// ---
		if( wrk.hasOwnProperty(k='_'+spd.id) )
		{
			q = wrk[k];
			bx = q.box;                                               // Recover existing box.
			m = q.tsf;                                                // Recover PB->boxInner matrix.
		}
		else
		{
			bx = this.IBOX(spd,gco,MX);                               // New box.
			m = bx.transformValuesOf(MX.csPB)[0].invertMatrix();      // PB->boxInner
			q = wrk[k]={ box:bx, tsf:m, L:1/0, T:1/0, R:-1/0, B:-1/0 }; // Save.
		}
		
		// 3. The whole cellBox trick is here: get the opposite
		// corners of the *VISIBLE IN-PARENT* box of `gco`.
		// ---
		lt = m.changeCoordinates(gco.resolve(myTL,MX.csPB)[0]);       // Translate the resolved (L,T) from PB to boxInner.
		(t=pp.leftEdgeStrokeWeight||0)   && (lt[0]-=t/2);             // Left edge shift.
		(t=pp.topEdgeStrokeWeight||0)    && (lt[1]-=t/2);             // Top edge shift.
		// ---
		rb = m.changeCoordinates(gco.resolve(myBR,MX.csPB)[0]);       // Translate the resolved (R,B) from PB to boxInner
		(t=pp.rightEdgeStrokeWeight||0)  && (rb[0]+=t/2);             // Right edge shift.
		(t=pp.bottomEdgeStrokeWeight||0) && (rb[1]+=t/2);             // Rottom edge shift.

		// 4. Basically, all we have to do is reframing the box
		// in its inner space along [lt,rb]. But since we may
		// address multiple cells, just update the metrics.
		// ---
		(t=lt[0]) < q.L && (q.L=t);
		(t=lt[1]) < q.T && (q.T=t);
		(t=rb[0]) > q.R && (q.R=t);
		(t=rb[1]) > q.B && (q.B=t);

		return bx;
	};

	cellBox.IBOX = function(/*Spread*/spd,/*PageItem*/gco,/*Enums*/MX,  r,t)
	//----------------------------------
	// (Initialize-Box.) Create a new box in appropriate transform state.
	// this :: cellBox (fct)
	// => Rectangle.
	{
		const TVO = 'transformValuesOf';
		const INV = 'invertMatrix';

		// 1. Create a fresh rectangle in `spd`.
		// ---
		r = spd.rectangles.add(gco.itemLayer);
		r.properties = this.BOX_PROPS;

		// 2. Adjust the transform state (diregarding translation)
		// so that: recInner->Spread  fits  gcoParent->Spread.
		// [REM] Since gco.transformValuesOf(<Spread>) is unsafe,
		// rely on spd->PB matrix:
		// Parent->Spread = Parent->Inner × Inner->PB × PB->Spread
		// ---
		t = gco[TVO](MX.csPR)[0][INV]()                               //   Parent->Inner
			.catenateMatrix( gco[TVO](MX.csPB)[0] )                   // × Inner->PB
			.catenateMatrix( spd[TVO](MX.csPB)[0][INV]() );           // × PB->Spread
		r.transform(MX.csSP, MX.apCC, t, MX.mcSHR);                   // Replace the existing S•H•R components.

		return r;
	};

	cellBox.Y2SP = function(/*num*/Y,/*Document*/doc,/*Enums*/MX,  K,a,t,k,i,z,b)
	//----------------------------------
	// Get the Spread that contains the absolute Y coordinate (in Pasteboard space.)
	// [REM] Master spreads not supported!!
	// => Spread.
	{
		// Spread y-positions. (Cached.)
		// ---
		K = doc.spreads;
		a = (t=callee.Q||(callee.Q={})).hasOwnProperty(k=doc.toSpecifier()) && t[k];
		if( !a )
		{
			a = K.everyItem().resolve([MX.apTL,MX.bbVIS,MX.csPB],MX.csPB)[0];
			for( i=z=a.length ; i-- ; a[i]=i?a[i][1]:-1/0 );
			a[z] = 1/0;
			t[k] = a;
		}
		else
		{
			z = -1 + a.length;
		}

		// Binary search. Looks for the unique `i` s.t.
		// `a[i] <= Y < a[i+1]` (i is then the spread index.)
		// ---
		for
		(
			t=[0,z] ;
			Y < a[i=(t[b=0]+t[1])>>1] || Y >= a[(b=1)+i] ;
			t[1-b]=b+i
		);

		return K[i];
	};



// Test Me.
// ---
/*
	var cell = app.selection[0];
	var ret = cellBox(cell, 'Yellow');
	if( ret )
	{
		var i, msg;
		if( ret instanceof Array )
		{
			for
			(
				msg=["Intrinsic dimensions (multiple spreads):"], i=-1 ;
				++i < ret.length ;
				msg[msg.length] = ret[i].innerWidth + ' \xD7 ' + ret[i].innerHeight + ' pt'
			);
			msg = msg.join('\r');
		}
		else
		{
			msg = "Intrinsic dimensions: " + ret.innerWidth + ' \xD7 ' + ret.innerHeight + ' pt';
		}

		alert( msg );
	}
	else
	{
		alert("Select a Table cell or cell range.");
	}
*/