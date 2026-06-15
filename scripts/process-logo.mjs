import sharp from "sharp";

const sourcePath = "C:\\Users\\Gaming\\.gemini\\antigravity\\brain\\639ab0c1-fc7b-4784-8c97-4fbc0d92161f\\media__1781532652161.jpg";
const outputPath = "C:\\Users\\Gaming\\Desktop\\Tutorai\\public\\yazzow-brand-icon.png";
const outputLogoPath = "C:\\Users\\Gaming\\Desktop\\Tutorai\\public\\yazzow-logo-transparent.png";
const outputStandardPath = "C:\\Users\\Gaming\\Desktop\\Tutorai\\public\\yazzow-logo.png";

async function run() {
  console.log("Loading image...");
  const image = sharp(sourcePath);
  const metadata = await image.metadata();
  const width = metadata.width;
  const height = metadata.height;
  console.log(`Dimensions: ${width}x${height}`);

  const buffer = await image.ensureAlpha().raw().toBuffer();
  const channels = 4; // RGBA

  // Flood fill algorithm to find background pixels
  const isBg = new Uint8Array(width * height);
  const queue = [];

  // Add all border pixels to queue if they are light (background)
  function isLightPixel(x, y) {
    const idx = (y * width + x) * channels;
    const r = buffer[idx];
    const g = buffer[idx + 1];
    const b = buffer[idx + 2];
    // Light checkerboard background is generally > 180 for R, G, B
    return r > 175 && g > 175 && b > 175;
  }

  // Add borders
  for (let x = 0; x < width; x++) {
    if (isLightPixel(x, 0)) { queue.push([x, 0]); isBg[0 * width + x] = 1; }
    if (isLightPixel(x, height - 1)) { queue.push([x, height - 1]); isBg[(height - 1) * width + x] = 1; }
  }
  for (let y = 0; y < height; y++) {
    if (isLightPixel(0, y)) { queue.push([0, y]); isBg[y * width + 0] = 1; }
    if (isLightPixel(width - 1, y)) { queue.push([width - 1, y]); isBg[y * width + (width - 1)] = 1; }
  }

  console.log(`Starting flood fill with ${queue.length} seed pixels...`);

  const dx = [1, -1, 0, 0, 1, 1, -1, -1];
  const dy = [0, 0, 1, -1, 1, -1, 1, -1];

  let head = 0;
  while (head < queue.length) {
    const [x, y] = queue[head++];
    for (let i = 0; i < 8; i++) {
      const nx = x + dx[i];
      const ny = y + dy[i];
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const idx = ny * width + nx;
        if (isBg[idx] === 0 && isLightPixel(nx, ny)) {
          isBg[idx] = 1;
          queue.push([nx, ny]);
        }
      }
    }
  }

  console.log(`Flood fill finished. Marked ${queue.length} pixels as background.`);

  // Set background pixels to fully transparent
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (isBg[idx] === 1) {
        const pixelIdx = idx * channels;
        buffer[pixelIdx] = 255;     // R
        buffer[pixelIdx + 1] = 255; // G
        buffer[pixelIdx + 2] = 255; // B
        buffer[pixelIdx + 3] = 0;   // A (transparent)
      }
    }
  }

  // Crop the transparent image to the bounding box of non-transparent pixels
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const alpha = buffer[idx + 3];
      if (alpha > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Padding
  const padding = 10;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);

  const croppedWidth = maxX - minX + 1;
  const croppedHeight = maxY - minY + 1;

  console.log(`BBox to crop: [${minX}, ${minY}] to [${maxX}, ${maxY}] (${croppedWidth}x${croppedHeight})`);

  // Create cropped buffer
  const croppedBuffer = Buffer.alloc(croppedWidth * croppedHeight * channels);
  for (let y = 0; y < croppedHeight; y++) {
    const srcY = minY + y;
    for (let x = 0; x < croppedWidth; x++) {
      const srcX = minX + x;
      const srcIdx = (srcY * width + srcX) * channels;
      const destIdx = (y * croppedWidth + x) * channels;
      croppedBuffer[destIdx] = buffer[srcIdx];
      croppedBuffer[destIdx + 1] = buffer[srcIdx + 1];
      croppedBuffer[destIdx + 2] = buffer[srcIdx + 2];
      croppedBuffer[destIdx + 3] = buffer[srcIdx + 3];
    }
  }

  // Let's also crop just the shield emblem (on the left side) for the standalone icon!
  // In the image, the shield is on the left, the text YAZZOW is on the right.
  // BBox for the emblem (X is from minX to roughly minX + croppedWidth * 0.4)
  // Let's find the gap between emblem and text
  let emblemMaxX = minX + Math.round(croppedWidth * 0.38); // fallback
  for (let x = minX + Math.round(croppedWidth * 0.25); x < minX + Math.round(croppedWidth * 0.5); x++) {
    let columnHasPixels = false;
    for (let y = minY; y <= maxY; y++) {
      const idx = (y * width + x) * channels;
      if (buffer[idx + 3] > 0) {
        columnHasPixels = true;
        break;
      }
    }
    if (!columnHasPixels) {
      emblemMaxX = x;
      break;
    }
  }

  const emblemWidth = emblemMaxX - minX + 1;
  console.log(`Emblem BBox: X from ${minX} to ${emblemMaxX} (${emblemWidth}px width)`);

  const emblemBuffer = Buffer.alloc(emblemWidth * croppedHeight * channels);
  for (let y = 0; y < croppedHeight; y++) {
    const srcY = minY + y;
    for (let x = 0; x < emblemWidth; x++) {
      const srcX = minX + x;
      const srcIdx = (srcY * width + srcX) * channels;
      const destIdx = (y * emblemWidth + x) * channels;
      emblemBuffer[destIdx] = buffer[srcIdx];
      emblemBuffer[destIdx + 1] = buffer[srcIdx + 1];
      emblemBuffer[destIdx + 2] = buffer[srcIdx + 2];
      emblemBuffer[destIdx + 3] = buffer[srcIdx + 3];
    }
  }

  // Save the standalone brand icon (shield only) to public/yazzow-brand-icon.png
  console.log("Saving brand icon...");
  await sharp(emblemBuffer, { raw: { width: emblemWidth, height: croppedHeight, channels } })
    .png()
    .toFile(outputPath);

  // Save the full transparent logo (shield + YAZZOW text) to public/yazzow-logo-transparent.png
  console.log("Saving transparent logo...");
  await sharp(croppedBuffer, { raw: { width: croppedWidth, height: croppedHeight, channels } })
    .png()
    .toFile(outputLogoPath);

  // Save the full logo to public/yazzow-logo.png
  console.log("Saving standard logo...");
  await sharp(croppedBuffer, { raw: { width: croppedWidth, height: croppedHeight, channels } })
    .png()
    .toFile(outputStandardPath);

  console.log("Success! All logo files updated with beautiful transparent background.");
}

run().catch(console.error);
