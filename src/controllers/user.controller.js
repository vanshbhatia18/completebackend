import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { cloudinaryUpload, cloudinaryDeleteFile } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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
  // check user detail from frontend
  // validations
  // if user already exist : username , email
  // check images , check avatar
  // upload on cloudunary, avatar get or not
  // create a user object - entery in database
  // remove passsword and refreshtoken from response
  // check user is created properly
  // return response
  try {
    const { fullName, username,email,password} = req.body;
console.log(req.body,"username is this")
    



  const feilds = {fullName, username,email,password}
 /*
  for(const [key,value] of Object.entries(feilds)) {
    if (!value?.trim()) {
      throw new ApiError(400, `${key} is required`); }
  }   

    if (
      [fullName, username,email,password].some(
        (feild) => !feild||feild?.trim() === ""
      )
    ) {
      throw new ApiError(400, "full name is required");
    }
    console.log(email,"email is")
    const existedUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existedUser) {
      throw new ApiError(409, "user with email and email already exist");
    }
    */

    const user = await User.create({
      fullName,
      username,
       email,
      password,
      
    });
    console.log(user,"the user is")
    // in select we add the feilds which we dont want by adding - sign
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    if (!createdUser) {
      throw new ApiError(500, "something went wrong while registering");
    }
   // console.log(createdUser);
    //const apiResponse = new ApiResponse(200, createdUser, "success");
    // console.log("ApiResponse:", apiResponse);
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
// email , then check  email does exist , username , same for that
// check password is correct
// valid access and refresh token
// send through cookies
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!(email || username)) {
    throw new ApiError(
      400,
      "username or email is not entered need to enter one"
    );
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
    secured: true,
  };
  console.log("logged in successfully", logedInUser);
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: refreshToken,
          accessToken,
          logedInUser,
        },
        "user logged in successfully"
      )
    );
});

const checkAuth = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        req.user,
        "User is authenticated"
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
    secured: true,
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
    console.log("incoming cookie", incomingRefreshToken);
    if (!incomingRefreshToken) {
      new ApiError(401, "unAuthorized request");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    console.log("value of decoded token", decodedToken);
    const user = await User.findById(decodedToken?._id);
    if (!user) {
     throw new ApiError(401, "invalid refresh token");
    }
    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "invalid refresh token or its is expired");
    }

    const options = {
      httpOnly: true,
      secured: true,
    };
    const { accessToken, newRefreshToken } = await generateAccessandAccessToken(
      user._id
    );
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
    throw new ApiError(401, error.message);
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

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, res.user, "current user  fetched successfully");
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

const updateAvater = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "error avatar file is missing");
  }
  const previousAvatar = await User.findById(req.user._id);

  const file = previousAvatar.avatarPublicId;

  if (!file) {
    throw new ApiError(401, "cannot get the file");
  }

  console.log("publicId is", file);
  const deleteFile = await cloudinaryDeleteFile(file);
  if (!deleteFile) {
    throw new ApiError(402, "previous avatar not deleted from cloudinar");
  }
  const avatar = await cloudinaryUpload(avatarLocalPath);
  if (!avatar?.public_id) {
    throw new ApiError(400, "publicId not found");
  }

  if (!avatar.url) {
    throw new ApiError(400, "error while uploading file on cloudinary");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
        avatarPublicId: avatar.public_id,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  res
    .status(200)
    .json(new ApiResponse(200, user, "avatar has been updated successfully"));
});
const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "error coverimage file is missing");
  }
  const coverImage = await cloudinaryUpload(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "error while uploading file on cloudinary");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImageurl: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  res
    .status(200)
    .json(
      new ApiResponse(200, user, "coverimage has been updated successfully")
    );
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },

      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },

      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelSunscriptionToCount: {
          $size: "subscribedTo",
        },
        isSubscribedTo: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscribe"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "channel does not exist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(req.user._id),
      },

      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
                {
                  // $arrayElemAt: [ <array>, <idx> ] }
                  $addFields: { owner: { $first: "$owner" } },
                },
              ],
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "user watch history is fetched "
      )
    );
});
export {
  registorUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changecurrentPassword,
  getCurrentUser,
  updateUserDetails,
  updateAvater,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  checkAuth
};
