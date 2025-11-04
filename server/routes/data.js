const express = require('express');
const router = express.Router();
const multer = require('multer');
const dataController = require('../controllers/dataController');

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel files allowed.'));
    }
  }
});

router.post('/upload-excel', upload.single('file'), dataController.uploadExcel);
router.post('/test-connection', dataController.testConnection);
router.post('/import-database', dataController.importFromDatabase);
router.get('/sample-format', dataController.getSampleFormat);
router.post('/customers', dataController.addCustomer);
router.get('/customers', dataController.getCustomers);
router.put('/customers/:id', dataController.updateCustomer);
router.delete('/customers/:id', dataController.deleteCustomer);
router.post('/purchases', dataController.addPurchase);
router.get('/predictions/:customerId', dataController.getPredictions);

module.exports = router;