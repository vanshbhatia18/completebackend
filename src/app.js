import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();


app.use(
  cors({
    origin: process.env.CORS_ORIGIN, credentials: true,
  })
);

app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.json({ limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "An internal server error occurred" });
});
// 404 handler
/*
app.use((req, res, next) => {
  res.status(404).json({ message: "Nottt Found" });
});
*/
import userRouter from "./routes/user.routes.js";


import productRouter from "./routes/shop/product.routes.js"
import searchRouter from "./routes/shop/search.routes.js"
import  cartRouter from "./routes/shop/cart.routes.js"
import featureRouter from "./routes/feature.routes.js"
import addressRouter from "./routes/shop/address.routes.js"
import reviewRouter from "./routes/shop/review.routes.js"
import orderRouter from "./routes/shop/order.routes.js"


app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/search",searchRouter);
app.use("/api/v1/cart",cartRouter);
app.use("/api/v1/address",addressRouter)
app.use("/api/v1/feature",featureRouter)
app.use("/api/v1/review",reviewRouter)
app.use("/api/v1/order",orderRouter)


export { app };
