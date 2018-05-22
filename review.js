module.exports = function () {
    var express = require('express');
    var router = express.Router();
		
	/*Display all reviews. Requires web based javascript to delete reviews with AJAX*/

	function getReviews(res, mysql, context, complete) {
	mysql.pool.query('SELECT rid, rating, title, body, fname, lname, listing_title FROM `review`'
        + ' INNER JOIN `user` ON userFK = uid INNER JOIN `listing` ON listingFK = lid',
		function (err, results, fields) {
			if (err) {
				res.write(JSON.stringify(err));
				res.end();
			}
			context.review = results;
			complete();
		});
	}
	
	function getUsers(res, mysql, context, complete) {
        mysql.pool.query('SELECT uid, fname, lname FROM `user`',
            function (err, results, fields) {
                if (err) {
                    res.write(JSON.stringify(err));
                    res.end();
                }
                context.user = results;
                complete();
            });
    }
	
	function getListings(res, mysql, context, complete) {
        mysql.pool.query('SELECT lid, listing_title FROM `listing`',
            function (err, results, fields) {
                if (err) {
                    res.write(JSON.stringify(err));
                    res.end();
                }
                context.listing = results;
                complete();
            });
    }
	
	function getReview(res, mysql, context, rid, complete) {
		var sql = 'SELECT rid, rating, title, body, fname, lname, listing_title FROM `review`'
        + ' INNER JOIN `user` ON userFK = uid INNER JOIN `listing` ON listingFK = lid'
		+ ' WHERE rid = ?';
		var inserts = [rid];
		mysql.pool.query(sql, inserts, function (error, results, fields) {
			if (error) {
				res.write(JSON.stringify(error));
				res.end();
			}
			context.review = results[0];
			complete();
		});
    }
	
    router.get('/', function (req, res) {
        var callbackCount = 0;
        var context = {};
        context.jsscripts = ["deletereview.js"];
        var mysql = req.app.get('mysql');
		getUsers(res, mysql, context, complete);
		getListings(res, mysql, context, complete);
        getReviews(res, mysql, context, complete);
        function complete() {
            callbackCount++;
            if (callbackCount >= 3) {
                res.render('reviews', context);
            }
        }
    });
	
	/* Display one review for the specific purpose of updating reviews */
    router.get('/:rid', function (req, res) {
        callbackCount = 0;
        var context = {};
        context.jsscripts = ["../updatereview.js"];
        var mysql = req.app.get('mysql');
        getReview(res, mysql, context, req.params.rid, complete);
        function complete() {
            callbackCount++;
            if (callbackCount >= 1) {
                res.render('updatereview', context);
            }
        }
    });
	
	/* Adds a review, redirects to the reviews page after adding */

    router.post('/', function (req, res) {
        var mysql = req.app.get('mysql');
        var sql = "CALL add_review(?, ?, ?, ?, ?)";
        var inserts = [req.body.rating, req.body.title, req.body.body, req.body.listingFK, req.body.userFK];
        sql = mysql.pool.query(sql, inserts, function (error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            } else {
                res.redirect('/review');
            }
        });
    });
	
	/* The URI that update data is sent to in order to update a review */

    router.put('/:rid', function (req, res) {
        var mysql = req.app.get('mysql');
        var sql = "CALL update_review(?, ?, ?, ?, ?, ?)";
        var inserts = [req.params.rid, req.body.rating, req.body.title, req.body.body, req.body.userFK, req.body.listingFK];
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
	
	/* Route to delete a review, simply returns a 202 upon success. Ajax will handle this. */

    router.delete('/:rid', function (req, res) {
        var mysql = req.app.get('mysql');
        var sql = "CALL delete_review(?)";
        var inserts = [req.params.rid];
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