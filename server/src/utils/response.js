/**
 * Standardized API response helpers.
 * Every endpoint returns { success, message, data }.
 */

const success = (res, message = "Success", data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const error = (res, message = "Something went wrong", statusCode = 500, data = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data,
  });
};

module.exports = { success, error };
