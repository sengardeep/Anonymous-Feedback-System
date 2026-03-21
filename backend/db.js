import mongoose from "mongoose";
const Schema = mongoose.Schema;

const formSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    userId : Schema.Types.ObjectId
});

const feedbackSchema = new Schema({
    formId: {
        type: Schema.Types.ObjectId,
        ref: "Form",
        required: true,
        index: true,
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,  
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

export const Form = mongoose.model("Form", formSchema);
export const Feedback = mongoose.model("Feedback", feedbackSchema);
export const User = mongoose.model("User",userSchema);