import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { NextFunction, Request, Response } from "express";
import { ImageModel } from "../Model/imaUploadModel";
import multer from "multer";

// Multer setup for in-memory storage
const storage = multer.memoryStorage();

export const upload = multer({ storage });

// Helper to get asset path
export const getAssetPath = (fileName: string): string => {
  return path.join(__dirname, "../Assets", fileName);
};

// Logic for uploading image
export const uploadImage = async (
  req: Request,
  res: Response,
  ip: string,
  port: string
): Promise<void> => {
  if (!req.file) {
    res.status(400).send("No file uploaded.");
    return;
  }

  try {
    const ext = path.extname(req.file.originalname).toLowerCase();
    const uniqueFileName = `${uuidv4()}${ext}`;
    const localFilePath = getAssetPath(uniqueFileName);

    // Save the file locally
    fs.writeFileSync(localFilePath, req.file.buffer);

    // Construct the local URL for accessing the image
    const localUrl = `http://${ip}:${port}/image/filename/${uniqueFileName}`;

    // Save image details in MongoDB
    const newImage = new ImageModel({
      filename: uniqueFileName,
      url: localUrl,
      ext_name: ext,
    });
    await newImage.save();

    // Respond with the local URL
    res.status(200).json({
      message: "File uploaded successfully!",
      localUrl: localUrl,
    });
  } catch (error) {
    console.error("Error saving file:", error);
    res
      .status(500)
      .json({ message: "Failed to upload file.", error: error.message });
  }
};

// Logic for fetching the image by filename
export const getImageByFilename = async (
  req: Request,
  res: Response
//   next: NextFunction
): Promise<void> => {
  const { filename } = req.params;
  const filePath = getAssetPath(filename);

  // Check if the file exists locally
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ message: "File not found" });
  }
//   next()
};
