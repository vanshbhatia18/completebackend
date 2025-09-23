import Router from "express"

import {addProductReview,getProductReviews} from "../../controllers/shop/review.controller.js"

const router = Router()
router.post("/add", addProductReview);
router.get("/:productId", getProductReviews);

export default router;