var crypto = require('crypto');
var nodemailer = require("nodemailer");
var config = require('../config');

var smtpTransport = nodemailer.createTransport("SMTP",{
   service: "Gmail",
   auth: {
       user: config.emailUsername,
       pass: config.emailPassword
   }
});


exports.encryptPassword = function(password) {
	return crypto.createHash('sha256').update(password).digest("hex");
}

exports.randomString = function() {
	return crypto.randomBytes(20).toString('hex');
}

exports.getUserIdFromSession = function(req){
  return req.session.userId;	
};

exports.getOrganizationIdFromSession = function(req){
  return req.session.organizationId;  
};


exports.sendMail = function(to, subject, text) {
	smtpTransport.sendMail({
    to: to, 
    subject: subject, 
    text: text 
	}, function(error, response){
    if(error){
       return false;
    } else{
       return true;
    }
  });
}  

exports.authenticateUser = function(req, res) {
  if(typeof(req.session.userId) == 'undefined') {
    res.redirect('/');
  } 
}

exports.checkUserLoginStatus = function(req, res) {
  if(typeof(req.session.userId) != 'undefined') {
    res.redirect('/home');
  } 
};

exports.setUserSession = function(req, userId, organizationId) {
  req.session.userId = userId;
  req.session.organizationId = organizationId;
};

exports.destroySession = function(req) {
  req.session.destroy();
};

exports.getBaseUrl = function(req) {
  return req.protocol + '://'+ req.headers.host;
}

exports.getTagIdArray = function(tagIdArray) {
  if(typeof(tagIdArray) == 'string') {
      tagIdArray = [tagIdArray]
  }
  return tagIdArray;
}

exports.jsDateToSqlDate = function(date) {
  return date.getFullYear() + '-' + date.getMonth() + '-' + date.getDay() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
}

exports.createUserDict = function(data) {
  var dict = {};
  var firstData = data[0];
  var userId = firstData.userId;
  dict[userId] = {'name':data[0].name, 'tagList':{}};
  var tagList = dict[userId].tagList;
  for(var i=0; i<data.length;i++) {
    var unitId = data[i].unitId;
    if(unitId in tagList) {
      tagList[unitId].push(data[i].tagId);
    } else {
      tagList[unitId] = [data[i].tagId];
    }
  }

  return dict;
}



