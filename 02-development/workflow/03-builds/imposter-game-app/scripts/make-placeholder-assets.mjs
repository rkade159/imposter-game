// Generates PLACEHOLDER source images for the Android app icon and splash, into
// resources/. These are intentionally plain (the game's existing logo on the
// dark theme colour) — real artwork will come later from the design workspace.
//
// After running this, `capacitor-assets generate --android` slices these into
// every density Android needs. The `android:assets` npm script chains both.
//
// Run from the project root:  node scripts/make-placeholder-assets.mjs
import sharp from 'sharp';

const BG = { r: 15, g: 15, b: 26, alpha: 1 }; // #0f0f1a — the app's dark theme
const SOURCE_LOGO = 'public/icons/icon-512.png';

async function centredOnCanvas(size, logoSize, outFile) {
  // Resize the logo (preserving aspect, transparent padding) then drop it onto a
  // solid dark square of the requested size.
  const logo = await sharp(SOURCE_LOGO)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: logo }])
    .png()
    .toFile(outFile);
}

// Icon source must be at least 1024x1024; splash source 2732x2732 (Capacitor reqs).
await centredOnCanvas(1024, 720, 'resources/icon.png');
await centredOnCanvas(2732, 640, 'resources/splash.png');
console.log('Wrote resources/icon.png (1024) and resources/splash.png (2732)');
