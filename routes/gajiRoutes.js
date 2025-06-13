const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authMiddleware");
const roleCheck = require("../middlewares/roleMiddleware");
const gajiController = require("../controllers/gajiController");

router.use(authenticate);

// Admin perusahaan routes
router.post("/", roleCheck(["ADMIN_PERUSAHAAN"]), gajiController.createGaji);

router.get(
  "/karyawan/:karyawanId",
  roleCheck(["ADMIN_PERUSAHAAN", "KARYAWAN"]),
  gajiController.getGajiByKaryawan
);

router.put("/:id", roleCheck(["ADMIN_PERUSAHAAN"]), gajiController.updateGaji);

router.delete(
  "/:id",
  roleCheck(["ADMIN_PERUSAHAAN"]),
  gajiController.deleteGaji
);

// Karyawan hanya bisa melihat gaji sendiri
router.get("/me", roleCheck(["KARYAWAN"]), gajiController.getMyGaji);

module.exports = router;
