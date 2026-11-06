
const express = require('express');
const multer = require('multer');
const { uploadToCloudinary } = require('../controllers/uploadController');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

router.post('/upload-files', upload.array('files'), uploadToCloudinary);

module.exports = router;
