const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const requireWorkspace = require("../middleware/requireWorkspace");

// All admin routes require authentication + workspace + ADMIN/OWNER role
router.use(auth);
router.use(requireWorkspace);
router.use(requireRole("OWNER", "ADMIN"));

router.get("/stats", adminController.getStats);
router.get("/users", adminController.getUsers);

module.exports = router;
