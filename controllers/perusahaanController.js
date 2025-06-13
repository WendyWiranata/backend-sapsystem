const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getAllPerusahaan = async (req, res) => {
  try {
    const perusahaan = await prisma.perusahaan.findMany({
      select: {
        id: true,
        nama: true,
        alamat: true,
        telepon: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json(perusahaan);
  } catch (error) {
    res.status(500).json({
      error: "Gagal mengambil data perusahaan",
      details: error.message,
    });
  }
};

const getPerusahaanById = async (req, res) => {
  const { id } = req.params;

  try {
    const perusahaan = await prisma.perusahaan.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        nama: true,
        alamat: true,
        telepon: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        users: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        karyawans: {
          select: {
            id: true,
            nama: true,
            nip: true,
          },
        },
      },
    });

    if (!perusahaan) {
      return res.status(404).json({ error: "Perusahaan tidak ditemukan" });
    }

    res.json(perusahaan);
  } catch (error) {
    res.status(500).json({
      error: "Gagal mengambil data perusahaan",
      details: error.message,
    });
  }
};

const createPerusahaan = async (req, res) => {
  const { nama, alamat, telepon, email } = req.body;

  // Validasi input
  if (!nama) {
    return res.status(400).json({ error: "Nama perusahaan wajib diisi" });
  }

  try {
    const perusahaan = await prisma.perusahaan.create({
      data: {
        nama,
        alamat,
        telepon,
        email,
      },
      select: {
        id: true,
        nama: true,
        alamat: true,
        telepon: true,
        email: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: "Perusahaan berhasil dibuat",
      data: perusahaan,
    });
  } catch (error) {
    res.status(500).json({
      error: "Gagal membuat perusahaan",
      details: error.message,
    });
  }
};

const updatePerusahaan = async (req, res) => {
  const { id } = req.params;
  const { nama, alamat, telepon, email } = req.body;

  try {
    // Cek apakah perusahaan ada
    const existingPerusahaan = await prisma.perusahaan.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingPerusahaan) {
      return res.status(404).json({ error: "Perusahaan tidak ditemukan" });
    }

    const updatedPerusahaan = await prisma.perusahaan.update({
      where: { id: parseInt(id) },
      data: {
        nama,
        alamat,
        telepon,
        email,
      },
      select: {
        id: true,
        nama: true,
        alamat: true,
        telepon: true,
        email: true,
        updatedAt: true,
      },
    });

    res.json({
      message: "Perusahaan berhasil diperbarui",
      data: updatedPerusahaan,
    });
  } catch (error) {
    res.status(500).json({
      error: "Gagal memperbarui perusahaan",
      details: error.message,
    });
  }
};

const deletePerusahaan = async (req, res) => {
  const { id } = req.params;

  try {
    // Cek apakah perusahaan ada
    const perusahaan = await prisma.perusahaan.findUnique({
      where: { id: parseInt(id) },
    });

    if (!perusahaan) {
      return res.status(404).json({ error: "Perusahaan tidak ditemukan" });
    }

    // Hapus perusahaan
    await prisma.perusahaan.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      message: "Perusahaan berhasil dihapus",
      deletedId: parseInt(id),
    });
  } catch (error) {
    // Handle foreign key constraint error
    if (error.code === "P2003") {
      return res.status(400).json({
        error:
          "Tidak dapat menghapus perusahaan karena masih memiliki relasi data",
        solution: "Hapus semua user dan karyawan terkait terlebih dahulu",
      });
    }
    res.status(500).json({
      error: "Gagal menghapus perusahaan",
      details: error.message,
    });
  }
};

module.exports = {
  getAllPerusahaan,
  getPerusahaanById,
  createPerusahaan,
  updatePerusahaan,
  deletePerusahaan,
};
