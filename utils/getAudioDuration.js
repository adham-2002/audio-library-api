const mm = require("music-metadata");

async function getAudioDuration(filePath, next){
    try{
        const metadata = await mm.parseFile(filePath)
        const duration = metadata.format.duration || 0;
        return formattedDuration = Number(duration.toFixed(2));
    }catch(err){
        return next(new apiError("Failed to extract audio duration", 400));
    }
}

module.exports = getAudioDuration