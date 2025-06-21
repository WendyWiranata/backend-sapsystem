const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const validator = require("validator"); // Tambahkan package validator

const getAllKaryawan = async (req, res) => {
  try {
    const adminPerusahaanId = req.user.perusahaanId;
    if (!adminPerusahaanId) {
      return res.status(403).json({ error: "Akses ditolak. Informasi perusahaan admin tidak ditemukan." });
    }

    const karyawan = await prisma.karyawan.findMany({
      where: {
        perusahaanId: adminPerusahaanId,
      },
      select: {
        id: true,
        jabatan: true,
        departemen: true,
        user: {
          select: {
            username: true,
            email: true,
          }
        },
        perusahaanId: true, 
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json(karyawan);
  } catch (error) {
    res.status(500).json({
      error: "Gagal mengambil data karyawan",
      details: error.message,
    });
  }
};

const getKaryawanById = async (req, res) => {
  const { id } = req.params;

  try {
    const karyawan = await prisma.karyawan.findUnique({
      where: { id: parseInt(id) },
        select: {
        id: true,
        jabatan: true,
        departemen: true,
        user: {
          select: {
            username: true,
            email: true,
          }
        },
        perusahaanId: true,
        createdAt: true,
        updatedAt: true,
       
      },
    });

    if (!karyawan) {
      return res.status(404).json({ error: "Karyawan tidak ditemukan" });
    }

    res.json(karyawan);
  } catch (error) {
    res.status(500).json({
      error: "Gagal mengambil data karyawan",
      details: error.message,
    });
  }
};

const createKaryawan = async (req, res) => {
  // 1. Ambil data dari body. `perusahaanId` tidak diperlukan lagi dari klien.
  const { nama, jabatan, departemen, email, password } = req.body;

  // Validasi input dasar
  if (!nama || !jabatan || !departemen || !email || !password) {
    return res.status(400).json({ error: "Semua field wajib diisi" });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Format email tidak valid" });
  }

  try {
    // 2. Ambil informasi admin yang sedang login dari `req.user` (disediakan oleh middleware)
    const adminUser = req.user;

    // 3. Validasi Keamanan dan Hak Akses
    // Pastikan user yang request adalah admin dan memiliki perusahaanId
    if (!adminUser || !adminUser.perusahaanId) {
      return res.status(403).json({ error: "Akses ditolak. Informasi admin perusahaan tidak valid." });
    }

    // (Opsional tapi sangat direkomendasikan) Cek role spesifik
    if (adminUser.role !== 'ADMIN_PERUSAHAAN') {
      return res.status(403).json({ error: "Akses ditolak. Hanya admin perusahaan yang dapat membuat karyawan." });
    }

    // Ambil ID perusahaan dari admin yang sudah terotentikasi
    const adminPerusahaanId = adminUser.perusahaanId;
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Gunakan Transaksi untuk memastikan semua operasi (buat user & karyawan) berhasil atau semua dibatalkan
    const newKaryawan = await prisma.$transaction(async (tx) => {
      // Cek apakah email sudah ada di dalam transaksi
      const existingUser = await tx.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        // Melempar error di dalam transaksi akan otomatis membatalkan (rollback) semuanya
        throw new Error("Email sudah terdaftar");
      }

      // Buat user baru, hubungkan ke perusahaan admin secara otomatis
      const user = await tx.user.create({
        data: {
          email,
          username: nama,
          password: hashedPassword,
          role: "KARYAWAN",
          // Langsung hubungkan ke perusahaan milik admin yang login
          perusahaan: {
            connect: { id: adminPerusahaanId },
          },
        },
      });

      // Buat karyawan baru, hubungkan ke user yang baru dibuat dan perusahaan admin
      const karyawan = await tx.karyawan.create({
        data: {
          jabatan,
          departemen,
          perusahaan: {
            connect: { id: adminPerusahaanId }, // Otomatis dari admin
          },
          user: {
            connect: { id: user.id },
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

      return karyawan; // Kembalikan data karyawan jika semua berhasil
    });

    res.status(201).json({
      message: "Karyawan berhasil dibuat",
      data: newKaryawan,
    });

  } catch (error) {
    // Tangani error spesifik dari transaksi
    if (error.message === "Email sudah terdaftar") {
      return res.status(400).json({ error: error.message });
    }

    // Tangani error umum lainnya
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
      // Delete the Karyawan record first
      prisma.karyawan.delete({
        where: { id: parseInt(id) },
      }),
      // Then delete the associated User record
      prisma.user.delete({
        where: { id: karyawan.userId },
      }),
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
