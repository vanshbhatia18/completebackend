import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
const jwtVerify = asyncHandler(async (req, res, next) => {
  try {
    
    const token =   req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
     console.log(token,"the token")
    if (!token) {
      new ApiError(409, "unauthorized request ");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    const user = await User.findById(decodedToken?._id).select(
      "-passwor -refreshToken"
    );
   
    if (!user) {
      // discuss about frontend
      throw new ApiError(401, "Invalid access token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "in valid access token");
  }
});

export { jwtVerify };
