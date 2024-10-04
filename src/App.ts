import admin from 'firebase-admin';
// import { Storage } from '@google-cloud/storage';
import * as path from 'path';
import dotenv from 'dotenv';
import { existsSync, mkdirSync } from "fs";
import express, { Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from 'uuid';
import { ImageModel } from './Model/imaUploadModel';
// import serviceAccount from "../upload-img-8959c-firbase-adminsdk-oyrci-70136cb837.json" assert {type: "json"};
// import { ImageModel } from './models/ImageModel';  // Assuming you have an Image model defined

dotenv.config();

// Initialize Firebase Admin SDK
// import {serviceAccount} from './upload-img-8959c-firbase-adminsdk-oyrci-70136cb837.json'

const serviceAccount = require("../upload-img-8959c-firebase-adminsdk-oyrci-70136cb837.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "upload-img-8959c.appspot.com"
});

const bucket = admin.storage().bucket();  // This references your Firebase Storage bucket

const app = express();
const port = process.env.server_port || 7000;

app.use(express.json());

// Ensure directories exist before file upload (this is for local storage)
const ensureDirectoriesExist = () => {
  const directories = [
    "src/ASSETS/PDF",
    "src/ASSETS/Images",
    "src/ASSETS/Videos",
  ];
  directories.forEach((dir) => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  });
};
ensureDirectoriesExist();

// Multer setup for handling file uploads
const storage = multer.memoryStorage();  // Use memory storage for handling Firebase uploads
const upload = multer({ storage });

// Handle the file upload to Firebase
app.post('/upload', upload.single('file'), async (req: Request, res: Response):Promise<void> => {
  if (!req.file) {
  res.status(400).send('No file uploaded.');
  return
  }

  try {
    const ext = path.extname(req.file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;

    const file = bucket.file(uniqueName);
    
    // Create a stream for Firebase Storage upload
    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    stream.on('error', (err) => {
      console.error(err);
      res.status(500).send('Failed to upload image.');
    });

    stream.on('finish', async () => {
      // Make the file public
      await file.makePublic();

      // Get the public URL for the uploaded image
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

      // Save image details to MongoDB
      const newImage = new ImageModel({
        filename: uniqueName,
        url: publicUrl,
        ext_name: ext,
      });

      await newImage.save();

      res.status(200).json({
        message: 'File uploaded successfully!',
        url: publicUrl,
      });
    });

    stream.end(req.file.buffer);  // End the stream by passing the file buffer

  } catch (error) {
    console.error(error);
    res.status(500).send('Error uploading image.');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
