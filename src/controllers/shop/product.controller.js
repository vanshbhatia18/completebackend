import { Product } from "../../models/product.model";
import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";

// GET filtered and sorted products
export const getTheFilterProduct = asyncHandler(async (req, res) => {
  const {
    category = "",
    brand = "",
    sortBy = "price-HighToLow"
  } = req.query;

  // Build filters
  const filters = {};
  if (category) {
    filters.category = { $in: category.split(",") };
  }

  if (brand) {
    filters.brand = { $in: brand.split(",") };
  }

  // Build sort options
  let sort = {};
  switch (sortBy) {
    case "price-HighToLow":
      sort.price = -1;
      break;
    case "price-LowToHigh":
      sort.price = 1;
      break;
    case "title-atoz":
      sort.title = 1;
      break;
    case "title-ztoa":
      sort.title = -1;
      break;
    default:
      sort.price = 1;
  }

  // Fetch filtered & sorted products
  const filteredProducts = await Product.find(filters).sort(sort);

  return res.status(200).json({
    success: true,
    data: filteredProducts
  });
});

// GET product details by ID
export const getProductDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, "Product not found!");
  }

  return res.status(200).json({
    success: true,
    data: product,
  });
});
