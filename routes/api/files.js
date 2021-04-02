const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const uuid = require('uuid');
const multer = require('multer');
const verifyToken = require('../../middleware/auth');
const app = require('../../app');

// Set configuration variables.
const ROOT = app.config.path;
const USERS = app.config.users;
let allowedDownloads = [];

// Initialize disk storage engine.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userRoot = path.join(ROOT, req.headers['username'], 'files');
    cb(null, path.join(userRoot, req.params[0]));
  },
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage: storage });

// Create files folder for each user.
USERS.forEach(user => {
  fs.mkdirSync(path.join(ROOT, user.username, 'files'), { recursive: true });
});

// Verify if the given path is valid.
function verifyPath(req, res, next) {
  const requestPath = req.params[0];

  // Verify for relative parent.
  if (requestPath.indexOf('..') === -1) {
    next();
  } else {
    return res.sendStatus(400);
  }
}

// List files in directory or generate a download link.
router.get('/open/*', verifyToken, verifyPath, (req, res) => {
  try {
    // Variables.
    let filesArray = [];
    let filePath;
    let fileType;
    let fileSize;
    // Set path for specific user and request parameters.
    const requestPath = path.join(
      ROOT,
      req.headers['username'],
      'files',
      req.params[0]
    );

    // If the path is a directory return its contents,
    // else generate a download link for the file.
    if (fs.statSync(requestPath).isDirectory()) {
      // Loop each file.
      fs.readdirSync(requestPath).forEach(file => {
        // Determine file path.
        filePath = path.join(requestPath, file);
        // Determine file type.
        if (fs.statSync(filePath).isFile()) {
          fileType = 'file';
        } else {
          fileType = 'directory';
        }
        // Determine file size.
        fileSize = fs.statSync(filePath).size;

        // Create object representing the file and push it to the array.
        filesArray.push({
          name: path.basename(file),
          type: fileType,
          size: fileSize
        });
      });

      // Return folder content.
      res.json(filesArray);
    } else {
      // Create new download object.
      const newDownload = {
        uuid: uuid.v4(),
        path: requestPath,
        requestedTime: Date.now()
      };

      // Add it to allowed downloads.
      allowedDownloads.push(newDownload);
      // Send UUID to client.
      res.json(newDownload.uuid);
    }
  } catch (error) {
    console.log(error);
  }
});

// Download file with an UUID and remove invalid downloads.
router.get('/download/:uuid', (req, res) => {
  try {
    // Get current time.
    const currentTime = Date.now();
    // Flag.
    let downloadFound = false;

    // Iterate allowed downloads.
    for (let i = 0; i < allowedDownloads.length; i++) {
      // Current item of the iteration.
      let download = allowedDownloads[i];

      // If the time of the current item didn't expired, then download it, and after that, delete it.
      // Else just delete it.
      // 600.000ms equals 10 minutes.
      if (currentTime - download.requestedTime < 600000) {
        // If item's UUID matches parameter's UUID, allow the download.
        if (download.uuid === req.params.uuid) {
          // Set flag. Prevents sending 404 later.
          downloadFound = true;

          // Download file and call callback.
          res.download(download.path, error => {
            if (error) {
              console.log(error);
            } else {
              // Delete already downloaded download.
              allowedDownloads.splice(i, 1);
              // End request.
              res.end();
            }
          });
        }
      } else {
        allowedDownloads.splice(i, 1);
      }
    }

    // If a download is not found, send 404.
    if (!downloadFound) {
      res.sendStatus(404);
    }
  } catch (error) {
    console.log(error);
  }
});

// Create directory.
router.post('/directory/*', verifyToken, verifyPath, (req, res) => {
  // Set user root folder.
  const userRoot = path.join(ROOT, req.headers['username'], 'files');
  // Set path for specific user and request parameters.
  const requestPath = path.join(
    ROOT,
    req.headers['username'],
    'files',
    req.params[0]
  );

  // If directory is not the root folder and it does not exist, create it.
  if (requestPath !== userRoot) {
    // If folder does not exists, create it.
    if (!fs.existsSync(requestPath)) {
      try {
        // Create folder.
        fs.mkdirSync(requestPath);
        return res.sendStatus(201);
      } catch (error) {
        console.log(error);
        return res.sendStatus(400);
      }
    } else {
      return res.sendStatus(400);
    }
  } else {
    return res.sendStatus(400);
  }
});

// File upload.
router.post(
  '/upload/*',
  verifyToken,
  verifyPath,
  upload.array('upload'),
  (req, res) => {
    if (req.files != undefined && req.files.length > 0) {
      return res.sendStatus(200);
    } else {
      return res.sendStatus(400);
    }
  }
);

// Delete a directory and its content recursively.
const deleteFolderRecursive = folderPath => {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach(function(file, index) {
      let curPath = path.join(folderPath, file);

      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(folderPath);
  }
};

// Delete a file.
router.delete('/file/*', verifyToken, verifyPath, (req, res) => {
  const userRoot = path.join(ROOT, req.headers['username'], 'files');
  const filePath = path.join(userRoot, req.params[0]);
  // If something exists and is a file.
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.log(error);
      return res.sendStatus(500);
    }
  } else {
    return res.sendStatus(400);
  }

  return res.sendStatus(200);
});

// Delete a directory.
router.delete('/directory/*', verifyToken, verifyPath, (req, res) => {
  const userRoot = path.join(ROOT, req.headers['username'], 'files');
  const directoryPath = path.join(userRoot, req.params[0]);

  // Root directory as path is invalid.
  if (directoryPath !== ROOT) {
    // If something exists and is a directory.
    if (
      fs.existsSync(directoryPath) &&
      fs.statSync(directoryPath).isDirectory()
    ) {
      try {
        deleteFolderRecursive(directoryPath);
      } catch (error) {
        console.log(error);
        return res.sendStatus(500);
      }
    } else {
      return res.sendStatus(400);
    }

    return res.sendStatus(200);
  } else {
    return res.sendStatus(400);
  }
});

module.exports = router;

/*
 * Useful links:
 * https://stackoverflow.com/questions/31645738/how-to-create-full-path-with-nodes-fs-mkdirsync
 */
