/*******************************************************************************

		Name:           LinkAutoUpdate [4.3]
		Desc:           Automatically updates 'out-of-date' links.
		Path:           /full/LinkAutoUpdate.jsx
		Encoding:       ÛȚF8
		Compatibility:  InDesign CS5/CS6/CC [Mac/Win]
		L10N:           ---
		Kind:           Script / Startup script
		API:            ---
		DOM-access:     YES
		Todo:           ---
		Created:        181604 (YYMMDD)
		Modified:       210221 (YYMMDD)

*******************************************************************************/

	//==========================================================================
	// PURPOSE
	//==========================================================================
	
	/*

	This script automatically updates 'out-of-date' links in InDesign. It is a
	listener. You can either run it manually during your session, or load it
	as a 'startup script'.
	
	An alternate code exists based on a script from あるふぁ（仮） :
	twitter.com/peprintenpa/status/1361132929678667787?ref_src=twsrc%5Etfw
	which listens to the event `afterAttributeChanged` and delegates the task
	to BridgeTalk.
	
	The present implementation relies on the event `afterLinksChanged`
	available in CS5/CS6/CC. Its target is the document itself, so we access
	the links from `ev.target.links.everyItem()`. (For the record, the
	alternate implementation is kept in the event handler.)

	*/

	#targetengine 'LinkAutoUpdate'
	
	'string' == typeof $.global.EVENT_TYPE
	|| ( $.global.EVENT_TYPE = 'afterLinksChanged'); // Alt. 'afterAttributeChanged'


	'function' == typeof $.global.onEvent || ($.global.onEvent= function onEvent(/*{eventType,target}*/ev,  tg,s,i)
	//----------------------------------------------------------
	// ev.eventType :: 'afterLinksChanged'  |  'afterAttributeChanged'
	// ev.target    :: Document             |  any
	{
		const OUTDATED = LinkStatus.LINK_OUT_OF_DATE.toString();

		if( !(tg=(ev||0).target) ) return;
		
		if( 'afterLinksChanged' == ev.eventType )
		{
			if( (!(tg instanceof Document)) || !(tg=tg.links.everyItem()).isValid ) return;
			
			try
			{
				s = tg.status;                                        // LinkStatus[]
				if( -1 == (s=s.join('|')).indexOf(OUTDATED) ) return; // Aborts faster.
				for
				(
					s=s.split('|'), tg=tg.getElements(), i=tg.length ;
					i-- ;
					OUTDATED===s[i] && tg[i].update()
				);
			}
			catch(e)
			{
				alert($.engineName + " Error:\r" + e);
			}

			return;
		}

		// Alternate code.
		// ---
		if( 'afterAttributeChanged' == ev.eventType )
		{
			if( 'Link' != tg.constructor.name || tg.status != LinkStatus.LINK_OUT_OF_DATE ) return;

			// ---
			// We cannot simply invoke `tg.update()` from within the event handler
			// as InDesign would consider it 'removing' the event target and fire a
			// runtime error. The solution is to delegate the task to BridgeTalk.
			// ---

			with( new BridgeTalk )
			{
				target = BridgeTalk.appSpecifier + '#' + $.engineName;
				body = $.global.localize('try{resolve(%1).update()}catch(e){alert("%2 Error:\r"+e)}'
					, tg.toSpecifier().toSource()
					, $.engineName
					);
				send();
			}
		}

	})
	.help = $.global.localize("%1\r\r%2\r\r%1"
	, '-----------------------'
	, [
	    "> Out-of-date links will refresh automatically.",
	    "> Re-run this script to turn it off.",
	    "[Tip] Put the JSX file in your `startup scripts` folder to make it automatically active."
	  ].join('\r\r')
	);

	(function(/*str*/evType,/*str*/name,/*fct*/callback,  t,evls,MX_SAVE,doc)
	//----------------------------------------------------------
	// Install/uninstall the listener.
	{
		evls = app.eventListeners;
		if( (t=evls.itemByName(name)).isValid && t.properties.handler===callback )
		{
			t.remove();
			alert(name + " is turned OFF.");
		}
		else
		{
			MX_SAVE = app.performanceMetric(+PerformanceMetricOptions.MINISAVE_COUNT);

			// Autofix the active document, if relevant.
			// ---
			if( (doc=app.properties.activeDocument) && 'afterLinksChanged'==evType )
			{
				callback({target:doc, eventType:evType});
			}
			
			// Prevent alert on automatic startup.
			// ---
			if( 0 < MX_SAVE ) alert(name + " is turned ON.\r\r" + callback.help);

			evls.add(evType,callback,void 0,{name:name});
		}

	})(EVENT_TYPE, $.engineName, onEvent);
