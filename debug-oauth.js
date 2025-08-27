// Debug OAuth Flow - Run this in the extension's background console
// Go to chrome://extensions/ -> ScoutDeck AI -> Details -> Inspect views: background page

console.log('🔧 ScoutDeck AI OAuth Debug Tool');
console.log('================================');

// Get extension info
console.log('📋 Extension ID:', chrome.runtime.id);
console.log('🔗 Redirect URI:', chrome.identity?.getRedirectURL ? chrome.identity.getRedirectURL('extension-auth') : `https://${chrome.runtime.id}.chromiumapp.org/extension-auth`);

// Test redirect URI generation
function testRedirectUri() {
  const redirectUri = chrome.identity?.getRedirectURL ? 
    chrome.identity.getRedirectURL('extension-auth') : 
    `https://${chrome.runtime.id}.chromiumapp.org/extension-auth`;
  
  console.log('🧪 Testing redirect URI generation...');
  console.log('✅ Redirect URI:', redirectUri);
  
  // Copy to clipboard helper
  console.log('📋 Copy this redirect URI to your Google Cloud Console:');
  console.log(`%c${redirectUri}`, 'background: #f0f0f0; padding: 5px; border-radius: 3px; font-family: monospace;');
  
  return redirectUri;
}

// Test OAuth flow
async function testOAuthFlow() {
  console.log('🚀 Testing OAuth flow...');
  
  try {
    const redirectUri = testRedirectUri();
    const issueTokenUrl = `http://localhost:3000/api/extension/issue-token?redirect=${encodeURIComponent(redirectUri)}`;
    
    console.log('🌐 Issue Token URL:', issueTokenUrl);
    
    // Test if the URL is accessible
    try {
      const response = await fetch(issueTokenUrl, { method: 'HEAD' });
      console.log('✅ Issue token endpoint accessible:', response.status);
    } catch (e) {
      console.error('❌ Issue token endpoint not accessible:', e);
      console.log('💡 Make sure your website is running on http://localhost:3000');
    }
    
  } catch (error) {
    console.error('❌ OAuth test failed:', error);
  }
}

// Check current auth status
async function checkAuthStatus() {
  console.log('🔍 Checking current auth status...');
  
  try {
    const storage = await chrome.storage.local.get(['scoutdeck_token', 'scoutdeck_refresh', 'scoutdeck_exp']);
    console.log('💾 Current storage:', {
      hasToken: !!storage.scoutdeck_token,
      hasRefresh: !!storage.scoutdeck_refresh,
      expiresAt: storage.scoutdeck_exp ? new Date(storage.scoutdeck_exp).toLocaleString() : 'N/A'
    });
  } catch (error) {
    console.error('❌ Failed to check auth status:', error);
  }
}

// Clear auth data
async function clearAuth() {
  console.log('🧹 Clearing auth data...');
  await chrome.storage.local.remove(['scoutdeck_token', 'scoutdeck_refresh', 'scoutdeck_exp']);
  console.log('✅ Auth data cleared');
}

// Export functions to global scope for easy access
window.debugOAuth = {
  testRedirectUri,
  testOAuthFlow,
  checkAuthStatus,
  clearAuth
};

console.log('🎯 Available debug functions:');
console.log('- debugOAuth.testRedirectUri() - Get your redirect URI');
console.log('- debugOAuth.testOAuthFlow() - Test the OAuth flow');
console.log('- debugOAuth.checkAuthStatus() - Check current auth status');
console.log('- debugOAuth.clearAuth() - Clear stored auth data');
console.log('');
console.log('💡 Run debugOAuth.testRedirectUri() first to get your redirect URI for Google Cloud Console');

// Auto-run basic checks
testRedirectUri();
checkAuthStatus();
