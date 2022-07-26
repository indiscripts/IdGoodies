/*******************************************************************************

		Name:           CustomTextSortParagraphs
		Desc:           Custom sort of InDesign paragraphs.
		Path:           /tests/CustomTextSortParagraphs.jsx
		Encoding:       ÛȚF8
		Compatibility:  InDesign (all versions) [Mac/Win]
		L10N:           ---
		Kind:           Script ; using ../snip/TextSortParagraphs.jsx
		API:            ---
		DOM-access:     YES
		Todo:           ---
		Created:        220726 (YYMMDD)
		Modified:       220726 (YYMMDD)

*******************************************************************************/

	// For a standalone script, copy the contents of `snip/TextSortParagraphs.jsx`
	// and replace the #include directive below by the clipboard:
	#include '../snip/TextSortParagraphs.jsx'

	//==========================================================================
	// Testing the snippet with a custom order function - cf https://adobe.ly/3Oz8LNQ
	//==========================================================================

	const myCustomOrder = function(/*PluralParagraph*/pev,  q,r,n,i,z,k)
	//----------------------------------
	// WARNING: Make sure the returned strings do not contain \0
	// => str[]
	{
		// <ParagraphStyleName> => final order
		q = callee.Q||(callee.Q=
		{
			'Item Number' :     1,
			'Name' :            2,
			'Name Chinese' :    3,
			'Details' :         4,
			'Details Chinese' : 5,
			'Size' :            6,
			'Size Chinese' :    7,
			'Price' :           8,
		});
		
		const CHR = String.fromCharCode;

		// r :: ParagraphStyle[]  -->  str[]
		// ---
		r = pev.appliedParagraphStyle;
		for
		(
			z=1, n=r.length, i=-1 ;
			++i < n ;
			r[i]=q.hasOwnProperty(k=r[i].name) ? CHR(z,q[k]) : CHR(++z)
		);

		return r;
	};

	sortParagraphs(app.selection[0].parentStory, void 0, myCustomOrder);

