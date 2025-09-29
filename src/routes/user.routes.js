import Router from "express";
import {
  loginUser,
  registorUser,
  logoutUser,
  changecurrentPassword,
  
  checkAuth
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


export default router;
