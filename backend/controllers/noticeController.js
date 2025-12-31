const Notice = require('../models/Notice');
const User = require('../models/User');
const Department = require('../models/Department');
const { validationResult } = require('express-validator');

// @desc    Get all notices (with filters)
// @route   GET /api/notices
// @access  Private
exports.getNotices = async (req, res) => {
    try {
        const {
            category,
            priority,
            isPinned,
            targetAudience,
            department,
            search,
            page = 1,
            limit = 20,
            includeExpired = false
        } = req.query;

        const user = await User.findById(req.user.id);
        const query = {};

        // Apply filters
        if (category) query.category = category;
        if (priority) query.priority = priority;
        if (isPinned !== undefined) query.isPinned = isPinned === 'true';
        if (targetAudience) query.targetAudience = targetAudience;
        if (department) query.departments = department;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }

        // For non-admin users, show only relevant notices
        if (user.role !== 'admin' && user.role !== 'supervisor') {
            const now = new Date();
            query.$and = [
                { isActive: true },
                { validFrom: { $lte: now } },
                { validUntil: { $gte: now } }
            ];

            query.$or = [
                { targetAudience: 'all' },
                { targetAudience: user.role },
                {
                    targetAudience: 'department',
                    departments: { $in: user.department ? [user.department] : [] }
                }
            ];
        }

        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            sort: { isPinned: -1, priority: -1, publishedAt: -1 },
            populate: [
                { path: 'publishedBy', select: 'firstName lastName email employeeId avatar' },
                { path: 'departments', select: 'name code' },
                { path: 'comments.user', select: 'firstName lastName avatar employeeId' },
                { path: 'comments.replies.user', select: 'firstName lastName avatar employeeId' }
            ]
        };

        if (includeExpired === 'true') {
            options.includeExpired = true;
        }

        const notices = await Notice.paginate(query, options);

        // Mark notices as read for the user
        await Promise.all(
            notices.docs.map(async (notice) => {
                await notice.markAsRead(user._id);
            })
        );

        res.json({
            success: true,
            data: notices.docs,
            pagination: {
                total: notices.totalDocs,
                pages: notices.totalPages,
                page: notices.page,
                limit: notices.limit,
                hasNext: notices.hasNextPage,
                hasPrev: notices.hasPrevPage
            }
        });
    } catch (error) {
        console.error('Error fetching notices:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get single notice
// @route   GET /api/notices/:id
// @access  Private
exports.getNoticeById = async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id)
            .populate('publishedBy', 'firstName lastName email employeeId avatar')
            .populate('departments', 'name code')
            .populate('comments.user', 'firstName lastName avatar employeeId')
            .populate('comments.replies.user', 'firstName lastName avatar employeeId')
            .populate('views.user', 'firstName lastName employeeId');

        if (!notice) {
            return res.status(404).json({
                success: false,
                message: 'Notice not found'
            });
        }

        // Check if user has permission to view this notice
        const user = await User.findById(req.user.id);
        const hasPermission = checkNoticePermission(notice, user);

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this notice'
            });
        }

        // Mark as read
        await notice.markAsRead(user._id);

        res.json({
            success: true,
            data: notice
        });
    } catch (error) {
        console.error('Error fetching notice:', error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Notice not found'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Create new notice
// @route   POST /api/notices
// @access  Private (Admin/Supervisor only)
exports.createNotice = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const {
            title,
            content,
            category,
            priority,
            targetAudience,
            departments,
            validUntil,
            validFrom,
            isPinned,
            tags,
            attachments
        } = req.body;

        // Parse dates
        const validUntilDate = validUntil ? new Date(validUntil) : null;
        const validFromDate = validFrom ? new Date(validFrom) : new Date();

        // Calculate default validUntil (7 days from now if not provided)
        const defaultValidUntil = new Date();
        defaultValidUntil.setDate(defaultValidUntil.getDate() + 7);

        const noticeData = {
            title,
            content,
            category: category || 'general',
            priority: priority || 'medium',
            targetAudience: targetAudience || ['all'],
            publishedBy: req.user.id,
            validFrom: validFromDate,
            validUntil: validUntilDate || defaultValidUntil,
            isPinned: isPinned || false,
            isActive: true
        };

        // Handle departments
        if (departments && departments.length > 0) {
            if (targetAudience === 'department') {
                noticeData.departments = departments;
            }
        }

        // Handle tags
        if (tags && Array.isArray(tags)) {
            noticeData.tags = tags.map(tag => tag.trim().toLowerCase());
        }

        // Handle attachments
        if (attachments && Array.isArray(attachments)) {
            noticeData.attachments = attachments;
        }

        const notice = new Notice(noticeData);
        await notice.save();

        // Populate before sending response
        await notice.populate([
            { path: 'publishedBy', select: 'firstName lastName email employeeId avatar' },
            { path: 'departments', select: 'name code' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Notice created successfully',
            data: notice
        });
    } catch (error) {
        console.error('Error creating notice:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: Object.values(error.errors).map(err => err.message)
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update notice
// @route   PUT /api/notices/:id
// @access  Private (Admin/Supervisor only)
exports.updateNotice = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const notice = await Notice.findById(req.params.id);
        if (!notice) {
            return res.status(404).json({
                success: false,
                message: 'Notice not found'
            });
        }

        // Check if user is authorized to update
        if (!canEditNotice(req.user, notice)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this notice'
            });
        }

        const updates = req.body;

        // Handle dates
        if (updates.validUntil) updates.validUntil = new Date(updates.validUntil);
        if (updates.validFrom) updates.validFrom = new Date(updates.validFrom);

        // Handle tags
        if (updates.tags && Array.isArray(updates.tags)) {
            updates.tags = updates.tags.map(tag => tag.trim().toLowerCase());
        }

        // Update notice
        Object.assign(notice, updates);
        await notice.save();

        await notice.populate([
            { path: 'publishedBy', select: 'firstName lastName email employeeId avatar' },
            { path: 'departments', select: 'name code' }
        ]);

        res.json({
            success: true,
            message: 'Notice updated successfully',
            data: notice
        });
    } catch (error) {
        console.error('Error updating notice:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: Object.values(error.errors).map(err => err.message)
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete notice
// @route   DELETE /api/notices/:id
// @access  Private (Admin/Supervisor only)
exports.deleteNotice = async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);
        if (!notice) {
            return res.status(404).json({
                success: false,
                message: 'Notice not found'
            });
        }

        // Check if user is authorized to delete
        if (!canEditNotice(req.user, notice)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this notice'
            });
        }

        await notice.deleteOne();

        res.json({
            success: true,
            message: 'Notice deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting notice:', error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Notice not found'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Add comment to notice
// @route   POST /api/notices/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Comment content is required'
            });
        }

        const notice = await Notice.findById(req.params.id);
        if (!notice) {
            return res.status(404).json({
                success: false,
                message: 'Notice not found'
            });
        }

        // Check if user has permission to comment
        const user = await User.findById(req.user.id);
        const hasPermission = checkNoticePermission(notice, user);

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to comment on this notice'
            });
        }

        const comment = await notice.addComment(req.user.id, content);

        // Populate user info
        await comment.populate('user', 'firstName lastName avatar employeeId');

        res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            data: comment
        });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Reply to comment
// @route   POST /api/notices/:id/comments/:commentId/reply
// @access  Private
exports.addReply = async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Reply content is required'
            });
        }

        const notice = await Notice.findById(req.params.id);
        if (!notice) {
            return res.status(404).json({
                success: false,
                message: 'Notice not found'
            });
        }

        const comment = notice.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        // Check if user has permission to reply
        const user = await User.findById(req.user.id);
        const hasPermission = checkNoticePermission(notice, user);

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to reply on this notice'
            });
        }

        comment.replies.push({
            user: req.user.id,
            content: content.trim()
        });

        await notice.save();

        // Populate reply user info
        const reply = comment.replies[comment.replies.length - 1];
        await reply.populate('user', 'firstName lastName avatar employeeId');

        res.status(201).json({
            success: true,
            message: 'Reply added successfully',
            data: reply
        });
    } catch (error) {
        console.error('Error adding reply:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Toggle pin status
// @route   PATCH /api/notices/:id/toggle-pin
// @access  Private (Admin/Supervisor only)
exports.togglePin = async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);
        if (!notice) {
            return res.status(404).json({
                success: false,
                message: 'Notice not found'
            });
        }

        // Only admin/supervisor can pin notices
        if (!canEditNotice(req.user, notice)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to pin/unpin notices'
            });
        }

        notice.isPinned = !notice.isPinned;
        await notice.save();

        res.json({
            success: true,
            message: `Notice ${notice.isPinned ? 'pinned' : 'unpinned'} successfully`,
            data: { isPinned: notice.isPinned }
        });
    } catch (error) {
        console.error('Error toggling pin status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get notice statistics
// @route   GET /api/notices/stats
// @access  Private (Admin/Supervisor only)
exports.getNoticeStats = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.role !== 'admin' && user.role !== 'supervisor') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view statistics'
            });
        }

        const now = new Date();

        const [
            totalNotices,
            activeNotices,
            expiredNotices,
            highPriorityNotices,
            pinnedNotices,
            categoryStats,
            readStats
        ] = await Promise.all([
            Notice.countDocuments(),
            Notice.countDocuments({
                isActive: true,
                validFrom: { $lte: now },
                validUntil: { $gte: now }
            }),
            Notice.countDocuments({ validUntil: { $lt: now } }),
            Notice.countDocuments({ priority: 'high', isActive: true }),
            Notice.countDocuments({ isPinned: true, isActive: true }),
            Notice.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$category', count: { $sum: 1 } } }
            ]),
            Notice.aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: null,
                        totalReads: { $sum: '$metadata.readCount' },
                        avgReads: { $avg: '$metadata.readCount' }
                    }
                }
            ])
        ]);

        res.json({
            success: true,
            data: {
                totalNotices,
                activeNotices,
                expiredNotices,
                highPriorityNotices,
                pinnedNotices,
                categories: categoryStats,
                readStats: readStats[0] || { totalReads: 0, avgReads: 0 }
            }
        });
    } catch (error) {
        console.error('Error fetching notice stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Helper function to check notice permissions
function checkNoticePermission(notice, user) {
    // Admin and supervisor can see all notices
    if (user.role === 'admin' || user.role === 'supervisor') {
        return true;
    }

    // Check if notice is active and valid
    const now = new Date();
    if (!notice.isActive || now < notice.validFrom || now > notice.validUntil) {
        return false;
    }

    // Check target audience
    if (notice.targetAudience.includes('all')) {
        return true;
    }

    if (notice.targetAudience.includes(user.role)) {
        return true;
    }

    // Check department-specific notices
    if (notice.targetAudience.includes('department') && user.department) {
        return notice.departments.some(dept =>
            dept._id.toString() === user.department.toString()
        );
    }

    return false;
}

// Helper function to check edit permissions
function canEditNotice(user, notice) {
    // Only admin and supervisor can edit notices
    if (user.role !== 'admin' && user.role !== 'supervisor') {
        return false;
    }

    // Supervisor can only edit their own notices unless they're admin
    if (user.role === 'supervisor') {
        return notice.publishedBy.toString() === user._id.toString();
    }

    return true;
}
