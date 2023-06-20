/*******************************************************************************

		Name:           TableCellBox (v.4)
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
		Modified:       230620 (YYMMDD)

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
	
	Update (230620):
	- v4: ability to skip box creation: pass in `false` as 2nd argument. The function
	  now returns `topLeft`, `topRight`, `bottomLeft`, `bottomRight` properties in
	  *spread* coordinate space (instead of inner space anchors).
	- v3 circumvents the bug reported in https://t.co/qhHLtR7w5F (& https://t.co/9mgv6wh4L6)
	  related to anchored objects. This is an InDesign bug and we only have a half-hearted
	  solution so far: when the target cell contains an anchored objet, the inner contents
	  is restored thru `duplicate()`, not `move()`, to prevent ID crash. Consequence:
	  internal IDs of the underlying objects are then modified.
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

	;function cellBox(/*Cell|PageItem*/target,/*?str|false*/fillColor,/*?Document*/doc,    bkStrokeMu,wrk,K,cell,pp,t,i,q,m,r)
	//----------------------------------
	// By default, create a rectangle that exactly (?) matches the `target`
	// (single or plural specifier) w.r.t to transform states and stroke
	// weight. The function then returns a { box, topLeft, topRight, bottomLeft,
	// bottomRight, innerWidth, innerHeight } structure, `box` being the new Rectangle.
	// [CHG230620] If fillColor is explicitly set to `false`, no actual Rectangle is
	// created and the returned structure only contains coordinates (the `box` property
	// being set to false).
	// [CHG230620] While `innerWidth`, `innerHeight` are the intrinsic dimensions of the
	// box in points and relative to the inner space, the properties `topLeft`, `topRight`,
	// `bottomLeft`, and `bottomRight` give the [x,y] coordinates of the corresponding
	// anchors in SPREAD coordinate space. (Those anchors describe a parallelogram.)
	// [ADD220801] Added `innerWidth`, `innerHeight` props.
	// [ADD220803] `target` can be the cell's pageitem as well; the client
	// code can provide `doc` if the host document is already known.
	// [REM230620] If target is a plural cell that involves multiple pages,
	// the function returns an array of objects.
	// Note: Master items are not supported!
	// ---
	// Based on:
	// 1. Discussed suggestion at HDS: 
	//    Koordinaten einer Tabellenzelle (25. Jul 2022, 12:23)
	//    www.hilfdirselbst.ch/gforum/gforum.cgi?post=584008#584008 
	// 2. Uwe Laubender's code (25. Jul 2022, 17:57)
	// ---
	// => <BOX_DATA> | <BOX_DATA>[]  [OK]  |  false [KO]
	// where <BOX_DATA> :: { box:new Rectangle|false, innerWidth:num, innerHeight:num,
	//       topLeft:num[2], topRight:num[2], bottomLeft:num[2], bottomRight:num[2] }
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

		if( false !== fillColor )
		{
			( 'string' == typeof fillColor && (doc.colors.itemByName(fillColor).isValid||doc.swatches.itemByName(fillColor).isValid) )
			|| (fillColor='Black');
			callee.BOX_PROPS =
			{
				strokeColor: 'None',
				fillColor:   fillColor,
				// You may add safety attributes:
				// corner options, etc
			};
		}
		else
		{
			// [ADD230620] 'No box' option.
			callee.BOX_PROPS = false;
		}

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
			q = wrk[t]; // { box, tsf, insp, T, L, B, R }

			// [CHG230619] Q.box remains FALSE if 'No box'
			q.box && q.box.reframe(MX.csIN, [ [q.L,q.T] , [q.R,q.B] ]);

			m = q.insp;
			r[r.length] =
			{
				box:         q.box,          // Rectangle|false
				// --- [DEL230620]
				// top:      q.T,            // Top coordinate (pt) in inner space
				// left:     q.L,            // Left coordinate (pt) in inner space
				// bottom:   q.B,            // Bottom coordinate (pt) in inner space
				// right:    q.R,            // Right coordinate (pt) in inner space
				innerWidth:  q.R-q.L,        // Inner width (pt)
				innerHeight: q.B-q.T,        // Inner height (pt)
				// --- [ADD230620]
				topLeft:     m.changeCoordinates([q.L,q.T]), // Translate the topLeft anchor in SPREAD coords.
				topRight:    m.changeCoordinates([q.R,q.T]), // Translate the topRight anchor in SPREAD coords.
				bottomLeft:  m.changeCoordinates([q.L,q.B]), // Translate the bottomLeft anchor in SPREAD coords.
				bottomRight: m.changeCoordinates([q.R,q.B]), // Translate the bottomRight anchor in SPREAD coords.
			};
		}

		// Restore stroke unit if necessary.
		// ---
		bkStrokeMu && (doc.viewPreferences.strokeMeasurementUnits=bkStrokeMu);

		return 0 < (t=r.length) && (1 < t ? r : r[0]);
	};

	cellBox.TEXC = function(/*Work&*/wrk,/*Document*/doc,/*Cell&*/cell,/*CellProp*/pp,/*Enums*/MX,  reGrow,sto,tf,bx,k)
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
		k = -1 == sto.texts[0].contents.indexOf('\uFFFC')        // [FIX230608] Prevents InDesign Bug:
		? 'move'                                                 // `move` is allowed if `sto` has no anchor
		: 'duplicate';                                           // otherwise, use `duplicate` (fallback)
		sto[k](MX.loBEG,cell.texts[0].insertionPoints[0]);       // Restore contents.
		tf.remove();                                             // Remove dummy frame.
		
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
			if( this.BOX_PROPS )
			{
				bx = this.IBOX(spd,gco,MX);                           // New box.
				m = bx.transformValuesOf(MX.csPB)[0].invertMatrix();  // PB->boxInner
			}
			else
			{
				// [ADD230619] No box: use gcoParent as virtual dest space;
				// boxInner is not available so inner->parent is [1,0,0,1,0,0].
				bx = false;                                           // No box.
				m = this.PBPR(gco,MX);                                // PB->boxInner(=gcoParent)
			}
			
			// Save.
			q = wrk[k] =
			{
				box:bx, tsf:m,
				insp: this.INSP(spd, bx||gco, MX),                    // [ADD230620] Inner->Spread matrix
				L:1/0, T:1/0, R:-1/0, B:-1/0
			};
		}

		// 3. The whole cellBox trick is here: get the opposite
		// corners of the *VISIBLE IN-PARENT* box of `gco`.
		// ---
		lt = m.changeCoordinates(gco.resolve(myTL,MX.csPB)[0]);       // Translate the resolved (L,T) from PB to boxInner
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
		// 1. Create a fresh rectangle in `spd`.
		// ---
		r = spd.rectangles.add(gco.itemLayer);
		r.properties = this.BOX_PROPS;

		// 2. Adjust the transform state (diregarding translation)
		// so that: recInner->Spread  fits  gcoParent->Spread.
		t = gco.transformValuesOf(MX.csPR)[0].invertMatrix().         //   Parent->Inner
			catenateMatrix( this.INSP(spd,gco,MX) );                  // x Inner->Spread
		r.transform(MX.csSP, MX.apCC, t, MX.mcSHR);                   // Replace the existing S•H•R components.

		return r;
	};
	
	cellBox.INSP = function(/*Spread*/spd,/*PageItem*/item,/*Enums*/MX)
	//----------------------------------
	// (Inner-to-Spread-Matrix) [ADD230619] Get the *safe* inner-to-spread
	// matrix of the object `item`.
	// this :: cellBox (fct)
	// => TranformationMatrix
	{
		const TVO = 'transformValuesOf';
		const INV = 'invertMatrix';

		// [REM] Since item.transformValuesOf(<Spread>) may be unsafe, rely
		// on Spread->PB matrix and use Inner->Spread = Inner->PB × PB->Spread
		// ---
		return item[TVO](MX.csPB)[0].                                 //   Inner->PB
			   catenateMatrix( spd[TVO](MX.csPB)[0][INV]() );         // × PB->Spread
	},

	cellBox.PBPR = function(/*PageItem*/item,/*Enums*/MX)
	//----------------------------------
	// (Pasteboard-to-Parent-Matrix) [ADD230619] Get the PB-to-parent
	// matrix of the object `item`.
	// this :: cellBox (fct)
	// => TranformationMatrix
	{
		const TVO = 'transformValuesOf';
		const INV = 'invertMatrix';

		// PB->Parent = (Parent->Inner x Inner->PB).inv()
		// ---
		return item[TVO](MX.csPR)[0][INV]().                          // ( Parent->Inner
			   catenateMatrix( item[TVO](MX.csPB)[0] )[INV]();        // × Inner->PB     ).invert()
	},

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
	var cell = app.selection[0];
	var ret = cellBox(cell, 'Yellow'); // Use `false` rather than 'Yellow' to only get coordinates.
	/*
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


