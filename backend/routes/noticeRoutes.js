const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// Validation rules
const noticeValidationRules = [
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),

    body('content')
        .trim()
        .notEmpty().withMessage('Content is required'),

    body('category')
        .optional()
        .isIn(['general', 'announcement', 'urgent', 'holiday', 'maintenance', 'policy'])
        .withMessage('Invalid category'),

    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'critical'])
        .withMessage('Invalid priority'),

    body('targetAudience')
        .optional()
        .isArray().withMessage('Target audience must be an array')
        .custom((value) => {
            const validValues = ['all', 'staff', 'faculty', 'students', 'department'];
            return value.every(v => validValues.includes(v));
        }).withMessage('Invalid target audience value'),

    body('validUntil')
        .notEmpty().withMessage('Valid until date is required')
        .isISO8601().withMessage('Invalid date format')
        .custom((value, { req }) => {
            if (req.body.validFrom) {
                return new Date(value) > new Date(req.body.validFrom);
            }
            return new Date(value) > new Date();
        }).withMessage('Valid until must be after valid from date'),

    body('tags')
        .optional()
        .isArray().withMessage('Tags must be an array')
];

// All routes are protected
router.use(protect);

// GET /api/notices - Get all notices
router.get('/', noticeController.getNotices);

// GET /api/notices/stats - Get notice statistics (Admin/Supervisor only)
router.get('/stats', authorize(['admin', 'supervisor']), noticeController.getNoticeStats);

// GET /api/notices/:id - Get single notice
router.get('/:id', noticeController.getNoticeById);

// POST /api/notices - Create new notice (Admin/Supervisor only)
router.post(
    '/',
    authorize(['admin', 'supervisor']),
    noticeValidationRules,
    noticeController.createNotice
);

// PUT /api/notices/:id - Update notice (Admin/Supervisor only)
router.put(
    '/:id',
    authorize(['admin', 'supervisor']),
    noticeValidationRules,
    noticeController.updateNotice
);

// DELETE /api/notices/:id - Delete notice (Admin/Supervisor only)
router.delete('/:id', authorize(['admin', 'supervisor']), noticeController.deleteNotice);

// PATCH /api/notices/:id/toggle-pin - Toggle pin status (Admin/Supervisor only)
router.patch('/:id/toggle-pin', authorize(['admin', 'supervisor']), noticeController.togglePin);

// POST /api/notices/:id/comments - Add comment
router.post('/:id/comments', noticeController.addComment);

// POST /api/notices/:id/comments/:commentId/reply - Add reply to comment
router.post('/:id/comments/:commentId/reply', noticeController.addReply);

module.exports = router;
