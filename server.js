var express = require('express');
var mysql = require('./dbcon.js');
var bodyParser = require('body-parser');
var path = require('path');

var app = express();
var handlebars = require('express-handlebars').create({ defaultLayout: 'main' });
var handlebarsintl = require('handlebars-intl');

/*
var logicHelper = handlebars.create({
    helpers: {
        ifEquals: function (key, value, options) {
            if (key === value) {
                return options.fn(this);
            }
            return options.inverse(this);
        }
    }
});
*/

app.engine('handlebars', handlebars.engine);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'handlebars');
app.set('port', process.argv[2]);
app.set('mysql', mysql);

app.get('/', function (req, res, next) {
    var context = {};
    res.render('home', context);
});

app.use('/user', require('./user.js'));

app.use('/merchant', require('./merchant.js'));

app.use('/review', require('./review.js'));

app.use('/listing', require('./listing.js'));

app.use('/helpful', require('./helpful.js'));

app.use('/updatemerchants', function (req, res, next) {
    res.render('updatemerchants');
});

/*
app.use('/listings', function (req, res, next) {
    var context = {};
    mysql.pool.query('SELECT lid, listing_title, shop_name, amount, price, price_per, dairy_free, frozen, '
        + 'date_start, date_end, post_time, active FROM `listing`'
        + ' INNER JOIN `merchant` ON merchFK = mid;', function (err, rows, fields) {
            if (err) {
                console.log(err);
                return;
            }
            context.listing = rows;
            res.render('listings', context);
        });
});
*/

app.use('/updatelistings', function (req, res, next) {
    res.render('updatelistings');
});
/*
app.use('/reviews', function (req, res, next) {
    var context = {};
    mysql.pool.query('SELECT rid, rating, title, body, fname, lname, listing_title FROM `review`'
        + ' INNER JOIN `user` ON userFK = uid INNER JOIN `listing` ON listingFK = lid;',
        function (err, rows, fields) {
            if (err) {
                console.log(err);
                return;
            }
            context.review = rows;
            res.render('reviews', context);
        });
});
*/

app.use('/updatereviews', function (req, res, next) {
    res.render('updatereviews');
});

/*
app.use('/helpful', function (req, res, next) {
    var context = {};
    mysql.pool.query('SELECT uid, fname, lname, rid, rating, title FROM `helpful`'
            +' INNER JOIN `user` ON uid = userFK'
            +' INNER JOIN `review` ON rid = reviewFK;',
        function (err, rows, fields) {
            if (err) {
                console.log(err);
                return;
            }
            context.helpful = rows;
            res.render('helpful', context);
        });
});
*/

app.use('/updatehelpful', function (req, res, next) {
    res.render('updatehelpful');
});

app.use(function (req, res) {
    res.status(404);
    res.render('404');
});

app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500);
    res.render('500');
});

app.listen(app.get('port'), function () {
    console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
