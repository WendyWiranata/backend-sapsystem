const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const validator = require("validator"); // Tambahkan package validator

const getAllKaryawan = async (req, res) => {
  // ... (implementasi sebelumnya tetap sama)
};

const getKaryawanById = async (req, res) => {
  // ... (implementasi sebelumnya tetap sama)
};

const createKaryawan = async (req, res) => {
  const { nama, jabatan, departemen, email, password, perusahaanId } = req.body;

  // Validasi input
  if (!nama || !jabatan || !departemen || !email || !password) {
    return res.status(400).json({ error: "Semua field wajib diisi" });
  }

  // Validasi format email
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Format email tidak valid" });
  }

  // Validasi strength password
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Cek unique username dan email
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: "Email sudah terdaftar" });
      }
    }

    // Buat user
    const user = await prisma.user.create({
      data: {
        email,
        username: nama,
        password: hashedPassword,
        role: "KARYAWAN",
        perusahaanId,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        perusahaanId: true,
      },
    });

    // Buat karyawan
    const karyawan = await prisma.karyawan.create({
      data: {
        jabatan,
        departemen,
        perusahaan: {
          connect: {
            id: perusahaanId,
          },
        },
        user: {
          connect: {
            id: user.id,
          },
        },
      },
      include: {
        user: {
          select: {
            username: true,
            email: true,
            role: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Karyawan berhasil dibuat",
      data: karyawan,
    });
  } catch (error) {
    res.status(500).json({
      error: "Gagal membuat karyawan",
      details: error.message,
    });
  }
};

const updateKaryawan = async (req, res) => {
  const { id } = req.params;
  const { nama, jabatan, departemen, email, perusahaanId } = req.body;

  try {
    // Cek apakah karyawan ada di perusahaan yang sama
    const existingKaryawan = await prisma.karyawan.findFirst({
      where: {
        id: parseInt(id),
        perusahaanId,
      },
      include: {
        user: true,
      },
    });

    if (!existingKaryawan) {
      return res.status(404).json({ error: "Karyawan tidak ditemukan" });
    }

    // Validasi email jika diupdate
    if (email) {
      if (!validator.isEmail(email)) {
        return res.status(400).json({ error: "Format email tidak valid" });
      }

      // Cek email unik
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: existingKaryawan.user.id },
        },
      });

      if (emailExists) {
        return res
          .status(400)
          .json({ error: "Email sudah digunakan oleh user lain" });
      }
    }

    // Update data karyawan dan user
    const [updatedKaryawan] = await prisma.$transaction([
      prisma.karyawan.update({
        where: { id: parseInt(id) },
        data: {
          nama,
          jabatan,
          departemen,
        },
      }),
      prisma.user.update({
        where: { id: existingKaryawan.user.id },
        data: {
          email: email || existingKaryawan.user.email,
        },
      }),
    ]);

    // Get updated data
    const result = await prisma.karyawan.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            username: true,
            email: true,
            role: true,
          },
        },
      },
    });

    res.json({
      message: "Karyawan berhasil diperbarui",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      error: "Gagal memperbarui karyawan",
      details: error.message,
    });
  }
};

const deleteKaryawan = async (req, res) => {
  const { perusahaanId } = req.user;
  const { id } = req.params;

  try {
    // Cek apakah karyawan ada di perusahaan yang sama
    const karyawan = await prisma.karyawan.findFirst({
      where: {
        id: parseInt(id),
        perusahaanId,
      },
      include: {
        user: true,
      },
    });

    if (!karyawan) {
      return res.status(404).json({ error: "Karyawan tidak ditemukan" });
    }

    // Hapus semua data terkait karyawan
    await prisma.$transaction([
      prisma.gaji.deleteMany({
        where: { karyawanId: parseInt(id) },
      }),
      prisma.cuti.deleteMany({
        where: { karyawanId: parseInt(id) },
      }),
      prisma.user.delete({
        where: { id: karyawan.userId },
      }),
      // Karyawan akan terhapus otomatis karena onDelete: Cascade
    ]);

    res.json({
      message: "Karyawan dan semua data terkait berhasil dihapus",
      deletedData: {
        karyawanId: karyawan.id,
        userId: karyawan.userId,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Gagal menghapus karyawan",
      details: error.message,
    });
  }
};

// ... (fungsi lainnya tetap sama)

module.exports = {
  getAllKaryawan,
  getKaryawanById,
  createKaryawan,
  updateKaryawan,
  deleteKaryawan,
};
