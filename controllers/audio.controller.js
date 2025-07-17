// - `POST /api/audio` — upload audio file (MP3/M4A), cover image, title, genre, and private/public setting
// - `GET /api/audio` — list public audio files from all users
// - `GET /api/audio/mine` — list your own uploaded files (public + private)
// DELETE /api/audio/:id — delete your own audio file

const Audio = require("../models/audio.model");
const uploadAudio = async (req, res, next) => {
  const { title, genre, isPublic } = req.body;
  const userId = req.user.id;
  // save audio in the database
  const audioData = {
    title,
    genre,
    privacy: isPublic ? "public" : "private",
    user: userId,
  };
  try {
    const newAudio = await Audio.create(audioData);
    res.status(201).json(newAudio);
  } catch (error) {
    next(error);
  }
};
module.exports = {
  uploadAudio,
};
