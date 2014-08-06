"use strict";

var usertagList = {};

function getLatestPosts() {

	if(Object.keys(usertagList).length > 0) {
		for(var key in usertagList) {
			getPostsByUnit(key, usertagList[key]);
		}
	} else {
		$('#nosubscribedtags').show();
	}
	
}

function init() {
	$('#navhome').addClass('active');
	getUserSubscriptions(1);
}

init();