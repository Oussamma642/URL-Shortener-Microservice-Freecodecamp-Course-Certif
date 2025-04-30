require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { URL } = require('url');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-memory storage for URLs
let urlDatabase = [];

// Middleware to validate URLs
const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};

// POST /api/shorturl to create a new short URL
app.post('/api/shorturl', (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.json({ error: 'URL is required' });
  }

  if (!validateUrl(url)) {
    return res.json({ error: 'invalid url' });
  }

  // Add URL to database and get its index as short URL
  urlDatabase.push(url);
  const shortUrl = urlDatabase.length - 1;

  res.json({ original_url: url, short_url: shortUrl });
});

// GET /api/shorturl/:short_url to redirect to original URL
app.get('/api/shorturl/:short_url', (req, res) => {
  const { short_url } = req.params;
  const shortUrlIndex = parseInt(short_url);

  if (isNaN(shortUrlIndex) || shortUrlIndex < 0 || shortUrlIndex >= urlDatabase.length) {
    return res.json({ error: 'short url not found' });
  }

  res.redirect(urlDatabase[shortUrlIndex]);
});

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
