const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
const perusahaanRoutes = require("./routes/perusahaanRoutes");
const karyawanRoutes = require("./routes/karyawanRoutes");
const gajiRoutes = require("./routes/gajiRoutes");
const cutiRoutes = require("./routes/cutiRoutes");

const userRoutes = require("./routes/userRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/perusahaan", perusahaanRoutes);
app.use("/api/karyawan", karyawanRoutes);
app.use("/api/gaji", gajiRoutes);
app.use("/api/cuti", cutiRoutes);

app.use("/api/users", userRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${3000}`);
});
