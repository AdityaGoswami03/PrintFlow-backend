import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only PDF documents are supported for printing'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024, // e.g. 25MB
  },
});

export const uploadPdf = upload.single('document');
