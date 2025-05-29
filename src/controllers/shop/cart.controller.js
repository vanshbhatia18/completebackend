import { Cart } from "../../models/cart.model";
import { Product } from "../../models/product.model";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";


// Add to Cart
export const addToCart = asyncHandler(async (req, res) => {
  const { userId, productId, quantity } = req.body;

  if (!userId || !productId || quantity <= 0) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid input data"));
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json(new ApiResponse(404, null, "Product not found"));
  }

  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = new Cart({ userId, items: [] });
  }

  const index = cart.items.findIndex(item => item.productId.toString() === productId);

  if (index !== -1) {
    cart.items[index].quantity += quantity;
  } else {
    cart.items.push({ productId, quantity });
  }

  await cart.save();

  return res.status(200).json(new ApiResponse(200, cart, "Item has been added to the cart"));
});


// Fetch Cart Items
export const fetchCartItems = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const cart = await Cart.findOne({ userId }).populate({
    path: "items.productId",
    select: "image title description price salePrice"
  });

  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const validItems = cart.items.filter(item => item.productId);

  if (validItems.length < cart.items.length) {
    cart.items = validItems;
    await cart.save();
  }

  const productItemCart = validItems.map(item => ({
    productId: item.productId._id,
    image: item.productId.image,
    title: item.productId.title,
    description: item.productId.description,
    price: item.productId.price,
    salePrice: item.productId.salePrice,
    quantity: item.quantity
  }));

  return res.status(200).json(new ApiResponse(200, {
    ...cart._doc,
    items: productItemCart
  }, "Cart items fetched successfully"));
});


// Update Quantity in Cart
export const updateCartQty = asyncHandler(async (req, res) => {
  const { userId, productId, quantity } = req.body;

  if (!userId || !productId || quantity <= 0) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid input data"));
  }

  const cart = await Cart.findOne({ userId });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const index = cart.items.findIndex(item => item.productId.toString() === productId);

  if (index === -1) {
    throw new ApiError(404, "Product not found in cart");
  }

  cart.items[index].quantity = quantity;
  await cart.save();

  await cart.populate({
    path: "items.productId",
    select: "image title description price salePrice"
  });

  const updatedItems = cart.items.map(item => ({
    productId: item.productId ? item.productId._id : null,
    image: item.productId?.image || null,
    title: item.productId?.title || "Product not found",
    description: item.productId?.description || null,
    price: item.productId?.price || null,
    salePrice: item.productId?.salePrice || null,
    quantity: item.quantity
  }));

  return res.status(200).json(new ApiResponse(200, {
    ...cart._doc,
    items: updatedItems
  }, "Cart item quantity updated"));
});


// Delete Cart Item
export const deleteCartItem = asyncHandler(async (req, res) => {
  const { userId, productId } = req.body;

  if (!userId || !productId) {
    throw new ApiError(400, "User ID and Product ID are required");
  }

  const cart = await Cart.findOne({ userId });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const newItems = cart.items.filter(item => item.productId.toString() !== productId);
  cart.items = newItems;
  await cart.save();

  await cart.populate({
    path: "items.productId",
    select: "image title description price salePrice"
  });

  const getItems = cart.items.map(item => ({
    productId: item.productId?._id || null,
    image: item.productId?.image || null,
    title: item.productId?.title || "Product not found",
    description: item.productId?.description || null,
    price: item.productId?.price || null,
    salePrice: item.productId?.salePrice || null,
    quantity: item.quantity
  }));

  return res.status(200).json(new ApiResponse(200, {
    ...cart._doc,
    items: getItems
  }, "Cart item deleted"));
});
   export {
    addToCart,fetchCartItems,updateCartQty,deleteCartItem
   }