const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authMiddleware");
const roleCheck = require("../middlewares/roleMiddleware");
const cutiController = require("../controllers/cutiController");

router.use(authenticate);

// Admin perusahaan routes
router.get(
  "/",
  roleCheck(["ADMIN_PERUSAHAAN", "KARYAWAN"]),
  cutiController.getAllCuti
);

// Karyawan routes
router.post("/", roleCheck(["ADMIN_PERUSAHAAN","KARYAWAN"]), cutiController.createCuti);

// Admin approve/reject cuti
router.put(
  "/:id/status",
  roleCheck(["ADMIN_PERUSAHAAN"]),
  cutiController.updateStatusCuti
);

// Delete cuti (admin bisa hapus semua, karyawan hanya hapus sendiri yang pending)
router.delete(
  "/:id",
  roleCheck(["ADMIN_PERUSAHAAN", "KARYAWAN"]),
  cutiController.deleteCuti
);

module.exports = router;
