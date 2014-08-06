"use strict";


function getTagList(data) {
	  var tagList = {};
	  for(var i=0; i<data.length;i++) {
	    var unitId = data[i].unitId;
	    if(unitId in tagList) {
	      tagList[unitId].push(data[i].tagId);
	    } else {
	      tagList[unitId] = [data[i].tagId];
	    }
	  }
	  return tagList;
}
 
function getUserSubscriptions(signal, unitId) {
	$.ajax({
		url : url + "/getUserSubscriptions/",
		data : {
			'unitId' : unitId
		},
		traditional : true,
		success : function(data) {
			data = getTagList(data);

			switch(signal) {
				case 1:
					usertagList = data;
					getLatestPosts();
					break;
				case 2:
					usertagList = data[unitId];
					getTagsByUnit();
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


function getPostBlock(postId, post, name, dateOfPosting, userId) {
	
	var block = '<div id="' + postId + '" class="panel panel-default"><div  class="panel-heading"><p class="post">' + post.replace(/&&&/g, '"') + '</p><p class="postInfo">Posted on : ' + dateOfPosting + ' by ' + name + '</p><div id="' + postId + 't"></div>';
	if(userId == window.userId) {
		block = block + '<br><button type="button" class="btn btn-danger btn-xs" onclick="deleteElement(' + postId + ', \'post\')">Delete</button>'
	}
	block = block + '</div><div class="panel-body"><input type="text" id="' +postId
			+ 'c" placeholder="comment" class="form-control" style="width:50%"></input><br><button class="btn btn-success btn-xs"  onclick="submitComment(' + postId + ')">submit comment</button><br><br><ul class="list-group" id="' + postId + 'cd"></ul></div><br><br></div>'		
	return block;		
	
}

function getCommentBlock(commentId, comment, name, dateOfCommenting, userId, postId) {
	var block = '<li class="list-group-item" id="' + commentId + '"><p class="comment">' + comment + '</p><p class="commentInfo">commented on ' + dateOfCommenting + ' by ' + name + '</p>';
	if(userId == window.userId) {
		block = block + '<button type="button" class="btn btn-danger btn-xs" onclick="deleteElement(' + commentId + ', \'comment\')">Delete</button>'
	}
	block = block + '</li>';
	return block;
}


function deleteElement(id, type, postId) {
	
	if (confirm('Are you sure you want to delete this ' + type + ' ?' )) {
			$.ajax ({
			url : url + "/delete" + type + "/",
			data : {
				'id' : id
			},
			type : "POST",
			traditional : true,

			success : function(data) {
				if(data == true) {
					if(type==='tag') {
						window.location.href = window.location;
					} else {
						$('#' + id).remove();
					}
				}
			}
		});
	}
}

function getPostsByUnit() {

	if(arguments.length > 0) {
		var unitId = arguments[0];
		var tagIdArray = arguments[1];
	} else {
		var tagIdArray = getSelectedTags('tagList');
		var unitId = getUnitId();
	}
	
	$.ajax({
		url : url + "/getPostsByUnit/",
		data : {
			'unitId' : unitId,
			'tagIdArray' : tagIdArray,
			'typeId' : $('#filterByPost').val()
		},
		traditional : true,
		success : function(posts) {
			$('#postList').html('');
			if(posts.length > 0) {
				$('#postMessage').hide();
				$('#filterByPost').show();
				
				for(var i=0;i<posts.length;i++) {
					var post = posts[i];
					var postId = post.postId
					$('#postList').append(getPostBlock(postId, post.post, post.name, post.dateOfPosting, post.userId));
					getCommentsByPost(postId);
					getTagsByPost(postId);
				}
			} else {
				$('#postMessage').show();
				$('#filterByPost').show();
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
				commentList = commentList + getCommentBlock(comment.commentId, comment.comment, comment.name, comment.dateOfCommenting, comment.userId, postId)
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
				tagList = tagList + '<span class="badge" id="' + data[i].tagId + '">' +  data[i].tag + '</span>&nbsp;'
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

$( window ).load(function() {
	$("#filterByPost").change(function() {
			getLatestPosts();
	});
});