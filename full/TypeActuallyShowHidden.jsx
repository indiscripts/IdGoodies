/*******************************************************************************

		Name:           TypeActuallyShowHidden [1.1]
		Desc:           Make sure that the Show Hidden Characters action works!
		Path:           /full/TypeActuallyShowHidden.jsx
		Encoding:       ÛȚF8
		Compatibility:  InDesign CC/CS6/CS5 [Mac/Win]
		L10N:           ---
		Kind:           Startup script
		API:            ---
		DOM-access:     YES
		Todo:           ---
		Created:        250213 (YYMMDD)
		Modified:       250214 (YYMMDD)

*******************************************************************************/

	//==========================================================================
	// PURPOSE
	//==========================================================================
	
	/*

	This startup script changes the behaviour of Type > Show Hidden Characters
	so that Screen Mode is automatically changed into 'Normal' (aka preview off)
	if necessary.

	[REM] No `#targetengine` directive is used in this script as we don't really need
	to store persistent data for such a basic process. Instead, the script file itself
	is registered as "the event handler" and we use `$.global.evt` to determine whether
	the script is invoked for either installing the listener or managing the event.

	- To install the listener, drop it (or an alias) in the
	  Scripts/[startup scripts] folder.
	
	- To uninstall the listener, remove it (or its alias) from the
	  Scripts/[startup scripts] folder.
	
	[FIX250214] Also deactivate overprint preview [thx Branislav].

	More Info:
	→ indiscripts.com/post/2025/02/finally-fixing-show-hidden-characters-menu-action

	*/

	(function(/*any*/ev,  ff,doc,t,off)
	{
		if( (ev||0).isValid )
		{
			// Run the event handler.
			// ---
			'afterInvoke' == ev.eventType              // Safer (make sure you're managing the right event!)
			&& (doc=app.properties.activeDocument)     // Nothing to do if no active doc
			&& doc.isValid                             // Safer.
			&& doc.textPreferences.showInvisibles      // 'Show Hidden Characters' has just been activated.
			&& (t=app.properties.activeWindow)         // Make sure we have an active Window which:
			&& 'LayoutWindow'==t.constructor.name                               // (1) is a LayoutWindow
			&& doc===t.parent                                                   // (2) is a child of `doc`
			&&
			(
			+t.properties.screenMode != (off=+ScreenModeOptions.PREVIEW_OFF)    // (3a) has a 'preview' screen mode
			||                                                                  // OR
			t.properties.overprintPreview                                       // (3b) has overprint preview active
			)
			&& t.properties = { screenMode:off, overprintPreview:false };       // Then turn off any PREVIEW mode.
		}
		else
		{
			// Install the event listener (if not yet installed!)
			// ---
			const UID = 'TypeActuallyShowHidden';
			(ff=new File($.fileName)).exists
			&& (t=app.menuActions.itemByName("$ID/Show Hidden Characters")).isValid
			&& !((t=t.eventListeners).itemByName(UID)).isValid
			&& ((t.add('afterInvoke',ff)).name=UID);
		}
	})($.global.evt);
