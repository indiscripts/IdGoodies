/*******************************************************************************

		Name:           TypeActuallyShowHidden [2.0]
		Desc:           Makes 'Show Hidden Characters' always work!
		Path:           /full/TypeActuallyShowHidden.jsx
		Encoding:       ÛȚF8
		Compatibility:  InDesign CC/CS6/CS5/CS4 [Mac/Win]
		L10N:           ---
		Kind:           Startup script
		API:            ---
		DOM-access:     YES
		Todo:           ---
		Created:        250213 (YYMMDD)
		Modified:       250215 (YYMMDD)

*******************************************************************************/

	//==========================================================================
	// PURPOSE
	//==========================================================================
	
	/*

	1. DESCRIPTION
	____________________________________________________________________________

	This startup script changes the behaviour of Type > Show Hidden Characters
	so that Screen Mode is automatically changed into 'Normal' (aka preview off)
	if necessary.
	
	A SMART_MODE option (0 or 1) is available (see 'YOUR SETTINGS'):
	
	- SMART_MODE = 0
	  ----------------------------------------------------------------
	  With SMART_MODE turned off, the regular Show/Hide switch works
	  as usual. The script only disables preview effects if you ex-
	  pressly go to 'Show Hidden Characters'. Hence, if the special
	  characters are already in 'visible' state according to InDesign,
	  i.e. the menu command is labelled 'Hide Hidden Characters', then
	  the script does not interfere with that command and lets the
	  toggle operate without extra steps regarding screen modes.
	
	- SMART_MODE = 1
	  ----------------------------------------------------------------
	  With SMART_MODE turned on, the command 'Show Hidden Characters'
	  works as already specified, but the command 'Hide Hidden Cha-
	  racters' gets a special behaviour: it does not let the toggle
	  operate if the active window is in some preview mode (meaning
	  that hidden characters aren't actually noticeable to the user.)
	  In that particular case, special characters are kept 'visible'
	  (despite the 'Hide...' command) and preview modes are disabled.

	WARNING. Enabling SMART_MODE fulfills what the user intuitively expects from
	the Cmd Alt I shortcut. Special characters are shown when you don't see them,
	and hidden when you already see them. However, be aware that this special
	mode alters the semantics of the 'Hide Hidden Characters' menu item in that
	the command won't be honored in the case we've described above.

	[REM] No `#targetengine` directive is used in this script as we don't really
	need to store persistent data for such a basic process. Instead, the script
	file itself is registered as "the event handler" and we use `$.global.evt`
	to determine whether the script is invoked for either installing the listener
	or managing the event.


	2. INSTALL / UNINSTALL
	____________________________________________________________________________

	- To install the listener, drop it (or an alias) in the
	  Scripts/[startup scripts] folder.
	
	- To uninstall the listener, remove it (or its alias) from the
	  Scripts/[startup scripts] folder.

	NOTE. If you don't know where is the parent [Scripts] folder, run InDesign
	and show the Scripts panel (Window > Utility > Scripts). Then right-click
	the [User] branch and click “Reveal in Finder/Explorer”.


	3. VERSION HISTORY
	____________________________________________________________________________
	
	[FIX250215] Version 2.0 fix various bugs regarding the event listener.
	            It also activates SMART_MODE by default (you can change
	            that behavior in YOUR SETTINGS below.)
	            Added CS4 compatibility.

	[FIX250214] Deals with overprint preview too [thx Branislav].

	More info:
	→ indiscripts.com/post/2025/02/finally-fixing-show-hidden-characters-menu-action

	*/

	// YOUR SETTINGS (see DESCRIPTION)
	//----------------------------------
	SMART_MODE = 1;


	(function(/*any*/ev,  doc,win,shw,off,pvw,ff,mna,evs,t,a)
	//----------------------------------
	{
		if( (ev||0).isValid && 'afterInvoke'==ev.eventType )
		{
			// Checkpoints.
			if( !(doc=app.properties.activeDocument||0).isValid ) return;
			if( !(win=app.properties.activeWindow  ||0).isValid ) return;
			if( !('LayoutWindow'==win.constructor.name && doc===win.parent) ) return;

			// ShowHidden state (shw)
			shw = doc.textPreferences.showInvisibles;
			if( !shw && !$.global.SMART_MODE ) return;

			// Preview state (pvw)
			off = +ScreenModeOptions.PREVIEW_OFF;
			t = win.properties;
			pvw = t.overprintPreview || (+t.screenMode != off);
			if( !pvw ) return;

			// Hot process.
			win.properties =
			{
				screenMode:         off,                          // Go back to Normal screen mode.
				overprintPreview:   false,                        // Deactivate overprint preview.
			};
			
			!shw && (doc.textPreferences.showInvisibles=true);     // Smart mode!
			
			// [REM250215] It is crucial that switching back to
			// `showInvisibles=true` (against the command being
			// processed!) does not trigger a new 'afterInvoke'
			// MenuAction event.
		}
		else
		{
			// This block will install the event listener
			// iff it is not installed yet!

			const UID = 'TypeActuallyShowHidden';
			const ID_SHOW = '$ID/Show Hidden Characters';
			const ID_HIDE = '$ID/Hide Hidden Characters';

			if( !(ff=new File($.fileName)).exists ) return;
			
			// [FIX250215] Get the MenuAction from its *current* name.
			shw = app.textPreferences.showInvisibles;
			mna = app.menuActions.itemByName(shw?ID_HIDE:ID_SHOW);
			if( !mna.isValid )
			{
				// This shouldn't happen, but let's try the other way.
				mna = app.menuActions.itemByName(shw?ID_SHOW:ID_HIDE);
				if( !mna.isValid ) return;
			}

			// [REM250215] Whatever its *dynamic* name, the MenuAction
			// remains the same: ID=0x1D301 in all tested ID versions.
			
			mna = mna.getElements()[0]; // Not needed but let's be careful.
			
			// [FIX250215] In CS4, an EventListener has no 'name' prop
			// although EventListeners.itemByName() is available :-/
			// Let's find a trick that works anywhere. Our purpose here
			// is to prevent the user from duplicating the listener by
			// manually running the JSX (again).
			evs = mna.eventListeners;
			if( evs.length )
			for( a=evs.everyItem().properties ; t=a.pop() ; )
			{
				if( t.name===UID ) return;                            // Found by name (> CS4)

				t = t.handler;
				if( t && t.absoluteURI==ff.absoluteURI ) return;      // Found by URI (CS4)
			}

			// Hot process.
			evs.add('afterInvoke',ff).properties = { name:UID };

			// [REM250215] Assigning a name thru properties is
			// harmless (although ineffective) in CS4.
		}

	})($.global.evt);
