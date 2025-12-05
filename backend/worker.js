require("dotenv").config();
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const connectDB = require("./config/db");
const File = require("./models/File");
const Record = require("./models/Record");

const BATCH_SIZE = 500;

async function processNextFile() {
  await connectDB();

  // Find one file that is not processed yet
  const fileDoc = await File.findOneAndUpdate(
    { status: "uploaded" },
    { status: "processing" },
    { new: true }
  );

  if (!fileDoc) {
    console.log("No files to process. Exiting.");
    process.exit(0);
  }

  console.log("Processing file:", fileDoc.originalName);

  const filePath = path.resolve(fileDoc.path);

  if (!fs.existsSync(filePath)) {
    console.error("File not found on disk:", filePath);
    fileDoc.status = "failed";
    await fileDoc.save();
    process.exit(1);
  }

  const rows = [];
  let count = 0;

  const stream = fs.createReadStream(filePath).pipe(csv());

  stream.on("data", (data) => {
    rows.push({ ...data, file: fileDoc._id });
    if (rows.length >= BATCH_SIZE) {
      stream.pause();
      Record.insertMany(rows.splice(0, rows.length))
        .then(() => {
          count += BATCH_SIZE;
          stream.resume();
        })
        .catch((err) => {
          console.error("Error inserting batch:", err);
          stream.destroy(err);
        });
    }
  });

  stream.on("end", async () => {
    try {
      if (rows.length > 0) {
        await Record.insertMany(rows);
        count += rows.length;
      }
      fileDoc.status = "completed";
      await fileDoc.save();
      console.log(`Finished. Inserted ${count} rows.`);
      process.exit(0);
    } catch (err) {
      console.error("Error finishing processing:", err);
      fileDoc.status = "failed";
      await fileDoc.save();
      process.exit(1);
    }
  });

  stream.on("error", async (err) => {
    console.error("Stream error:", err);
    fileDoc.status = "failed";
    await fileDoc.save();
    process.exit(1);
  });
}

processNextFile().catch((err) => {
  console.error("Worker fatal error:", err);
  process.exit(1);
});
