/**
 * Global error handler middleware.
 * Catches unhandled errors and returns a consistent JSON response.
 */
const errorHandler = (err, req, res, _next) => {
  console.error("❌ Error:", err.message);

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large. Maximum size is 10 MB.",
      data: null,
    });
  }

  // Multer file type error
  if (err.message && err.message.includes("is not allowed")) {
    return res.status(400).json({
      success: false,
      message: err.message,
      data: null,
    });
  }

  // Prisma known request error (e.g. unique constraint violation)
  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "A record with that value already exists.",
      data: null,
    });
  }

  // Default server error
  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error.",
    data: null,
  });
};

module.exports = errorHandler;
