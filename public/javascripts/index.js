"use strict";

$( window ).load(function() {

	var messages = {'emptyEmailId' : 'Please enter your email Id',
					'emptyPassword' : 'Please enter your password',
					'emptyName' : 'Please enter your name',
					'emailIdRegistered' : 'Your emailId is already registered',
					'registrationDone' : 'done',
					'invalidLogin' : 'Wrong Username or password'} 

	function validateInputs(emailId,  password, name) {
		if(emailId.length == 0) {
			return messages.emptyEmailId;
		} else if(password.length == 0) {
			return messages.emptyPassword;
		} if(typeof(name) !='undefined' && name.length == 0) {
			return messages.emptyName;
		} else return null;
	}


	function register() {

		var name = $("#rname").val().trim();
		var emailprefix = $("#remailId").val().trim();
		var password = $("#rpassword").val().trim();

		var message = validateInputs(emailprefix, password, name);
		if(message != null) {
			$("#rmessage").html(message);
		} else {
		
		 	$.ajax({
				url : url + "/register/",
				data : {
					name : name,
					emailprefix : emailprefix,
					password : password
				},
				type : "POST",
				traditional : true,
				success : function(data) {
					if(data == '0') {
						$("#rmessage").html(messages.emailIdRegistered);
					} else if(data == '1') {
						$("#rmessage").html(messages.registrationDone);
					}

				}
			});
	 	}
	}

	$("#register").click(function() {
		register();
	});

	$('#rname, #rpassword, #remailId').keypress(function(e) {
	    if(e.which == 13) {
	        register();
	    }
	});

	function login() {
		var emailId = $("#lemailId").val().trim();
		var password = $("#lpassword").val().trim();

		var message = validateInputs(emailId, password);

		if(message != null) {
			$("#lmessage").html(message);
		} else {
		
		 	$.ajax({
				url : url + "/login/",
				data : {
					emailId : emailId,
					password : password
				},
				type : "POST",
				traditional : true,
				success : function(data) {
					if(data == true) {
						window.location.href = url + '/home/';
					} else  {
						$("#lmessage").html(messages.invalidLogin);
					}
				}
			});
	 	}
	}

	$('#lemailId, #lpassword').keypress(function(e) {
	    if(e.which == 13) {
	        login();
	    }
	});


	$("#login").click(function() {
		login();	
	});

});