const mongoose = require("mongoose");

const playlistSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    duration: {
      type: Number,
      default: 0,
    },
    privacy: {
      type: String,
      enum: ["private", "public"],
      default: "public",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cover: {
      type: String,
      default: "images/song_cover.jpg",
    },
    audios: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Audio",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Playlist", playlistSchema);
