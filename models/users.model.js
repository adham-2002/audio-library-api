const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Ensure email is unique
    },
    password: {
      type: String,
      required: true,
    },
    profilePic: {
      type: String,
      required: true,
      default: "images/default-profile.jpg",
    },
    history: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Audio",
      },
    ],
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Audio",
      },
    ],
    playlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Playlist",
      },
    ],
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isActive: { type: Boolean, default: true },
    deactivatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
