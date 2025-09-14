import {Wishlist} from "../../models/wishlist.model"
import { asyncHandler } from "../../utils/asyncHandler"
export const createWishlist=  asyncHandler(async(req,res)=>{
  try {
      const created=await new Wishlist(req.body).populate({path:"product",populate:["brand"]})
      await created.save()
      res.status(201).json(created)
  } catch (error) {
      console.log(error);
      res.status(500).json({message:"Error adding product to wishlist, please try again later"})
  }
}) 
export const getByUserId=  asyncHandler(async(req,res)=>{
  try {
      const {id}=req.params
      let skip=0
      let limit=0

      if(req.query.page && req.query.limit){
          const pageSize=req.query.limit
          const page=req.query.page

          skip=pageSize*(page-1)
          limit=pageSize
      }

      const result=await Wishlist.find({user:id}).skip(skip).limit(limit).populate({path:"product",populate:['brand']})
      const totalResults=await Wishlist.find({user:id}).countDocuments().exec()

      res.set("X-Total-Count",totalResults)
      res.status(200).json(result)
  } catch (error) {
      console.log(error);
      res.status(500).json({message:"Error fetching your wishlist, please try again later"})
  }
}) 
export const updateById=asyncHandler(async(req,res)=>{
  try {
      const {id}=req.params
      const updated=await Wishlist.findByIdAndUpdate(id,req.body,{new:true}).populate("product")
      res.status(200).json(updated)
  } catch (error) {
      console.log(error);
      res.status(500).json({message:"Error updating your wishlist, please try again later"})
  }
}) 
export const deleteById=  asyncHandler(async(req,res)=>{
  try {
      const {id}=req.params
      const deleted=await Wishlist.findByIdAndDelete(id)
      return res.status(200).json(deleted)
  } catch (error) {
      console.log(error);
      res.status(500).json({message:"Error deleting that product from wishlist, please try again later"})
  }
})