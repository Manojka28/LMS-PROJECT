import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { protect, attachUser } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getAssignmentSubmissions,
  gradeSubmission
} from '../controllers/assignmentController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../uploads/assignments');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['application/pdf', 'application/zip', 'application/x-zip-compressed'];
  if (allowedMimeTypes.includes(file.mimetype) || file.originalname.match(/\.(pdf|zip)$/i)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and ZIP files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter
});

router.use(protect, attachUser);

router.get('/:lectureId', getAssignment);
router.post('/', authorize('instructor', 'admin'), createAssignment);
router.put('/:id', authorize('instructor', 'admin'), updateAssignment);
router.delete('/:id', authorize('instructor', 'admin'), deleteAssignment);

// Instructor routes
router.get('/:id/submissions', authorize('instructor', 'admin'), getAssignmentSubmissions);
router.put('/submission/:id/grade', authorize('instructor', 'admin'), gradeSubmission);

// Student routes
router.post('/:id/submit', authorize('student'), upload.single('file'), submitAssignment);

export default router;
