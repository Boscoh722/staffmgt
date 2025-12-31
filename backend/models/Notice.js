const mongoose = require('mongoose');
const paginatePlugin = require('./plugins/paginatePlugin');

// DEFINE THE SCHEMA FIRST
const noticeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Notice title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    content: {
        type: String,
        required: [true, 'Notice content is required'],
        trim: true
    },
    category: {
        type: String,
        enum: ['general', 'announcement', 'urgent', 'holiday', 'maintenance', 'policy'],
        default: 'general'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    targetAudience: {
        type: [String],
        enum: ['all', 'staff', 'faculty', 'students', 'department'],
        default: ['all']
    },
    departments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    }],
    publishedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    publishedAt: {
        type: Date,
        default: Date.now
    },
    validFrom: {
        type: Date,
        default: Date.now
    },
    validUntil: {
        type: Date,
        required: [true, 'Valid until date is required']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    attachments: [{
        fileName: String,
        fileUrl: String,
        fileType: String,
        fileSize: Number,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    views: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        viewedAt: {
            type: Date,
            default: Date.now
        }
    }],
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: true,
            trim: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        isEdited: {
            type: Boolean,
            default: false
        },
        editedAt: Date,
        replies: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            content: {
                type: String,
                required: true,
                trim: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }]
    }],
    tags: [{
        type: String,
        trim: true
    }],
    metadata: {
        readCount: {
            type: Number,
            default: 0
        },
        shareCount: {
            type: Number,
            default: 0
        },
        importantReads: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// NOW APPLY THE PLUGIN
noticeSchema.plugin(paginatePlugin);
