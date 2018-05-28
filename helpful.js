module.exports = function () {
    var express = require('express');
    var router = express.Router();
		
	/*Display all helpful reactions. Requires web based javascript to delete helfpul with AJAX*/

	function getHelpfuls(res, mysql, context, complete) {
	mysql.pool.query('SELECT marker.uid, marker.fname, marker.lname, rid, title, reviewer.fname AS rfname, reviewer.lname AS rlname '
					+ 'FROM `helpful` INNER JOIN `user` AS marker ON uid = userFK '
					+ 'INNER JOIN `review` ON rid = reviewFK '
					+ 'INNER JOIN `user` AS reviewer ON review.userFK = reviewer.uid',
		function (err, results, fields) {
			if (err) {
				res.write(JSON.stringify(err));
				res.end();
			}
			context.helpful = results;
			complete();
		});
	}

	function getHelpful(res, mysql, context, uid, rid, complete) {
		var sql = 'SELECT marker.uid, marker.fname, marker.lname, reviewFK, title, reviewer.fname AS rfname, reviewer.lname AS rlname '
					+ 'FROM `helpful` INNER JOIN `user` AS marker ON uid = userFK '
					+ 'INNER JOIN `review` ON rid = reviewFK '
					+ 'INNER JOIN `user` AS reviewer ON review.userFK = reviewer.uid '
					+ 'WHERE marker.uid = ? AND rid = ?';
		var inserts = [uid, rid];
		mysql.pool.query(sql, inserts, function (error, results, fields) {
			if (error) {
				res.write(JSON.stringify(error));
				res.end();
			}
			context.helpful = results[0];
			complete();
		});
    }
	
	function getUsers(res, mysql, context, complete) {
		var sql = 'SELECT uid, fname, lname FROM `user`';
		mysql.pool.query(sql, function (error, results, fields) {
			if (error) {
				res.write(JSON.stringify(error));
				res.end();
			}
			context.user = results;
			complete();
		});
    }
	
	function getUser(res, mysql, context, uid, complete) {
		var sql = 'SELECT uid, fname, lname FROM `user` WHERE uid = ?';
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
	
	function getUnhelpfulReviews(res, mysql, context, uid, rid, complete) {
		var sql = 'SELECT rid, title, fname, lname FROM review' +
		' INNER JOIN user ON uid = review.userFK' +
		' LEFT JOIN (SELECT userFK, reviewFK FROM helpful' +
		' WHERE userFK = ? AND reviewFK != ?) as notHelpful' +
		' ON rid = reviewFK' +
		' WHERE notHelpful.reviewFK IS NULL';
		var inserts = [uid, rid];
		mysql.pool.query(sql, inserts, function (error, results, fields) {
			if (error) {
				res.write(JSON.stringify(error));
				res.end();
			}
			context.unhelpful = results;
			complete();
		});
    }
	
    router.get('/', function (req, res) {
        var callbackCount = 0;
        var context = {};
        context.jsscripts = ["/deletehelpful.js"];
        var mysql = req.app.get('mysql');
        getUsers(res, mysql, context, complete);
		getHelpfuls(res, mysql, context, complete);
        function complete() {
            callbackCount++;
            if (callbackCount >= 2) {
                res.render('helpfuls', context);
            }
        }
    });
	
	/* Add a review for selected user */
	router.post('/add', function (req, res) {
        callbackCount = 0;
        var context = {};
		var mysql = req.app.get('mysql');
		getUser(res, mysql, context, req.body.uid, complete);
        getUnhelpfulReviews(res, mysql, context, req.body.uid, -1, complete);
        function complete() {
            callbackCount++;
            if (callbackCount >= 2) {
                res.render('addhelpful', context);
            }
        }
    });
	
	/* Display one review for the specific purpose of updating reviews */
    router.get('/:uid/:rid', function (req, res) {
		callbackCount = 0;
        var context = {};
        context.jsscripts = ["/updatehelpful.js"];
		var mysql = req.app.get('mysql');
        getUnhelpfulReviews(res, mysql, context, req.params.uid, req.params.rid, complete);
		getUser(res, mysql, context, req.params.uid, complete);
		getHelpful(res, mysql, context, req.params.uid, req.params.rid, complete);
        function complete() {
            callbackCount++;
            if (callbackCount >= 3) {
                res.render('updatehelpful', context);
            }
        }
    });
	
	/* Adds a helpful instance, redirects to the helpfuls page after adding */

    router.post('/', function (req, res) {
        var mysql = req.app.get('mysql');
        var sql = "INSERT INTO `helpful` (`userFK`, `reviewFK`) VALUES (?, ?)";
        var inserts = [req.body.uid, req.body.rid];
        sql = mysql.pool.query(sql, inserts, function (error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            } else {
                res.redirect('/helpful');
            }
        });
    });
	
	/* The URI that update data is sent to in order to update a review */

    router.put('/:uid/:rid', function (req, res) {
        var mysql = req.app.get('mysql');
        var sql = "UPDATE `helpful` SET reviewFK = ? WHERE userFK = ? AND reviewFK = ?";
		var inserts = [req.body.rid, req.params.uid, req.params.rid];
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
	
	/* Route to delete a helpful, simply returns a 202 upon success. Ajax will handle this. */

    router.delete('/:uid/:rid', function (req, res) {
		var mysql = req.app.get('mysql');
        var sql = "DELETE FROM `helpful` WHERE userFK = ? AND reviewFK = ?";
        var inserts = [req.params.uid, req.params.rid];
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