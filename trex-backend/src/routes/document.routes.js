const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const auth = require('../middleware/auth');
const controller = require('../controllers/document.controller');

const storage = multer.diskStorage({
    destination: path.join(process.cwd(), 'uploads'),

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);

        cb(
            null,
            `${Date.now()}-${crypto.randomUUID()}${extension}`
        );
    }
});

const upload = multer({
    storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png'
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return cb(
                new Error('Only PDF, JPG and PNG files are allowed.')
            );
        }

        cb(null, true);
    }
});

router.use(auth);

// Upload a document for a case
router.post(
    '/:caseId',
    upload.single('file'),
    controller.upload
);

// List documents belonging to a case
router.get(
    '/:caseId',
    controller.list
);

module.exports = router;
