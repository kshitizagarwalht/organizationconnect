var mysql = require('mysql');
var config = require('../config');

var connection = mysql.createConnection({
    host : config.database.host,
    user : config.database.user,
    password : config.database.password,
    database : config.database.database
});

var selectPostQuery = 'select p.postId as postId, p.post as post, DATE_FORMAT( p.dateOfPosting,  "%h:%i:%s %d-%m-%Y " )  as dateOfPosting, u.name as name, u.userId as userId from post p inner join user u on p.userId = u.userId ';

exports.getStaticData = function(req, res, func) {

    connection
            .query(
                    'SELECT unit, unitId, 1 FROM unit union select type, typeId, 2 FROM post_type', func);
};

exports.getUserById = function(req, res, userId, func) {

    connection.query('SELECT u.userId, u.name, u.lastLogin, u.unitId FROM user u where u.userId = ' + userId, func);

};

exports.getUserByUnitId = function(req, res, unitId, func) {

    connection.query('SELECT u.name, u.emailId FROM user u where u.unitId = ' + unitId, func);

};

exports.getUserSubscriptions = function(req, res, userId, func, unitId) {

    var query = 'SELECT us.unitId, us.tagId from user_subscriptions us where us.userId = ' + userId;

    if(typeof(unitId) != 'undefined') {
        query = query + ' and us.unitId = ' + unitId;
    }
    
    connection.query(query, func);

};

exports.getUserByEmailId = function(req, res, emailId, func) {

    connection.query('SELECT count(*) FROM user where emailId = "' + emailId
            + '"', func);

};


exports.getBirthDayUsers = function(req, res, date, func) {

    connection.query('SELECT name, emailId, unitId FROM user where dateOfBirth = "' + date
            + '"', func);

};

exports.getUserByLogin = function(req, res, emailId, password, func) {
    
    connection.query(
            'SELECT userId FROM user where emailId = "'
                    + emailId + '" and password = "' + password
                    + '" and code = ""', func)

};

exports.updateUserLastLogin = function(req, res, userId, time, func) {
    connection.query(
            'update user set lastLogin = "' + time + '" where userId = ' + userId, func)

};


exports.getTagsByUnit = function(req, res, unitId, func) {

    connection.query('SELECT t.tagId, t.tag, t.userId, u.name FROM tag t inner join user u on t.userId = u.userId where unitId = ' + unitId + ' order by tag desc', func);

};


exports.getTagsByPost = function(req, res, postId, func) {
    connection.query('SELECT t.tag FROM post_tag pt inner join tag t on pt.tagId = t.tagId where pt.postId = ' + postId, func);

};

exports.getPostsByUnit = function(req, res, unitId, tagIdArray, typeId, func, lastLogin) {
    
    var query = selectPostQuery;
            
    if (typeof (tagIdArray) != 'undefined') {

        query = query + ' INNER JOIN post_tag pt ON p.postId = pt.postId ';
        
        query = query + ' where pt.tagId in (';
        var length = tagIdArray.length;

        for ( var i = 0; i < length - 1; i++) {
            query = query + tagIdArray[i] + ', ';
            
        }
        query = query + tagIdArray[length - 1] + ') and ';
    } else {
        query = query + ' where ';
    }

    query = query  + ' p.unitId = ' + unitId;

    if(typeId !== '-1') {
        query = query + ' and p.typeId = ' + typeId;
    }

    if(typeof(lastLogin) != 'undefined')  {
        query = query + ' and p.dateOfPosting >= "' + lastLogin + '"';
    }      
    query = query + ' order by p.dateOfPosting desc';
    connection.query(query, func);

};


exports.getCommentsByPost = function(req, res, postId, func) {

    connection.query('select c.commentId, c.comment, c.userId, c.dateOfCommenting, u.name from comment c inner join user u on c.userId = u.userId  where postId = ' + postId + ' order by dateOfCommenting desc', func);
};


exports.getPostsByUser = function(req, res, userId, func) {

    connection.query(selectPostQuery + ' where p.userId = ' + userId, func);

};

exports.addUser = function(req, res, name, emailId, password, code, func) {

    connection.query(
            'insert into user (emailId, name, password, code) values("'
                    + emailId + '", "' + name + '", "' + password + '", "'
                    + code + ')', func);

};

exports.addTag = function(req, res, tag, unitId, userId, func) {
    
    connection.query(
            'insert into tag (tag, unitId, userId) values("' + tag
                    + '", ' + unitId + ', ' + userId + ')', func);
    
};

exports.addPost = function(req, res, post, unitId, tagIdArray, postTypeId, userId, func) {

    var query = 'insert into post (post, unitId, userId, typeId) values("'
            + post
            + '", '
            + unitId
            + ', '
            + userId
            + ', '
            + postTypeId
            + ')';
    var error = false;
    
    if (typeof (tagIdArray) != 'undefined') {
        connection
                .query(
                        query,
                        function(err, results) {

                            var postId = results.insertId;
                            var length = tagIdArray.length;
                            for(var i=0;i<length-1;i++)
                            {            
                                        connection
                                                .query(
                                                        'insert into post_tag (postId, tagId) values ('
                                                                + postId
                                                                + ', '
                                                                + tagIdArray[i]
                                                                + ')',
                                                        function(err,
                                                                results) {

                                                            if (err) {
                                                                connection
                                                                        .query(
                                                                                'delete from post_tag where postId = '
                                                                                        + postId,
                                                                                function(
                                                                                        err,
                                                                                        results) {
                                                                                    connection
                                                                                            .query(
                                                                                                    'delete from post where postId = '
                                                                                                            + postId,
                                                                                                    func);
                                                                                });
                                                            }
                                                        });
                                    };

                               
                                    connection
                                                .query(
                                                        'insert into post_tag (postId, tagId) values ('
                                                                + postId
                                                                + ', '
                                                                + tagIdArray[length-1]
                                                                + ')',
                                                        func);
                                      
                        });
    } else {
        connection.query(query, func);
    }
    
}

exports.addComment = function(req, res, comment, postId, userId, func) {
    
    connection.query('insert into comment (comment, postId, userId) values("'
            + comment + '", ' + postId + ', ' + userId + ')', func);
    
};

exports.addUserSubscriptions = function(req, res, userId, unitId, tagIdArray, func) {
    
    connection.query('delete from user_subscriptions where userId = ' + userId + ' and unitId = ' + unitId, function(err, results){
        if(err == null) {
            var length = tagIdArray.length;
            for(var i=0;i<length-1;i++) {
                connection
                        .query(
                                'insert into user_subscriptions (userId, unitId, tagId) values ('
                                        + userId
                                        + ', '
                                        + unitId
                                        + ', '
                                        + tagIdArray[i]
                                        + ')');
                }
                connection.query(
                                'insert into user_subscriptions (userId, unitId, tagId) values ('
                                        + userId
                                        + ', '
                                        + unitId
                                        + ', '
                                        + tagIdArray[length-1]
                                        + ')',
                                func);
                                                  

        } else {
            console.log(err)
        }
    });
    
};

exports.getUsersByTagSubscriptions = function(req, res, unitId, tagIdArray, func) {

    query = 'SELECT distinct u.emailId from user u inner join user_subscriptions us on u.userId = us.userId where us.unitId = ' + unitId;

    if (typeof (tagIdArray) != 'undefined') {
        query = query + ' and us.tagId in (';
        var length = tagIdArray.length;

        for ( var i = 0; i < length - 1; i++) {
            query = query + tagIdArray[i] + ', ';
            
        }
        query = query + tagIdArray[length - 1] + ')';
    }
    
    connection.query(query, func);
};


exports.verifyUser = function(req, res, emailId, code, func) {

    connection.query('update user set code = "" where emailId = "' + emailId
            + '" and code = "' + code + '"', func);

};

exports.deletePost = function(req, res, postId, func) {

    connection.query('delete FROM post where postId = ' + postId, func);

};

exports.deleteComment = function(req, res, commentId, func) {

    connection
            .query('delete FROM comment where commentId = ' + commentId, func);

};

exports.deleteTag = function(req, res, tagId, func) {

    connection.query('delete FROM tag where tagId = ' + tagId, func);

};

exports.updateTag = function(req, res, tagId, tag, func) {

    connection.query('update tag set tag = ' + tag + ' where tagId = ' + tagId,
            func);

};