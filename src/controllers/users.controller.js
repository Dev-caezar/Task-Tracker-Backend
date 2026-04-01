import { User } from "../models/user.js";
import jwt from "jsonwebtoken"

const registerUser = async (req, res) =>{
    try {
        const {fullName, email, password} = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({message: "all fields are required"})
        }

        const existingUser = await User.findOne({email: email.toLowerCase()})
        if (existingUser) {
            return res.status(400).json({message: "user already exists"})
        }

        const user = await User.create({
            fullName,
            email: email.toLowerCase(),
            password,
        })

        res.status(201).json({
            message: "Account created successfully",
            data: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                } 
        })

    } catch (error) {
        res.status(500).json({message: "internal server error", error: error.message})
    }
}

const loginUser = async (req, res) => {
    try {
        const {email, password} = req.body;
        const user = await User.findOne({
            email: email.toLowerCase(),
        })
        if (!email || !password) {
            return res.status(400).json({message: "all fields are required"})
        };
        if (!user) {
            return res.status(400).json({message: "user does not exist, try creating an account"})
        }

        const ismatch = await user.comparePassword(password);
        if (!ismatch) {
            return res.status(400).json({message: "invalid credentials"})
        }

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: "2h"})

        res.status(200).json({
            message: "login successful",
            data: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                } ,
                token
        })
    }
    catch (error) {
        res.status(500).json({message: "internal server error", error: error.message})
    }
}

const getAllUsers = async (req, res) =>{
    try {
       const users = await User.find();
       res.status(200).json({
        message: "users retrieved successfully",
        data: users
       }) 
    } catch (error) {
        res.status(500).json({
            message: "internal server error",
            error: error.message
        })
    }
}

const getOneUser = async (req, res) =>{
    try {
        const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({message: "user not found"})
    }
    res.status(200).json({
        message: "user retrieved successfully",
        data: user
    })
    } catch (error) {
       res.status(500).json({
        message: "internal server error",
        error: error.message
       }) 
    }
}

export {
    registerUser,
    loginUser,
    getAllUsers,
    getOneUser
}