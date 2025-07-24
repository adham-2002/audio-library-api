const Playlist = require("../models/playlist.model");
const Audio = require("../models/audio.model");
const apiError = require("../utils/apiError");
const asyncErrorHandler = require("../utils/asyncErrorHandler");

const createNewPlaylist = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user.id;
  const title = `playlist_${Date.now()}`;

  const newPlaylist = await Playlist.create({
    title: title,
    user: userId,
  });

  res.status(201).json({
    status: "success",
    message: "Playlist created successfully",
    data: {
      playlist: {
        id: newPlaylist._id,
        title: title,
        createdAt: newPlaylist.createdAt,
      },
    },
  });
});

const UpdatePlaylist = asyncErrorHandler(async (req, res, next) => {
  //still need to update cover future
  const { title, description, privacy = "public" } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;
  const { playlistId } = req.params;
  const wantedPlaylist = await Playlist.findOne({
    user: userId,
    _id: playlistId,
  });
  if (!wantedPlaylist) {
    return next(
      new apiError(
        "Playlist not found or you are not the owner of this playlist",
        404
      )
    );
  }
  if (userRole !== "admin" && wantedPlaylist.user.toString() !== userId) {
    return next(
      new apiError("You are not authorized to update this audio", 403)
    );
  }

  if (title) wantedPlaylist.title = title;
  if (description) wantedPlaylist.description;
  if (privacy) wantedPlaylist.privacy = privacy;
  await wantedPlaylist.save();
  res.status(200).json({
    status: "success",
    message: "Playlist updated successfully",
    data: {
      playlist: {
        id: wantedPlaylist._id,
        title: wantedPlaylist.title,
        description: wantedPlaylist.description,
        privacy: wantedPlaylist.privacy,
        createdAt: wantedPlaylist.createdAt,
        updatedAt: wantedPlaylist.updatedAt,
      },
    },
  });
});

const addAudioToPlaylist = asyncErrorHandler(async (req, res, next) => {
  const { playlistId } = req.params;
  const { audioId } = req.body;
  const userId = req.user.id;

  const wantedPlaylist = await Playlist.findOne({
    _id: playlistId,
    user: userId,
  });
  if (!wantedPlaylist) {
    return next(
      new apiError(
        "Playlist not found or you are not the owner of this playlist",
        404
      )
    );
  }

  const wantedAudio = await Audio.findOne({ _id: audioId, privacy: "public" });
  if (!wantedAudio) {
    return next(new apiError("Audio not found or the audio is private"), 404);
  }


  if (wantedPlaylist.audios.includes(audioId)) {
    return next(new apiError("Audio already exists in playlist", 400));
  }
  const audioDuration = wantedAudio.duration
  wantedPlaylist.duration +=audioDuration
 
 
  wantedPlaylist.audios.push(audioId);
  await wantedPlaylist.save();
  res.status(200).json({
    status: "success",
    message: "audio added successfully to playlist",
    data: {
      playlist: {
        id: wantedPlaylist._id,
        title: wantedPlaylist.title,
        description: wantedPlaylist.description,
        duration:wantedPlaylist.duration,
        audios: wantedPlaylist.audios,
        privacy: wantedPlaylist.privacy,
        createdAt: wantedPlaylist.createdAt,
        updatedAt: wantedPlaylist.updatedAt,
      },
    },
  });
});
const getPublicPlaylist = asyncErrorHandler(async (req, res, next) => {
  const playlists = await Playlist.find({ privacy: 'public' });
  if (!playlists) {
    return next(new apiError("playlists not found", 404));
  }
  res.status(200).json({
    status: "success",
    message: "audio added successfully to playlist",
    data: {
      playlists: {
        playlists,
      },
    },
  });
});
module.exports = {
  createNewPlaylist,
  UpdatePlaylist,
  addAudioToPlaylist,
  getPublicPlaylist,
};
