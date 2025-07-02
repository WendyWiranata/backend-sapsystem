// File: controllers/karyawan.controller.js (KODE FINAL YANG BENAR)
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const validator = require("validator");

const getAllKaryawan = async (req, res) => {
  try {
    const adminPerusahaanId = req.user.perusahaanId;
    if (!adminPerusahaanId) {
      return res.status(403).json({ error: "Akses ditolak. Informasi perusahaan admin tidak ditemukan." });
    }
    const karyawan = await prisma.karyawan.findMany({
      where: { perusahaanId: adminPerusahaanId },
      select: {
        id: true,
        jabatan: true,
        departemen: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
    return res.json(karyawan);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data karyawan", details: error.message });
  }
};

const getKaryawanById = async (req, res) => {
    const { id } = req.params;
    const adminPerusahaanId = req.user.perusahaanId;
    try {
        const karyawan = await prisma.karyawan.findFirst({
            where: { 
                id: parseInt(id),
                perusahaanId: adminPerusahaanId // Pastikan admin hanya bisa akses karyawannya sendiri
            },
            select: {
                id: true,
                jabatan: true,
                departemen: true,
                user: { select: { username: true, email: true } },
            },
        });
        if (!karyawan) {
            return res.status(404).json({ error: "Karyawan tidak ditemukan" });
        }
        res.json(karyawan);
    } catch (error) {
        res.status(500).json({ error: "Gagal mengambil data karyawan", details: error.message });
    }
};

const createKaryawan = async (req, res) => {
  const { nama, jabatan, departemen, email, password } = req.body;
  if (!nama || !jabatan || !departemen || !email || !password) {
    return res.status(400).json({ error: "Semua field wajib diisi" });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Format email tidak valid" });
  }
  try {
    const adminPerusahaanId = req.user.perusahaanId;
    if (!adminPerusahaanId) {
      return res.status(403).json({ error: "Akses ditolak. Informasi admin tidak valid." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newKaryawan = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findFirst({ where: { OR: [{ email }, { username: nama }] } });
      if (existingUser) {
        if (existingUser.email === email) throw new Error("Email sudah terdaftar");
        if (existingUser.username === nama) throw new Error("Username sudah terdaftar");
      }
      const user = await tx.user.create({
        data: {
          email,
          username: nama,
          password: hashedPassword,
          role: "KARYAWAN",
          perusahaan: { connect: { id: adminPerusahaanId } },
        },
      });
      const karyawan = await tx.karyawan.create({
        data: {
          jabatan,
          departemen,
          perusahaan: { connect: { id: adminPerusahaanId } },
          user: { connect: { id: user.id } },
        },
        include: { user: { select: { username: true, email: true, role: true } } },
      });
      return karyawan;
    });
    res.status(201).json({ message: "Karyawan berhasil dibuat", data: newKaryawan });
  } catch (error) {
    if (error.message.includes("terdaftar")) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Gagal membuat karyawan", details: error.message });
  }
};

const updateKaryawan = async (req, res) => {
  const { id } = req.params;
  const { nama, jabatan, departemen, email, password } = req.body;
  
  try {
    const adminPerusahaanId = req.user.perusahaanId;
    if (!adminPerusahaanId) {
        return res.status(403).json({ error: "Akses ditolak. Anda bukan admin perusahaan." });
    }

    const karyawanToUpdate = await prisma.karyawan.findFirst({
        where: { id: parseInt(id), perusahaanId: adminPerusahaanId },
        include: { user: true }
    });

    if (!karyawanToUpdate) {
        return res.status(404).json({ error: "Karyawan tidak ditemukan di perusahaan Anda." });
    }

    const userDataToUpdate = {};
    if (nama) userDataToUpdate.username = nama;
    if (email) {
        if (!validator.isEmail(email)) return res.status(400).json({ error: "Format email tidak valid" });
        const emailExists = await prisma.user.findFirst({ where: { email, NOT: { id: karyawanToUpdate.userId } } });
        if (emailExists) return res.status(400).json({ error: "Email sudah digunakan." });
        userDataToUpdate.email = email;
    }
    if (password) {
        userDataToUpdate.password = await bcrypt.hash(password, 10);
    }
    
    const karyawanDataToUpdate = {};
    if (jabatan) karyawanDataToUpdate.jabatan = jabatan;
    if (departemen) karyawanDataToUpdate.departemen = departemen;

    const result = await prisma.$transaction(async (tx) => {
        if (Object.keys(userDataToUpdate).length > 0) {
            await tx.user.update({
                where: { id: karyawanToUpdate.userId },
                data: userDataToUpdate
            });
        }
        if (Object.keys(karyawanDataToUpdate).length > 0) {
            await tx.karyawan.update({
                where: { id: parseInt(id) },
                data: karyawanDataToUpdate
            });
        }
        return tx.karyawan.findUnique({
            where: { id: parseInt(id) },
            include: { user: { select: { username: true, email: true, role: true } } }
        });
    });

    res.json({ message: "Karyawan berhasil diperbarui", data: result });
  } catch (error) {
    res.status(500).json({ error: "Gagal memperbarui karyawan", details: error.message });
  }
};

const deleteKaryawan = async (req, res) => {
  const adminPerusahaanId = req.user.perusahaanId;
  const { id } = req.params;
  try {
    const karyawan = await prisma.karyawan.findFirst({
      where: { id: parseInt(id), perusahaanId: adminPerusahaanId },
    });
    if (!karyawan) {
      return res.status(404).json({ error: "Karyawan tidak ditemukan di perusahaan Anda." });
    }
    await prisma.$transaction([
      prisma.gaji.deleteMany({ where: { karyawanId: parseInt(id) } }),
      prisma.cuti.deleteMany({ where: { karyawanId: parseInt(id) } }),
      prisma.karyawan.delete({ where: { id: parseInt(id) } }),
      prisma.user.delete({ where: { id: karyawan.userId } }),
    ]);
    res.json({ message: "Karyawan dan data terkait berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus karyawan", details: error.message });
  }
};

module.exports = {
  getAllKaryawan,
  getKaryawanById,
  createKaryawan,
  updateKaryawan,
  deleteKaryawan,
};