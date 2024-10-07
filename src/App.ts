import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import router from "./Routes/Router";

// Load environment variables
dotenv.config();

// // Initialize Express app
const app = express();
const port = process.env.SERVER_PORT || 3000;

// Serve static files from the "Assets" directory (where images are saved locally)
app.use("/images", express.static(path.join(__dirname, "Assets")));
app.use(router);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
