# Generate PWA Icons

Your PWA is configured but needs icons in various sizes. Here are the easiest ways to generate them:

## Option 1: Online Tool (Recommended - Easiest)

1. Visit [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator) or [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Upload your logo at `/public/logo.svg`
3. Download the generated icons
4. Place all icons in the `/public` directory

The following icon sizes are needed:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Option 2: Use ImageMagick (Command Line)

If you have ImageMagick installed:

```bash
# Convert SVG to PNG at different sizes
for size in 72 96 128 144 152 192 384 512; do
  convert -background none -resize ${size}x${size} public/logo.svg public/icon-${size}x${size}.png
done
```

## Option 3: Use Node.js Sharp Library

Install sharp and run this script:

```bash
npm install sharp
```

Create `generate-icons.js`:

```javascript
const sharp = require('sharp');
const fs = require('fs');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  sharp('public/logo.svg')
    .resize(size, size)
    .png()
    .toFile(`public/icon-${size}x${size}.png`)
    .then(() => console.log(`Generated icon-${size}x${size}.png`))
    .catch(err => console.error(err));
});
```

Then run: `node generate-icons.js`

## After Generating Icons

1. Delete this file (GENERATE_PWA_ICONS.md)
2. Run `npm run build` to build your PWA
3. Test your PWA by:
   - Running `npm run start`
   - Opening in Chrome
   - Checking the Application tab in DevTools
   - Looking for install prompt
