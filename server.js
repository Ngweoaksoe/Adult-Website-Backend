const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Uploads Folder စစ်ဆေးပြီး မရှိရင် အလိုအလျောက် ဆောက်ပေးခြင်း
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Local Storage Preview အတွက် Static Route ချိတ်ဆက်ခြင်း
app.use('/uploads', express.static('uploads'));

// API Index (root) — browser-friendly overview of what this service exposes
app.get('/', (req, res) => {
  const endpoints = [
    ['GET', '/api/videos?page=1&limit=8&category=All&search=', 'List videos (paginated, filter + search)'],
    ['GET', '/api/videos/stats/admin', 'Admin analytics stats'],
    ['POST', '/api/videos', 'Upload a video (multipart: thumbnail, video)'],
    ['PUT', '/api/videos/:id', 'Edit title / category'],
    ['DELETE', '/api/videos/:id', 'Delete a video'],
    ['PUT', '/api/videos/:id/like', 'Like a video'],
    ['POST', '/api/videos/:id/comment', 'Add a comment'],
    ['POST', '/api/auth/register', 'Register a user'],
    ['POST', '/api/auth/login', 'Log in, returns a JWT'],
    ['GET', '/uploads/<filename>', 'Uploaded media (static)']
  ];
  const rows = endpoints.map(([method, route, desc]) => {
    const path = route.includes('<filename>') ? route.replace('<filename>', '1792508827411.jpg') : route;
    return `<tr><td class="m">${method}</td><td>${method === 'GET' ? `<a href="${path}">${route}</a>` : `<code>${route}</code>`}</td><td>${desc}</td></tr>`;
  }).join('\n      ');

  res.type('html').send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>X Monsters API</title>
<style>
  body { margin: 0; padding: 2rem; background: #0f1115; color: #e6e8ee;
         font: 15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  h1 { margin: 0 0 .25rem; font-size: 1.5rem; }
  .status { margin: 0 0 1.5rem; color: #8de2b0; font-variant-numeric: tabular-nums; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: .5rem .6rem; border-bottom: 1px solid #232733; vertical-align: top; }
  th { color: #9aa3b5; font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; }
  td.m { color: #9aa3b5; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; white-space: nowrap; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #cfd5e4; }
  a { color: #7cc4ff; text-decoration: none; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  a:hover { text-decoration: underline; }
</style>
</head>
<body>
  <h1>X Monsters API</h1>
  <p class="status" id="status">Checking database…</p>
  <table>
    <thead><tr><th>Method</th><th>Route</th><th>Description</th></tr></thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <script>
    fetch('/api/videos/stats/admin')
      .then(r => r.json())
      .then(s => { document.getElementById('status').textContent = 'Running · ' + s.totalVideos + ' videos · ' + s.totalViews; })
      .catch(() => { document.getElementById('status').textContent = 'Running · database stats unavailable'; });
  </script>
</body>
</html>`);
});

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/xmonsters')
  .then(() => console.log('MongoDB Connected Successfully!'))
  .catch(err => console.log('DB Connection Error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/videos', require('./routes/videos'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
