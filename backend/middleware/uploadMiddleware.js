import multer from "multer";
import path from "path";

// Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// File Filter (Only CSV, XLS, XLSX)
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = [".csv", ".xls", ".xlsx"];
  const ext = path.extname(file.originalname);
  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only CSV, XLS, or XLSX files are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

export default upload;
