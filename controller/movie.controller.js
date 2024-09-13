const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.insert = async (req, res) => {
  try {
    const body = JSON.parse(req.body.data);
    const { price, rating, genre } = body;

    const data = {
      ...body,
      image: req.file.filename,
      price: Number(price),
      rating: Number(rating),
      genre: Number(genre),
    };

    await prisma.movie.create({ data });

    res.json({
      status: true,
      message: "Movie added successfully",
    });
  } catch (error) {
    res.json({
      status: false,
      message: "Error creating movie data",
    });
  }
};

exports.getAll = async (req, res) => {
  try {
    const data = await prisma.movie.findMany({
      include: {
        genre_movie_genreTogenre: true,
      },
    });

    res.json({
      status: true,
      message: "Request Success",
      data: data,
    });
  } catch (error) {
    res.json({
      status: false,
      message: "Error fetching movie data",
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const data = await prisma.movie.findFirst({
      include: {
        genre_movie_genreTogenre: true,
      },
      where: {
        idMovie: Number(req.params.id),
      },
    });

    res.json({
      status: true,
      message: "Request Success",
      data: data,
    });
  } catch (error) {
    res.json({
      status: false,
      message: "Error fetching movie data",
    });
  }
};

exports.edit = async (req, res) => {
  try {
    const body = JSON.parse(req.body.data);

    const { price, rating, genre } = body;

    const data = {
      ...body,
      price: Number(price),
      rating: Number(rating),
      genre: Number(genre),
    };

    if (req.file) {
      data.image = req.file.filename;
    }

    await prisma.movie.update({
      where: {
        idMovie: Number(req.params.id),
      },
      data,
    });

    res.json({
      status: true,
      message: "Movie Edited Successfully",
    });
  } catch (error) {
    res.json({
      status: false,
      message: "Error editing movie data",
    });
  }
};

exports.deleteMovie = async (req, res) => {
  try {
    await prisma.movie.delete({
      where: {
        idMovie: Number(req.params.id),
      },
    });

    res.json({
      status: true,
      message: "Movie Deleted Successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({
      status: false,
      message: "Error deleting movie data",
    });
  }
};
