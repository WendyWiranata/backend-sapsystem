const router = require("express").Router();
const {
  insert,
  getAll,
  edit,
  deleteMovie,
  getById,
} = require("../controllers/movie.controller");
const { upload } = require("../uploadconfig");

const uploadPoster = upload.single("image");

router.post("/insert", uploadPoster, insert);
router.get("/get", getAll);
router.put("/edit/:id", uploadPoster, edit);
router.delete("/delete/:id", deleteMovie);
router.get("/get/:id", getById);

module.exports = router;
