# 🏈 ScoutDeck AI Chrome Extension

A powerful Chrome extension that integrates with [ScoutDeck.ai](https://scoutdeck.ai) to provide comprehensive football film analysis directly on Hudl pages.

## ✨ Features

### 🔐 **Seamless Authentication**
- **Google OAuth Integration**: Sign in through your ScoutDeck.ai account
- **One-Click Access**: Authenticate directly from the extension popup
- **Persistent Sessions**: Stay signed in across browser sessions
- **Secure Token Management**: JWT-based authentication with automatic refresh

### 📊 **Comprehensive Film Analysis**
- **12-Step Analysis Funnel**: Complete offensive and defensive breakdowns
- **Real-Time Data Sync**: Automatically saves analysis to your ScoutDeck account
- **Hudl Integration**: Seamlessly works on any Hudl film page
- **Professional UI**: Clean, intuitive interface matching ScoutDeck branding

### 🚀 **Advanced Functionality**
- **Background Processing**: Efficient API communication via service worker
- **Smart Storage**: Local caching with cloud synchronization
- **Dashboard Access**: Direct link to your ScoutDeck dashboard
- **Export Capabilities**: Save and share your analysis

## 🛠️ Installation

### For Users
1. Download the extension from the Chrome Web Store *(coming soon)*
2. Click "Add to Chrome"
3. Sign in with your ScoutDeck.ai account
4. Start analyzing film on Hudl!

### For Developers
1. **Clone the repository**:
   ```bash
   git clone https://github.com/Nateben8/Scout-Deck-AI-Chrome-Extension.git
   cd Scout-Deck-AI-Chrome-Extension
   ```

2. **Load in Chrome**:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension folder

3. **Test the extension**:
   - Follow the testing guide in `TEST_EXTENSION.md`

## 🎯 How It Works

### Authentication Flow
1. **Click Extension Icon** → Opens popup with sign-in option
2. **Google OAuth** → Redirects to ScoutDeck.ai for authentication
3. **Token Exchange** → Receives secure JWT tokens
4. **Ready to Use** → Access all features on Hudl pages

### Analysis Workflow
1. **Navigate to Hudl** → Extension automatically detects film pages
2. **Open Analysis Panel** → Click extension icon or use keyboard shortcut
3. **Complete Analysis** → Follow the 12-step guided process
4. **Auto-Save** → Data syncs to your ScoutDeck account in real-time
5. **Export & Share** → Generate reports and share insights

## 🔧 Technical Architecture

### Core Components
- **Background Service Worker** (`background.js`): Handles API communication and authentication
- **Content Script** (`content.js`): Injects analysis panel into Hudl pages
- **Popup Interface** (`popup.html/js/css`): Extension popup with authentication
- **Analysis Panel** (`panel/`): Comprehensive film breakdown interface

### API Integration
- **Authentication Endpoints**: `/api/extension/issue-token`, `/api/extension/refresh`
- **User Management**: `/api/extension/me`
- **Data Sync**: `/api/extension/plays`
- **Token Management**: Automatic refresh and secure storage

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **HTTPS Only**: All API communication over secure connections
- **Token Refresh**: Automatic token renewal
- **Secure Storage**: Chrome's secure storage APIs

## 📱 User Interface

### Extension Popup
- **Sign-In Screen**: Clean Google OAuth integration
- **User Dashboard**: Quick access to account and settings
- **Status Indicators**: Real-time authentication status

### Analysis Panel
- **Step-by-Step Guidance**: 12 comprehensive analysis steps
- **Smart Forms**: Dynamic fields based on play type
- **Progress Tracking**: Visual progress indicators
- **Auto-Save**: Continuous data preservation

## 🧪 Testing

Run the complete test suite using the provided testing guide:

```bash
# See TEST_EXTENSION.md for detailed testing instructions
```

### Test Coverage
- ✅ Authentication flow
- ✅ API integration
- ✅ Data persistence
- ✅ UI responsiveness
- ✅ Error handling
- ✅ Cross-browser compatibility

## 🚀 Development

### Prerequisites
- Chrome Browser (latest version)
- ScoutDeck.ai account
- Node.js (for development server)

### Development Setup
1. **Clone and install**:
   ```bash
   git clone https://github.com/Nateben8/Scout-Deck-AI-Chrome-Extension.git
   cd Scout-Deck-AI-Chrome-Extension
   npm install
   ```

2. **Load in Chrome**:
   - Enable Developer mode in `chrome://extensions/`
   - Load unpacked extension

3. **Start development server** (for website integration):
   ```bash
   cd ../Scout\ Deck\ AI\ Website
   npm run dev
   ```

### File Structure
```
Scout-Deck-AI-Chrome-Extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker
├── popup.html/js/css      # Extension popup
├── content.js/css         # Content script
├── panel/                 # Analysis interface
│   ├── panel.html
│   ├── panel.js
│   └── panel.css
├── utils/                 # Utility functions
├── icons/                 # Extension icons
└── TEST_EXTENSION.md      # Testing guide
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: [ScoutDeck.ai](https://scoutdeck.ai)
- **Chrome Web Store**: *Coming Soon*
- **Documentation**: [ScoutDeck Docs](https://scoutdeck.ai/docs)
- **Support**: [Contact Us](https://scoutdeck.ai/contact)

## 📞 Support

Need help? We're here for you:

- **Email**: support@scoutdeck.ai
- **Documentation**: Check our comprehensive guides
- **Issues**: Report bugs on GitHub
- **Community**: Join our Discord server

---

**Made with ❤️ by the ScoutDeck.ai team**

*Revolutionizing football analysis, one play at a time.*