import express from 'express';
import mongoose from 'mongoose';
import { Feedback, Form, User } from './db.js';
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import { z } from "zod";
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware } from './middleware/auth.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, '..', 'frontend');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

if (!process.env.JWT_SECRET) {
    console.warn("JWT_SECRET is not set in environment. Using development fallback secret.");
}

app.use(cors({
    origin: "*"
}));

mongoose.connect(process.env.MONGODB_URI)
    .then(() => { console.log("Mongodb Connected"); })
    .catch(err => console.log(err));

app.use(express.json());
app.use(express.static(frontendPath));

app.get("/", (req, res) => {
    return res.sendFile(path.join(frontendPath, 'index.html'));
});

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});

const signinSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});

const formSchema = z.object({
    title: z.string().min(1)
});

const feedbackSchema = z.object({
    message: z.string().min(1)
});

//Signup
app.post("/signup", async (req, res) => {
    try {
        const result = signupSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ error: result.error.errors });
        }
        const { email, password } = result.data;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hash = await bcrypt.hash(password, 10);
        const user = await User.create({
            email: email,
            password: hash
        });

        if (!user) {
            return res.status(400).json({ message: "Unable to create user" });
        }
        return res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

//Signin
app.post("/signin", async (req, res) => {
    try {
        const result = signinSchema.safeParse(req.body);
        if (!result.success) {
             return res.status(400).json({ error: result.error.errors });
        }
        const { email, password } = result.data;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found with these credentials" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Wrong password" });
        }
        const token = jwt.sign({ userId: user._id }, JWT_SECRET);

        return res.status(200).json({
            msg: "Signin successfully",
            token: "Bearer " + token
        });
    } catch (error) {
        console.error("Signin error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

//Create a new feedback form
app.post("/form", authMiddleware, async (req, res) => {
    try {
        const result = formSchema.safeParse(req.body);
        if (!result.success) {
             return res.status(400).json({ error: result.error.errors });
        }
        const { title } = result.data;
        const form = await Form.create({
            title,
            userId: req.userId
        });
        return res.status(201).json({ formId: form._id });
    } catch (error) {
        console.error("Create form error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

//Fetch all forms for the logged in user
app.get("/forms", authMiddleware, async (req, res) => {
    try {
        const forms = await Form.find({ userId: req.userId }).sort({ createdAt: -1 });
        return res.status(200).json({ forms });
    } catch (error) {
        console.error("Fetch all forms error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

//Fetch form details
app.get("/form/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const form = await Form.findById(id);
        if (!form) {
            return res.status(404).json({ message: "Form does not exist" });
        }
        return res.status(200).json({
            id: form._id,
            title: form.title
        });
    } catch (error) {
        console.error("Fetch form error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

//Send the feedback to the respected form
app.post("/feedback/:formId", async (req, res) => {
    try {
        const formId = req.params.formId;
        const result = feedbackSchema.safeParse(req.body);
        if (!result.success) {
             return res.status(400).json({ error: result.error.errors });
        }
        const { message } = result.data;
        const form = await Form.findById(formId);
        if (!form) {
            return res.status(404).json({ message: "Form not found" });
        }
        
        const feedback = await Feedback.create({
            formId: formId,
            message: message
        });
        return res.status(201).json({
            message: "Feedback submitted successfully",
            id: feedback._id
        });
    } catch (error) {
        console.error("Submit feedback error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

//Owner sees all feedback
app.get("/feedback/:formId", authMiddleware, async (req, res) => {
    try {
        const id = req.params.formId;
        const form = await Form.findById(id);

        if (!form) {
            return res.status(404).json({ message: "Form not found" });
        }

        if (form.userId.toString() !== req.userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const allFeedbacks = await Feedback.find({ formId: id });
        return res.status(200).json({ allFeedbacks });
    } catch (error) {
        console.error("Get feedback error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

app.listen(3000, () => {
    console.log("Server is listening to port 3000");
});