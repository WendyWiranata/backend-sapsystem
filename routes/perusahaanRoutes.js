const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authMiddleware");
const roleCheck = require("../middlewares/roleMiddleware");
const perusahaanController = require("../controllers/perusahaanController");

router.use(authenticate);
router.use(roleCheck(["SUPERADMIN"]));

router.get("/", perusahaanController.getAllPerusahaan);
router.post("/create", authenticate, perusahaanController.createPerusahaan);
router.get("/:id", perusahaanController.getPerusahaanById);
router.put("/:id", perusahaanController.updatePerusahaan);
router.delete("/:id", perusahaanController.deletePerusahaan);

module.exports = router;
