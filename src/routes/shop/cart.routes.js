import Router from "express"

const {
  addToCart,
  fetchCartItems,
  deleteCartItem,
  updateCartQty,
} = require("../../controllers/shop/cart.controller");

const router = express.Router();

router.post("/add", addToCart);
router.get("/get/:userId", fetchCartItems);
router.put("/update-cart",updateCartQty);
router.delete("/:userId/:productId", deleteCartItem);

export default router