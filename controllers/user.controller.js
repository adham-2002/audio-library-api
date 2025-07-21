const bcrypt = require("bcrypt");
const User = require("../models/users.model");
const passwordValidator = require("../utils/passwordValidator");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const { validationResult } = require("express-validator");
const apiError = require("../utils/apiError");

const signup = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
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
      return next(
        new apiError("username, email and password are required", 400)
      );
    }
    const existedEmail = await User.findOne({ email });
    if (existedEmail) {
      return next(new apiError("Email already exists", 409));
    }
    if (!passwordValidator(password)) {
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User Not Found" });
    }
    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) {
      return next(new apiError("Invalid Password", 400));
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    console.log(accessToken);
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
    next(error);
    return res
      .status(500)
      .json({ message: "Server error. Please try again later." });
  }
};

module.exports = { signup, signin };
