# WhatsApp-Like Notification Setup Guide

This guide explains how to set up and use the notification system with sounds in your chat application.

## Features

Your notification system now includes:

✅ **Browser Push Notifications** - Desktop notifications when the app is in the background
✅ **Notification Sounds** - WhatsApp-like sounds for incoming messages
✅ **Multiple Sound Options** - Choose from 5 different notification sounds
✅ **Per-Conversation Muting** - Mute specific conversations
✅ **Smart Notification Logic** - Only notify when necessary
✅ **Fallback Support** - Automatically falls back to synthesized sounds if audio files are missing

## Quick Start

### Step 1: Add Notification Sound Files

You need to add notification sound files to the `public/sounds/` directory:

1. **Option A: Download from Sound Libraries** (Recommended)
   - Visit https://www.zapsplat.com/sound-effect-categories/notifications/
   - Download short notification sounds (0.5-1 second duration)
   - Save them as MP3 files in `public/sounds/`:
     - `notification.mp3` (default sound)
     - `ding.mp3`
     - `bell.mp3`
     - `chime.mp3`
     - `pop.mp3`

2. **Option B: Generate Basic Sounds**
   - Open `scripts/generate-notification-sounds.html` in your browser
   - Preview and download the generated sounds
   - Save them in `public/sounds/`
   - (Note: These are basic synthesized sounds; professional audio files are recommended)

3. **Option C: Use Your Own Sounds**
   - Record or create custom notification sounds
   - Export as MP3 format
   - Keep duration short (0.5-2 seconds)
   - Normalize volume to -6dB to -3dB peak

See `public/sounds/README.md` for detailed instructions.

### Step 2: Enable Notifications in the App

1. **Open the app** and log in
2. **Go to Settings** (click your profile)
3. **Enable "Push Notifications"**
   - This will request browser permission
   - Allow notifications when prompted
4. **Enable "Sound Notifications"**
5. **Select your preferred sound** from the dropdown
6. **Click "Test Sound"** to preview

### Step 3: Test Notifications

1. Open the app in two different browsers or devices
2. Log in with different accounts
3. Send a message from one account to the other
4. You should hear a notification sound
5. Switch to another tab or minimize the browser
6. Send another message
7. You should see a browser notification and hear a sound

## How It Works

### Sound Notifications

- **Tab Visible**: Plays sound only
- **Tab Hidden**: Plays sound AND shows browser notification
- **Sound Settings**: Respects user's sound enable/disable setting
- **Volume**: Set to 50% by default (adjustable in code)

### Browser Notifications

Browser notifications are shown when:
- The browser tab is hidden or minimized
- Push notifications are enabled
- Browser permission has been granted
- The conversation is not muted

Notification includes:
- Conversation name (or sender name for direct messages)
- Message preview (first 50 characters for text messages)
- Sender name for group chats
- App icon

### Smart Notification Logic

The system intelligently handles notifications:
- ✅ Only notifies for messages from other users (not your own messages)
- ✅ Prevents duplicate notifications
- ✅ Respects muted conversations
- ✅ Only notifies for new messages (not on page load)
- ✅ Works with real-time updates via WebSockets

### Fallback Behavior

If notification sound files are missing or can't be played:
- Automatically falls back to Web Audio API synthesized sounds
- No error shown to the user
- Gracefully handles audio playback failures

## Notification Settings

Users can control:
1. **Push Notifications** (On/Off) - Browser notifications
2. **Sound Notifications** (On/Off) - Audio alerts
3. **Notification Sound** - Choose from 5 different sounds
4. **Per-Conversation Muting** - Mute specific chats

Settings are saved per-user in the database and persist across sessions.

## Architecture

### Key Files

**Frontend:**
- `hooks/useNotifications.ts` - Main notification hook with sound playback
- `hooks/useMessageNotifications.ts` - Message notification logic
- `components/shared/NotificationSettings.tsx` - Settings UI

**Backend:**
- `convex/notificationSettings.ts` - Database queries and mutations
- `convex/schema.ts` - Notification settings schema

**Assets:**
- `public/sounds/` - Notification sound files
- `public/icon-192x192.png` - Notification icon

**Tools:**
- `scripts/generate-notification-sounds.html` - Sound generator tool

### Technology Stack

- **HTML5 Audio API** - For playing sound files
- **Web Audio API** - For fallback synthesized sounds
- **Notification API** - For browser push notifications
- **Convex** - For real-time data sync and storage
- **React Hooks** - For state management

## Customization

### Adjust Volume

Edit `hooks/useNotifications.ts` line 99:

```typescript
audioRef.current.volume = 0.5; // Change this value (0.0 to 1.0)
```

### Add More Sounds

1. Add sound file to `public/sounds/`
2. Update `NOTIFICATION_SOUNDS` object in `hooks/useNotifications.ts`:

```typescript
const NOTIFICATION_SOUNDS = {
  default: "/sounds/notification.mp3",
  ding: "/sounds/ding.mp3",
  bell: "/sounds/bell.mp3",
  chime: "/sounds/chime.mp3",
  pop: "/sounds/pop.mp3",
  custom: "/sounds/custom.mp3", // Add your new sound
} as const;
```

3. The new sound will automatically appear in the settings dropdown

### Change Notification Duration

Browser notifications auto-dismiss after a few seconds by default. To change this, edit `hooks/useMessageNotifications.ts` line 65:

```typescript
new Notification(conversationName, {
  body: ...,
  requireInteraction: true, // Notification stays until dismissed
  // or
  requireInteraction: false, // Auto-dismiss (default)
})
```

### Customize Notification Content

Edit the message preview logic in `hooks/useMessageNotifications.ts` line 51-57:

```typescript
const messagePreview = msg.message.type === "text"
  ? msg.message.content.slice(0, 50) // Change character limit
  : msg.message.type === "image"
    ? "📷 Photo" // Change emoji or text
    : "📎 Attachment";
```

## Troubleshooting

### Notifications Not Showing

1. **Check browser permissions:**
   - Chrome: Settings → Privacy and Security → Site Settings → Notifications
   - Firefox: Preferences → Privacy & Security → Permissions → Notifications
   - Safari: Preferences → Websites → Notifications

2. **Check app settings:**
   - Open Settings in the app
   - Verify "Push Notifications" is enabled
   - Try clicking "Enable Notifications" again

3. **Check browser console:**
   - Press F12 to open DevTools
   - Look for error messages
   - Common issues: permission denied, notification API not supported

### Sounds Not Playing

1. **Check if sound files exist:**
   - Verify files are in `public/sounds/` directory
   - Check filenames match exactly: `notification.mp3`, `ding.mp3`, etc.

2. **Check browser console:**
   - Look for "Audio playback failed" warnings
   - If you see warnings, the system is using fallback sounds

3. **Check app settings:**
   - Open Settings in the app
   - Verify "Sound Notifications" is enabled
   - Try different sounds from the dropdown

4. **Check browser audio:**
   - Ensure browser tab is not muted
   - Check system volume
   - Try playing the sound file directly by visiting: `http://localhost:3000/sounds/notification.mp3`

### Sounds Play But Notifications Don't Show

- Browser notifications only show when the tab is **hidden or minimized**
- If the tab is active/visible, only sounds will play (by design)
- This matches WhatsApp Web behavior

### Permission Denied

If browser blocks notification permission:
1. Click the lock icon in the address bar
2. Reset notification permissions
3. Reload the page
4. Try enabling notifications again in settings

### Notifications Show But No Sound

1. Check "Sound Notifications" is enabled in settings
2. Verify sound files exist in `public/sounds/`
3. Check browser console for audio errors
4. Try testing the sound using the "Test Sound" button in settings

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Browser Notifications | ✅ | ✅ | ✅ | ✅ |
| HTML5 Audio | ✅ | ✅ | ✅ | ✅ |
| Web Audio API (Fallback) | ✅ | ✅ | ✅ | ✅ |
| Silent Notifications | ✅ | ✅ | ⚠️ | ✅ |

⚠️ Safari may play system sound for notifications

## Best Practices

1. **Keep sounds short** - 0.5-2 seconds is ideal
2. **Use pleasant tones** - Avoid harsh or jarring sounds
3. **Normalize volume** - Prevent overly loud notifications
4. **Test on devices** - Different devices may have different volume levels
5. **Provide options** - Let users choose their preferred sound
6. **Respect privacy** - Show message preview but not full content in notifications
7. **Mute support** - Allow users to mute specific conversations

## Production Deployment

Before deploying to production:

1. ✅ Add professional notification sound files
2. ✅ Test on multiple browsers and devices
3. ✅ Verify HTTPS is enabled (required for notifications)
4. ✅ Test with Do Not Disturb mode
5. ✅ Verify PWA manifest is properly configured
6. ✅ Test notification behavior in different scenarios
7. ✅ Add analytics to track notification engagement (optional)

## Advanced: Service Worker Notifications

For background notifications (even when the app is closed), you'll need to implement Service Worker notifications:

1. Update `public/sw.js` to handle push events
2. Set up push notification server (using Firebase Cloud Messaging or similar)
3. Subscribe users to push notifications
4. Send push messages from your backend

This is more advanced and requires additional setup. The current implementation handles notifications when the app is open (in foreground or background tab).

## Support

If you encounter issues:
1. Check this documentation first
2. Review the browser console for errors
3. Test in an incognito/private window
4. Try a different browser
5. Check the GitHub issues for similar problems

## Resources

- [Web Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [HTML5 Audio API](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
