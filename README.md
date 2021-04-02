# Scloud.js

Self-hosted cloud storage app made with Node.js and Express.

⚠️ **NOTE: this application is no longer being developed and contains outdated libraries. Use it at your own risk!**

## Motivation

This project aims to provide a lightweight app that will work in any machine
with Node.js support, e.g. Raspberry Pi. This is also intended for people who
want to self-host their cloud storage without relying on other services like
Google Drive.

## Installation

For this app to work Node.js must be already installed and with npm support.

1. Clone the repository.
2. Install dependencies: run `npm install --production` inside the repository folder.
3. Configure: `npm run config`.
4. Run the app: `node app.js`.

This will run a local instance of the app. If you want it to be accessible from
Internet you need to run it from a TCP port that is allowed. This app lacks
encryptation so you shouldn't run it directly to the Internet, you can modify
the code so Express can run with SSL or you can install a web server and proxy
all request to the running port of the app. The latter brings multiple
advantages: a well-known web server is more secure, robust and flexible.

It is also recomended to run the app with a proccess manager like PM2. This
makes sure the app is always running and can be configured to run on system
boot.

## Adding more users

To add more users you have to modify the config.json file generated in step 2
in the app's folder. It has to be added as a JSON object below the main user.

