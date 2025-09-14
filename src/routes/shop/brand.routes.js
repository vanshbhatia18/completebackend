import Router  from "express";
import { getAllBrands ,addBrand} from "../../controllers/shop/brand.controller.js";


const router = Router()

router.get("/brands",getAllBrands)
router.post("/add-brand",addBrand)

export default router