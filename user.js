module.exports = function () {
    var express = require('express');
    var router = express.Router();

    function getUsers(res, mysql, context, complete) {
        mysql.pool.query('SELECT uid, fname, lname, email, add_line1, add_line2, city, add_state, zip, num_reviews, shop_name'
            + ' FROM `user` LEFT JOIN `merchant` ON merchFK = mid;',
            function (err, results, fields) {
                if (err) {
                    res.write(JSON.stringify(err));
                    res.end();
                }
                context.user = results;
                complete();
            });
    }

    function getUser(res, mysql, context, uid, complete) {
        var sql = "SELECT uid, fname, lname, email, add_line1, add_line2, city, add_state, zip, num_reviews, shop_name FROM user LEFT JOIN `merchant` ON merchFK = mid WHERE uid = ?";
        var inserts = [uid];
        mysql.pool.query(sql, inserts, function (error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            }
            context.user = results[0];
            complete();
        });
    }

    /*Display all people. Requires web based javascript to delete users with AJAX*/

    router.get('/', function (req, res) {
        var callbackCount = 0;
        var context = {};
        context.jsscripts = ["deleteuser.js"];
        var mysql = req.app.get('mysql');
        getUsers(res, mysql, context, complete);
        function complete() {
            callbackCount++;
            if (callbackCount >= 1) {
                res.render('users', context);
            }
        }
    });

    /* Display one person for the specific purpose of updating people */
    router.get('/:uid', function (req, res) {
        callbackCount = 0;
        var context = {};
        context.jsscripts = ["../updateuser.js"];
        var mysql = req.app.get('mysql');
        getUser(res, mysql, context, req.params.uid, complete);
        function complete() {
            callbackCount++;
            if (callbackCount >= 1) {
                res.render('updateuser', context);
            }
        }
    });
	
    /* Adds a person, redirects to the user page after adding */

    router.post('/', function (req, res) {
        var mysql = req.app.get('mysql');
        var sql = "INSERT INTO user (fname, lname, email, add_line1, add_line2, city, add_state, zip) VALUES (?,?,?,?,?,?,?,?)";
        var inserts = [req.body.fname, req.body.lname, req.body.email, req.body.add_line1, req.body.add_line2, req.body.city, req.body.add_state, req.body.zip];
        sql = mysql.pool.query(sql, inserts, function (error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            } else {
                res.redirect('/user');
            }
        });
    });

    /* The URI that update data is sent to in order to update a person */

    router.put('/:uid', function (req, res) {
        var mysql = req.app.get('mysql');
        var sql = "UPDATE user SET fname=?, lname=?, email=?, add_line1=?, add_line2=?, city=?, add_state=?, zip=? WHERE uid=?";
        var inserts = [req.body.fname, req.body.lname, req.body.email, req.body.add_line1, req.body.add_line2, req.body.city, req.body.add_state, req.body.zip, req.params.uid];
        sql = mysql.pool.query(sql, inserts, function (error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            } else {
                res.status(200);
                res.end();
            }
        });
    });

    /* Route to delete a person, simply returns a 202 upon success. Ajax will handle this. */

    router.delete('/:uid', function (req, res) {
        var mysql = req.app.get('mysql');
        var sql = "CALL delete_user(?)";
        var inserts = [req.params.uid];
        sql = mysql.pool.query(sql, inserts, function (error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.status(400);
                res.end();
            } else {
                res.status(202).end();
            }
        })
    })

    return router;
}();