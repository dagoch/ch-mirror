
		var colorThief = new ColorThief();

// for decimal to hex color conversion	
function rgbToHex(R,G,B) {return toHex(R)+toHex(G)+toHex(B)}
function toHex(n) {
 n = parseInt(n,10);
 if (isNaN(n)) return "00";
 n = Math.max(0,Math.min(n,255));
 return "0123456789ABCDEF".charAt((n-n%16)/16)
      + "0123456789ABCDEF".charAt(n%16);
}

function chObjsByColor(hexcolor) {
	// show what color we're looking for (for debugging)
	$("#color-swatch").html("Color: #"+hexcolor);
	$("#color-swatch").css('background-color',hexcolor);
	$("#color-swatch").show();

		qryStr = "&color="+hexcolor;
		chSearchObjs(qryStr);
}

function chSearchObjs(qryStr) {
			// jquery ajax call to cooper hewitt museum api
	var token = 'ab2420224c8ad118c80f216fc888d045';  // sorry guys, should hide this server side somewhere, but this is quick-and-dirty

	var CHapi = "https://api.collection.cooperhewitt.org/rest/";
	var method = "method=cooperhewitt.search.objects";



	var url = CHapi + "?" + method + "&access_token=" + token;
		url += "&has_images=1";  // Only get objects with images
	url += qryStr;

console.log("URL = "+url);

		// some info for debugging
	var ch_out = $("#ch_output").html();
	console.log("Got from art: \n"+ch_out);
	ch_out += "<p>Querying API URL = " + url + "</p>\n";
	$("#ch_output").html(ch_out);	
	//$("#ch_output").show();
	
	// show 'loading' spinner
	$("#loading").show();

	// Call the museum api
	$.getJSON(url,
		function(resp) {
			 // debugging: log each key in the response data
			$.each( resp, function( key, value ) {
				console.log( key + " : " + value );
			});

			var artInfo = '';

			var numObjects = resp.total;
			ch_out += "<p>Found "+numObjects+" Objects</p>\n";
			var perPage = resp.per_page;
			if (numObjects>perPage) {
				numObjects = perPage;  // Don't pick an object that's not in the first page 
			}

			if (numObjects>0) {  // we got results, let's pick one
				var pick = Math.floor(Math.random()*numObjects);
				console.log("Picking Object number "+pick);
				var yourObject = resp.objects[pick];
				console.log(JSON.stringify(yourObject));

				var objTitle = yourObject.title;
		 		var objUrl = yourObject.url;
				artInfo = '<p><a href="' + objUrl + '">' + objTitle + '</a></p>\n';

		 		// console.log(JSON.stringify(yourObject.images[0].b));
		 		// $.each(yourObject.images[0], function(key, value) {
		 		// 	console.log( key + " : " + value );
		 		// 	if (value.is_primary == 1) {
		 		// 		console.log("Primary url = "+value.url);
		 		// 	}
		 		// });
			// For simplicity I'm assuming that images[0] is the primary image
			//  All images seem to have b, n and z entries (full size, thumbnail, and in-between)
			//  Get the big one, and let the browser reduce it if need be.
				var imageUrl = yourObject.images[0].b.url;
				var imageHeight = yourObject.images[0].b.height;
				$("#art").css('background-image', 'url(' + imageUrl + ')');
				$("#art").css('height',imageHeight);   // show full height of the image


	 		} else {
	 			// no objects returned.  Bummer
	 			artInfo = 'No objects in the Cooper-Hewitt collection matched the current weather.  Try again later.';

	 		}
	 		$("#loading").hide();
	


			$("#art_info").html(artInfo);
			$("#art_info").show();


		}
	);
}

$(function(){
	$( '#example' ).photobooth().on( "image", function( event, dataUrl ){
		$( "#gallery" ).show().html( '<img src="' + dataUrl + '" >');

	// now find colors from the camera image and use to retrieve objects from cooper hewitt
	myImage = new Image(); 
	myImage.src = dataUrl;
	// image takes time to load; must not call colorthief before it is loaded!
	myImage.onload = function() { 

		var hexcolor = null;
		var domcolor = null;
		var palette = colorThief.getPalette(myImage, 6);  // get six colors from image
		for (i=0; i<palette.length; i++) {
			thisColor = palette[i];
				// convert domColor to hex color string
			hexcolor = rgbToHex(thisColor[0],thisColor[1],thisColor[2]);
			console.log("in hex: "+hexcolor);
			if (i==0) { // first color found is dominant color
				domcolor = hexcolor;
			}

			// check if it's grey: if rgb are all within 16 of each other
			if (Math.abs(thisColor[0]-thisColor[1]) < 16) {
				if (Math.abs(thisColor[2]-thisColor[0]) < 16) {
					if (Math.abs(thisColor[2]-thisColor[1]) > 16) {
						break;  // this color is not grey, so we can use it
					}
				} else {
					break;  // this color is not grey, so we can use it
				}
			} else {
				break;  // this color is not grey, so we can use it
			}
		}
		if (hexcolor) {
			console.log("found non-grey color: "+hexcolor);
		} else {
			 // found no non-grey color, so just use the first one (the dominant color)
			hexcolor = domcolor;
			console.log("dom color in hex: "+hexcolor);
		}

		chObjsByColor(hexcolor);
	}

	});

	/**
	* Tab boxes
	*/
	$( '.tab_container' ).each(function( i, elem ){
		$( elem ).find( ".tabs li" ).click(function(){
			$( elem ).find( ".tabs li.selected" ).removeClass( "selected" );
			$( this ).addClass( "selected" );
			$( elem ).find( ".tab_content" ).hide();
			$( elem ).find( ".tab_content." + $(this).attr( "calls" ) ).show();
		});
	});

	/**
	* Link highlighting
	*/
	$( "a" ).click(function(){
		$( "#nav a.selected" ).removeClass( "selected" );
		$( "#nav a[href=" + $(this).attr( "href" ) + "]" ).addClass( "selected" );
	});
});