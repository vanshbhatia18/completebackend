import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { cloudinaryUpload, cloudinaryDeleteFile } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Product } from "../../models/product.model.js";
const handleImageUpload = asyncHandler(async (req,res)=> {
  try{
  const b64 = Buffer.from(req.file.buffer).toString("base64")
  const url = "data:" + req.file.mimetype + ";base64," + b64;
  const imageUpload = await  cloudinaryUpload(url);
  return res.status(200).json(new ApiResponse(200,imageUpload,"image Successfully uploaded")) }
  catch(error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
})

const addProduct = asyncHandler(async(req,res)=> {
   try{
    const {
      image, 
      title, 
      description, 
      category, 
      brand, 
      price,
      salePrice,
      totalStock,
      averageReview,
      
    } = req.body
    const newlyCreatedProduct =  new Product({image, 
      title, 
      description, 
      category, 
      brand, 
      price,
      salePrice,
      totalStock,
      averageReview})
     await newlyCreatedProduct.save() 
     return res.status(200).json(new ApiResponse(200,newlyCreatedProduct,"the new Product jas been created"))

   }catch(error) {

    return res.status(500).json({ message: "Internal Server Error" });

   }
  

   
})

const getAllProducts = asyncHandler(async (req,res)=> {
     try{const getProducts =  await Product.find({})

     return res.status(200).json(new ApiResponse(200,getProducts,"list of all the products"))}
     catch(error) {
      return res.status(500).json({ message: "Internal Server Error" });

     }
  
})
const editProduct = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const {
      image,
      title,
      description,
      category,
      brand,
      price,
      salePrice,
      totalStock,
      averageReview,
    } = req.body;

    let findProduct = await Product.findById(id);
    if (!findProduct)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    findProduct.title = title || findProduct.title;
    findProduct.description = description || findProduct.description;
    findProduct.category = category || findProduct.category;
    findProduct.brand = brand || findProduct.brand;
    findProduct.price = price === "" ? 0 : price || findProduct.price;
    findProduct.salePrice =
      salePrice === "" ? 0 : salePrice || findProduct.salePrice;
    findProduct.totalStock = totalStock || findProduct.totalStock;
    findProduct.image = image || findProduct.image;
    findProduct.averageReview = averageReview || findProduct.averageReview;

    await findProduct.save();
    res.status(200).json({
      success: true,
      data: findProduct,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error occured",
    });
  }
});

//delete a product
const deleteProduct = asyncHandler( async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    res.status(200).json({
      success: true,
      message: "Product delete successfully",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error occured",
    });
  }
});

