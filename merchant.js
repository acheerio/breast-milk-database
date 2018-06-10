module.exports = function () {
    var express = require('express');
    var router = express.Router();
		
	/*Display all people. Requires web based javascript to delete users with AJAX*/

	function getMerchants(res, mysql, context, complete) {
	mysql.pool.query('SELECT mid, shop_name, ave_reviews_rcvd, num_reviews_rcvd, total_listings, active_listings, fname, lname FROM `merchant` INNER JOIN `user` ON merchFK = mid',
		function (err, results, fields) {
			if (err) {
				res.write(JSON.stringify(err));
				res.end();
			}
			context.merchant = results;
			complete();
		});
	}
	
	function getMerchant(res, mysql, context, mid, complete) {
		var sql = "SELECT mid, shop_name, CAST(ave_reviews_rcvd AS DECIMAL(2,1)) as ave_reviews_rcvd, num_reviews_rcvd, total_listings, active_listings, fname, lname FROM `merchant` INNER JOIN `user` ON merchFK = mid WHERE mid = ?";
		var inserts = [mid];
		mysql.pool.query(sql, inserts, function (error, results, fields) {
			if (error) {
				res.write(JSON.stringify(error));
				res.end();
			}
			context.merchant = results[0];
			complete();
		});
    }
	
	function getUsers(res, mysql, context, mid, complete) {
		var sql = 'SELECT uid, fname, lname FROM `user` WHERE merchFK IS NULL OR merchFK = ?';
		var inserts = [mid];
		mysql.pool.query(sql, inserts, function (error, results, fields) {
			if (error) {
				res.write(JSON.stringify(error));
				res.end();
			}
			context.user = results;
			complete();
		});
	}
	
	function getUser(res, mysql, context, mid, complete) {
		var sql = 'SELECT uid FROM `user` WHERE merchFK = ?';
		var inserts = [mid];
		mysql.pool.query(sql, inserts, function (error, results, fields) {
			if (error) {
				res.write(JSON.stringify(error));
				res.end();
			}
			context.oldUser = results[0];
			complete();
		});
	}
	
    router.get('/', function (req, res) {
        var callbackCount = 0;
        var context = {};
        context.jsscripts = ["/deletemerchant.js"];
        var mysql = req.app.get('mysql');
        getMerchants(res, mysql, context, complete);
		getUsers(res, mysql, context, -1, complete);
        function complete() {
            callbackCount++;
            if (callbackCount >= 2) {
                res.render('merchants', context);
            }
        }
    });

    /* Display one person for the specific purpose of updating people */
    router.get('/:mid', function (req, res) {
        callbackCount = 0;
        var context = {};
        context.jsscripts = ["/updatemerchant.js"];
        var mysql = req.app.get('mysql');
        getMerchant(res, mysql, context, req.params.mid, complete);
		getUsers(res, mysql, context, req.params.mid, complete);
		getUser(res, mysql, context, req.params.mid, complete);
		console.log(context);
        function complete() {
            callbackCount++;
            if (callbackCount >= 3) {
                res.render('updatemerchant', context);
            }
        }
    });
	
    /* Adds a merchant, redirects to the merchant page after adding */

    router.post('/', function (req, res) {
        var mysql = req.app.get('mysql');
		var sql = "CALL add_merchant(?, ?)";
        var inserts = [req.body.shop_name, req.body.user];
        sql = mysql.pool.query(sql, inserts, function (error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            } else {
                res.redirect('/merchant');
            }
        });
    });

    /* The URI that update data is sent to in order to update a merchant */

    router.put('/:mid', function (req, res) {
        var mysql = req.app.get('mysql');
        var sql = "CALL update_merchant(?, ?, ?)";
        var inserts = [req.params.mid, req.body.shop_name, req.body.uid];
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

    router.delete('/:mid', function (req, res) {
        var mysql = req.app.get('mysql');
        var sql = "CALL delete_merchant(?)";
        var inserts = [req.params.mid];
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