import Router from "express";
import {
  loginUser,
  registorUser,
  logoutUser,
  changecurrentPassword,
  getCurrentUser,
  updateUserDetails,
  updateAvater,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,checkAuth
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { jwtVerify } from "../middlewares/auth.middleware.js";
import { refreshAccessToken } from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(
  
  registorUser
);

router.route("/login").post(loginUser);
router.route("/check-auth").get(checkAuth)
router.route("/logout").post(jwtVerify, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(jwtVerify, changecurrentPassword);
router.route("/current-user").post(jwtVerify, getCurrentUser);
router.route("/update-account").patch(jwtVerify, updateUserDetails);
router.route("/avatar").patch(jwtVerify, upload.single("avatar"), updateAvater);
router
  .route("/cover-image")
  .patch(jwtVerify, upload.single("coverImage"), updateCoverImage);
router.route("/c/:username").get(jwtVerify, getUserChannelProfile);
router.route("/watch-history").get(jwtVerify, getWatchHistory);
export default router;
