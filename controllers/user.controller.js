// File: controllers/user.controller.js (KODE FINAL YANG BENAR)
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true, // DITAMBAHKAN
        role: true,
        createdAt: true,
        updatedAt: true,
        perusahaan: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        username: true,
        email: true, // DITAMBAHKAN
        role: true,
        createdAt: true,
        updatedAt: true,
        perusahaan: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createUser = async (req, res) => {
  const { username, email, password, role, perusahaanId } = req.body;
  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: "Username, email, password, and role are required." });
  }
  try {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existingUser) {
        if (existingUser.username === username) return res.status(400).json({ error: "Username already exists" });
        if (existingUser.email === email) return res.status(400).json({ error: "Email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role,
        perusahaanId: role === "SUPERADMIN" ? null : parseInt(perusahaanId),
      },
      select: { // Bagian ini sudah benar dari sebelumnya
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, password, role, perusahaanId } = req.body;
  try {
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (role === "SUPERADMIN") {
      updateData.perusahaanId = null;
    } else if (perusahaanId) {
      updateData.perusahaanId = parseInt(perusahaanId);
    }
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true, // DITAMBAHKAN
        role: true,
        updatedAt: true,
        perusahaan: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
    });
    res.json(updatedUser);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: `The ${error.meta.target.join(', ')} is already in use.` });
    }
    res.status(500).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  const userId = parseInt(id);

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Gunakan transaksi untuk menghapus semua data terkait
    await prisma.$transaction(async (tx) => {
      // 1. Cek apakah user ini adalah seorang karyawan
      const karyawan = await tx.karyawan.findUnique({
        where: { userId: userId },
      });

      // 2. Jika dia karyawan, hapus data gaji dan cutinya terlebih dahulu
      if (karyawan) {
        await tx.gaji.deleteMany({ where: { karyawanId: karyawan.id } });
        await tx.cuti.deleteMany({ where: { karyawanId: karyawan.id } });
        
        // 3. Hapus data karyawan itu sendiri
        await tx.karyawan.delete({ where: { id: karyawan.id } });
      }

      // 4. Setelah semua data terkait bersih, hapus data user utama
      await tx.user.delete({ where: { id: userId } });
    });

    res.json({ message: "User and all related data deleted successfully" });
  } catch (error) {
    // Berikan pesan error yang lebih umum jika terjadi kesalahan tak terduga
    res.status(500).json({ error: "Failed to delete user.", details: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};