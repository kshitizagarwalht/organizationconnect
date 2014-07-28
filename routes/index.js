var express = require('express');
var router = express.Router();
var dao = require('./dao');
var config = require('../config');
var service = require('./service');


/* GET login page. */
router.get('/', function(req, res) {
  service.checkUserLoginStatus(req, res);
  res.render('index', {'baseUrl': service.getBaseUrl(req)});
});




router.get('/home', function(req, res) {
  service.authenticateUser(req, res);
  dao.getOrganizationById(req, res, service.getOrganizationIdFromSession(req), function(err, results){
         res.render('home', {'userId':service.getUserIdFromSession(req), 'organization':results, 'baseUrl': service.getBaseUrl(req)});      
  });
  
});



router.post('/register', function(req, res) {
  var emailId = req.body.emailprefix + config.emailSuffix;
  dao.getUserByEmailId(req, res, emailId, function(err, results){
    
      if(results.length > 0) {
        res.send('0');
      } else {
        dao.addUser(req, res, req.body.name, emailId, service.encryptPassword(req.body.password), service.randomString(), 1, function(err, results){
        if(err === null) {
          service.sendMail(emailId, 'done', 'link');
          res.send('1');
        } else {
          res.send('2');
        }
      });
    }
  });

  
});

router.get('/verifyUser', function(req, res) {

    dao.verifyUser(req, res, req.query.emailId, req.query.code, function(err, results){
        if(err === null) {
          res.redirect('/');
        }
    });
});

router.post('/login', function(req, res) {
  
  dao.getUserByLogin(req, res, req.body.emailId, service.encryptPassword(req.body.password), function(err, results){
        if(results.length > 0) {
          result = results[0];
        // Setting userId in session
          service.setUserSession(req, result.userId, result.organizationId);
          dao.updateUserLastLogin(req, res, service.getUserIdFromSession(req),  service.jsDateToSqlDate(new Date()), function(err, results){
             res.send(true)
          });
        } else {
          res.send(false);
        }
    });
});

router.get('/getUserById', function(req, res) {

  dao.getUserById(req, res, service.getUserIdFromSession(req), function(err, results){

      var userDict = service.createUserDict(results);

      var userId = 0;
      for(var key in userDict) {
        userId = key;
        break;
      }
      
      res.send({'name':userDict[userId].name, 'tagList':userDict[userId].tagList});      
  });
  
});

router.get('/getTagsByOrganization', function(req, res) {
  dao.getTagsByOrganization(req, res, req.query.unitId, service.getOrganizationIdFromSession(req), function(err, results){
        res.send(results)
  });
});

router.get('/getTagsByPost', function(req, res) {
  dao.getTagsByPost(req, res, req.query.postId, function(err, results){
        res.send(results)
  });
});


router.get('/getPostsByOrganization', function(req, res) {
  var tagIdArray = service.getTagIdArray(req.query.tagIdArray);
  dao.getPostsByOrganization(req, res, service.getOrganizationIdFromSession(req), req.query.unitId, tagIdArray, function(err, results){
        res.send(results);
    }, req.query.lastLogin);  
});

router.get('/getCommentsByPost', function(req, res) {
  dao.getCommentsByPost(req, res, req.query.postId, function(err, results){
        res.send(results);
      });  
});


router.post('/addPost', function(req, res) {
    var tagIdArray = service.getTagIdArray(req.body.tagIdArray);
    var post = req.body.post.trim();
    if(post.length > 0) {
        dao.addPost(req, res, post, service.getOrganizationIdFromSession(req), req.body.unitId, tagIdArray, service.getUserIdFromSession(req), function(err, results){  
        if(err == null) {
          res.send(true)  
        } else {
          res.send(false)
        }
      });
    } else {
      res.send(false)
    } 
});

router.post('/addComment', function(req, res) {
  var comment = req.body.comment.trim();
  if(comment.length > 0) {
    dao.addComment(req, res, comment, req.body.postId, service.getUserIdFromSession(req), function(err, results){
      if(err == null) {
        res.send(results.insertId.toString())  
      } else {
        res.send(false)
      }
    });
  } else {
    res.send(false)
  } 
});

router.post('/addTag', function(req, res) {
  var tag = req.body.tag.trim();
  if(tag.length > 0) {
    dao.addTag(req, res, tag, req.body.unitId, service.getOrganizationIdFromSession(req), service.getUserIdFromSession(req), function(err, results){
     if(err == null) {
        res.send(results.insertId.toString())  
      } else {
        res.send(false)
      }
    });
  } else {
    res.send(false)
  }
});

router.post('/addUserSubscriptions', function(req, res) {

    var tagIdArray = service.getTagIdArray(req.body.tagIdArray);
    if (typeof (tagIdArray) != 'undefined') {
      dao.addUserSubscriptions(req, res, service.getUserIdFromSession(req), req.body.unitId, tagIdArray, function(err, results){  
          if(err == null) {
            res.send(true);  
          } else {
            res.send(false);
          }
      });  
    } else {
      res.send(false);
    }     
});


router.post('/deletePost', function(req, res) {
  dao.deletePost(req, res, req.body.postId, function(err, results){
    res.send(err)
  });
});

router.post('/deleteComment', function(req, res) {
  dao.deleteComment(req, res, req.body.commentId, function(err, results){
    res.send(err)
  }); 
});

router.post('/deleteTag', function(req, res) {
  dao.deleteTag(req, res, req.body.tagId, function(err, results){
    res.send(err)
  });
});

router.post('/updateTag', function(req, res) {
  dao.updateTag(req, res, req.body.tagId, req.body.tag, function(err, results){
    res.send(err)
  });
});

router.get('/logout', function(req, res) {
  service.destroySession(req);
  res.redirect('/');
});

router.get('/:organization', function(req, res) {
  service.authenticateUser(req, res);
  dao.getOrganizationById(req, res, service.getOrganizationIdFromSession(req), function(err, results){
         res.render('unit', {'userId':service.getUserIdFromSession(req), 'organization':results, 'baseUrl': service.getBaseUrl(req)});      
  });
  
});

module.exports = router;
