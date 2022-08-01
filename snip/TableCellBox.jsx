/*******************************************************************************

		Name:           TableCellBox
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
		Modified:       220801 (YYMMDD)

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

	*/

	;function cellBox(/*Cell*/cell,  K,doc,pp,reGrow,reStro,nonGC,tf,sto,box,ret,tsf,lt,rb,i,t,z)
	//----------------------------------
	// Create a rectangle that exactly (?) matches the `cell` object
	// (single or plural specifier) w.r.t to transform states and
	// stroke weight. Return a { box, left, top, right, bottom }
	// structure, `box` being the created Rectangle. The coordi-
	// nates (in pt) are all given in the INNER space.
	// [ADD220801] Added `innerWidth`, `innerHeight` props.
	// ---
	// Based on:
	// 1. Discussed suggestion at HDS: 
	//    Koordinaten einer Tabellenzelle (25. Jul 2022, 12:23)
	//    www.hilfdirselbst.ch/gforum/gforum.cgi?post=584008#584008 
	// 2. Uwe Laubender's code (25. Jul 2022, 17:57)
	// ---
	// => { box: new Rectangle, ... }
	{
		if( 'Cell' != (cell||0).constructor.name ) return false;
		
		// Boring enums.
		// ---
		const GC =  +CellTypeEnum.GRAPHIC_TYPE_CELL;
		const BEG = +LocationOptions.AT_BEGINNING;
		const MU_PT = +MeasurementUnits.POINTS;
		const AP_TL = +AnchorPoint.TOP_LEFT_ANCHOR;
		const AP_BR = +AnchorPoint.BOTTOM_RIGHT_ANCHOR;
		const CS_IN = +CoordinateSpaces.INNER_COORDINATES;
		const CS_PB = +CoordinateSpaces.PASTEBOARD_COORDINATES;

		// Host document required.
		// ---
		t = cell.toSpecifier().split('//')[0];
		'('==t.charAt(0) && (t=t.slice(1));
		doc = resolve(t);
		if( !doc.isValid ) return false; // Shouldn't happen.

		// Make sure we'll read stroke weights in PT.
		// reStro :: backup (if needed.)
		// ---
		MU_PT == (reStro=+doc.viewPreferences.strokeMeasurementUnits)
		? ( reStro = false )
		: ( doc.viewPreferences.strokeMeasurementUnits=MU_PT );

		// Now supporting multiple cells.
		// ---
		for( tsf=ret=false, K=cell.cells, i=K.length ; i-- ; )
		{
			// Use graphic cell as base rectangle.
			// ---
			pp = (cell=K[i]).properties;
			(reGrow=pp.autoGrow)&&(cell.autoGrow=false);
			nonGC = GC != +pp.cellType;
			if( nonGC )
			{
				sto=(tf=doc.textFrames.add()).parentStory;           // Dummy frame/story.
				cell.texts[0].move(BEG, sto);                        // Cell is now empty. (Sure?)
				cell.convertCellType(GC);                            // Temp conv to GC.
			}
			box = cell.pageItems[0].duplicate();                     // Duplicate GC into rect.
			if( nonGC )
			{
				cell.convertCellType(CellTypeEnum.TEXT_TYPE_CELL);   // Restore cell.
				sto.move(BEG,cell.texts[0].insertionPoints[0]);      // Restore contents.
				tf.remove();                                         // Remove dummy fame.
			}
			reGrow && (cell.autoGrow=true);                          // Restore autoGrow.

			// [WARNING] Due to an ID bug the `box` polygon doesn't
			// necessarily match, but its *bounding box* is OK :-)
			// Convert-to-rectangle forces the poly to fit its b-box.
			// ---
			box.convertShape(+ConvertShapeOptions.CONVERT_TO_RECTANGLE);

			// Take cell strokes into account.
			// ---
			z = 0;
			lt = box.resolve(AP_TL,CS_IN)[0];                      // [x,y]
			(t=pp.leftEdgeStrokeWeight||0)   && (++z, lt[0]-=t/2); // left shift
			(t=pp.topEdgeStrokeWeight||0)    && (++z, lt[1]-=t/2); // top shift
			// ---
			rb = box.resolve(AP_BR,CS_IN)[0];                      // [x,y]
			(t=pp.rightEdgeStrokeWeight||0)  && (++z, rb[0]+=t/2); // right shift
			(t=pp.bottomEdgeStrokeWeight||0) && (++z, rb[1]+=t/2); // bottom shift
			
			if( !ret )
			{
				ret =
				{
					box:         box,
					left:        lt[0],
					top:         lt[1],
					right:       rb[0],
					bottom:      rb[1],
					wantReframe: 0 < z,
				};
			}
			else
			{
				// Convert `box` corners into ret.box inner coordinates.
				// [REM] This block is entered only in MULTIPLE CELLS case.
				// ---
				tsf || (tsf=ret.box.transformValuesOf(CS_PB)[0].invertMatrix()), // PB->ret.box

				t = box.transformValuesOf(CS_PB)[0].catenateMatrix(tsf);         // curBox->ret.box
				lt = t.changeCoordinates(lt);
				rb = t.changeCoordinates(rb);

				// Update TLBR.
				// ---
				(t=lt[0]) < ret.left   && (ret.left=t);
				(t=lt[1]) < ret.top    && (ret.top=t);
				(t=rb[0]) > ret.right  && (ret.right=t);
				(t=rb[1]) > ret.bottom && (ret.bottom=t);
				ret.wantReframe = true;

				box.remove();
			}
		}
		
		if( ret.wantReframe )
		{
			// TLBR shift in the INNER space (of ret.box).
			// ---
			ret.box.reframe(CS_IN, [[ret.left,ret.top],[ret.right,ret.bottom]]);
			delete ret.wantReframe;
		}
		
		// Extra infos...
		// ---
		ret.innerWidth  = ret.right-ret.left;
		ret.innerHeight = ret.bottom-ret.top;
		// etc

		// Restore stroke unit if necessary.
		// ---
		reStro && (doc.viewPreferences.strokeMeasurementUnits=reStro);

		return ret;
	};


// Test Me.
// ---
/*
	var cell = app.selection[0];
	var ret = cellBox(cell);
	if( ret )
	{
		ret.box.properties = { fillColor:'Yellow' };
		alert( "Intrinsic dimensions: " + [ret.innerWidth,ret.innerHeight].join(' \xD7 ') + " pt." );
	}
	else
	{
		alert("Select a Table cell or cell range.");
	}
*/
