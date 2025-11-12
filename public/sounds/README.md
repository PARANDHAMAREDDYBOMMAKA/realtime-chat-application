# Notification Sounds

This directory contains audio files for WhatsApp-like notification sounds.

## Required Sound Files

You need to add the following sound files to this directory:

1. **notification.mp3** - Default notification sound (similar to WhatsApp)
2. **ding.mp3** - Ding sound
3. **bell.mp3** - Bell sound
4. **chime.mp3** - Chime sound
5. **pop.mp3** - Pop sound

## Where to Get Notification Sounds

### Option 1: Free Sound Libraries
- **Zapsplat**: https://www.zapsplat.com/sound-effect-categories/notifications/
- **Freesound**: https://freesound.org/search/?q=notification
- **Mixkit**: https://mixkit.co/free-sound-effects/notification/

### Option 2: Record Your Own
Use Audacity or similar audio software to create custom notification sounds.

### Option 3: Use Open Source Sounds
Search for "open source notification sounds" or "creative commons notification sounds"

## Audio File Specifications

- **Format**: MP3 (for best browser compatibility)
- **Duration**: 0.5 - 2 seconds (short and crisp)
- **Sample Rate**: 44.1 kHz
- **Bit Rate**: 128-192 kbps
- **Volume**: Normalized to -6dB to -3dB peak

## WhatsApp-like Sound Characteristics

For a WhatsApp-like notification:
- Short duration (around 0.5-1 second)
- Clear, distinct tone
- Not too harsh or jarring
- Pleasant frequency range (500-1000 Hz)
- Quick attack and decay

## Example Using ffmpeg

If you have a sound file and want to optimize it:

```bash
# Convert to MP3 with optimal settings
ffmpeg -i input.wav -codec:a libmp3lame -b:a 128k -ar 44100 notification.mp3

# Trim to 1 second
ffmpeg -i notification.mp3 -ss 0 -t 1 notification-trimmed.mp3

# Normalize volume
ffmpeg -i notification.mp3 -af "volume=0.5" notification-normalized.mp3
```

## Testing

After adding the sound files:
1. Open your chat application
2. Go to Settings → Notifications
3. Toggle "Sound Notifications" on
4. Select a sound from the dropdown
5. Click "Test Sound" to preview
6. Send a test message to hear it in action

## Fallback Behavior

If sound files are missing or can't be played, the app will automatically fall back to using Web Audio API synthesized sounds.
