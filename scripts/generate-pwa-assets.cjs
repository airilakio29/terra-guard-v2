const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const SPLASH_DIR = path.join(PUBLIC_DIR, 'splash');
const SOURCE_LOGO = path.join(PUBLIC_DIR, 'logo.png');

if (!fs.existsSync(SPLASH_DIR)) {
  fs.mkdirSync(SPLASH_DIR, { recursive: true });
}

async function generate() {
  console.log('🎨 Generating Terra Guard V2 PWA Icons & iOS Splash Screens...');

  // 1. Standard 192x192 icon
  await sharp(SOURCE_LOGO)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(PUBLIC_DIR, 'pwa-192x192.png'));
  console.log('✅ Generated pwa-192x192.png');

  // 2. Standard 512x512 icon
  await sharp(SOURCE_LOGO)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(PUBLIC_DIR, 'pwa-512x512.png'));
  console.log('✅ Generated pwa-512x512.png');

  // 3. Maskable 512x512 icon (W3C spec: 80% safe zone inner, solid theme background #F8FAFC)
  const innerLogoSize = Math.round(512 * 0.76); // ~389px inner
  const innerLogoBuffer = await sharp(SOURCE_LOGO)
    .resize(innerLogoSize, innerLogoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 248, g: 250, b: 252, alpha: 1 }, // #F8FAFC
    },
  })
    .composite([
      {
        input: innerLogoBuffer,
        gravity: 'center',
      },
    ])
    .png()
    .toFile(path.join(PUBLIC_DIR, 'pwa-maskable-512x512.png'));
  console.log('✅ Generated pwa-maskable-512x512.png (with 80% safe zone padding)');

  // 4. Apple Touch Icon (180x180, NO transparency per Apple HIG, #F8FAFC background)
  const appleInnerSize = Math.round(180 * 0.85); // 153px
  const appleInnerBuffer = await sharp(SOURCE_LOGO)
    .resize(appleInnerSize, appleInnerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 248, g: 250, b: 252, alpha: 1 }, // #F8FAFC
    },
  })
    .composite([
      {
        input: appleInnerBuffer,
        gravity: 'center',
      },
    ])
    .png()
    .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
  console.log('✅ Generated apple-touch-icon.png (180x180, non-transparent)');

  // 5. Favicons
  await sharp(SOURCE_LOGO)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(PUBLIC_DIR, 'favicon-32x32.png'));

  await sharp(SOURCE_LOGO)
    .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(PUBLIC_DIR, 'favicon-16x16.png'));
  console.log('✅ Generated favicons (32x32, 16x16)');

  // 6. Apple Touch Startup Images (Splash Screens for major iOS devices)
  const splashScreens = [
    { name: 'apple-splash-1179-2556.png', width: 1179, height: 2556, logoWidth: 420 }, // iPhone 16/15/14 Pro
    { name: 'apple-splash-1290-2796.png', width: 1290, height: 2796, logoWidth: 460 }, // iPhone 16/15/14 Pro Max
    { name: 'apple-splash-1170-2532.png', width: 1170, height: 2532, logoWidth: 420 }, // iPhone 15/14/13/12
    { name: 'apple-splash-750-1334.png', width: 750, height: 1334, logoWidth: 320 },   // iPhone SE/8
    { name: 'apple-splash-2048-2732.png', width: 2048, height: 2732, logoWidth: 620 }, // iPad Pro 12.9"
    { name: 'apple-splash-1668-2388.png', width: 1668, height: 2388, logoWidth: 540 }, // iPad Air / 11"
  ];

  for (const s of splashScreens) {
    const splashLogoBuffer = await sharp(SOURCE_LOGO)
      .resize(s.logoWidth, s.logoWidth, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: {
        width: s.width,
        height: s.height,
        channels: 4,
        background: { r: 248, g: 250, b: 252, alpha: 1 }, // #F8FAFC (Terra Classic background)
      },
    })
      .composite([
        {
          input: splashLogoBuffer,
          gravity: 'center',
        },
      ])
      .png()
      .toFile(path.join(SPLASH_DIR, s.name));
    console.log(`✅ Generated iOS splash: ${s.name} (${s.width}x${s.height})`);
  }

  console.log('🎉 All PWA assets generated successfully!');
}

generate().catch((err) => {
  console.error('❌ Failed to generate PWA assets:', err);
  process.exit(1);
});
