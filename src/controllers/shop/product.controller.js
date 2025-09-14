import { Product } from "../../models/product.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { cloudinaryUpload } from "../../utils/cloudinary.js";
// GET filtered and sorted products

export const createProduct = asyncHandler(async(req,res)=> {
  try {

    const {title , price , description,stockQuantity,thumbnail,discountPercentage,category,brand} = req.body;
    const obj= {title , price , description,stockQuantity,thumbnail,discountPercentage};
   // console.log(req.f)
   /*
    for([key,value] of Object.entries(obj)) {
       if(key!=)
    }*/
    console.log(req.files,"reqested files are")
   if (!req.files || !Array.isArray(req.files?.images) ||req.files?.images.length==0) {
     throw new ApiError(404,"not sended product Imaages");

   }
    let uploadedImages = [];
    if(req.files?.images) {
       const promises=  req.files.images.map((image)=> 
        cloudinaryUpload(image.path))
        uploadedImages = await Promise.all(promises)
    }
  
      const images = uploadedImages.map((img)=> img.url);

    const created=new Product({
        title :title,
        description:description,
        price:price,
        discountPercentage:discountPercentage,
        category:category,
        brand:brand,
        stockQuantity:stockQuantity,
        thumbnail:thumbnail,
        images:images

    })

   
    await created.save()
    console.log(created,"req.body gives us")
    res.status(201).json(created)
} catch (error) {
    console.log(error);
    return res.status(500).json({message:'Error adding product, please trying again later'})
}
})






export const getTheFilterProduct = asyncHandler(async (req, res) => {
  try {
    const filter={}
    const sort={}
    let skip=0
    let limit=0

    if(req.query.brand){
        filter.brand={$in:req.query.brand}
    }

    if(req.query.category){
        filter.category={$in:req.query.category}
    }

    if(req.query.user){
        filter['isDeleted']=false
    }

    if(req.query.sort){
        sort[req.query.sort]=req.query.order?req.query.order==='asc'?1:-1:1
    }

    if(req.query.page && req.query.limit){

        const pageSize=req.query.limit
        const page=req.query.page

        skip=pageSize*(page-1)
        limit=pageSize
    }

    const totalDocs=await Product.find(filter).sort(sort).populate("brand").countDocuments().exec()
    const results=await Product.find(filter).sort(sort).populate("brand").skip(skip).limit(limit).exec()

    res.set("X-Total-Count",totalDocs)

    res.status(200).json(new ApiResponse(200,results,"All the results has been fetched"))

} catch (error) {
    console.log(error);
    res.status(500).json({message:'Error fetching products, please try again later'})
}
});

// GET product details by ID
export const getProductDetails = asyncHandler(async (req, res) => {
  

  try {
    const {id}=req.params
    const result=await Product.findById(id).populate("brand").populate("category")
    res.status(200).json(result)
} catch (error) {
    console.log(error);
    res.status(500).json({message:'Error getting product details, please try again later'})
}
});


export const updateById=asyncHandler(async(req,res)=>{
  try {
      const {id}=req.params
      const updated=await Product.findByIdAndUpdate(id,req.body,{new:true})
      res.status(200).json(updated)
  } catch (error) {
      console.log(error);
      res.status(500).json({message:'Error updating product, please try again later'})
  }
}) 

export const undeleteById=asyncHandler(async(req,res)=>{
  try {
      const {id}=req.params
      const unDeleted=await Product.findByIdAndUpdate(id,{isDeleted:false},{new:true}).populate('brand')
      res.status(200).json(unDeleted)
  } catch (error) {
      console.log(error);
      res.status(500).json({message:'Error restoring product, please try again later'})
  }
})

export const deleteById= asyncHandler(async(req,res)=>{
  try {
      const {id}=req.params
      const deleted=await Product.findByIdAndUpdate(id,{isDeleted:true},{new:true}).populate("brand")
      res.status(200).json(deleted)
  } catch (error) {
      console.log(error);
      res.status(500).json({message:'Error deleting product, please try again later'})
  }
})

export const getAllProducts= asyncHandler(async(req,res)=>{
    try {
        const result=await Product.find({})
        res.status(200).json(result)
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Error fetching Products"})
    }
})
    