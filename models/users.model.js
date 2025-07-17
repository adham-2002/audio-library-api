const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePic: {
    type: String,
    required: true,
    default: "/public/images/default-profile.jpg",
  },
  roles: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  }
},{timestamps:true});

module.exports = mongoose.model("User", userSchema);
