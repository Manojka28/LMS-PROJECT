import mongoose from 'mongoose';

const discussionThreadSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lecture',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    votes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for fast querying by course and lecture
discussionThreadSchema.index({ courseId: 1, lectureId: 1 });
discussionThreadSchema.index({ studentId: 1 });

const DiscussionThread = mongoose.model('DiscussionThread', discussionThreadSchema);

export default DiscussionThread;
