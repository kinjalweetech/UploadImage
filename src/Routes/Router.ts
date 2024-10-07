import express from "express";
import { getImageByFilename, upload, uploadImage } from "../Middleware/Validation";

const router = express.Router();
const ip = process.env.IP || "192.168.29.16";
const port = process.env.SERVER_PORT || '3000';

// Route to handle image upload
router.post("/upload", upload.single("file"), (req, res) => {
   uploadImage(req, res, ip, port);
});

// Route to fetch the image by filename
router.get("/image/filename/:filename", getImageByFilename);

export default router;
