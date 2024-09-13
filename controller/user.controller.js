const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

exports.register = async (req, res) => {
  try {
    const data = req.body;

    const userExist = await prisma.users.findUnique({
      where: {
        username: data.username,
      },
    });

    if (userExist) {
      res.json({
        status: false,
        msg: "Username already exist",
      });
    } else {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(data.password, salt);
      data.password = hashedPassword;

      await prisma.users.create({ data });

      res.json({
        status: true,
        msg: "Registration successful",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.login = async (req, res) => {
  try {
    const userExist = await prisma.users.findUnique({
      where: {
        username: req.body.username,
      },
    });

    if (userExist) {
      const isPasswordCorrect = bcrypt.compareSync(
        req.body.password,
        userExist.password
      );

      if (isPasswordCorrect) {
        const data = {
          username: userExist.username,
          full_name: userExist.full_name,
          email: userExist.email,
          role: userExist.role,
        };

        res.json({
          status: true,
          msg: "Login Successful",
          data: data,
        });
      } else {
        res.json({
          status: false,
          msg: "Incorrect Password",
        });
      }
    } else {
      res.json({
        status: false,
        msg: "Username doesn't exist",
      });
    }
  } catch (error) {
    console.log(error);
  }
};
