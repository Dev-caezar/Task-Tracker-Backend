import { User } from "../models/user.js";
import jwt from "jsonwebtoken";
import { sendOtpEmail } from "../service/otpService.js";
import { generateOtp } from "../utils/generateOtp.js";
import { hashOtp } from "../utils/hashOtp.js";
import { sendForgotPasswordOtp } from "../service/passwordService.js";

export const registerUser = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const emailNormalized = email.toLowerCase();

    const existingUser = await User.findOne({ email: emailNormalized });

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        message: "User already exists and is verified",
      });
    }

    const otp = generateOtp();
    const hashedOtp = hashOtp(otp);

    const user = await User.create({
      fullName,
      email: emailNormalized,
      password,
      otp: hashedOtp,
      otpExpires: Date.now() + 10 * 60 * 1000,
      otpAttempts: 0,
      otpLastSentAt: Date.now(),
    });

    await sendOtpEmail(emailNormalized, otp, "verify");

    res.status(201).json({
      message: "User created. Check your email for OTP.",
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const emailNormalized = email.toLowerCase();
    const user = await User.findOne({ email: emailNormalized });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otpAttempts >= 5) {
      return res.status(429).json({
        message: "Too many attempts. Try again later",
      });
    }

    const hashedOtp = hashOtp(otp);

    if (user.otp !== hashedOtp) {
      user.otpAttempts += 1;
      await user.save();

      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    user.otpAttempts = 0;

    await user.save();

    res.json({ message: "Account verified successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const emailNormalized = email.toLowerCase();

    const user = await User.findOne({ email: emailNormalized });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified) {
      return res.status(400).json({
        message: "Account already verified",
      });
    }

    const now = Date.now();

    if (user.otpLastSentAt && now - user.otpLastSentAt < 60 * 1000) {
      return res.status(429).json({
        message: "Please wait before requesting another OTP",
      });
    }

    const otp = generateOtp();
    const hashedOtp = hashOtp(otp);

    user.otp = hashedOtp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    user.otpAttempts = 0;
    user.otpLastSentAt = now;

    await user.save();

    await sendOtpEmail(emailNormalized, otp, "verify");

    res.json({ message: "OTP resent successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const emailNormalized = email.toLowerCase();

    const user = await User.findOne({ email: emailNormalized }).select(
      "+password",
    );

    if (!user) {
      return res.status(400).json({
        message: "User does not exist",
      });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        message: "Please verify your email first",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    res.status(200).json({
      message: "Login successful",
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const emailNormalized = email.toLowerCase();

    await sendForgotPasswordOtp(emailNormalized);

    res.json({
      message: "OTP sent to email",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyForgotOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const emailNormalized = email.toLowerCase();
    const user = await User.findOne({ email: emailNormalized });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otpAttempts >= 5) {
      return res.status(429).json({
        message: "Too many attempts. Try again later",
      });
    }

    const hashedOtp = hashOtp(otp);

    if (user.otp !== hashedOtp) {
      user.otpAttempts += 1;
      await user.save();

      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.isResetVerified = true;
    user.otp = null;
    user.otpExpires = null;
    user.otpAttempts = 0;

    await user.save();

    res.json({ message: "OTP verified. You can now reset your password." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resendForgotOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const emailNormalized = email.toLowerCase();
    const user = await User.findOne({ email: emailNormalized });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const now = Date.now();

    if (user.otpLastSentAt && now - user.otpLastSentAt < 60 * 1000) {
      return res.status(429).json({
        message: "Please wait before requesting another OTP",
      });
    }

    const otp = generateOtp();
    const hashedOtp = hashOtp(otp);

    user.otp = hashedOtp;
    user.otpExpires = now + 10 * 60 * 1000;
    user.otpAttempts = 0;
    user.otpLastSentAt = now;

    await user.save();

    await sendOtpEmail(user.email, otp, "forgot");

    res.json({ message: "OTP resent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const emailNormalized = email.toLowerCase();
    const user = await User.findOne({ email: emailNormalized }).select(
      "+password",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isResetVerified) {
      return res.status(400).json({
        message: "OTP not verified",
      });
    }

    user.password = newPassword;
    user.isResetVerified = false;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: true,
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to fetch user profile",
      error: error.message,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();

    res.status(200).json({
      message: "Users retrieved successfully",
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getOneUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
