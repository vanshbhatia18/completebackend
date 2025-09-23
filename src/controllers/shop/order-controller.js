//const paypal = require("../../helpers/paypal");
 import { razorpay } from "../../helpers/razorpay.js";
import {Order} from "../../models/order.model.js"
import {Cart} from "../../models/cart.model.js";
import {Product} from "../../models/product.model.js";
import crypto from "crypto";
import dotenv from "dotenv"
import axios from "axios"

dotenv.config()

 export const createOrder = async (req, res) => {
  try {
    const {
      userId,
      cartItems,
      addressInfo,
     totalAmount,
      
      cartId,
    } = req.body;
    const options = {
        amount: totalAmount * 100, 
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes: { userId, cartId },
      };


    const paymentInfo = await razorpay.orders.create(options);
    
    const newlyCreatedOrder = new Order({
        userId,
        cartId,
        cartItems,
        addressInfo,
        orderStatus:'pending',
        paymentMethod:"razorpay",
        paymentStatus:"pending",
        totalAmount,
        orderDate : new Date(),
        orderUpdateDate:new Date(),
        razorpayOrderId: paymentInfo.id, 
      });
      newlyCreatedOrder.save();
      res.status(201).json({
        success: true,
        orderId: newlyCreatedOrder._id,
        razorpayOrderId: paymentInfo.id,
        amount: paymentInfo.amount,
        currency: paymentInfo.currency,
        key: process.env.KEY_ID
      });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

export const capturePayment = async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
  const keyValues= razorpay_order_id + "|" + razorpay_payment_id
    
      const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(keyValues.toString())
        .digest("hex");
  
      if (expectedSign !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment signature",
        });
      }
  
      // Step 2: Find order in DB
      let order = await Order.findById(orderId);
  
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }
  
      
      for (let item of order.cartItems) {
        let product = await Product.findById(item.productId);
  
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Product with ID ${item.productId} not found`,
          });
        }
  
        if (product.totalStock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Not enough stock for ${product.title}`,
          });
        }
      }
      

      for (let item of order.cartItems) {
        let product = await Product.findById(item.productId);
        product.totalStock -= item.quantity;
        await product.save();
      }
  
      // Step 5: Delete cart
      if (order.cartId) {
        await Cart.findByIdAndDelete(order.cartId);
      }
  
      // Step 6: Update order
      order.paymentStatus = "paid";
      order.orderStatus = "confirmed";
      order.razorpayPaymentId = razorpay_payment_id;
      order.razorpayOrderId = razorpay_order_id;
      order.razorpaySignature = razorpay_signature;
  
      await order.save();
        
      res.status(200).json({
        success: true,
        message: "Payment captured and order confirmed",
        data: order,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        success: false,
        message: "Some error occurred!",
      });
    }
  };
  

 export  const getAllOrdersByUser = async (req, res) => {
    try {
      const { userId } = req.params;
  
      const orders = await Order.find({ userId });
  
      if (!orders.length) {
        return res.status(404).json({
          success: false,
          message: "No orders found!",
        });
      }
  
      res.status(200).json({
        success: true,
        data: orders,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        success: false,
        message: "Some error occurred!",
      });
    }
  };
  
  
  export const getOrderDetails = async (req, res) => {
    try {
      const { id } = req.params;
  
      const order = await Order.findById(id);
  
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found!",
        });
      }
  
      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        success: false,
        message: "Some error occurred!",
      });
    }
  };