import express, { Request, Response } from "express";
import multer from "multer";
import admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.SERVER_PORT || 3000;

// Initialize Firebase Admin SDK
const serviceAccount = require("../upload-img-8959c-firebase-adminsdk-oyrci-9086c9edc8.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "upload-img-8959c.appspot.com", // Replace with your Firebase Storage bucket URL
});

const bucket = admin.storage().bucket(); // Initialize Firebase bucket

// Set up Multer for file storage
const storage = multer.memoryStorage(); // Use memory storage to store files temporarily before uploading to Firebase
const upload = multer({ storage }); // Initialize Multer

// Data structure to store image info with unique IDs (In-memory for now)
let imageStore: { id: string; fileName: string; publicUrl: string; localPath: string }[] = [];

// Route to upload a file to Firebase Cloud Storage and save locally
app.post("/upload", upload.single("file"), async (req: Request, res: Response): Promise<void> => {
  // Check if a file was uploaded
  if (!req.file) {
    res.status(400).send("No file uploaded.");
    return;
  }

  try {
    const ext = path.extname(req.file.originalname).toLowerCase(); // Get file extension
    const uniqueFileName = `${uuidv4()}${ext}`; // Create a unique file name with UUID
    const imageId = uuidv4(); // Generate unique ID for the image

    // Save the file locally
    const localFilePath = path.join(__dirname, "Assets", uniqueFileName); // Ensure "Assets" folder exists
    fs.writeFileSync(localFilePath, req.file.buffer);

    console.log(`File saved locally at ${localFilePath}`);

    // Create a file reference in Firebase Storage
    const file = bucket.file(uniqueFileName);

    // Create a write stream to upload the file to Firebase
    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype, // Set the MIME type of the file
      },
    });

    // Handle error during file upload
    stream.on("error", (err) => {
      console.error("Stream Error: ", err);
      res.status(500).send("Error uploading file.");
    });

    // Handle successful file upload
    stream.on("finish", async () => {
      // Make the uploaded file public (optional)
      await file.makePublic();

      // Get the public URL of the file
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

      // Store the image data with its unique ID
      imageStore.push({
        id: imageId,
        fileName: uniqueFileName,
        publicUrl: publicUrl,
        localPath: localFilePath,
      });

      // Send a success response with the public URL and image ID
      res.status(200).json({
        message: "File uploaded successfully to Firebase and saved locally!",
        imageId: imageId,
        firebaseUrl: publicUrl,
        localPath: localFilePath,
      });
    });

    // End the stream and upload the file from memory
    stream.end(req.file.buffer);
  } catch (error) {
    console.error("Error uploading to Firebase: ", error);
    res.status(500).json({ message: "Failed to upload file.", error: error.message });
  }
});

// Route to access the uploaded image by its unique ID
app.get("/image/:id", (req: Request, res: Response) => {
  const imageId = req.params.id;

  // Find the image in the store using the ID
  const image = imageStore.find((img) => img.id === imageId);

  if (!image) {
    res.status(404).send("Image not found.");
    return;
  }

  // Send back the image's public URL and local path
  res.status(200).json({
    message: "Image found!",
    fileName: image.fileName,
    publicUrl: image.publicUrl,
    localPath: image.localPath,
  });
});

// Simple route to check server status
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
