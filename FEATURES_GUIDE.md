# ChantFlow - Feature Guide & Tips

## Getting the Most Out of ChantFlow

### 🎵 Building Your Perfect Session

#### Example Sessions:

**Morning Meditation (10 min)**
- Om Chant: 21x
- Music 1: 3x
- Total: ~10 minutes

**Evening Chanting (30 min)**
- Om Chant: 54x
- Music 1: 10x
- Censor: 5x
- Total: ~30 minutes

**Quick Session (5 min)**
- Om Chant: 11x
- Total: ~5 minutes

#### Pro Tips:

1. **Start with 11x repetitions** for beginners
2. **Mix different audio tracks** for variety
3. **Use the time estimate** to plan your day
4. **Save sessions locally** - they're automatically saved!

---

## 💡 Understanding Each Feature

### Play Control
- **Play** - Start from first item
- **Pause** - Temporarily stop (press Play to resume)
- **Stop** - Stop and reset to beginning

### Auto-Play Next
When ON (default):
- Automatically moves to next item after current finishes
- Completes full session without interruption

When OFF:
- Pauses after each item
- Great if you want breaks between chants

### Loop Session
When ON:
- Repeats entire session from beginning when it ends
- Perfect for continuous background chanting

When OFF:
- Stops after final item
- Requires manual restart

### Volume Control
- Drag slider from 0% to 100%
- Affects playback volume immediately
- Useful for:
  - Background sessions (low volume)
  - Deep meditation (medium volume)
  - Exercise sessions (high volume)

---

## 📱 Installation Guide

### Add to iPhone Home Screen
1. Open Safari browser
2. Go to your ChantFlow URL
3. Tap Share button (bottom middle)
4. Scroll down → "Add to Home Screen"
5. Name it (default "ChantFlow" is fine)
6. Tap "Add"
7. App now appears like native app!

**Benefits:**
- Opens faster
- Works offline completely
- Full screen experience
- Separate from browser

### Add to Android Home Screen
1. Open Chrome browser
2. Go to your ChantFlow URL
3. Tap menu (3 dots, top right)
4. Tap "Install app"
5. Confirm installation
6. App added to home screen!

**Benefits:**
- Same as iPhone
- Can appear in app drawer
- Push notifications possible (future)

---

## 🎧 Audio Track Tips

### Recommended Audio Format
- **Format:** MP3
- **Bitrate:** 128 kbps or higher
- **Sample Rate:** 44.1 kHz
- **Channels:** Mono or Stereo

### Converting Audio
If you have WAV, OGG, or other formats:
1. Use free tools:
   - [Audacity](https://www.audacityteam.org) - Desktop (free)
   - [CloudConvert](https://cloudconvert.com) - Web (free)
   - [Online Convert](https://online-convert.com) - Web (free)
2. Export as MP3
3. Keep under 20 MB for best performance

### Adding Your Own Audio
1. Convert file to MP3
2. Upload to `/audio/` folder
3. Edit `app.js`:
```javascript
{ id: 'my_chant', name: '🕉 My Chant', file: 'audio/my_chant.mp3', duration: 0 }
```
4. Reload the app
5. Your track appears in dropdown!

---

## ⏱️ Timing Your Sessions

### Duration Calculation
- Session time = Audio length × Repetitions × Number of items
- Example:
  - Om Chant: 30 seconds × 11 = 5.5 minutes
  - Music 1: 2 minutes × 3 = 6 minutes
  - Total: ~11.5 minutes

### When to Use Quick Buttons
- **11x** - Quick morning session (5-10 min)
- **21x** - Standard session (15-20 min)
- **54x** - Extended session (30-45 min)
- **108x** - Full meditation (60+ min)

---

## 🔐 Privacy & Offline Use

### Your Data Privacy
- ✅ All data stored on YOUR device only
- ✅ No account needed
- ✅ No tracking or analytics
- ✅ No servers collect your info
- ✅ 100% private

### Offline Capability
- ✅ Works without internet after first load
- ✅ Audio files cached locally
- ✅ Playlists saved in browser storage
- ✅ Can chant anywhere, anytime

### Clearing Data (if needed)
1. Open browser → Settings
2. Find "Clear browsing data" or "Clear cache"
3. Select all options
4. Confirm deletion
5. Visit app again to re-cache

---

## 🐛 Troubleshooting

### Problem: Audio doesn't play
**Solution:**
1. Refresh page (Ctrl+Shift+R or Cmd+Shift+R)
2. Check internet connection (for first load)
3. Try different browser
4. Clear browser cache

### Problem: App won't install
**Solution:**
1. Must use HTTPS (auto on GitHub Pages/Netlify)
2. Visit site once, wait 2 seconds, try again
3. Check if browser supports PWA (Chrome, Edge, Firefox)
4. Try different browser

### Problem: Playlist disappeared
**Solution:**
1. Browser cache was cleared
2. Used private/incognito mode (data not saved)
3. Switched browsers
4. Disabled cookies in browser settings
- **Prevention:** Don't clear cache, use public browsing mode

### Problem: Time display wrong
**Solution:**
1. Audio file duration couldn't load
2. Refresh the page
3. Try different audio file
4. Check browser console (F12) for errors

### Problem: Volume not working
**Solution:**
1. Check device volume (not app volume)
2. Reload page
3. Try different audio file
4. Browser might have audio restrictions

---

## 🌍 Sharing & Collaboration

### Share Your Playlist
- ⚠️ **Note:** Playlists are stored locally, not on servers
- **Workaround:** Screenshot your playlist and share image
- **Or:** Write down the items and repetitions to share

### Recommended Use Cases
1. **Family & Friends** - Share the app link to let them create their own
2. **Group Sessions** - All use same app, sync using shared playlist notes
3. **Community** - Share app link in devotional groups
4. **Meditation Circles** - Everyone plays from same device via speaker

---

## 🎯 Use Cases & Ideas

### 🧘 Daily Meditation
- Morning: 21x Om Chant (10 min)
- Evening: 54x Music 1 (30 min)

### 🚴 Exercise Sessions
- High-energy music (11x to 21x)
- Keeps rhythm during workout

### 😴 Sleep & Relaxation
- Calm ambient music (54x or 108x)
- Low volume as you sleep

### 📚 Study Focus
- Background ambient music (looped)
- Helps concentration without distraction

### 🙏 Devotional Gatherings
- Group chanting session
- Multiple items, extended repetitions
- Screen on speaker for all to hear

---

## 🚀 Advanced Features (Future)

Planned enhancements:
- ✨ Custom audio upload
- ✨ Session templates
- ✨ Meditation timer
- ✨ Export/import sessions
- ✨ Statistics & history
- ✨ Background notifications
- ✨ Sync across devices

---

## 💬 Tips & Tricks

1. **Bookmark the site** - Easy access
2. **Add to home screen** - App-like experience
3. **Enable notifications** - Session reminders (future)
4. **Test offline** - Close WiFi/cellular, app still works
5. **Share link** - Anyone can use it, no setup needed

---

## ❓ FAQs

**Q: Will the app work on my old phone?**
A: Works on iOS 11.3+ and Android 5+. Older devices may not support all features.

**Q: Can I use it with Bluetooth speaker?**
A: Yes! App plays through device speaker or Bluetooth automatically.

**Q: Is my data backed up?**
A: Only locally. Back up manually if important (export feature coming).

**Q: Can I edit items in playlist?**
A: Currently, remove and re-add. Edit feature planned for v2.

**Q: Works without internet?**
A: Yes, after first load. Audio files cached locally.

**Q: Can friends see my playlist?**
A: No, 100% private and local to your device.

**Q: How much storage does it use?**
A: ~5-20 MB depending on audio files. Very lightweight.

---

## 🙏 Happy Chanting!

Remember:
- **Start small** - 11 repetitions is perfect to begin
- **Be consistent** - Daily practice is more important than duration
- **Enjoy the journey** - Quality over quantity
- **Share with others** - Help others discover the app

**May your practice bring peace and joy! 🕉**

---

Last updated: July 2024
Questions? Check browser console (F12 → Console) for error details.
