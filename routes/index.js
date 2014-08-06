var express = require('express');
var router = express.Router();
var dao = require('./dao');
var config = require('../config');
var service = require('./service');


// User subscriptions are taken saperately from ajax call and not included in base as the returned object values appear as string when using in javascript
// user subscriptions need to be called out saperately
function base(req, res, func) {
  dao.getStaticData(req, res, function(err, results){
      var data = {};
      data.staticData = service.createStaticDataDict(results);
      data.baseUrl = service.getBaseUrl(req);
      
      dao.getUserById(req, res, service.getUserIdFromSession(req), function(err, results){
          data.userBasicInfo = results[0];
          func.call(this, data)
      }, req.query.unitId);
  });
}

/* GET login page. */
router.get('/', function(req, res) {
  service.checkUserLoginStatus(req, res);
  res.render('index', {'baseUrl': service.getBaseUrl(req), 'user':{'userId':0}});
});


router.get('/home', function(req, res) {
  service.authenticateUser(req, res);
  base(req, res, function(data){
      res.render('home', {'user':data.userBasicInfo, 'staticData':data.staticData, 'baseUrl': data.baseUrl});      
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
          service.setUserSession(req, result.userId);
          dao.updateUserLastLogin(req, res, service.getUserIdFromSession(req),  service.jsDateToSqlDate(new Date()), function(err, results){
             res.send(true)
          });
        } else {
          res.send(false);
        }
    });
});

router.get('/getUserSubscriptions', function(req, res) {

  dao.getUserSubscriptions(req, res, service.getUserIdFromSession(req), function(err, results){
    res.send(results)
  }, req.query.unitId);
  
});

router.get('/getTagsByUnit', function(req, res) {
  dao.getTagsByUnit(req, res, req.query.unitId, function(err, results){
        res.send(results)
  });
});

router.get('/getTagsByPost', function(req, res) {
  dao.getTagsByPost(req, res, req.query.postId, function(err, results){
        res.send(results)
  });
});


router.get('/getPostsByUnit', function(req, res) {
  var tagIdArray = service.getTagIdArray(req.query.tagIdArray);
  dao.getPostsByUnit(req, res, req.query.unitId, tagIdArray, req.query.typeId, function(err, results){
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
        dao.addPost(req, res, post, req.body.unitId, tagIdArray, req.body.postTypeId, service.getUserIdFromSession(req), function(err, results){  
        if(err == null) {
          service.bulkMailForPost(req, res, post, req.body.unitId, tagIdArray);
          res.send(true);  
        } else {
          res.send(false);
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
    dao.addTag(req, res, tag, req.body.unitId, service.getUserIdFromSession(req), function(err, results){
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


router.post('/deletepost', function(req, res) {
  dao.deletePost(req, res, req.body.id, function(err, results){

    if(err == null) {
      res.send(true);  
    } else {
      res.send(false);
    }
  });
});

router.post('/deletecomment', function(req, res) {
  dao.deleteComment(req, res, req.body.id, function(err, results){
    if(err == null) {
      res.send(true);  
    } else {
      res.send(false);
    }
  }); 
});

router.post('/deletetag', function(req, res) {
  dao.deleteTag(req, res, req.body.id, function(err, results){
    if(err == null) {
      res.send(true);  
    } else {
      res.send(false);
    }
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
  base(req, res, function(data){
      res.render('unit', {'user':data.userBasicInfo, 'staticData':data.staticData, 'baseUrl': data.baseUrl});      
  });
});

module.exports = router;
