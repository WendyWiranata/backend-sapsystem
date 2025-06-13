const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authMiddleware");
const roleCheck = require("../middlewares/roleMiddleware");
const karyawanController = require("../controllers/karyawanController");

router.use(authenticate);
router.use(roleCheck(["ADMIN_PERUSAHAAN"]));

router.get("/", karyawanController.getAllKaryawan);
router.post("/", karyawanController.createKaryawan);
router.get("/:id", karyawanController.getKaryawanById);
router.put("/:id", karyawanController.updateKaryawan);
router.delete("/:id", karyawanController.deleteKaryawan);

module.exports = router;
