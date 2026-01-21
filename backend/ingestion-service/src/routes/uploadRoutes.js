import express from "express";
import multer from "multer";
import { uploadFile,getUserDocs,deleteDocument } from "../controllers/uploadController.js";

const router = express.Router();
const upload = multer(); // in-memory storage

router.post("/", upload.single("file"), uploadFile);
router.get("/docs/:userId", getUserDocs);
router.delete("/docs/:userId/:docId", deleteDocument);
export default router;
