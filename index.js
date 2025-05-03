require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');
const validUrl = require('valid-url');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// URL schema
const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url:    { type: Number, required: true, unique: true }
});
const Url = mongoose.model('Url', urlSchema);

app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Test endpoint
app.get('/api/hello', (req, res) => {
  res.json({ greeting: 'hello API' });
});

// POST to create short URL
app.post('/api/shorturl', async (req, res) => {
  const original = req.body.url;

  // Validate format
  if (!validUrl.isWebUri(original)) {
    return res.json({ error: 'invalid url' });
  }

  // DNS lookup to ensure domain exists
  const hostname = new URL(original).hostname;
  dns.lookup(hostname, async (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Check if URL already saved
    let urlDoc = await Url.findOne({ original_url: original });
    if (!urlDoc) {
      // Determine next short code
      const last = await Url.findOne({}).sort({ short_url: -1 });
      const nextShort = last ? last.short_url + 1 : 1;
      urlDoc = new Url({ original_url: original, short_url: nextShort });
      await urlDoc.save();
    }

    res.json({ original_url: urlDoc.original_url, short_url: urlDoc.short_url });
  });
});

// GET to redirect
app.get('/api/shorturl/:short', async (req, res) => {
  const short = parseInt(req.params.short, 10);
  const urlDoc = await Url.findOne({ short_url: short });
  if (!urlDoc) {
    return res.json({ error: 'No short URL found for given input' });
  }
  res.redirect(urlDoc.original_url);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
