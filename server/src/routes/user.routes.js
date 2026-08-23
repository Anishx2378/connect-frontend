const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const auth = require("../middleware/auth");
const requireWorkspace = require("../middleware/requireWorkspace");
const requireRole = require("../middleware/role");
const upload = require("../middleware/upload");

// All user routes require authentication + workspace context
router.use(auth);
router.use(requireWorkspace);

router.get("/", userController.getAllUsers);
router.get("/dashboard", userController.getDashboardStats);
router.get("/:id", userController.getUserById);
router.patch("/:id", upload.single("avatar"), userController.updateProfile);

// Admin-only routes (OWNER or ADMIN)
router.post("/invite", requireRole("OWNER", "ADMIN"), userController.inviteUser);
router.delete("/:id", requireRole("OWNER", "ADMIN"), userController.deleteUser);
router.patch("/:id/role", requireRole("OWNER", "ADMIN"), userController.updateUserRole);

module.exports = router;
