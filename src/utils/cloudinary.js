import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryUpload = async (localfilePath) => {
  try {
    if (!localfilePath) return null;
    const response = await cloudinary.uploader.upload(localfilePath, {
      resource_type: "auto",
    });
    //   console.log("file uploaded successfully", response.url);
    //  console.log(response);
    fs.unlinkSync(localfilePath);
    return response;
  } catch (error) {
    console.log(error);
    fs.unlinkSync(localfilePath);
    // remove the localfilepath if uploading to cloudnary failed ;
    return null;
  }
};

const cloudinaryDeleteFile = async (localFilePath) => {
  try {
    const response = await cloudinary.uploader.destroy(localFilePath, {
      resource_type: "image",
    });
    if (!response) {
      console.log("not able to delete file");
    }
    console.log("cloudinary response is ", response);
    return response;
  } catch (error) {
    console.log("erorr while deleting the file", error);
  }
};
export { cloudinaryUpload, cloudinaryDeleteFile };
/*
export { cloudinaryUpload };
cloudinary.uploader.upload(
  "https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
  { public_id: "olympic_flag" },
  function (error, result) {
    console.log(result);
  }
);
*/
