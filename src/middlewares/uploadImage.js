const multer = require("multer");

const storage = multer.memoryStorage();

const createUploader = (allowedTypes) => {
  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error("File type not allowed"), false);
      }
      cb(null, true);
    },
  });
};

const uploadImage = createUploader([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const uploadFile = createUploader([
  "application/pdf",
  "text/plain",
]);

module.exports = { uploadImage, uploadFile };
