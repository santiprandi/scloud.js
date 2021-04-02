/** Log in to the cloud. */
async function login() {
  // Get username and password.
  const txtUsername = document.querySelector('#txt-username');
  const txtPassword = document.querySelector('#txt-password');
  const username = txtUsername.value;
  const password = txtPassword.value;

  const url = '/api/login';
  const data = { username, password };

  try {
    // Send request.
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // If response is ok...
    if (response.status === 200) {
      // Parse data.
      const json = await response.json();
      // Save token on localStorage.
      localStorage.setItem('token', json.token);
      // Redirect to index or previous page if coming from an app.
      if (document.referrer === '') {
        window.location = '/';
      } else {
        window.location = document.referrer;
      }
    } else {
      // Notify invalid user.
      alert('Invalid user.');
    }
  } catch (error) {
    console.log('Error: ', error);
  }
}

// Event: form submission.
const loginForm = document.querySelector('#login-form');
loginForm.addEventListener('submit', e => {
  e.preventDefault();
  login();
});

// Event: DOM loaded.
document.addEventListener('DOMContentLoaded', () => {
  // Focus password input.
  document.querySelector('#txt-username').focus();
});
