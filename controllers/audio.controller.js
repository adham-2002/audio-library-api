// - `POST /api/audio` — upload audio file (MP3/M4A), cover image, title, genre, and private/public setting
// - `GET /api/audio` — list public audio files from all users
// - `GET /api/audio/mine` — list your own uploaded files (public + private)
// DELETE /api/audio/:id — delete your own audio file

const Audio = require("../models/audio.model");
const fs = require("fs").promises;
// async function deleteFile(path) {
//   try {
//     await fs.unlink(path);
//   } catch (err) {
//     console.error("Error deleting file:", err);
//   }
// }
const uploadAudio = async (req, res, next) => {
  const { title, genre, isPublic } = req.body;
  const userId = req.user.id;
  // save audio in the database
  console.log(req.files.cover?.[0].filename);
  const audioData = {
    title,
    genre,
    privacy: isPublic ? "public" : "private",
    user: userId,
    coverName: req.files.cover?.[0].filename,
    audioName: req.files.audio?.[0].filename,
  };
  try {
    const newAudio = await Audio.create(audioData);
    res.status(201).json(newAudio);
  } catch (error) {
    next(error);
  }
};

const getPublicAudios = async (req, res, next) => {
  const publicAudios = await Audio.find({ privacy: "public" });
  res.status(200).json({
    publicAudios,
  });
};
const getUserAudios = async (req, res, next) => {
  const userId = req.user.id;
  const myAudios = await Audio.find({ user: userId }).populate("user");
  console.log(myAudios);
  if (myAudios.length === 0) {
    return next(new Error("You don't uploaded any audios"));
  }
  res.status(200).json({
    message: "successfully",
    myAudios,
  });
};
const deleteAudio = async (req, res, next) => {
  //name of file is user_${req.user.id}. but how i can get extention of file?
  const path = `uploads/audios/user_${req.user.id}`;
  const userId = req.user.id;
  const audioId = req.params.id;
  console.log(userId);
  console.log(audioId);
  try {
    const something = await Audio.deleteOne({ user: userId, _id: audioId });
    console.log(something);
  } catch (err) {
    next(
      new Error(
        "AUdio not exists or you not the owner of this audio to delete it"
      )
    );
  }
  res.status(204).end();
};
module.exports = {
  uploadAudio,
  getPublicAudios,
  getUserAudios,
  deleteAudio,
};
