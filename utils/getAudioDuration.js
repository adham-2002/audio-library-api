const mm = require("music-metadata");
const fs = require("fs");

async function getAudioDuration(filePath) {
  try {
    // Check if file exists first
    if (!fs.existsSync(filePath)) {
      console.error(`Audio file not found: ${filePath}`);
      return 0;
    }

    const metadata = await mm.parseFile(filePath);
    const duration = metadata.format.duration || 0;
    const finalDuration = Number(duration.toFixed(2));

    if (finalDuration === 0) {
      console.warn(`Duration extracted is 0 for file: ${filePath}`);
    }

    return finalDuration;
  } catch (err) {
    console.error("Failed to extract audio duration:", {
      filePath,
      error: err.message,
    });
    return 0; // Return default duration if extraction fails
  }
}

module.exports = getAudioDuration;
