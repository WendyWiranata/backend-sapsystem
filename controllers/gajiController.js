const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

const createGaji = async (req, res) => {
  const { perusahaanId } = req.user;
  const { karyawanId, jumlah, bulan, tahun } = req.body;

  try {
    // Cek apakah karyawan ada di perusahaan yang sama
    const karyawan = await prisma.karyawan.findFirst({
      where: {
        id: karyawanId,
        perusahaanId,
      },
    });

    if (!karyawan) {
      return res.status(404).json({ error: "Karyawan tidak ditemukan" });
    }

    // Cek apakah gaji untuk bulan dan tahun ini sudah ada
    const existingGaji = await prisma.gaji.findFirst({
      where: {
        karyawanId,
        bulan,
        tahun,
      },
    });

    if (existingGaji) {
      return res.status(400).json({ error: "Gaji untuk bulan ini sudah ada" });
    }

    const gaji = await prisma.gaji.create({
      data: {
        karyawanId,
        perusahaanId,
        jumlah,
        bulan,
        tahun,
      },
      include: {
        karyawan: true,
      },
    });

    res.status(201).json(gaji);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getGajiByKaryawan = async (req, res) => {
  const { perusahaanId } = req.user;
  const { karyawanId } = req.params;

  try {
    // Untuk admin perusahaan, pastikan karyawan ada di perusahaan yang sama
    if (req.user.role === "ADMIN_PERUSAHAAN") {
      const karyawan = await prisma.karyawan.findFirst({
        where: {
          id: parseInt(karyawanId),
          perusahaanId,
        },
      });

      if (!karyawan) {
        return res.status(404).json({ error: "Karyawan tidak ditemukan" });
      }
    }

    // Untuk karyawan, hanya bisa melihat gaji sendiri
    if (req.user.role === "KARYAWAN") {
      if (parseInt(karyawanId) !== req.user.karyawan.id) {
        return res
          .status(403)
          .json({ error: "Anda hanya bisa melihat gaji sendiri" });
      }
    }

    const gajiList = await prisma.gaji.findMany({
      where: {
        karyawanId: parseInt(karyawanId),
      },
      orderBy: [{ tahun: "desc" }, { bulan: "desc" }],
      include: {
        karyawan: {
          select: {
            jabatan: true,
            user: {
              select: {
            username: true,
            email: true,
            role: true,
          },
            }
          },
        },
      },

    });

    res.json(gajiList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMyGaji = async (req, res) => {
  const { karyawan } = req.user;

  if (!karyawan) {
    return res.status(403).json({ error: "Anda bukan karyawan" });
  }

  try {
    const gajiList = await prisma.gaji.findMany({
      where: {
        karyawanId: karyawan.id,
      },
      orderBy: [{ tahun: "desc" }, { bulan: "desc" }],
    });

    res.json(gajiList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateGaji = async (req, res) => {
  const { perusahaanId } = req.user;
  const { id } = req.params;
  const { jumlah } = req.body;

  try {
    // Cek apakah gaji ada dan milik perusahaan yang sama
    const gaji = await prisma.gaji.findFirst({
      where: {  
        id: parseInt(id),
        perusahaanId,
      },
    });

    if (!gaji) {
      return res.status(404).json({ error: "Gaji tidak ditemukan" });
    }

    const updatedGaji = await prisma.gaji.update({
      where: { id: parseInt(id) },
      data: { jumlah },
    });

    res.json(updatedGaji);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteGaji = async (req, res) => {
  const { perusahaanId } = req.user;
  const { id } = req.params;

  try {
    // Cek apakah gaji ada dan milik perusahaan yang sama
    const gaji = await prisma.gaji.findFirst({
      where: {
        id: parseInt(id),
        perusahaanId,
      },
    });

    if (!gaji) {
      return res.status(404).json({ error: "Gaji tidak ditemukan" });
    }

    await prisma.gaji.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Gaji berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createGaji,
  getGajiByKaryawan,
  getMyGaji,
  updateGaji,
  deleteGaji,
};
