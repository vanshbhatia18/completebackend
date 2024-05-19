import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { cloudinaryUpload } from "../utils/cloudinary.js";
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

  const { fullName, email, password, username } = req.body;

  /*
  if (fullName === "") {
    return ApiError(400, "full name is required");
  } */

  if (
    [fullName, email, password, username].some((feild) => feild?.trim() === "")
  ) {
    throw new ApiError(400, "full name is required");
  }
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existedUser) {
    throw new ApiError(409, "user with email and email already exist");
  }
  //console.log(req.files.avatar[0]);

  // req.files by multer
  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImagePath = req.files?.coverImage[0]?.path;
  let coverImagePath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImagePath = req.files.coverImage[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar is needed");
  }
  const avatar = await cloudinaryUpload(avatarLocalPath);
  const coverImage = await cloudinaryUpload(coverImagePath);

  if (!avatar) {
    throw new ApiError(400, "avatar is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  // in select we add the feilds which we dont want by adding - sign
  const createdUser = User.findById(user._id).select("-password -refreshToken");
  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering");
  }
  return res.status(201).json(new ApiResponse(200, createdUser, "Success"));
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

    if (!incomingRefreshToken) {
      new ApiError(401, "unAuthorized request");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      new ApiError(401, "invalid refresh token");
    }
    if (decodedToken !== user.refreshToken) {
      throw new ApiError(401, "invalid refresh token or its is expired");
    }

    const options = {
      httpOnly: true,
      secured: true,
    };
    const { accessToken, newRefreshToken } =
      await generateAccessandAccessToken();
    return res
      .status(200)
      .cookie(accessToken, options)
      .cookie(newRefreshToken)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "accessTokenRefreshed"
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
  const avatar = await cloudinaryUpload(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "error while uploading file on cloudinary");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatarurl: avatar.url,
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
};
