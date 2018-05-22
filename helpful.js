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
		var sql = 'SELECT marker.uid, marker.fname, marker.lname, rid, title, reviewer.fname AS rfname, reviewer.lname AS rlname '
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
	
    router.get('/', function (req, res) {
        var callbackCount = 0;
        var context = {};
        context.jsscripts = ["deletehelpful.js"];
        var mysql = req.app.get('mysql');
        getHelpfuls(res, mysql, context, complete);
        function complete() {
            callbackCount++;
            if (callbackCount >= 1) {
                res.render('helpfuls', context);
            }
        }
    });
	
	/* Display one review for the specific purpose of updating reviews */
    router.get('/:uid/:rid', function (req, res) {
        callbackCount = 0;
        var context = {};
        context.jsscripts = ["../updatehelpful.js"];
        var mysql = req.app.get('mysql');
        getHelpful(res, mysql, context, req.params.lid, complete);
        function complete() {
            callbackCount++;
            if (callbackCount >= 1) {
                res.render('updatelisting', context);
            }
        }
    });
	
    return router;
}();