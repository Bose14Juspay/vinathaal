// server.js

const express = require('express');
const cors = require('cors');
const extractRoute = require('./routes/extract');
const generateRoute = require('./routes/generate');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ✅ Mount both OCR and Question generation routes
app.use('/api/extract-syllabus', extractRoute);
app.use("/api", generateRoute);// ✅ Changed to match frontend endpoint

app.get('/', (req, res) => {
    res.send("✅ Backend is up and running.");
});
  
app.get('/api/generate-questions', (req, res) => {
    res.send("📌 This route only supports POST requests.");
});
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
