# 🕉 ChantFlow - Devotional Chant Player PWA

A simple, modern Progressive Web Application for creating and playing customized devotional chanting sessions.

## Features ✨

- **📱 Progressive Web App** - Works offline, installable on home screen
- **🎵 Playlist Builder** - Drag-and-drop playlist creation
- **🔁 Flexible Repetitions** - Play mantras 11, 21, 54, 108, 1008 times or any custom number
- **⏱️ Session Timer** - Estimated duration for your entire session
- **🎚️ Volume Control** - Adjust playback volume
- **💾 Persistent Storage** - Your playlists are saved locally
- **🌙 Dark Mode** - Automatically adapts to system preferences
- **📡 Works Offline** - Service worker caches all assets
- **👴 Simple & Accessible** - Designed for all ages and technical levels

## Getting Started

### Local Testing

1. **Download/Clone ChantFlow**
   ```bash
   # If you have Git
   git clone <your-repo-url> chantflow
   cd chantflow
   ```

2. **Run a Local Server**
   
   **Option A: Python**
   ```bash
   python -m http.server 8000
   # or Python 3
   python3 -m http.server 8000
   ```
   
   **Option B: Node.js**
   ```bash
   npx http-server
   ```
   
   **Option C: VS Code Live Server**
   - Install "Live Server" extension
   - Right-click index.html → "Open with Live Server"

3. **Open in Browser**
   - Visit `http://localhost:8000` (or your server's port)
   - Test on mobile: Visit from phone on same WiFi

## Deployment Options

### 🌟 **Option 1: GitHub Pages (FREE, Recommended)**

Easiest option for beginners.

1. **Create GitHub Account** - Go to [github.com](https://github.com) and sign up
2. **Create New Repository**
   - Name: `chantflow` (or anything you want)
   - Make it **Public**
   - Click "Create"
3. **Upload Files**
   - Click "Add file" → "Upload files"
   - Drag all ChantFlow files (index.html, app.js, styles.css, etc.)
   - Commit changes
4. **Enable GitHub Pages**
   - Go to Settings → Pages
   - Source: main branch
   - Wait 2-3 minutes
   - Your site is live at: `https://username.github.io/chantflow`

✅ **Free** | ✅ **No credit card** | ✅ **Custom domain possible**

---

### 🚀 **Option 2: Netlify (FREE)**

Better performance and auto-deployment.

1. **Sign Up** - Go to [netlify.com](https://netlify.com)
2. **Deploy**
   - Drag-and-drop all ChantFlow files into Netlify
   - Your site is live immediately!
   - Get a free domain like: `chantflow.netlify.app`

✅ **Free** | ✅ **Fast deployment** | ✅ **Custom domain at $12.99/year**

---

### 🟢 **Option 3: Vercel (FREE)**

Similar to Netlify, very user-friendly.

1. **Sign Up** - Go to [vercel.com](https://vercel.com)
2. **Import Project** or drag-and-drop
3. Get free domain: `chantflow.vercel.app`

✅ **Free** | ✅ **Great performance**

---

### 💻 **Option 4: Traditional Web Hosting (Affordable)**

For more control and custom domain.

**Popular Free Hosting:**
- **000webhost** (free.host) - Free with ads
- **InfinityFree** - Completely free
- **Hostinger** - $2.99/month (cheapest paid)

**Steps:**
1. Sign up for hosting
2. Upload files via FTP
3. No installation needed - just upload HTML/CSS/JS

**FTP Upload:**
- Download FileZilla (free)
- Use hosting provider's FTP credentials
- Drag files to `/public_html` folder

✅ **Cheapest paid option** | ✅ **Full control**

---

## File Structure

```
ChantFlow/
├── index.html              # Main webpage
├── app.js                  # Application logic
├── styles.css              # Styling
├── manifest.json           # PWA configuration
├── service-worker.js       # Offline support
├── .htaccess              # Apache server config (optional)
├── audio/                 # Audio files folder
│   ├── om.mp3
│   ├── music1.mp3
│   └── censor.mp3
└── README.md              # This file
```

## Adding Your Own Audio Files

1. **Convert to MP3** (Recommended)
   - Use free tools: [CloudConvert.com](https://cloudconvert.com) or [Online-Convert.com](https://online-convert.com)
   - Format: MP3, Bitrate: 128kbps or higher

2. **Upload to `/audio/` folder**
   - Add your MP3 file (e.g., `om_chant.mp3`)

3. **Register in app.js**
   - Open `app.js` and find the `loadTracks()` method
   - Add your track:
   ```javascript
   { id: 'om_chant', name: '🕉 Om Chant', file: 'audio/om_chant.mp3', duration: 0 }
   ```

4. **Restart & Reload**
   - Your track appears in the "Select Audio" dropdown

## Usage Guide

### Creating a Session

1. **Select an audio track** from the dropdown
2. **Choose repetitions** (11, 21, 54, 108, or custom)
3. **Click "Add to Sequence"**
4. **Repeat steps 1-3** to build your complete session
5. **Click "Play"** when ready

### Quick Shortcuts

- **11x, 21x, 54x, 108x buttons** - Instantly set repetitions
- **🗑️ Clear** - Remove all items from session
- **Loop Session** - Automatically repeat the entire sequence

### Offline Use

- App works completely offline after first load
- All audio files are cached on your device
- Sessions are saved in browser storage

## Troubleshooting

### Audio files not loading?
- Check file paths in `app.js`
- Ensure files are in `/audio/` folder
- Try refreshing (Ctrl+Shift+R or Cmd+Shift+R)

### Service Worker not caching?
- Open DevTools (F12) → Application → Service Workers
- Check registration status
- Clear cache if having issues: DevTools → Application → Cache Storage → Delete

### Can't install as app?
- Must be HTTPS (GitHub Pages, Netlify auto-enable this)
- Some browsers show install prompt differently
- Try: Click menu → "Install app" or similar

### Offline doesn't work?
- Visit site once while online
- Service worker needs initial load to cache files
- Check DevTools Console for errors

## Browser Support

✅ Chrome/Edge 40+
✅ Firefox 44+
✅ Safari 11.1+ (iOS 11.3+)
✅ Opera 27+

Older browsers will work but without offline/install features.

## Performance Tips

- Use MP3 format (smaller file size than WAV)
- 128kbps bitrate is good for voice/music
- Test on slow internet (DevTools → Network → Throttling)

## Privacy & Data

- **All data stored locally** on your device
- **No tracking** or analytics
- **No accounts needed**
- Offline support means no data sent to servers
- Your playlists never leave your device

## Customization

### Change Colors
Edit `:root` variables in `styles.css`:
```css
:root {
    --primary-color: #8B4513;      /* Brown */
    --accent-color: #FFD700;       /* Gold */
    --primary-dark: #6B3410;       /* Dark brown */
}
```

### Change App Name
Edit in `index.html` and `manifest.json`:
- Search for "ChantFlow"
- Replace with your app name

### Custom Logo
- Edit SVG icons in `manifest.json` and `index.html`
- Or replace with PNG images

## Mobile Installation

### iPhone/iPad
1. Open ChantFlow in Safari
2. Tap Share → "Add to Home Screen"
3. App appears as native app

### Android
1. Open ChantFlow in Chrome
2. Tap menu (⋮) → "Install app"
3. App appears on home screen

## Sharing & Distribution

✅ **Share the link** - Anyone with the link can access
✅ **QR Code** - Generate QR code pointing to your site
✅ **Share shortcut** - Users can add to their home screen
✅ **Social Media** - Link works great in posts/messages

## Future Enhancements

- Audio file upload (cloud storage)
- Session templates
- Session history/statistics
- Meditation timer
- Background music
- Interval notifications
- Export/import sessions

## Support & Feedback

Found a bug? Want a feature? 
- Check browser console (F12 → Console) for errors
- Test on different browsers
- Try clearing cache and reloading

## License & Credits

- **ChantFlow** - Open source for personal/community use
- Built with HTML5, CSS3, JavaScript
- No external dependencies (vanilla JS)
- Uses Web Audio API and Service Workers

---

## Quick Deployment Checklist

- [ ] Test locally first
- [ ] Choose hosting (GitHub Pages recommended)
- [ ] Upload all files
- [ ] Test on mobile
- [ ] Add to home screen (verify it works)
- [ ] Share the link
- [ ] Celebrate! 🎉

---

**Questions?** Check the browser console (F12) for any error messages - this helps troubleshooting!

**Happy Chanting! 🕉**
