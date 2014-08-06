var crypto = require('crypto');
var nodemailer = require("nodemailer");
var config = require('../config');
var dao = require('./dao');

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


var sendMail = function(to, subject, text) {
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

exports.sendMail = sendMail;

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

exports.setUserSession = function(req, userId) {
  req.session.userId = userId;
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

exports.bulkMailForPost = function(req, res, post, unitId, tagIdArray) {

  var emailList = ''
  
  dao.getUsersByTagSubscriptions(req, res, unitId, tagIdArray, function(err, results){
      var length = results.length;
      for(var i=0;i<length-1;i++) {
        emailList = emailList + results[i] + ', ';
      }
      emailList = emailList + results[length-1];
      sendMail(emailList, 'New Update', post);
  });
  
}

exports.createStaticDataDict = function(data) {
  var dict = {};
  dict.organizationName = config.organizationName;
  dict.units = {};
  dict.ques_types = {};
  for(var i=0; i<data.length;i++) {
    var singleData = data[i];
    if(singleData['1'] === 1) {
      dict.units[singleData.unitId] = singleData.unit;
    } else {
      dict.ques_types[singleData.unitId] = singleData.unit;
    }
  }
  return dict;
}




