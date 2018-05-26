module.exports = function () {
    var express = require('express');
    var router = express.Router();

	/*Display all listings. Requires web based javascript to delete listings with AJAX*/
	
	/*
	function getListings(res, mysql, context, merch_id, complete) {
		var myquery;
		if (merch_id == null)
		{
			myquery = 'SELECT lid, listing_title, shop_name, amount, price, price_per, dairy_free, frozen, '
		+ 'date_start, date_end, post_time, active FROM `listing`'
		+ ' INNER JOIN `merchant` ON merchFK = mid';
		}
		else
		{
			myquery = 'SELECT lid, listing_title, shop_name, amount, price, price_per, dairy_free, frozen, '
		+ 'date_start, date_end, post_time, active FROM `listing`'
		+ ' INNER JOIN `merchant` ON merchFK = mid WHERE mid = ' + mid;
		}
		mysql.pool.query(myquery,
		function (err, results, fields) {
			if (err) {
				res.write(JSON.stringify(err));
				res.end();
			}
			context.listing = results;
			complete();
		});
	}*/
	
	function getListings(res, mysql, context, complete) {
		mysql.pool.query('SELECT lid, listing_title, shop_name, amount, price, price_per, dairy_free, frozen,'
        + ' date_start, date_end, post_time, active FROM `listing`'
		+ ' INNER JOIN `merchant` ON merchFK = mid',
		function (err, results, fields) {
			if (err) {
				res.write(JSON.stringify(err));
				res.end();
			}
			context.listing = results;
			complete();
		});
	}
	
	
	function getListing(res, mysql, context, lid, complete) {
		var sql = 'SELECT lid, listing_title, shop_name, amount, price, price_per, dairy_free, frozen,'
        + ' date_start, date_end, post_time, active FROM `listing`'
		+ ' INNER JOIN `merchant` ON merchFK = mid'
		+ ' WHERE lid = ?';
		var inserts = [lid];
		mysql.pool.query(sql, inserts, function (error, results, fields) {
			if (error) {
				res.write(JSON.stringify(error));
				res.end();
			}
			context.listing = results;
			complete();
		});
    }

    function filterListing(res, mysql, context, mid, complete) {
        var sql = 'SELECT lid, listing_title, shop_name, amount, price, price_per, dairy_free, frozen,'
            + ' date_start, date_end, post_time, active FROM `listing`'
            + ' INNER JOIN `merchant` ON merchFK = mid'
            + ' WHERE mid = ?';
        var inserts = [mid];
        mysql.pool.query(sql, inserts, function (error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            }
            context.listing = results;
            complete();
        });
    }
	
	function getMerchants(res, mysql, context, complete) {
        mysql.pool.query('SELECT mid, shop_name FROM `merchant`',
            function (err, results, fields) {
                if (err) {
                    res.write(JSON.stringify(err));
                    res.end();
                }
                context.merchant = results;
                complete();
            });
    }
	
	/* Display all listings. Requires web based javascript to delete listings with AJAX */
    router.get('/', function (req, res) {
        var callbackCount = 0;
		/*
		var mid = req.body.mid;
		console.log('mid = ' + mid);
		*/
        var context = {};
        context.jsscripts = ["/deletelisting.js"];
        var mysql = req.app.get('mysql');
		getMerchants(res, mysql, context, complete);
		/*
		getListings(res, mysql, context, mid, complete);
		*/
		getListings(res, mysql, context, complete);
        function complete() {
            callbackCount++;
            if (callbackCount >= 2) {
                res.render('listings', context);
            }
        }
    });

    /* Display listings filtered by merchant */
    router.get('/filter/:mid', function (req, res) {
        callbackCount = 0;
        var context = {};
        context.jsscripts = ["/filterlisting.js"];
        var mysql = req.app.get('mysql');
        getMerchants(res, mysql, context, complete);
        filterListing(res, mysql, context, req.params.mid, complete);
        function complete() {
            callbackCount++;
            if (callbackCount >= 2) {
                res.render('filterlisting', context);
            }
        }
    });
	
	/* Display one listing for the specific purpose of updating listings */
    router.get('/:lid', function (req, res) {
        callbackCount = 0;
        var context = {};
        context.jsscripts = ["/updatelisting.js"];
        var mysql = req.app.get('mysql');
        getListing(res, mysql, context, req.params.lid, complete);
        function complete() {
            callbackCount++;
            if (callbackCount >= 1) {
                res.render('updatelisting', context);
            }
        }
    });
    	
	/* Adds a listing, redirects to the listings page after adding */
	
    router.post('/', function (req, res) {
        var mysql = req.app.get('mysql');
        var sql = "CALL add_listing(?, ?, ?, ?, ?, ?, ?, ?)";
        var inserts = [req.body.listing_title, req.body.amount, req.body.price, req.body.dairy_free, req.body.frozen, req.body.date_start, req.body.date_end, req.body.merchFK];
        sql = mysql.pool.query(sql, inserts, function (error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            } else {
                res.redirect('/listing');
            }
        });
    });
	
    /* The URI that update data is sent to in order to update a listing */

    router.put('/:lid', function (req, res) {
        var mysql = req.app.get('mysql');
        var sql = "CALL update_listing(?, ?, ?, ?, ?, ?, ?, ?, ?)";
        var inserts = [req.params.lid, req.body.listing_title, req.body.amount, req.body.price, req.body.dairy_free, req.body.frozen, req.body.date_start, req.body.date_end, req.body.active];
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
	
    /* Route to delete a listing, simply returns a 202 upon success. Ajax will handle this. */
	
	router.delete('/:lid', function (req, res) {
        var mysql = req.app.get('mysql');
        var sql = "CALL delete_listing(?)";
        var inserts = [req.params.lid];
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
