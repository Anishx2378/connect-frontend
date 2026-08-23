const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const auth = require("../middleware/auth");

// Public routes
router.post("/signup", authController.signup);
router.post("/verify-email", authController.verifyEmail);
router.post("/login", authController.login);
router.post("/complete-invite", authController.completeInvite);

// Protected routes
router.get("/me", auth, authController.getMe);
router.post("/accept-invite", auth, authController.acceptInvite);

module.exports = router;
