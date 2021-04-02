const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');

// Check if configuration files exists.
if (!fs.existsSync('config.json')) {
  console.log('Error: config.json does not exist. Please run: npm run config.');
} else {
  const app = express();

  // Load configuration.
  const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
  // Export configuration.
  exports.config = config;

  const PORT = config.port;

  // Body parsers.
  app.use(express.json()); // JSON.
  app.use(express.urlencoded({ extended: false })); // Form data.
  // Helmet middleware.
  app.use(helmet());
  // Set static folder.
  app.use(express.static(path.join(__dirname, 'public')));

  // Use login API.
  app.use('/api/login', require('./routes/api/login'));
  // Use Files API.
  app.use('/api/files', require('./routes/api/files'));

  app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}
