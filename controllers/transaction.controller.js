const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.insert = async (req, res) => {
  try {
    const data = req.body;

    await prisma.transaction.create({
      data: {
        ...data,
        movieID: Number(data.movieID),
        jumlah: Number(data.jumlah),
        harga: Number(data.harga),
        total: Number(data.total),
      },
    });

    return res.json({
      status: true,
      msg: "transaction created successfully",
    });
  } catch (error) {
    console.log(error);
  }
};

exports.confirmTransaction = async (req, res) => {
  try {
    await prisma.transaction.update({
      data: {
        status: 2,
      },
      where: {
        transactionID: Number(req.params.id),
      },
    });

    return res.json({
      status: true,
      msg: "transaction confirmed",
    });
  } catch (error) {
    console.log(error);
  }
};

exports.getAll = async (req, res) => {
  try {
    const data = await prisma.transaction.findMany({
      include: {
        movie: true,
        users: true,
      },
    });

    return res.json({
      status: true,
      msg: "Transaction Found",
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.getById = async (req, res) => {
  try {
    const data = await prisma.transaction.findMany({
      where: {
        userID: req.params.id,
        users: {
          role: 2,
        },
      },
      include: {
        movie: true,
      },
    });

    return res.json({
      status: true,
      msg: "Transaction Found",
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};
