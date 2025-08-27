// Authentication elements
const signedOutView = document.getElementById('signedOutView');
const signedInView = document.getElementById('signedInView');
const mainActions = document.getElementById('mainActions');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const dashboardBtn = document.getElementById('dashboardBtn');
const authStatus = document.getElementById('authStatus');
const userEmail = document.getElementById('userEmail');
const toggleBtn = document.getElementById('toggleBtn');

// Check authentication status on popup open
async function checkAuthStatus() {
  try {
    const { scoutdeck_token } = await chrome.storage.local.get('scoutdeck_token');
    const isAuthenticated = Boolean(scoutdeck_token);
    
    if (isAuthenticated) {
      // Get user info
      chrome.runtime.sendMessage({ type: 'ME' }, (resp) => {
        if (resp?.ok && resp.me) {
          showSignedInView(resp.me);
        } else {
          showSignedOutView();
        }
      });
    } else {
      showSignedOutView();
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    showSignedOutView();
  }
}

function showSignedOutView() {
  signedOutView.style.display = 'block';
  signedInView.style.display = 'none';
  mainActions.style.display = 'none';
  authStatus.textContent = '';
}

function showSignedInView(userInfo) {
  signedOutView.style.display = 'none';
  signedInView.style.display = 'block';
  mainActions.style.display = 'block';
  
  if (userInfo && userInfo.email) {
    userEmail.textContent = userInfo.email;
  } else {
    userEmail.textContent = 'Signed in';
  }
}

// Login button handler
loginBtn.addEventListener('click', () => {
  authStatus.textContent = 'Signing in...';
  loginBtn.disabled = true;
  
  chrome.runtime.sendMessage({ type: 'LOGIN' }, (resp) => {
    loginBtn.disabled = false;
    
    if (resp?.ok) {
      authStatus.textContent = 'Success! Getting user info...';
      // Get user info after successful login
      chrome.runtime.sendMessage({ type: 'ME' }, (userResp) => {
        if (userResp?.ok) {
          showSignedInView(userResp.me);
        } else {
          showSignedInView({ email: 'Signed in' });
        }
      });
    } else {
      authStatus.textContent = `Sign in failed: ${resp?.error || 'Unknown error'}`;
    }
  });
});

// Logout button handler
logoutBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'LOGOUT' }, (resp) => {
    if (resp?.ok) {
      showSignedOutView();
    }
  });
});

// Dashboard button handler
dashboardBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'OPEN_DASHBOARD' });
  window.close();
});

// Toggle sidebar button handler (original functionality)
toggleBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' }, () => {});
});

// Listen for auth changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.scoutdeck_token) {
    checkAuthStatus();
  }
});

// Initialize on popup open
checkAuthStatus(); 