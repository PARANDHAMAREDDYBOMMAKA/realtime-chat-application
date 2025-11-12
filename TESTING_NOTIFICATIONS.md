# Testing Notification System

I've added comprehensive debug logging to help us identify the issue. Follow these steps:

## Step 1: Enable Notifications

1. **Open the app** in your browser
2. **Open Browser Console** (Press F12 or Right-click → Inspect → Console tab)
3. **Click the Bell icon** in the app header
4. **Toggle "Push Notifications" ON**
   - You should see a browser permission popup
   - Click "Allow"
5. **Toggle "Sound" ON**
6. **Click "Test Sound"** button
   - You should hear the iPhone notification sound
   - Check console for logs starting with 🎵

## Step 2: Check Your Settings

In the console, you should see logs like:
```
🎵 playNotificationSound called: {soundName: undefined, soundEnabled: true, customSound: "default"}
🎵 Attempting to play sound: {sound: "default", soundPath: "/sounds/notification.wav"}
✅ Audio played successfully
```

If you see:
- `⏭️ Sound disabled in settings` - Your sound is turned off, enable it
- `❌ Cannot show notification` - Browser permission is denied
- `⚠️ Audio playback failed` - Sound file issue

## Step 3: Test Receiving Messages

### Setup:
1. Open the app in **two different browsers** (Chrome and Firefox) OR
2. Open the app in **two different devices** OR
3. Open the app in **normal + incognito window**

### Test A: Tab Visible
1. Keep the app visible in both browsers
2. Send a message from Browser A
3. In Browser B console, you should see:
   ```
   📨 New message received: {from: "Username", soundEnabled: true, pushEnabled: true, ...}
   🔊 Playing notification sound...
   🎵 playNotificationSound called: ...
   ✅ Audio played successfully
   ℹ️ Not showing notification - app is in foreground or push disabled
   ```
4. You should **HEAR the sound**
5. You should **NOT see a browser notification** (because tab is visible)

### Test B: Tab Hidden (Different Tab)
1. In Browser B, switch to a different tab (like Gmail, Twitter, etc.)
2. Send a message from Browser A
3. In Browser B, you should:
   - **HEAR the notification sound**
   - **SEE a browser notification popup**
4. Switch back to the app tab and check console for:
   ```
   📨 New message received: {isHidden: true, hasFocus: false, ...}
   🔊 Playing notification sound...
   🔔 Showing browser notification...
   ✅ Notification created: Notification {title: "..."}
   ```

### Test C: Different Window
1. In Browser B, click on a different application (VS Code, Terminal, etc.)
2. Send a message from Browser A
3. You should:
   - **HEAR the notification sound**
   - **SEE a browser notification**

## Step 4: What to Check If It's Not Working

### If NO SOUND plays:

1. **Check browser console** - Look for these logs:
   - `🎵 playNotificationSound called` - Function is being called?
   - `⏭️ Sound disabled in settings` - If you see this, enable sound in settings
   - `⚠️ Audio playback failed` - If you see this, check error message

2. **Check sound files exist:**
   ```bash
   ls public/sounds/
   # Should show: notification.wav, ding.wav, bell.wav, chime.wav, pop.wav
   ```

3. **Test sound file directly:**
   - Open: `http://localhost:3000/sounds/notification.wav`
   - Should play the sound in browser

4. **Check browser audio:**
   - Browser tab is not muted (check tab icon)
   - System volume is not muted
   - Browser has permission to play audio

### If NO NOTIFICATION shows:

1. **Check console logs:**
   ```
   📨 New message received: {
     isHidden: true,     ← Should be true when tab is hidden
     hasFocus: false,    ← Should be false when window not focused
     pushEnabled: true,  ← Should be true
     permission: "granted"  ← Should be "granted"
   }
   ```

2. **If `permission: "default"` or `"denied"`:**
   - Click Bell icon → Enable Notifications
   - OR reset browser permissions:
     - Chrome: Click lock icon in address bar → Site settings → Notifications → Allow
     - Firefox: Click shield icon → Permissions → Notifications → Allow

3. **If `isHidden: false` when tab is hidden:**
   - This is a bug - please share console logs

4. **If `pushEnabled: false`:**
   - Click Bell icon → Toggle "Push Notifications" ON

### If sound plays BUT notification doesn't show:

Check the console for:
```
ℹ️ Not showing notification - app is in foreground or push disabled
```

This means:
- Either the tab is visible (working as intended)
- OR push notifications are disabled in settings

## Step 5: Share Debug Info

If it's still not working, please share:

1. **Console logs** when you receive a message (copy all logs with emoji icons)
2. **Browser name and version** (Chrome 120, Firefox 115, etc.)
3. **Operating System** (Windows 11, macOS 14, etc.)
4. **Screenshot** of the Bell icon → Settings dialog showing toggle states
5. **Browser permission** (chrome://settings/content/notifications or similar)

## Expected Behavior Summary

| Scenario | Sound | Browser Notification |
|----------|-------|---------------------|
| Tab visible, window focused | ✅ Yes | ❌ No |
| Tab visible, window not focused | ✅ Yes | ✅ Yes |
| Tab hidden (different tab) | ✅ Yes | ✅ Yes |
| Browser minimized | ✅ Yes | ✅ Yes |
| App closed | ❌ No* | ❌ No* |

*Requires Service Worker push notifications (not implemented yet)

## Common Issues

### "Sound works in foreground but not background"
- This is usually a browser autoplay policy
- The first interaction with the page should unlock audio
- Try clicking anywhere on the page first

### "Notification shows but no sound"
- Check `soundEnabled: true` in console logs
- Try the "Test Sound" button in settings
- Check browser tab is not muted

### "Neither sound nor notification"
- Check you're receiving the message (message appears in chat)
- Check console for `📨 New message received` log
- If no log appears, the hook might not be attached

### "Works sometimes but not always"
- Check if conversation is muted
- Check console for "conversation is muted" or similar
- Unmute the conversation if needed
