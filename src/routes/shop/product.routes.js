import Router from "express";
import {upload} from "../../middlewares/multer.middleware.js"
import {
  getTheFilterProduct,
  getProductDetails,createProduct,getAllProducts,uploadImage
}  from "../../controllers/shop/product.controller.js"

const router = Router();
router.post("/upload-image",upload.single(
  "productImage"
),uploadImage)
router.post("/add-product"
  ,createProduct)

router.get("/getProducts", getTheFilterProduct);
router.get("/get/:id", getProductDetails);
router.get("/get-products",getAllProducts)
export default router