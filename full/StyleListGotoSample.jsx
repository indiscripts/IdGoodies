/*******************************************************************************

		Name:           StyleListGotoSample (1.0)
		Desc:           Add a "Goto Sample" menu item to the paragraph/character style lists
		Path:           /full/StyleListGotoSample.jsx
		Encoding:       ÛȚF8
		Compatibility:  InDesign CC/CS6/CS5 [Mac/Win]
		L10N:           ---
		Kind:           Startup Script
		API:            ---
		DOM-access:     YES
		Todo:           ---
		Created:        230321 (YYMMDD)
		Modified:       230321 (YYMMDD)

*******************************************************************************/

	//==========================================================================
	// PURPOSE
	//==========================================================================
	
	/*
	
		This startup script creates an extra item "Goto Sample" in
		the right-click menu of the Paragraph/Character Styles panel.
		When the action is invoked, a text sample having the desired
		style is selected and shown in the active document.
		
		INSTALLATION. - Go into the `Scripts` folder of your InDesign
		install (i.e. right-click the User item from the Scripts
		panel and click Reveal in...). If not already here, create
		a `startup scripts` folder and put the present file
		`StyleListGotoSample.jsx` in that folder. Restart InDesign.
		
		If you no longer use the "Goto Sample" feature, quit InDesign
		and simply remove the file `StyleListGotoSample.jsx` from the
		`startup scripts` folder.

	*/

	const MENU_KEY = "$ID/RtMenuStyleListItem";
	
	const ACTION_NAME = (function(/*uint*/loc,  i)
	{
		i = 1*(loc==+Locale.FRENCH_LOCALE) ||
			2*(loc==+Locale.GERMAN_LOCALE) ||
			3*(loc==+Locale.SPANISH_LOCALE);
		return [ "Goto Sample", "Voir \xE9chantillon", "Gehe zu Beispiel", "Ir a ejemplo" ][i];
	})(+app.locale);

	const PTN = app.translateKeyString('$ID/Edit "^1"...').split('^1');

	(function(/*any*/ev,  ff,pp,MA,sma,MI,mni,doc,sty,FTP,a,t,tt,i,z,s)
	{
		MI = (t=app.menus.itemByName(MENU_KEY)).isValid && t.menuItems;
		if( !MI.length ) return;

		// Event manager.
		// ---
		if( (ev||0).isValid )
		{
			if( !(doc=app.properties.activeDocument||0).isValid ) return;

			// Get the style name under consideration.
			// ---
			a = MI.everyItem().name;
			z = a.length;
			for
			(
				t=PTN[0], tt=PTN[1], i=-1 ;
				++i < z && !( 0===a[i].indexOf(t) && tt===a[i].slice(-tt.length) ) ;
			);
			if( i >= z ) return;
			
			s = a[i].slice(t.length,-tt.length);
			if( !s.length ) return;
			
			// Identify the style.
			// [REM] So far I don't know how to decide which style panel is used,
			// therefore if the *same* style name exists in both Para & Char styles
			// we cannot be sure. At best, panel visibility may allow us to restrict
			// the search area.
			// ---
			a = [];
			(t=app.panels.itemByName("$ID/Character Styles")).isValid && t.visible && (a=doc.allCharacterStyles);
			(t=app.panels.itemByName("$ID/Paragraph Styles")).isValid && t.visible && (a.push.apply(a,doc.allParagraphStyles));
			a.length || (a=doc.allCharacterStyles.concat(doc.allParagraphStyles)); // Fallback

			for( i=a.length ; i-- && a[i].name !== s ; );
			sty = 0 <= i && a[i];
			if( !sty ) return;

			// Find it.
			// ---
			FTP = app.findTextPreferences;
			bkp = FTP.properties;
			app.findTextPreferences = null;
			FTP['applied'+sty.constructor.name] = sty;
			a=doc.findText();
			FTP.properties = bkp;
			
			if( a.length )
			{
				// [REM] Text.showText() is available since CS5.
				// ---
				try{ a[0].showText(); }catch(_){}
			}
			else
			{
				alert( "No result." );
			}

			return;
		}

		// Installer.
		// ---
		if( (ff=new File($.fileName)).exists )
		{
			// 1. Check or create the script menu action (session-persistent).
			// ---
			MA = app.scriptMenuActions;
			sma = false;
			pp =
			{
				title:  ACTION_NAME,
				name:   ACTION_NAME,
				label:  ff.absoluteURI,
			};
			for
			(
				a = (t=MA.itemByName(pp.title)).isValid ? t.getElements() : [] ;

				t=a.pop() ;

				false===sma && t.properties.label===pp.label
				// Already available?
				? ( sma=t )
				// Remove any undesired duplicate.
				: ( (tt=t.eventListeners).length && tt.everyItem().remove(), t.remove() )
			);

			// Need to create the menu action?
			// ---
			false===sma && (sma=MA.add(pp.title));
			
			// Always assign valid properties.
			// ---
			sma.properties = pp;
			
			// Re-attach event listeners if necessary.
			// ---
			i = (t=sma.eventListeners).length;
			if( 1 != i || ( i && t[0].isValid && t[0].handler.absoluteURI !=ff.absoluteURI ) )
			{
				if( 0 < i ){ t.everyItem().remove() }
				sma.addEventListener('onInvoke', ff);
			}
			
			// 2. Check or create the contextual menu item (app-persistent).
			// ---
			mni = false;
			for
			(
				a = (t=MI.itemByName(pp.title)).isValid ? t.getElements() : [] ;
				t=a.pop() ;
				// Remove any undesired duplicate.
				t.associatedMenuAction===sma && (mni ? t.remove() : (mni=t))
			);

			// Need to create the menu item?
			// Try..catch block in case `MI.add()` wouldn't work for some reason.
			// ---
			try{ mni||(mni=MI.add(sma, LocationOptions.AT_END)) }catch(_){}
		}

	})($.global.evt);

