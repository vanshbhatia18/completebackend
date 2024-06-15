import { asyncHandler } from "../utils/asyncHandler.js";
//import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
//import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
//import { ApiResponse } from "../utils/ApiResponse.js";
import { cloudinaryUpload } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";

//const getAllVideos = asyncHandler((req, res) => {});

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    throw new ApiError(402, "does not provided a video title or description");
  }
  const existedVideo = await Video.findOne({
    $or: [{ title }, { description }],
  });

  if (existedVideo) {
    throw new ApiError(401, "video with the same title or description exists");
  }

  const owner = req.user._id;

  if (!owner) {
    throw new ApiError(402, "user is not logged in");
  }
  if (
    !req.files ||
    !Array.isArray(req.files.videoFile) ||
    req.files.videoFile.length === 0
  ) {
    throw new ApiError(402, "videoLocalPath does not exist ");
  }
  const videoLocalPath = req.files.videoFile[0]?.path;

  const videoFile = await cloudinaryUpload(videoLocalPath);
  console.log("video file properties are", videoFile);
  if (!videoFile) {
    throw new ApiError(403, "some error while uploade to cloudinary");
  }
  if (
    !req.files ||
    !Array.isArray(req.files.thumbnail) ||
    req.files.thumbnail.length == 0
  ) {
    throw new ApiError(402, "thumbail local path does not exist ");
  }
  const thumbnailLocalPath = req.files.thumbnail[0]?.path;

  const thumbnail = await cloudinaryUpload(thumbnailLocalPath);

  if (!thumbnail) {
    throw new ApiError(403, "thumbnail file not uploaded to cloudinary");
  }
  const video = await Video.create({
    title,
    description,
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    owner: owner,
    duration: videoFile.duration,
  });

  const videoPublished = await Video.findById(video._id);
  console.log("video published created", videoPublished);
  return res
    .status(201)
    .json(
      new ApiResponse(203, videoPublished, "publish video controller is made")
    );
});

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query = "", userId } = req.query;

  if (userId || query) {
    var searchCondition = [];
    if (userId) {
      searchCondition.push({
        text: {
          query: mongoose.Types.ObjectId(userId),
          path: owner,
        },
      });
    }
    if (query) {
      searchCondition.push({
        text: {
          query: query,
          path: "description",
          score: { boost: { value: 3 } },
        },
      });
    }
  }

  const video = await Video.aggregate([
    {
      $search: {
        index: "default",
        compound: {
          should: searchCondition,
        },
        sort: { createdAt: 1 },
      },
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: limit,
    },
    {
      $project: {
        _id: 1,
        title: 1,
        thumbnail: 1,
        videoFile: 1,
        description: 1,
        owner: 1,
        score: { $meta: "searchScore" },
      },
    },
  ]);
  console.log("video contains", video);

  return res
    .status(201)
    .json(new ApiResponse(203, video, "all video controller is made"));
});

export { publishVideo, getAllVideos };
