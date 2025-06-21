const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getAllCuti = async (req, res) => {
  const { perusahaanId, role, karyawan } = req.user;

  try {
    let cutiList;

    if (role === "ADMIN_PERUSAHAAN") {
      // Admin melihat semua cuti di perusahaannya
      cutiList = await prisma.cuti.findMany({
        where: { perusahaanId },
        include: {
        karyawan: {
          select: {
            id: true,
            user: {
              select: {
            username: true,
          
          },
            }
          },
        },
      },
        orderBy: {
          tanggalMulai: "desc",
        },
      });
    } else if (role === "KARYAWAN") {
      // Karyawan hanya melihat cuti sendiri
      cutiList = await prisma.cuti.findMany({
        where: { karyawanId: karyawan.id },
        orderBy: {
          tanggalMulai: "desc",
        },
      });
    }

    res.json(cutiList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createCuti = async (req, res) => {
  // Admin/HR yang login, kita hanya butuh perusahaanId-nya
  const { perusahaanId } = req.user;

  // Ambil ID karyawan yang akan dibuatkan cuti dari body request
  const { karyawanId, tanggalMulai, tanggalSelesai, alasan } = req.body;

  // Validasi input
  if (!karyawanId) {
    return res.status(400).json({ error: "karyawanId harus disertakan dalam body request." });
  }

  try {
    // Validasi tanggal
    if (new Date(tanggalMulai) >= new Date(tanggalSelesai)) {
      return res
        .status(400)
        .json({ error: "Tanggal selesai harus setelah tanggal mulai" });
    }

    // Cek apakah karyawan ada di perusahaan yang sama (opsional tapi disarankan)
    const karyawanExists = await prisma.karyawan.findFirst({
        where: { id: Number(karyawanId), perusahaanId: perusahaanId }
    });
    if (!karyawanExists) {
        return res.status(404).json({ error: "Karyawan tidak ditemukan di perusahaan ini." });
    }

    // Cek cuti overlapping menggunakan karyawanId dari body
    const existingCuti = await prisma.cuti.findFirst({
      where: {
        karyawanId: Number(karyawanId),
        OR: [
          {
            tanggalMulai: { lte: new Date(tanggalSelesai) },
            tanggalSelesai: { gte: new Date(tanggalMulai) },
          },
        ],
      },
    });

    if (existingCuti) {
      return res.status(400).json({
        error: "Karyawan sudah memiliki jadwal cuti yang bertabrakan.",
      });
    }

    // Buat cuti menggunakan karyawanId dari body
    const cuti = await prisma.cuti.create({
      data: {
        karyawanId: Number(karyawanId),
        perusahaanId,
        tanggalMulai: new Date(tanggalMulai),
        tanggalSelesai: new Date(tanggalSelesai),
        alasan,
        status: "PENDING",
      },
     include: {
        karyawan: {
          select: {
            id: true,
            user: {
              select: {
            username: true,
          
          },
            }
          },
        },
      },
    });

    res.status(201).json(cuti);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateStatusCuti = async (req, res) => {
  const { perusahaanId } = req.user;
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Validasi status
    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ error: "Status tidak valid" });
    }

    // Cek apakah cuti ada dan milik perusahaan yang sama
    const cuti = await prisma.cuti.findFirst({
      where: {
        id: parseInt(id),
        perusahaanId,
      },
    });

    if (!cuti) {
      return res.status(404).json({ error: "Cuti tidak ditemukan" });
    }

    // Update status cuti
    const updatedCuti = await prisma.cuti.update({
      where: { id: parseInt(id) },
      data: { status },
        include: {
        karyawan: {
          select: {
            id: true,
            user: {
              select: {
            username: true,
          
          },
            }
          },
        },
      },
    });

    res.json(updatedCuti);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteCuti = async (req, res) => {
  const { perusahaanId, role, karyawan } = req.user;
  const { id } = req.params;

  try {
    // Cek apakah cuti ada
    const cuti = await prisma.cuti.findUnique({
      where: { id: parseInt(id) },
    });

    if (!cuti) {
      return res.status(404).json({ error: "Cuti tidak ditemukan" });
    }

    // Validasi hak akses
    if (role === "ADMIN_PERUSAHAAN") {
      // Admin hanya bisa menghapus cuti di perusahaannya
      if (cuti.perusahaanId !== perusahaanId) {
        return res
          .status(403)
          .json({ error: "Anda tidak berhak menghapus cuti ini" });
      }
    } else if (role === "KARYAWAN") {
      // Karyawan hanya bisa menghapus cuti sendiri yang masih PENDING
      if (cuti.karyawanId !== karyawan.id || cuti.status !== "PENDING") {
        return res.status(403).json({
          error:
            "Anda hanya bisa menghapus cuti sendiri yang berstatus PENDING",
        });
      }
    }

    await prisma.cuti.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Cuti berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllCuti,
  createCuti,
  updateStatusCuti,
  deleteCuti,
};
