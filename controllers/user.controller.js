const bcrypt = require("bcrypt");
const User = require("../models/users.model");
const Audio = require("../models/audio.model");
const passwordValidator = require("../utils/passwordValidator");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const { validationResult } = require("express-validator");
const apiError = require("../utils/apiError");
const logger = require("../utils/logger");

const asyncErrorHandler = require("../utils/asyncErrorHandler");


const signup = asyncErrorHandler(async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    logger.info(`User signup attempt`, {
      username,
      email,
      role: role || "user",
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn(`Signup validation failed`, {
        username,
        email,
        errors: errors.array().map((err) => err.msg),
      });
      return next(
        new apiError(
          errors
            .array()
            .map((err) => err.msg)
            .join(", "),
          400
        )
      );
    }
    if (!username || !email || !password) {
      logger.warn(`Signup failed - missing required fields`, {
        username,
        email,
      });
      return next(
        new apiError("username, email and password are required", 400)
      );
    }
    const existedEmail = await User.findOne({ email });
    if (existedEmail) {
      logger.warn(`Signup failed - email already exists`, { email });
      return next(new apiError("Email already exists", 409));
    }
    if (!passwordValidator(password)) {
      logger.warn(`Signup failed - weak password`, { username, email });
      return next(new apiError("Password is too weak", 400));
    }

    const userRole = role === "admin" ? "admin" : "user";
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username: username,
      email: email,
      password: hashedPassword,
      role: userRole,
    });

    await newUser.save();
    logger.info(`User created successfully`, {
      userId: newUser._id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    });

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "Signup successful",
      user: {
        id: newUser._id,
        name: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
});
const signin = asyncErrorHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    logger.info(`User signin attempt`, { email });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn(`Signin validation failed`, {
        email,
        errors: errors.array().map((err) => err.msg),
      });
      return res.status(400).json({ errors: errors.array() });
    }

    if (!email || !password) {

      logger.warn(`Signin failed - missing required fields`, { email });
      return res
        .status(400)
        .json({ message: "email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`Signin failed - user not found`, { email });
      return res.status(400).json({ message: "User Not Found" });

      return next(new apiError("email and password are required", 400));
    }
    const user = await User.findOne({ email });
    if (!user) {
      return next(new apiError("User Not Found", 400));

    }
    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) {
      logger.warn(`Signin failed - invalid password`, {
        email,
        userId: user._id,
      });
      return next(new apiError("Invalid Password", 400));
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    logger.info(`User signed in successfully`, {
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      message: "Signin successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      accessToken,
    });
  } catch (error) {
    logger.error(`Signin error`, {
      email: req.body?.email,
      error: error.message,
      stack: error.stack,
    });
    next(error);


  }
});
const profile = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user.id;

  const existedUser = await User.findById(userId);
  if (!existedUser) {
    return next(new apiError("User not found", 404));
  }
  res.json({ userProfile: existedUser });
});
const getHistory = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user.id;
  const user = await User.findById(userId)
    .select("history")
    .populate("history");

  if (!user) {
    return next(new apiError("User not found", 404));
  }

  const history = user.history;

  res.status(200).json({
    success: true,
    history,
  });
});
const addfavorite = asyncErrorHandler(async (req, res, next) => {
  const { audioId } = req.params;
  const userId = req.user.id;
  if (!audioId) {
    return next(new apiError("Audio ID is required", 404));
  }

  const audioExists = await Audio.findById(audioId);
  if (!audioExists) {
    return next(new apiError("Audio not found", 404));
  }

  await User.updateOne({ _id: userId }, { $addToSet: { favorites: audioId } });
  res.status(200).json({
    status: "success",
    message: "Added to favorites",
  });
});
const getFavorites = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user.id;
  const user = await User.findById(userId)
    .select("favorites")
    .populate("favorites");

  if (!user) {
    return next(new apiError("User not found", 404));
  }

  const favorites = user.favorites;

  res.status(200).json({
    success: true,
    favorites,
  });
});
const removeFavorite = asyncErrorHandler(async (req, res, next) => {
  const { audioId } = req.params;
  const userId = req.user.id;

  if (!audioId) {
    return next(new apiError("Audio ID is required", 400));
  }

  const audioExists = await Audio.findById(audioId);
  if (!audioExists) {
    return next(new apiError("Audio not found", 404));
  }

  await User.updateOne({ _id: userId }, { $pull: { favorites: audioId } });

  res.status(200).json({
    status: "success",
    message: "Removed from favorites",
  });
});
module.exports = {
  signup,
  signin,
  profile,
  getHistory,
  addfavorite,
  getFavorites,
  removeFavorite,
};
