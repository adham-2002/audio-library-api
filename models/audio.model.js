const mongoose = require("mongoose");

const audioSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    genre: {
      type: String,
      enum: [
        "pop",
        "rock",
        "rap",
        "jazz",
        "electronic",
        "classical",
        "country",
        "blues",
        "reggae",
        "metal",
      ],
    },
    privacy: {
      type: String,
      enum: ["private", "public"],
      default: "public",
    },
    coverName: {
      type: String,
      default: "public/images/song_cover.jpg",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    audioName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Audio", audioSchema);
