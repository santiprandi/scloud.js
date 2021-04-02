// Auxiliar variables.
const token = localStorage.getItem('token');
let currentApiDirectory = ['/'];

// =============================================================================
//                              MAIN FUNCTIONS
// =============================================================================

// Remove credentials and go to login page.
function logout() {
  // Delete token.
  localStorage.removeItem('token');
  // Redirect to login page.
  window.location = '/login';
}

// Get a list of files or a download link from a path.
async function getFiles(path) {
  try {
    if (path == undefined) {
      path = '/';
    }

    // Send request.
    const response = await fetch(`/api/files/open${path}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // If response is ok...
    if (response.status === 200) {
      // Return files.
      return await response.json();
    } else {
      logout();
    }
  } catch (error) {
    console.log('Error: ', error);
  }
}

// Loop files/directories and display them in the browser.
function displayFiles(files) {
  // Get file browser.
  const browserFiles = document.querySelector('#browser-files');
  // Delete previous files.
  while (browserFiles.firstChild) {
    browserFiles.removeChild(browserFiles.firstChild);
  }

  const directoriesToAppend = [];
  const filesToAppend = [];

  // Loop files and create elements.
  files.forEach(file => {
    // Create a new file item and content elements with the file data.
    const row = document.createElement('div');
    const fileIcon = document.createElement('span');
    const fileName = document.createElement('span');
    const fileSize = document.createElement('span');
    // const shareButton = document.createElement('button');
    const deleteButton = document.createElement('button');

    // Set data.
    fileName.innerHTML = file.name;
    fileSize.innerHTML = readableBytes(file.size);
    // shareButton.innerHTML = '<i class="material-icons">share</i>';
    deleteButton.innerHTML = '<i class="material-icons">delete</i>';

    // Event: click file or directory.
    row.addEventListener('click', () => fileItemClick(file));
    // Event: click delete button.
    deleteButton.addEventListener('click', e => deleteButtonClick(e, file));
    // Event: click share button.
    // shareButton.addEventListener('click', e => shareButtonClick(e, file));

    // Fill file item.
    row.append(fileIcon);
    row.appendChild(fileName);
    // If is a file show its size and the share button.
    // Also set file type icon.
    if (file.type === 'file') {
      fileIcon.innerHTML = '<i class="material-icons">insert_drive_file</i>';
      row.appendChild(fileSize);
      // row.appendChild(shareButton);
    } else {
      fileIcon.innerHTML = '<i class="material-icons">folder</i>';
    }
    row.appendChild(deleteButton);

    // Set file item styles.
    row.classList.add('browser-item');

    // Sort files and directories.
    if (file.type === 'file') {
      filesToAppend.push(row);
    } else {
      directoriesToAppend.push(row);
    }
  });

  // Add sorted files and directories to the browser.
  directoriesToAppend.forEach(dir => {
    browserFiles.appendChild(dir);
  });
  filesToAppend.forEach(file => {
    browserFiles.appendChild(file);
  });
}

// Get files from a directory and then display them.
async function displayDirectory(path) {
  // Get files.
  const files = await getFiles(path);
  // Display them.
  displayFiles(files);
}

// Return current directory path.
function getCurrentDirectoryPath() {
  let path = '';
  currentApiDirectory.forEach(pathItem => {
    path += pathItem;
  });

  return path;
}

//Format file size to human readable format.
function readableBytes(bytes) {
  if (bytes === 0) {
    return '0 B';
  } else {
    const i = Math.floor(Math.log(bytes) / Math.log(1024)),
      sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    return (bytes / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + sizes[i];
  }
}

// =============================================================================
//                                  EVENTS
// =============================================================================

// Event: page loaded.
window.addEventListener('DOMContentLoaded', async () => {
  await displayDirectory('/');
});

// Event: file upload.
// Help provided by: https://javascript.info/xmlhttprequest.
// XMLHttpRequest is used here instead of fetch because an upload progress
// bar is not implemented yet.
const uploadForm = document.querySelector('#upload-form');
uploadForm.addEventListener('submit', async e => {
  e.preventDefault();

  // Create XMLHttpRequest object.
  const xhr = new XMLHttpRequest();

  // Create a FormData object which will hold all the files.
  const formData = new FormData();
  const uploadInput = document.querySelector('#upload-input');

  // This does not work:
  // formData.append('upload', uploadInput.files);
  // You have to append individual files to the form data object.
  for (let i = 0; i < uploadInput.files.length; i++) {
    formData.append('upload', uploadInput.files[i]);
  }

  // Get current directory.
  let directoryPath = '';
  currentApiDirectory.forEach(pathItem => {
    directoryPath += pathItem;
  });
  // Set upload URL.
  const url = `/api/files/upload${directoryPath}`;
  // Get the upload button element.
  const uploadButton = document.querySelector('#upload-button');

  // Event: update progress bar value.
  xhr.upload.onprogress = e => {
    const progress = Math.floor((e.loaded * 100) / e.total);
    // Set progress in the button.
    uploadButton.innerHTML = `${progress}%`;
    // Change the button style based on the current progress.
    if (progress < 25) {
      uploadButton.className = 'upload-btn-0';
    } else if (progress < 50) {
      uploadButton.className = 'upload-btn-25';
    } else if (progress < 75) {
      uploadButton.className = 'upload-btn-50';
    } else {
      uploadButton.className = 'upload-btn-75';
    }
  };

  // Update elements on successful upload.
  xhr.onloadend = async () => {
    if (xhr.status === 200) {
      // Update list of files.
      await displayDirectory(directoryPath);
      // Clear file input.
      uploadInput.value = '';
      // Change the button style based on the result.
      uploadButton.className = 'upload-btn-success';
      uploadButton.innerHTML = 'Success';
    } else {
      // Change the button style based on the result.
      uploadButton.className = 'upload-btn-error';
      uploadButton.innerHTML = 'Error';
    }
    setTimeout(() => {
      // Reset upload button after 3 seconds.
      uploadButton.innerHTML = 'Upload';
      uploadButton.className = '';
    }, 3000);
  };

  // You do not have to set the request type to multipart/form-data.
  // Javascript detects this when adding a FormData object to the request.
  xhr.open('POST', url);
  // Set authorization token.
  xhr.setRequestHeader('Authorization', `Bearer ${token}`);
  // Send request.
  xhr.send(formData);
});

// Event: go back button clicked.
// Go back to parent directory.
const goBackButton = document.querySelector('#go-back');
goBackButton.addEventListener('click', async () => {
  // If there is more path items than "/"...
  if (currentApiDirectory.length > 1) {
    // Remove path item.
    currentApiDirectory.pop();
    // Get parent path.
    const directoryPath = getCurrentDirectoryPath();
    // Dispay parent files.
    await displayDirectory(directoryPath);
  }
});

// Event: create directory button clicked.
// Show prompt asking for a directory name.
const createDirectoryButton = document.querySelector('#create-directory');
createDirectoryButton.addEventListener('click', async () => {
  // Get user input.
  const newDirectoryName = prompt('New directory name:');

  if (newDirectoryName != null) {
    if (newDirectoryName === '') {
      alert('Invalid directory name.');
    } else {
      // Send request.
      try {
        // Get current directory path.
        const directoryPath = getCurrentDirectoryPath();

        const response = await fetch(
          `/api/files/directory${directoryPath}${newDirectoryName}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.status === 201) {
          // Update list of files.
          await displayDirectory(directoryPath);
        } else {
          alert('Invalid directory name.');
        }
      } catch (error) {
        console.error(error);
      }
    }
  }
});

// Event: logout button clicked.
const logoutButton = document.querySelector('#logout');
logoutButton.addEventListener('click', () => {
  logout();
});

// =============================================================================
//                              EVENT HANDLERS
// =============================================================================

// Handler: click file or directory.
async function fileItemClick(file) {
  if (file.type === 'file') {
    // Download a file when is clicked.

    // Get download link.
    let path = '';
    currentApiDirectory.forEach(pathItem => {
      path += pathItem;
    });
    path += file.name;

    const uuid = await getFiles(path);

    // Start download with provided UUID.
    // Create a element to prevent popup warnings.
    const link = document.createElement('a');
    link.setAttribute('href', `/api/files/download/${uuid}`);
    link.setAttribute('download', file.name);

    link.style.display = 'none';
    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  } else {
    // Open and display a directory content when is clicked.

    let url = '';
    // Update current directory path.
    currentApiDirectory.push(`${file.name}/`);
    currentApiDirectory.forEach(pathItem => {
      url += pathItem;
    });

    await displayDirectory(url);
  }
}
// Handler: click delete button.
async function deleteButtonClick(e, file) {
  e.stopPropagation();
  // Ask user for confirmation.
  const confirmation = confirm(
    `Are you sure you want to delete this ${file.type}?`
  );

  if (confirmation) {
    // Get file/directory path.
    let directoryPath = '';
    currentApiDirectory.forEach(pathItem => {
      directoryPath += pathItem;
    });

    // Send delete request.
    if (file.type === 'file') {
      try {
        const response = await fetch(
          `/api/files/file${directoryPath}${file.name}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.status === 200) {
          await displayDirectory(directoryPath);
        } else {
          alert(`Error code: ${response.status}. file could not be deleted`);
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      try {
        const response = await fetch(
          `/api/files/directory${directoryPath}${file.name}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.status === 200) {
          await displayDirectory(directoryPath);
        } else {
          alert(
            `Error code: ${response.status}. directory could not be deleted`
          );
        }
      } catch (error) {
        console.error(error);
      }
    }
  }
}
// Handler: click share button.
async function shareButtonClick(e, file) {
  e.stopPropagation();
  // Not yet implemented.
}
