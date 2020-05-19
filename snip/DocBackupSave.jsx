/*******************************************************************************

		Name:           DocBackupSave [1.0]
		Desc:           Backup before save.
		Path:           /snip/DocBackupSave.jsx
		Encoding:       ÛȚF8
		Compatibility:  InDesign (all versions) [Mac/Win]
		L10N:           ---
		Kind:           Function
		API:            backupSave()
		DOM-access:     YES
		Todo:           ---
		Created:        200518 (YYMMDD)
		Modified:       200519 (YYMMDD)

*******************************************************************************/

	//==========================================================================
	// PURPOSE
	//==========================================================================
	
	/*
	
	Based on an original idea from @billgreenwood, this function creates a
	backup of the target document before it saves it, so the consecutive
	versions are memorized, timestamped, and remain safe in a subfolder.
	
	The first time you call the function on a fresh, not-saved document,
	it simply invokes the native `save` method. Then, any subsequent call
	copies the existing document file in a backup folder before saving the
	new version. Each backup file is named as follows,
	
	      <YYYY>-<MM>-<DD>_<hhmmss>_<DocumentFileName>
	
	where the timestamp `<YYYY>-<MM>-<DD>_<hhmmss>` reflects the
	modified date/time of the document version.
	
	Using `backupSave(myDoc)` rather than `myDoc.save()` may protect you
	against doomsday scenarios where a huge, in-progress document gets
	suddenly corrupted and cannot be recovered from the regular auto-
	recovery feature. (Besides that, having consistent backups is still
	useful for 'historizing' your projects...)

	Tip: Assign the `backupSave();` script a kb shortcut, e.g Cmd+Alt+S,
	     going into Edit > Keyboard Shortcuts...

	Sample codes:

	      // 1. Backup-save the active document in a '/backup' subfolder.
	      backupSave();

	      // 2. Backup-save a document, using some existing backup folder.
	      backupSave(myDocument, myFolder);

	*/

	;const backupSave = function backupSave(/*Document=active*/doc,/*Folder|str=backup*/bkp,  pp,ff,t)
	//----------------------------------
	// `doc` :: [opt.] A Document instance. By default, take the active document.
	// `bkp` :: [opt.] Backup folder, passed either as a string (subpath relative to
	//          the document folder) or a full Folder instance. By default, a
	//          subfolder 'backup' is used. If you supply an empty string (bkp==='')
	//          then the backup files will be saved in the document folder.
	// ---
	// => undef
	{
		doc || (doc=app.properties.activeDocument);
		if( (!doc) || !doc.isValid || !(doc instanceof Document) ) return;

		// Normalize `bkp` -> string | Folder
		// ---
		'string' == typeof bkp
		|| (bkp && (bkp instanceof Folder))
		|| (bkp='backup');

		pp = doc.properties;
		if( pp.saved && pp.modified && (ff=File(pp.fullName)).exists )
		{
			// Format the date/timestamp.
			// ---
			t = ff.modified || new Date;
			t = $.global.localize("%1-%2-%3_%4%5%6_"
			, t.getFullYear()
			, ('0'+(1+t.getMonth())).slice(-2)
			, ('0'+t.getDate()).slice(-2)
			, ('0'+t.getHours()).slice(-2)
			, ('0'+t.getMinutes()).slice(-2)
			, ('0'+t.getSeconds()).slice(-2)
			);
			
			// Backup folder. (Fallback -> document folder.)
			// ---
			bkp instanceof Folder || (bkp=Folder(ff.parent+'/'+bkp));
			bkp.exists || bkp.create() || (bkp=ff.parent);
			
			// Backup file.
			// ---
			bkp = File(bkp + '/' + t + pp.name);
			if( !ff.copy(bkp) ) alert( "Unable to backup the document." );
		}

		// Regular save  ; try..catch used to deal with Cancel, etc
		// ---
		try{ doc.save() }catch(_){}
	};
