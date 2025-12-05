const mongoose = require("mongoose");

// Flexible schema: accepts any columns from CSV
const recordSchema = new mongoose.Schema(
  {
    file: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
  },
  {
    strict: false, // allow any extra CSV columns
    timestamps: true,
  }
);

// This creates the actual Mongoose model
const Record = mongoose.model("Record", recordSchema);

module.exports = Record;
