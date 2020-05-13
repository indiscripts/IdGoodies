/*******************************************************************************

		Name:           GroupAddItems [1.0]
		Desc:           Add one or several PageItems to a Group.
		Path:           /snip/GroupAddItems.jsx
		Encoding:       ÛȚF8
		Compatibility:  InDesign (all versions) [Mac/Win]
		L10N:           ---
		Kind:           Method (extends Group.prototype)
		API:            Group.prototype.addItems()
		DOM-access:     YES
		Todo:           ---
		Created:        200513 (YYMMDD)
		Modified:       200513 (YYMMDD)

*******************************************************************************/

	//==========================================================================
	// PURPOSE
	//==========================================================================
	
	/*
	
	This snippet provides a `addItems` method to any singular Group instance.

	Such feature is not available in InDesign's scripting API and it is
	hard to implement in a way that does not temporarily destroy the target
	group. The present solution relies on a brilliant idea proposed by Uwe
	Laubender -- originally discussed in the InDesign Scripting Forum.
	
	The trick is to create a temporary MultiStateObject (MSO) which can
	then handle the target group into a State. New items are added to that
	state. When the state is finally released, the original group is restored
	with its new components.

	Issues may still arise in edge cases. The present code should deal with
	the target group G being part of an AnchoredObject (AO), or inside a
	'nested item' (i.e pasted into.) However, no solution has been found in
	the particular case of G being *directly* nested in a SplineItem.

	Sample codes:

	      // 1. Add an Oval to the target Group.
	      myGroup.addItems(myOval);

	      // 2. Add multiples page items.
	      // ---
	      myGroup.addItems([myItem1, myItem2...]);

	*/

	;Group.prototype.addItems = function addItems(/*PageItem|PageItem[]*/items, gp,gpn,ao,t,p,mso,sta)
	//----------------------------------
	// Add the incoming item(s) to this Group instance.
	// [REM] If `this` is a plural specifier, the 1st
	// element is considered as the target.
	// ---
	// => Group [OK]  |  false [KO]
	{
		// Checkpoint and target Group -> gp.
		// ---
		if( !this.isValid ) return false;
		gp = this.getElements()[0];
		
		// Coerce items into an Array (if needed.)
		// [REM] `items` can be a plural specifier too :-)
		// ---
		(items instanceof Array) || (items=items.getElements());
		if( !items.length ) return false;

		// Backup the name of the Group.
		// ---
		gpn = gp.properties.name;

		// If necessary, temporarily release the containing AO.
		// ---
		if( ao=callee.UPAO(gp) )
		{
			t = ao.anchoredObjectSettings;
			ao = {
				obj:      ao,
				ancPos:   t.anchoredPosition,
				ipOffset: ao.parent.insertionPoints[0].getElements()[0],
			};
			t.releaseAnchoredObject();
		}

		// ---
		// Possible parents of a Group:
		// Snippet | PlaceGun | ComboBox | ListBox | TextBox | SignatureField
		// Spread | MasterSpread | Group | State | Character
		// SplineItem | Polygon | GraphicLine | Rectangle | Oval
		// ---

		p = gp.parent;

		// [TODO] 'Unnest' gp (temporarily) if it is the direct child of a SplineItem.
		// ---
		if( p.hasOwnProperty('textPaths') ) return false;

		// Make sure we can create a MSO from `p`.
		// ---
		if( !p.hasOwnProperty('multiStateObjects') ) return false;

		// Create a MSO and convert `gp` into a new state.
		// ---
		mso = p.multiStateObjects.add();
		mso.addItemsAsState( [gp] );
		sta = mso.states.lastItem();

		// Inject `items` in the new state.
		// ---
		sta.addItemsToState( items );

		// Release the state "as object".
		// The `gp` specifier is fully restored.
		// ---
		sta.releaseAsObject();
		mso.remove();
		gp.properties = {name: gpn};

		// Restore the containing AO.
		// ---
		if( ao )
		{
			t = ao.obj.anchoredObjectSettings;
			t.insertAnchoredObject(ao.ipOffset,ao.ancPos);
		}

		return gp;
	};

	Group.prototype.addItems.UPAO = function(/*DOM*/obj,  t)
	// -----------------------------------------------
	// (Up-AnchoredObject-Utility.) Return the first AO (if any)
	// containing the input object. If `obj` is itself an AO, return it.
	// If obj doesn't belong to any AO, return false.
	// ---
	// [REM] The fact that any AO is parented by a Character is not
	// a sufficient condition to identify it as an AO, since Cells,
	// Footnotes, or HiddenTexts also belong to a Character.
	// [REM] The returned AO might in turn belong to a higher AO.
	// ---
	// =>  SplineItem | Polygon | GraphicLine | Rectangle | Oval | Group |
	//     TextFrame | EndnoteTextFrame | MultiStateObject | Button |
	//     FormField | SignatureField | TextBox | RadioButton | ListBox |
	//     ComboBox | CheckBox | EPSText [OK]  |  false [KO]
	{
		if( obj.hasOwnProperty('anchoredObjectSettings') && (t=obj.anchoredObjectSettings.properties) && t.anchorPoint )
		{
			t = obj.constructor.name;
			return 'Application'!=t && 'Document'!=t && 'ObjectStyle'!=t && obj;
		}

		// Any Text -> callee(TextFrame|TextPath)
		// ---
		if( obj.hasOwnProperty('parentTextFrames') )
		{
			obj = obj.parentTextFrames;
			return ( obj && obj.length ) ? callee(obj[0]) : false;
		}
		
		t = (obj=obj.parent).constructor.name;
		return 'Document'!=t && 'Spread'!=t && 'MasterSpread'!=t && 'Page'!=t && callee(obj);
	};
