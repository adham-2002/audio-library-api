const bcrypt = require("bcrypt");
const User = require("../models/users.model");
const passwordValidator = require("../utils/passwordValidator");
const { generateAccessToken, generateRefrechToken } = require("../utils/jwt");
const { validationResult } = require("express-validator");

const signup = async (req, res,next) => {
  try {
    const { username, email, password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map(err => err.msg)});
    }
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "username, email and password are required" });
    }
    const existedEmail = await User.findOne({ email });
    if (existedEmail) {
      return res.status(409).json({ message: "Email is already existed" });
    }
    if (!passwordValidator(password)) {
      return res.status(400).json({ message: "weak Password" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username: username,
      email: email,
      password: hashedPassword,
    });

    await newUser.save();
    const accessToken = generateAccessToken(newUser);
    const refrechToken = generateRefrechToken(newUser);
  console.log(accessToken)
    res.cookie("refresh_token", refrechToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({
      message: "Signup successful",
      user: {
        id: newUser._id,
        name: newUser.username,
        email: newUser.email,
      },
      accessToken,
    });
  } catch (error) {
    next(error)
    return res
      .status(500)
      .json({ message: "Server error. Please try again later." });
  }
};
const signin = async (req, res,next) => {
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
      return res.status(400).json({ message: "Invailed Password" });
    }
    const accessToken = generateAccessToken(user);
    const refrechToken = generateRefrechToken(user);
    console.log(accessToken)
    res.cookie("refresh_token", refrechToken, {
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
    next(error)
    return res
      .status(500)
      .json({ message: "Server error. Please try again later." });
  }
};

module.exports = { signup, signin };
