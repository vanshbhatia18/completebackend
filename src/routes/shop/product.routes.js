import Router from "express";
import {upload} from "../../middlewares/multer.middleware.js"
import {
  getTheFilterProduct,
  getProductDetails,createProduct,getAllProducts
}  from "../../controllers/shop/product.controller.js"

const router = Router();
router.post("/add-product",upload.fields([
  {
    name:"images",
    maxCount:3

  }
]),createProduct)
router.get("/get", getTheFilterProduct);
router.get("/get/:id", getProductDetails);
router.get("/get-products",getAllProducts)
export default router