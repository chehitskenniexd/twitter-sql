// setting up PostgreSQL with URL to db
var pg = require('pg');
var postgresURL = 'postgres://localhost:5432/twitterdb'
var client = new pg.Client(postgresURL);

// connect to client
client.connect();

// export module
module.exports = client;