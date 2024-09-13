const {
  insert,
  confirmTransaction,
  getAll,
  getById,
} = require("../controller/transaction.controller");

const router = require("express").Router();

router.post("/insert", insert);
router.put("/confirm-transaction/:id", confirmTransaction);
router.get("/get", getAll);
router.get("/get/:id", getById);

module.exports = router;
