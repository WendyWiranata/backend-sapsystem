const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.insert = async (req, res) => {
  try {
    await prisma.genre.create({
      data: req.body,
    });

    res.json({
      status: true,
      message: "Genre added successfully",
    });
  } catch (error) {
    res.json({
      status: false,
      message: "Failed to add Genre",
      error: error,
    });
  }
};

exports.getAll = async (req, res) => {
  try {
    const data = await prisma.genre.findMany();

    res.json({
      status: true,
      message: "Request Success",
      data: data,
    });
  } catch (error) {
    res.json({
      status: false,
      message: "Failed to get genre",
      error: error,
    });
  }
};

exports.edit = async (req, res) => {
  try {
    await prisma.genre.update({
      data: req.body,
      where: {
        idGenre: Number(req.params.id),
      },
    });

    res.json({
      status: true,
      message: "Genre Edited Successfully",
    });
  } catch (error) {
    res.json({
      status: false,
      message: "Failed to edit genre",
      error: error,
    });
  }
};

exports.deleteGenre = async (req, res) => {
  try {
    await prisma.genre.delete({
      where: {
        idGenre: Number(req.params.id),
      },
    });

    res.json({
      status: true,
      message: "Genre Deleted Successfully",
    });
  } catch (error) {
    if (error.code === "P2003") {
      // Handle the foreign key constraint error
      res.json({
        status: false,
        message: "Cannot delete genre. It is referenced in another table.",
      });
    } else {
      res.json({
        status: false,
        message: "Error deleting genre data",
      });
    }
  }
};
