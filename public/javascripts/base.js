"use strict";

function getUserById(signal) {
	$.ajax({
		url : url + "/getUserById/",
		traditional : true,
		success : function(data) {
			$('#homeLink').text(data.name);
			switch(signal) {
				case 1:
					usertagList = data.tagList;
					for(var key in usertagList) {
						getPostsByOrganization(key, usertagList[key]);
					}
					break;
				case 2:
					usertagList = data.tagList[unitId];
					break;
			}
		}
	});
}


function getUrlVars() {
	var urlVars = {};
	window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(c,
			variable, value) {
		urlVars[variable] = value
	});
	return urlVars;
}


function getPostBlock(postId, post, name, dateOfPosting, tag) {
	return '<div class="panel panel-default"><div id="' + postId + '" class="panel-heading"><p class="post">' + post.replace(/&&&/g, '"') + '</p><p class="postInfo">Posted on : ' + dateOfPosting + ' by ' + name + '</p><div id="' + postId + 't"></div></div><div class="panel-body"><input type="text" id="' +postId
			+ 'c" placeholder="comment" class="form-control" style="width:50%"></input><br><button class="btn btn-success btn-xs"  onclick="submitComment(' + postId + ')">submit comment</button><br><br><ul class="list-group" id="' + postId + 'cd"></ul></div></div><br><br>';
	
}

function getCommentBlock(commentId, comment, name, dateOfCommenting) {
	return '<li class="list-group-item"><p class="comment">' + comment + '</p><p class="commentInfo">commented on ' + dateOfCommenting + ' by ' + name + '</p></li>';
}

function getPostsByOrganization() {

	if(arguments.length > 0) {
		var unitId = arguments[0];
		var tagIdArray = arguments[1];
	} else {
		var tagIdArray = getSelectedTags('tagList');
		var unitId = getUnitId();
	}
	
	$.ajax({
		url : url + "/getPostsByOrganization/",
		data : {
			'unitId' : unitId,
			'tagIdArray' : tagIdArray
		},
		traditional : true,
		success : function(posts) {
			$('#postList').html('');
			if(posts.length > 0) {
				$('#postMessage').hide();
				
				for(var i=0;i<posts.length;i++) {
					var post = posts[i];
					var postId = post.postId
					$('#postList').append(getPostBlock(postId, post.post, post.name, post.dateOfPosting));
					getCommentsByPost(postId);
					getTagsByPost(postId);
				}
			} else {
				$('#postMessage').show();
			}
		}
	});
}

function getCommentsByPost(postId) {
	$.ajax({
		url : url + "/getCommentsByPost/",
		data : {
			'postId' : postId
		},
		traditional : true,
		success : function(comments) {
			var commentList = '';
			for(var j=0; j<comments.length; j++) {
				var comment = comments[j];
				commentList = commentList + getCommentBlock(comment.commentId, comment.comment, comment.name, comment.dateOfCommenting)
			}
			$('#' + postId + 'cd').html(commentList);	
		}
	});
}

function getTagsByPost(postId) {
	$.ajax({
		url : url + "/getTagsByPost/",
		traditional : true,
		data : {
			'postId' : postId
		},
		success : function(data) {
			var tagList = ''
			for ( var i = 0; i < data.length; i++) {
				tagList = tagList + '<span class="badge">' +  data[i].tag + '</span>&nbsp;'
			}
			$('#'+postId+'t').append(tagList)
		}
	});
}

function submitComment(postId) {
			
			var id = '#' + postId + 'c';
			var comment = $(id).val().trim();
			$.ajax({
				url : url + "/addComment/",
				type : "POST",
				data : {
					'comment' : comment,
					'postId' : postId
				},
				traditional : true,
				success : function(data) {
					getCommentsByPost(postId);
				}
			});
}