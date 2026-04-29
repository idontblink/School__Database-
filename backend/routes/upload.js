const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const cloudinary = require('cloudinary').v2;
const { authenticateToken } = require('../middleware/auth');
const pool = require('../db');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'application/pdf,image/jpeg,image/png,image/jpg').split(',');
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

// Choose storage method based on env variables
const useS3 = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
const useCloudinary = process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_API_KEY;

if (useS3) {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
  });
}

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Upload file to S3
const uploadToS3 = async (file) => {
  const s3 = new AWS.S3();
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `papers/${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };

  return new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) reject(err);
      else resolve(data.Location);
    });
  });
};

// Upload file to Cloudinary
const uploadToCloudinary = async (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'pastpapers',
        resource_type: 'auto',
        public_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    uploadStream.end(file.buffer);
  });
};

// Upload endpoint
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let fileUrl;

    if (useS3) {
      fileUrl = await uploadToS3(req.file);
    } else if (useCloudinary) {
      fileUrl = await uploadToCloudinary(req.file);
    } else {
      return res.status(500).json({ error: 'No file storage configured (set up AWS S3 or Cloudinary)' });
    }

    res.status(201).json({
      message: 'File uploaded successfully',
      file_url: fileUrl,
      file_name: req.file.originalname
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
