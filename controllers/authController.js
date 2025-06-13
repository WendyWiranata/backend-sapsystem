const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");

const login = async (req, res) => {
  const { email, password } = req.body; // Ubah dari username ke email

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { perusahaan: true, karyawan: true },
    });

    if (!user) {
      return res.status(404).json({ error: "Email tidak terdaftar" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Password salah" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, perusahaanId: user.perusahaanId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        perusahaan: user.perusahaan,
        karyawan: user.karyawan,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const register = async (req, res) => {
  const { username, email, password, role, perusahaanId } = req.body;

  // Validasi input
  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: "Semua field wajib diisi" });
  }

  // Validasi format email
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Format email tidak valid" });
  }

  // Validasi strength password

  // Validasi role
  const allowedRoles = ["ADMIN_PERUSAHAAN", "KARYAWAN", "SUPERADMIN"];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({
      error: "Role tidak valid",
      allowedRoles: allowedRoles,
    });
  }

  try {
    // Cek unique username dan email
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ error: "Username sudah digunakan" });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ error: "Email sudah terdaftar" });
      }
    }

    // Buat user baru
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role,
        perusahaanId,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Kirim email verifikasi (contoh pseudo-code)
    // sendVerificationEmail(newUser.email);

    res.status(201).json({
      message: "Registrasi berhasil. Silakan verifikasi email Anda.",
      user: newUser,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      error: "Terjadi kesalahan saat registrasi",
      details: error.message,
    });
  }
};

module.exports = { login, register };
