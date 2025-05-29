import razorpay from "../../helpers/razorpay";
import { asyncHandler } from "../../utils/asyncHandler";
import Order from "../../models/Order";
import Cart from "../../models/Cart";
import Product from "../../models/Product";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";

// Create Razorpay Order and Save in DB
export const createOrder = asyncHandler(async (req, res) => {
  const {
    userId,
    cartItems,
    addressInfo,
    orderStatus,
    paymentMethod,
    paymentStatus,
    totalAmount,
    orderDate,
    orderUpdateDate,
    cartId,
  } = req.body;

  if (
    !userId || !cartItems || !addressInfo || !paymentMethod ||
    !paymentStatus || !totalAmount || !orderDate || !orderUpdateDate || !cartId
  ) {
    throw new ApiError(400, "All fields are required to create an order");
  }

  const amountPaisa = totalAmount * 100;
  const receipt = `receipt_${Date.now()}`;

  const razorpayOrder = await razorpay.orders.create({
    amount: amountPaisa,
    currency: "INR",
    receipt,
    payment_capture: 0,
    notes: {
      userId: userId,
      customNote: "Ecommerce Order",
    },
  });

  const newOrder = new Order({
    userId,
    cartId,
    cartItems,
    addressInfo,
    orderStatus,
    paymentMethod,
    paymentStatus,
    totalAmount,
    orderDate,
    orderUpdateDate,
    razorpayOrderId: razorpayOrder.id,
  });

  await newOrder.save();

  return res.status(200).json(
    new ApiResponse(200, {
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderId: newOrder._id,
    }, "Order successfully created")
  );
});


// Capture Razorpay Payment and Finalize Order
export const capture = asyncHandler(async (req, res) => {
  const { requestPaymentId, orderId } = req.body;

  if (!requestPaymentId || !orderId) {
    throw new ApiError(400, "Payment ID and Order ID are required");
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const amount = order.totalAmount * 100;

  try {
    const captureResponse = await razorpay.payments.capture(requestPaymentId, amount, "INR");

    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.razorpayPaymentId = requestPaymentId;

    // Update Product Stock
    for (const item of order.cartItems) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.title}`,
        });
      }

      product.totalStock -= item.quantity;
      await product.save();
    }

    // Delete user's cart after successful order
    await Cart.findByIdAndDelete(order.cartId);
    await order.save();

    return res.status(200).json(
      new ApiResponse(200, {
        success: true,
        message: "Payment captured and order confirmed",
        order,
        captureResponse,
      }, "Payment captured")
    );
  } catch (error) {
    console.error("Razorpay capture error:", error);
    throw new ApiError(500, "Payment capture failed");
  }
});
       export {createOrder}