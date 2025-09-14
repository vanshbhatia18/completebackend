import Router  from "express";

import { getAllCategories ,addCategory} from "../../controllers/shop/category.controller.js";


const router = Router()

router.get("/categories",getAllCategories)
router.post("/add-category",addCategory)
export default router


