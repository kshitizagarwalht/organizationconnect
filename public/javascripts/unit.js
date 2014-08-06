"use strict";

var unitId = 1;
var usertagList = [];

function init() {
	
	var urlVars = getUrlVars();
	if(typeof(urlVars['unitId']) != 'undefined') {
		unitId = urlVars['unitId'];
		$('#unit'+unitId).addClass('active');
	}
	getUserSubscriptions(2, unitId)
}

function getUnitId() {
	return unitId;
}

function getLatestPosts() {
	getPostsByUnit();
}

function getTagsByUnit() {
	$.ajax({
		url : url + "/getTagsByUnit/",
		traditional : true,
		data : {
			'unitId' : getUnitId()
		},
		success : function(data) {
			var tagList = '';
			var tagTable = '';
			for ( var i = 0; i < data.length; i++) {
				var tag = data[i]["tag"];
				var tagId = data[i]['tagId'];
				tagList = tagList
						+ getTagCheckBox(tagId, tag)
				tagTable = tagTable + getTagTableRow(tagId, tag, data[i].userId);	
			}
			$('#tagList').html(tagList);
			if(tagTable.length === 0) {
				$('#noTagsFoundForSubs').show();
				$('#subscribeUser').hide();
			} else {
				$('#noTagsFoundForSubs').hide();
				$('#subscribeUser').show();
				$('#tagTable').html(tagTable);
			}
			getLatestPosts();
		}
	});
}

function getTagCheckedStatus(tagId) {
	return (typeof(usertagList) !== 'undefined' && usertagList.indexOf(tagId) > -1) ? "checked" : "";
}

function getTagTableRow(tagId, tag, userId) {
	
	var block = '<tr><td><input type="checkbox" value="' + tagId
			+ '" id="' + tagId + 's"' + getTagCheckedStatus(tagId) + '></td><td><label  for="' + tagId
			+ 's" style="font-size:0.8em;font-weight: 400;"> <span>' + tag + '</span></label>';
	if(userId == window.userId) {
		block = block + '&nbsp;&nbsp;&nbsp;<button type="button" class="btn btn-danger btn-xs" onclick="deleteElement(' + tagId + ', \'tag\')">Delete</button>';
	}		
	block = block + '</td></tr>';		
	return block;		
}

function getTagCheckBox(tagId, tag) {

	return '<span class="tagCheckBox"><input type="checkbox" value="' + tagId
			+ '" id="' + tagId + '"' + getTagCheckedStatus(tagId) + '>&nbsp;<label  for="' + tagId
			+ '" class="content"> <span class="label label-info" style="font-size:0.9em">' + tag + '</span></label></span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
}

function getSelectedTags(id) {
	var tagIdList = [];
	$("#" + id + " :checked").each(function(a) {
		tagIdList.push($(this).val());
	});
	return tagIdList;
}

init();

$( window ).load(function() {

		function submitPost() {
			var post = $('#enterPost').val().replace(/(?:\r\n|\r|\n)/g, '<br />').replace(/"/g, '&&&').replace(/\t/g, '&nbsp;').trim();
			
			$.ajax({
				url : url + "/addPost/",
				type : "POST",
				data : {
					'post' : post,
					'unitId' : getUnitId(),
					'tagIdArray' : getSelectedTags('tagList'),
					'postTypeId' : $('#selectPostType').val()
				},
				traditional : true,
				success : function(data) {
					if(data == true) {
						getLatestPosts();
					}
				}
			});
		}

		function submitTag() {
			var tag = $('#enterTag').val().trim();
			$.ajax({
				url : url + "/addTag/",
				type : "POST",
				data : {
					'tag' : tag,
					'unitId' : getUnitId()
				},
				traditional : true,
				success : function(data) {
					getTagsByUnit();
				}
			});
		}

		function subscribeUser() {
			$.ajax({
				url : url + "/addUserSubscriptions/",
				type : "POST",
				data : {
					'unitId' : getUnitId(),
					'tagIdArray' : getSelectedTags('tagTable')
				},
				traditional : true,
				success : function(data) {
					if(data == true) {
						$('#subscriptionDone').show();
					}
				}
			});
		}

		$('#submitPost').click(function() {
			submitPost();
		});

		$('#submitTag').click(function() {
			submitTag();
		});

		$('#subscribeUser').click(function() {
			subscribeUser();
		});

		$("#tagList").change(function() {
			getLatestPosts();
		});


});