import mongoose, { Schema } from "mongoose";

const productSchema = new mongoose.Schema({
  title:{
    type:String,
    required:true
},
description:{
    type:String,
    required:true
},
price:{
    type:Number,
    required:true
},
salePrice: {
    type: Number,
    default: 0,
},
category:{
    type : String,
    
    required:true
},
brand:{
type: String,
required: true
},
totalStock:{
    type:Number,
    required:true
},

image:{
    type:String,
    required:true
},
   averageReview : {
   type : Number
   }
},{timestamps:true,versionKey:false}
);

export const Product =mongoose.model("Product", productSchema);