import { Brand } from "../../models/brand.model.js";

export const getAllBrands=async(req,res)=>{
    try {
        const result=await Brand.find({})
        console.log(result,"brand controller called")
        res.status(200).json(result)
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Error fetching brands"})
    }
}

export const addBrand= async(req,res)=> {
  try {const brand = await Brand.create(req.body);
    console.log(brand,"brand is added");
    res.status(200).json(brand)}
    catch(e) {
        console.log(error);
        res.status(500).json({message:"Error adding brands"})  
    }
    
}