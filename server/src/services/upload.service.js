const cloudinary = require("../config/cloudinary");
const prisma = require("../config/db");

/**
 * Upload a file buffer to Cloudinary and save the attachment record.
 * Returns the attachment metadata.
 */
const uploadAndSaveAttachment = async (file, messageId) => {
  const result = await uploadFile(file);

  // Save attachment record in database
  const attachment = await prisma.attachment.create({
    data: {
      url: result.secure_url,
      fileName: file.originalname,
      fileType: file.mimetype,
      messageId,
    },
  });

  return attachment;
};

/**
 * Determine the correct Cloudinary resource_type from a MIME type.
 * - "image" → proper image CDN URLs
 * - "video" → video/audio streaming URLs
 * - "raw"   → any other file (PDF, DOCX, ZIP…) — produces a direct download URL
 */
const getResourceType = (mimeType = "") => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/") || mimeType.startsWith("audio/")) return "video";
  return "raw";
};

/**
 * Just upload a file buffer to Cloudinary and return the result.
 */
const uploadFile = async (file) => {
  const resourceType = getResourceType(file.mimetype);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "coderaxo-connect",
        resource_type: resourceType,
        // For raw files, use the original filename so the download is named correctly
        ...(resourceType === "raw" && {
          use_filename: true,
          unique_filename: true,
        }),
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(file.buffer);
  });
};

module.exports = { uploadAndSaveAttachment, uploadFile };
