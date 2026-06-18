import sharp from "sharp";

async function makeIcon() {
  const bg = { r: 251, g: 251, b: 248, alpha: 1 }; // #fbfbf8 off-white
  
  console.log("Resizing brand icon...");
  // Resize the brand icon to fit within the 512x512 box with padding (320x320)
  const brandIconResized = await sharp("public/yazzow-brand-icon.png")
    .resize(320, 320, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();

  console.log("Generating centered PWA icon for public/icon.png...");
  // Create a 512x512 off-white background and composite the resized brand icon on top of it
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: bg
    }
  })
  .composite([{ input: brandIconResized, gravity: "center" }])
  .png()
  .toFile("public/icon.png");

  console.log("Generating centered app icon for src/app/icon.png...");
  // Also write to src/app/icon.png
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: bg
    }
  })
  .composite([{ input: brandIconResized, gravity: "center" }])
  .png()
  .toFile("src/app/icon.png");

  console.log("Success! App icon successfully generated and centered.");
}

makeIcon().catch(console.error);
