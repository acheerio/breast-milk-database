var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit : 10,
  host            : 'classmysql.engr.oregonstate.edu',
  user            : 'cs340_oherina',
  password        : '7688',
  database        : 'cs340_oherina',
  multipleStatements: true
});

module.exports.pool = pool;
