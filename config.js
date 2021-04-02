const readline = require('readline');
const uuid = require('uuid');
const fs = require('fs');

// Configuration object.
const config = {};

let rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// User questions for configuration.
rl.question('Port number: ', answer => {
  config.port = answer.trim();

  rl.question('Main username: ', answer => {
    config.users = [{ username: answer.trim() }];

    rl.question('Password: ', answer => {
      config.users[0].password = answer.trim();

      rl.question('Data saving path: ', answer => {
        config.path = answer.trim();
        config.key = uuid.v4();

        fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
        rl.close();
      });
    });
  });
});
