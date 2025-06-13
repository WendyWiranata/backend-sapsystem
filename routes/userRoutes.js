const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authMiddleware.js");
const roleCheck = require("../middlewares/roleMiddleware.js");
const userController = require("../controllers/user.controller.js");

// Hanya SuperAdmin yang bisa mengakses routes ini
router.use(authenticate);
router.use(roleCheck(["SUPERADMIN"]));

// Get all users
router.get("/", userController.getAllUsers);

// Get user by ID
router.get("/:id", userController.getUserById);

// Create new user
router.post("/", userController.createUser);

// Update user
router.put("/:id", userController.updateUser);

// Delete user
router.delete("/:id", userController.deleteUser);

module.exports = router;
