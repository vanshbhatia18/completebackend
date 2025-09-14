import mongoose, { Schema } from "mongoose";

const cartSchema=new Schema({
    user:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    product:{
        type:Schema.Types.ObjectId,
        ref:"Product",
        required:true
    },
    quantity:{
        type:Number,
        default:1,
    }
},{versionKey:false})

export const Cart=mongoose.model("Cart",cartSchema)