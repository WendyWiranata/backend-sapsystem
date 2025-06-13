const router = require("express").Router();
const {
  insert,
  getAll,
  edit,
  deleteGenre,
} = require("../controllers/genre.controller");

router.post("/insert", insert);
router.get("/get", getAll);
router.put("/edit/:id", edit);
router.delete("/delete/:id", deleteGenre);

module.exports = router;
