// ch-mirror.js
//  where our appplication code lives

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

console.log("Calling getJson: "+(new Date()));
	// Call the museum api
	$.getJSON(url,
		function(resp) {
			 // debugging: log each key in the response data
			 console.log("Got json from museum: "+(new Date()));
			// $.each( resp, function( key, value ) {
			// 	console.log( key + " : " + value );
			// });

			var artInfo = '';

			var numObjects = resp.total;
			ch_out += "<p>Found "+numObjects+" Objects</p>\n";
			var perPage = resp.per_page;
			if (numObjects>perPage) {
				numObjects = perPage;  // Don't pick an object that's not in the first page 
			}

			if (numObjects>0) {  // we got results, let's pick one
				objPicked = false;
			  do {
				var pick = Math.floor(Math.random()*numObjects);
				console.log("Picking Object number "+pick);
				var yourObject = resp.objects[pick];
				//console.log(JSON.stringify(yourObject));

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
				var imageWidth = yourObject.images[0].b.width;

				// check if image is vertical within usual formats
				if (imageHeight/imageWidth > 1.3 && imageHeight/imageWidth < 1.8) {
					//var cont = $("#art").html();
					$("#art").html('<img src="'+imageUrl+'">');
					// $("#art").css('background-image', 'url(' + imageUrl + ')');
					// $("#art").css('height',imageHeight);   // show full height of the image
					// $("#art").css('width',imageWidth);
					objPicked = true;
				}
			  } while (!objPicked);  // TODO: THIS WILL LOOP FOREVER IF THERE ARE NO VERTICAL IMAGES IN RETURNED OBJECTS!



	 		} else {
	 			// no objects returned.  Bummer
	 			artInfo = 'No objects in the Cooper-Hewitt collection matched the current weather.  Try again later.';

	 		}
	 		$("#loading").hide();
	


			$("#art_info").html(artInfo);
			$("#art_info").show();
			console.log("Done showing image: "+(new Date()));


		}
	);
}

function chMirror(dataUrl) {
	// now find colors from the camera image and use to retrieve objects from cooper hewitt
	myImage = new Image(); 
	myImage.src = dataUrl;
	// image takes time to load; must not call colorthief before it is loaded!
	myImage.onload = function() { 

		var hexcolor = null;
		var domcolor = null;
		var palette = colorThief.getPalette(myImage, 8);  // get six colors from image

 

		for (i=0; i<palette.length; i++) {
			thisColor = palette[i];
				// convert domColor to hex color string
			red = thisColor[0];
			green = thisColor[1];
			blue = thisColor[2];
			hexcolor = rgbToHex(red,green,blue);
			console.log("in hex: "+hexcolor);
			if (i==0) { // first color found is dominant color
				domcolor = hexcolor;
			}

		  if (0) {
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
		  } else {
		  	// here, use HSB to find first bright color
		  	// L (lightness) = (M + m) / 2, where M is max(R, G, B) and m is min(R, G, B)
		  	maxC = Math.max(red,green,blue);
		  	minC = Math.min(red,green,blue);
		  	B = (maxC + minC)/2;
		  	// S (saturation) = 0, if R = G = B, otherwise 255 * (M - m) / (M + m), if L < 128, otherwise 255 * (M - m) / (511 - (M + m))
		  	S = 0;
		  	if (red == green && red == blue) {
		  		S = 0;
		  	} else if (B<128) {
		  		S = 255 * (maxC-minC)/(maxC+minC);
		  	} else { // B>128
		  		S= 255 * (maxC - minC) / (511 - (maxC + minC));
		  	}
		  	console.log("S = "+S+" and B = "+B);
		  	if (S>32 && B>32 && B<224) {
		  		console.log("choosing this color: "+hexcolor);
		  		break;
		  	}
		  }
		}
		if (i<palette.length) {
			console.log("found non-grey color: "+hexcolor);
		} else {
			 // found no non-grey color, so just use the first one (the dominant color)
			hexcolor = domcolor;
			console.log("dom color in hex: "+hexcolor);
		}

		chObjsByColor(hexcolor);
	}

	}