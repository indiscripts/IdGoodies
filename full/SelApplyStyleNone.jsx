/*******************************************************************************

		Name:           SelApplyStyleNone (1.2)
		Desc:           Reset the selection to the [None] character style.
		Path:           /full/SelApplyStyleNone.jsx
		Encoding:       ÛȚF8
		Compatibility:  InDesign (all versions) [Mac/Win]
		L10N:           ---
		Kind:           Script
		API:            ---
		DOM-access:     YES
		Todo:           ---
		Created:        100102 (YYMMDD)
		Modified:       221006 (YYMMDD)

*******************************************************************************/

	//==========================================================================
	// PURPOSE
	//==========================================================================
	
	/*
	
	Forcibly apply the [None] character style to the selected text or insertion point
	(if any), making sure that all specific character attributes are removed.
	
	This script has the same effect than clicking [None] in the Character Style panel
	[which unfortunately cannot be easily associated to a KB shortcut despite
	countless InDesign user requests.]
	
	So, you can attach a KB shortcut to this script and have a manual control of the
	Apply None action. All InDesign versions should be supported from CS4 to CC.
	Also, the script is undo-able (Cmd Z.)

	*/

	;app.doScript
	(
		function(  doc,t,s)
		{
			(doc=app.properties.activeDocument)                           // Is there an active document?
			&& (t=doc.properties.selection||0).length                     // Is there a selection?
			&& (t=t[0]).isValid                                           // Is this a valid DOM component?
			&& (t.hasOwnProperty('endBaseline'))                          // Is this a Text instance?
			&& (s=doc.characterStyles.itemByName('$ID/[None]')).isValid   // Clean identification of the [None] style.
			&&
			(
				t.applyCharacterStyle(s),                                 // Apply [None] (attributes remain as overrides)
				t.clearOverrides(OverrideType.CHARACTER_ONLY)             // then remove character-scoped overrides.
			);
		},
		void 0,
		void 0,
		UndoModes.ENTIRE_SCRIPT,
		'Apply None'
	);
