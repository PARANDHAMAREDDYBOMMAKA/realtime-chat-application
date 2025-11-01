const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputSvg = path.join(__dirname, '../public/logo.svg');
const outputDir = path.join(__dirname, '../public');

console.log('Generating PWA icons...\n');

// Check if sharp is installed
try {
  require.resolve('sharp');
} catch (e) {
  console.error('Error: sharp is not installed.');
  console.error('Please run: npm install --save-dev sharp');
  process.exit(1);
}

// Check if input SVG exists
if (!fs.existsSync(inputSvg)) {
  console.error('Error: logo.svg not found at public/logo.svg');
  process.exit(1);
}

// Generate icons
Promise.all(
  sizes.map(size => {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    return sharp(inputSvg)
      .resize(size, size, {
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(outputPath)
      .then(() => {
        console.log(`✓ Generated icon-${size}x${size}.png`);
      })
      .catch(err => {
        console.error(`✗ Failed to generate icon-${size}x${size}.png:`, err.message);
      });
  })
)
  .then(() => {
    console.log('\n✓ All PWA icons generated successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run build');
    console.log('2. Run: npm run start');
    console.log('3. Open Chrome and check DevTools > Application > Manifest');
  })
  .catch(err => {
    console.error('\n✗ Error generating icons:', err);
    process.exit(1);
  });
