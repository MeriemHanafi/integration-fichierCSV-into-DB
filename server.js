const express = require('express');
const path = require('path');
const cors = require('cors'); // Optional
const csvRouter = require('./app/routers/csv.router.js');

const app = express();

global.__basedir = __dirname;

// Middleware
app.use(cors()); // Optional
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'app/views')));

// Routes
app.use('/', csvRouter);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Une erreur est survenue!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

