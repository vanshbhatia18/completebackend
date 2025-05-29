import Router from "express";

const {
  getTheFilterProduct,
  getProductDetails,
} = require("../../controllers/shop/product.controller");

const router = Router();

router.get("/get", getTheFilterProduct);
router.get("/get/:id", getProductDetails);

export default router