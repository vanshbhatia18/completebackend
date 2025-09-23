import { Product } from "../../models/product.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { cloudinaryUpload } from "../../utils/cloudinary.js";
// GET filtered and sorted products
   export const uploadImage = asyncHandler(async (req,res)=> {
    console.log(req.file, "the file conatin info");
    
        const value= await cloudinaryUpload(req.file?.path);
        console.log(value,"the value is")

        return res.status(200).json(new ApiResponse(200,{imageUrl:value.url},"image added successfully"))

    
   })
export const createProduct = asyncHandler(async(req,res)=> {
  try {

    const {title , price , description,salePrice, totalStock,averageReview,category,brand,image} = req.body;
    

    const created=new Product({
        title :title,
        description:description,
        price:price,
        salePrice:salePrice,
        category:category,
        brand:brand,
        totalStock:totalStock,
        image:image,
        averageReview:averageReview

    })

   
    await created.save()
    
    res.status(201).json({...created,message:"successfully added product",success:true})
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
        filter.brand={$in:req.query.brand.split(",")}
    }

    if(req.query.category){
        filter.category={$in:req.query.category.split(",")}
    }

    

    
    switch (req.query.sortBy) {
        case "price-lowtohigh":
          sort.price = 1;
  
          break;
        case "price-hightolow":
          sort.price = -1;
  
          break;
        case "title-atoz":
          sort.title = 1;
  
          break;
  
        case "title-ztoa":
          sort.title = -1;
  
          break;
  
        default:
          sort.price = 1;
          break;
      }
    if(req.query.page && req.query.limit){

        const pageSize=req.query.limit
        const page=req.query.page

        skip=pageSize*(page-1)
        limit=pageSize
    }

    const products = await Product.find(filter).sort(sort);



    res.status(200).json(new ApiResponse(200,products,"All the results has been fetched"))

} catch (error) {
    console.log(error);
    res.status(500).json({message:'Error fetching products, please try again later'})
}
});

// GET product details by ID
export const getProductDetails = asyncHandler(async (req, res) => {
  

  try {
    const {id}=req.params
    const result=await Product.findById(id);
  
    res.status(200).json(new ApiResponse(200,result," result has been fetched"))
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
    