import mongoose, { Schema } from "mongoose";

const reviewSchema=new Schema({
    user:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    product:{
        type:Schema.Types.ObjectId,
        ref:"Product",
        required:true
    },
    rating:{
        type:Number,
        required:true,
        min:1,
        max:5,
    },
    comment:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
},{versionKey:false})


export const Review=mongoose.model("Review",reviewSchema)