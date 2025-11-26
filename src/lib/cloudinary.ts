import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "deik0ghqf",
  api_key: process.env.CLOUDINARY_API_KEY || "444671763722193",
  api_secret:
    process.env.CLOUDINARY_API_SECRET || "cC5lvhL29dTJ3-W0oRT50ZScf0Y",
});

export default cloudinary;
