const express = require('express');
const router = express.Router();
const upload = require('../config/multer.config.js');
const csvController = require('../controllers/csv.controller.js'); // Assurez-vous que le chemin est correct

// Route pour la page d'accueil
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/index.html'));
});
router.get('/api/universities', csvController.getUniversities);
router.get('/api/faculties', csvController.getFaculties); 
router.post('/api/file/uploadFaculties', upload.single("file"), csvController.uploadFaculties);
router.post('/api/file/uploadDepartments', upload.single("file"), csvController.uploadDepartments);

module.exports = router;

