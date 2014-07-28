var mysql = require('mysql');

var connection = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : 'root123',
    database : 'mydatabase'
});

var selectPostQuery = 'select p.postId as postId, p.post as post, DATE_FORMAT( p.dateOfPosting,  "%h:%i:%s %d-%m-%Y " )  as dateOfPosting, u.name as name, u.userId as userId from post p inner join user u on p.userId = u.userId ';

exports.getOrganizationById = function(req, res, organizationId, func) {

    connection
            .query(
                    'SELECT o.organization, o.email, u.unit, u.unitId FROM organization o inner join organization_unit ou on o.organizationId = ou.organizationId inner join unit u on ou.unitId = u.unitId where o.organizationId = '
                            + organizationId, func);
};

exports.getUserById = function(req, res, userId, func) {

    connection.query(
            'SELECT u.userId, u.name, u.organizationId, u.lastLogin, us.unitId, us.tagId FROM user u left join user_subscriptions us on u.userId = us.userId where u.userId = '
                    + userId, func);

};

exports.getUserByEmailId = function(req, res, emailId, func) {

    connection.query('SELECT count(*) FROM user where emailId = "' + emailId
            + '"', func);

};

exports.getUserByLogin = function(req, res, emailId, password, func) {

    connection.query(
            'SELECT userId, organizationId FROM user where emailId = "'
                    + emailId + '" and password = "' + password
                    + '" and code = ""', func)

};

exports.updateUserLastLogin = function(req, res, userId, time, func) {
    connection.query(
            'update user set lastLogin = "' + time + '" where userId = ' + userId, func)

};


exports.getTagsByOrganization = function(req, res, unitId, organizationId, func) {

    connection.query('SELECT tagId, tag FROM tag where organizationId = '
            + organizationId + ' and unitId = ' + unitId + ' order by tag desc', func);

};

exports.getTagsByUser = function(req, res, userId, func) {

    connection.query('SELECT * FROM tag where userId = ' + userId, func);

};

exports.getTagsByPost = function(req, res, postId, func) {
    connection.query('SELECT t.tag FROM post_tag pt inner join tag t on pt.tagId = t.tagId where postId = ' + postId, func);

};

exports.getPostsByOrganization = function(req, res, organizationId, unitId,
        tagIdArray, func, lastLogin) {
    
    
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

    query = query + ' p.organizationId = ' + organizationId
            + ' and p.unitId = ' + unitId;
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

exports.addUser = function(req, res, name, emailId, password, code,
        organizationId, func) {

    connection.query(
            'insert into user (emailId, name, password, code, organizationId) values("'
                    + emailId + '", "' + name + '", "' + password + '", "'
                    + code + '", ' + organizationId + ')', func);

};

exports.addTag = function(req, res, tag, unitId, organizationId, userId, func) {
    
    connection.query(
            'insert into tag (tag, unitId, organizationId, userId) values("' + tag
                    + '", ' + unitId + ', ' + organizationId + ', ' + userId + ')', func);
    
};

exports.addPost = function(req, res, post, organizationId, unitId, tagIdArray,
        userId, func) {

    var query = 'insert into post (post, organizationId, unitId, userId) values("'
            + post
            + '", '
            + organizationId
            + ', '
            + unitId
            + ', '
            + userId
            + ')';
    var error = false;
    if (post.trim().length > 0) {
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
}

exports.addComment = function(req, res, comment, postId, userId, func) {
    
    connection.query('insert into comment (comment, postId, userId) values("'
            + comment + '", ' + postId + ', ' + userId + ')', func);
    
};

exports.addUserSubscriptions = function(req, res, userId, unitId, tagIdArray, func) {
    
    connection.query('delete from user_subscriptions where userId = ' + userId, function(err, results){
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
                                        + ')',
                                function(err,
                                        results) {

                                });
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

    connection.query('delete FROM post where tagId = ' + tagId, func);

};

exports.updateTag = function(req, res, tagId, tag, func) {

    connection.query('update tag set tag = ' + tag + ' where tagId = ' + tagId,
            func);

};