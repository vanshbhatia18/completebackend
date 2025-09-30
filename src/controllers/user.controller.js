import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

import dotenv from "dotenv";

dotenv.config();

const generateAccessandAccessToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating access and refresh token"
    );
  }
};
const registorUser = asyncHandler(async (req, res) => {

  try {
    const {  username,email,password} = req.body;

    




   const isempty=  [username,email,password].some((val)=> {
        return val.trim()==="";
     })
     if(isempty) {
    
    throw new ApiError(402, "all feild id needed");
     }


    const user = await User.create({
      
      username,
       email,
      password,
      
    });
   
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    if (!createdUser) {
      throw new ApiError(500, "something went wrong while registering");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, createdUser, "user successfully registered"));
  } catch (error) {
    // Handle errors
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
    
  if (!(email || username)) {
     res.status(400).json(new ApiError(400,"email or username is not entered add either one"))
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });
 
  if (!user) {
    throw new ApiError(404, "does not find the user");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "password is not correct");
  }
 
  const { accessToken, refreshToken } = await generateAccessandAccessToken(
    user._id
  );

  const logedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
 
  const options = {
    httpOnly: true,
    secure: true,
    sameSite:"none",
    path:"/"
  
    
  };
  
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        
          
          logedInUser
        ,
        "user logged in successfully"
      )
    );
});

// User which comes from mongo db have method like find one but does not have access to our functions which we
// by user
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
    sameSite:"none",
    path:"/"

    
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out successfullt"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
    
    if (!incomingRefreshToken) {
        return res.status(401).json({message: "UnAuthorized Request"})
    }    
    let decodedToken
        try {
             decodedToken =  jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
          );
        }  catch(err) {
          return res.status(401).json({message:"Invalid Refresh Token"})
        }
    
  
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      return res.status(403).json({message:"Invalid Refresh Token"})
    }
    
    if (incomingRefreshToken !== user.refreshToken) {
       return res.status(403).json(new ApiError(403,"Invalid refresh token or token expired"))
    }

    const options = {
      httpOnly: true,
      secure: true,
      sameSite:"none",
      path:"/"
    };
    const { accessToken, newRefreshToken } = await generateAccessandAccessToken(
      user._id
    );
    user.refreshToken= newRefreshToken;
    await user.save();
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    res.status(500).json(new ApiError(401, error.message))
  }
});
const changecurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "incorrect password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, "Password is saved"));
});



const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!email || !fullName) {
    throw new ApiError(400, "need both email and fullName");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { fullName: fullName, email: email },
    },
    {
      new: true,
    }
  ).select("-password");
  res
    .status(200)
    .json(new ApiResponse(200, user, "account details has been updated"));
});




 const checkAuth = asyncHandler(async(req,res)=> {
  try {


    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
   let decodedToken
    // 2. Verify token
    try {
       decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch(err) {
      return res.status(401).json({
        message: "Invalid Access Token"
      })
    }
   
    // 3. Get user details (optional: remove password field)
    const user = await User.findById(decodedToken._id).select("-password -refreshToken");

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // 4. Return user data
    return res.status(200).json({
      success: true,
      logedInUser: user, 
      message:"authentication is successsfull"
    });
  } catch (error) {
    console.error("Check auth error:", error.message);
    return res.status(401).json({ success: false, message: "Invalid Refresh Token" });
  }
})
export {
  registorUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changecurrentPassword,
  
  updateUserDetails,
  
  checkAuth
  
};
