const fileRoutes = require("./routes/files");
const authRoutes = require("./routes/auth");

require("dotenv").config();          // must be first

const express = require("express");
const connectDB = require("./config/db");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
};

startServer();
