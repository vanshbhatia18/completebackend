import { Category } from "../../models/category.model.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
export const getAllCategories= asyncHandler(async(req,res)=>{
    try {
        const result=await Category.find({})
        res.status(200).json(result)
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Error fetching categories"})
    }
})


export const addCategory= async(req,res)=> {
    try {const category= await Category.create(req.body);
      console.log(category,"category is added");
      res.status(200).json(category``)}
      catch(e) {
          console.log(error);
          res.status(500).json({message:"Error addin brands"})  
      }
      
  }