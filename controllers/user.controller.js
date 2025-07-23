const bcrypt = require("bcrypt");
const User = require("../models/users.model");
const passwordValidator = require("../utils/passwordValidator");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const { validationResult } = require("express-validator");
const apiError = require("../utils/apiError");
const logger = require("../utils/logger");

const signup = async (req, res, next) => {
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

    // Note: Role handling - in production, only admins should be able to create admin users
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
};
const signin = async (req, res, next) => {
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
};

module.exports = { signup, signin };
