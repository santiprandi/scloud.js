const jwt = require('jsonwebtoken');
const app = require('../app');

// Get users and key from the configuration file.
const USERS = app.config.users;
const KEY = app.config.key;

// Verify if the auth token is valid.
function verifyToken(req, res, next) {
  // Get auth header value.
  const bearerHeader = req.headers['authorization'];

  // Check if bearer is undefined.
  if (typeof bearerHeader !== 'undefined') {
    // Split at the space.
    const bearer = bearerHeader.split(' ');
    // Get token from array.
    const bearerToken = bearer[1];

    try {
      // Decode token.
      const decoded = jwt.verify(bearerToken, KEY);
      // Find user.
      const user = USERS.find(
        user =>
          user.username === decoded.username &&
          user.password === decoded.password
      );

      // If the user exists then call next(),
      // else send forbidden code.
      if (user != undefined) {
        // Set username header for other APIs.
        req.headers['username'] = user.username;
        next();
      } else {
        console.log('Error: user no longer exists.');
        return res.sendStatus(403);
      }
    } catch (error) {
      console.log(`${error.name}: ${error.message}`);
      return res.sendStatus(403);
    }
  } else {
    res.sendStatus(403);
  }
}

module.exports = verifyToken;
