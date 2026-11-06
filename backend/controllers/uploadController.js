
const cloudinary = require("cloudinary").v2;
const path = require("path");
const { Readable } = require("stream");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const uploadBuffer = (file, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    Readable.from(file.buffer).pipe(stream);
  });
};

const uploadToCloudinary = async (req, res) => {
  try {
    const files = req.files || [];

    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded"
      });
    }

    const results = await Promise.all(
      files.map((file) => {
        const originalName = path
          .parse(file.originalname)
          .name.replace(/\s/g, "_");

        let resourceType = "raw";

        if (file.mimetype.startsWith("video/") ||
            file.mimetype.startsWith("audio/")) {
          resourceType = "video";
        } else if (file.mimetype.startsWith("image/")) {
          resourceType = "image";
        }

        const options = {
          folder: "uploads",
          resource_type: resourceType,
          public_id: originalName,
          use_filename: true,
          unique_filename: true,
          overwrite: false
        };

        if (resourceType === "video") {
          options.chunk_size = 6000000;
        }

        return uploadBuffer(file, options);
      })
    );

    res.status(200).json({
      success: true,
      urls: results.map((result) => result.secure_url)
    });

  } catch (error) {
    console.error("Cloudinary upload error:", error);

    res.status(500).json({
      success: false,
      message: "Upload failed",
      error: error.message
    });
  }
};

module.exports = { uploadToCloudinary };
