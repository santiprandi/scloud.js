const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const app = require('../../app');

// Get users and key from the configuration file.
const USERS = app.config.users;
const KEY = app.config.key;

router.post('/', (req, res) => {
  // Get user.
  const user = USERS.find(user => user.username === req.body.username);
  // If user exists and the password is correct...
  if (user != undefined && user.password === req.body.password) {
    // Sign token.
    const token = jwt.sign(user, KEY);
    // Return token.
    res.json({ token });
  } else {
    res.sendStatus(400);
  }
});

module.exports = router;
