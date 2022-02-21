/*******************************************************************************

		Name:           DocPreventOpening [1.0]
		Desc:           Prohibits the opening of certain InDesign documents based on their filename.
		Path:           /full/DocPreventOpening.jsx
		Encoding:       ÛȚF8
		Compatibility:  InDesign CC/CS6/CS5 [Mac/Win]
		L10N:           ---
		Kind:           Script / Startup script
		API:            ---
		DOM-access:     YES
		Todo:           ---
		Created:        220221 (YYMMDD)
		Modified:       220221 (YYMMDD)

*******************************************************************************/

	//==========================================================================
	// PURPOSE
	//==========================================================================
	
	/*

	This script prevents the opening of documents having a certain filename pattern.
	Change the `RE_EXCLUDE` constant (see below) to make it fit your needs.
	
	The present implementation relies on the event `beforeOpen` available in CS5/CS6/CC.
	Its target is the Application instance (which may not be obvious at first!) but it
	still provides, as any DocumentEvent, a `fullName` property (File) that indicates
	which document is about to be opened. Unlike `afterOpen`, `beforeOpen` is cancelable,
	so `ev.preventDefault()` actually cancels document opening if you decide so.
	
	[REM] No `#targetengine` directive is used in this script as we don't really need
	to store persistent data for such a basic process. Instead, the script file itself
	is registered as "the event handler" and we use `$.global.evt` to determine whether
	the script is invoked for either installing the listener or managing the event.
	
	- To install the listener just execute the script manually (once). You can still
	  change and refine your `RE_EXCLUDE` pattern dynamically (since there is no persis-
	  tent engine.)
	
	- To uninstall the listener, close your InDesign session. (Of course, if you have
	  installed the present file as a startup script, remove it from its folder!)
	
	DISCLAIMER. - DO NOT INSTALL THIS SCRIPT AS A STARTUP SCRIPT UNLESS YOU REALLY
	KNOW WHAT YOU ARE DOING. USERS WILL BE UNABLE TO OPEN DOCUMENTS HAVING A CERTAIN
	FILE NAME PATTERN AND WON'T BE NOTIFIED. IN CASE YOU DEPLOY THIS SOLUTION, MAKE
	SURE YOUR CLIENTS ARE INFORMED. ALWAYS PROVIDE INSTRUCTIONS FOR UNINSTALLING!

	*/

	// ADJUST THIS REGEX TO YOUR NEEDS.
	// ---
	const RE_EXCLUDE = /\.skip\.indd$/;           // Exclude filenames ending with ".skip.indd"

	(function(/*any*/ev,  ff,t)
	{
		if( (ev||0).isValid )
		{
			// Run the event handler.
			// ---
			'beforeOpen' == ev.eventType          // Safer (make sure you're managing the right event!)
			&& (t=ev.properties.fullName)         // Get the `fullName` (File object.)
			&& RE_EXCLUDE.test(t.fsName)          // Should be excluded?
			&& ev.preventDefault();               // Cancel the opening.
		}
		else
		{
			// Install the event listener (if not yet installed!)
			// ---
			const UID = 'myBeforeOpenKiller';
			(ff=File($.fileName)).exists
			&& !((t=app.eventListeners).itemByName(UID)).isValid
			&& ((t.add('beforeOpen',ff)).name=UID);
		}
	})($.global.evt);
