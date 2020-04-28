const dotenv = require('dotenv');
dotenv.config();
// Using environment variables helps with best pratice and allows you to run your server locally without any actual "hard code" written//
const mongodo = require('mongodb');

mongodo.connect(
  process.env.CONNECTIONSTRING,
  { useNewUrlParser: true, useUnifiedTopology: true },
  function(err, client) {
    module.exports = client;
    const app = require('./app');
    app.listen(process.env.PORT);
  }
);
