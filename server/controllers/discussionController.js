import DiscussionThread from '../models/DiscussionThread.js';
import DiscussionReply from '../models/DiscussionReply.js';
import Notification from '../models/Notification.js';

export const getThreads = async (req, res) => {
  try {
    const { courseId, lectureId, search, filter } = req.query;

    let query = { courseId, lectureId };

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    if (filter === 'resolved') {
      query.resolved = true;
    } else if (filter === 'unresolved') {
      query.resolved = false;
    }

    const threads = await DiscussionThread.find(query)
      .populate('studentId', 'name avatar')
      .sort({ createdAt: -1 });

    // For each thread, get reply count
    const threadsWithCount = await Promise.all(
      threads.map(async (thread) => {
        const replyCount = await DiscussionReply.countDocuments({ threadId: thread._id });
        return { ...thread.toObject(), replyCount };
      })
    );

    res.json({ success: true, threads: threadsWithCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createThread = async (req, res) => {
  try {
    const { courseId, lectureId, title, content } = req.body;
    const studentId = req.user._id;

    const thread = new DiscussionThread({
      courseId,
      lectureId,
      studentId,
      title,
      content,
    });

    await thread.save();

    const populatedThread = await DiscussionThread.findById(thread._id).populate('studentId', 'name avatar');

    res.status(201).json({ success: true, thread: { ...populatedThread.toObject(), replyCount: 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { title, content } = req.body;

    const thread = await DiscussionThread.findById(threadId);

    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }

    if (thread.studentId.toString() !== req.user._id.toString() && req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    thread.title = title || thread.title;
    thread.content = content || thread.content;
    await thread.save();

    res.json({ success: true, thread });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteThread = async (req, res) => {
  try {
    const { threadId } = req.params;

    const thread = await DiscussionThread.findById(threadId);

    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }

    if (thread.studentId.toString() !== req.user._id.toString() && req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await DiscussionThread.deleteOne({ _id: threadId });
    await DiscussionReply.deleteMany({ threadId });

    res.json({ success: true, message: 'Thread deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getThreadReplies = async (req, res) => {
  try {
    const { threadId } = req.params;
    const replies = await DiscussionReply.find({ threadId })
      .populate('userId', 'name avatar role')
      .sort({ pinned: -1, createdAt: 1 }); // Pinned first, then chronological

    res.json({ success: true, replies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createReply = async (req, res) => {
  try {
    const { threadId, content } = req.body;
    const userId = req.user._id;
    const isInstructor = req.user.role === 'instructor' || req.user.role === 'admin';

    const thread = await DiscussionThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }

    const reply = new DiscussionReply({
      threadId,
      userId,
      content,
      isInstructor,
    });

    await reply.save();

    const populatedReply = await DiscussionReply.findById(reply._id).populate('userId', 'name avatar role');

    // Notification Logic
    if (isInstructor && thread.studentId.toString() !== userId.toString()) {
      const notification = new Notification({
        userId: thread.studentId,
        type: 'DISCUSSION_REPLY',
        title: 'Instructor Replied',
        message: `An instructor replied to your question: "${thread.title}"`,
        link: `/course/${thread.courseId}?lecture=${thread.lectureId}&thread=${thread._id}`
      });
      await notification.save();
    }

    res.status(201).json({ success: true, reply: populatedReply });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateReply = async (req, res) => {
  try {
    const { replyId } = req.params;
    const { content } = req.body;

    const reply = await DiscussionReply.findById(replyId);
    if (!reply) {
      return res.status(404).json({ success: false, message: 'Reply not found' });
    }

    if (reply.userId.toString() !== req.user._id.toString() && req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    reply.content = content || reply.content;
    await reply.save();

    res.json({ success: true, reply });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteReply = async (req, res) => {
  try {
    const { replyId } = req.params;

    const reply = await DiscussionReply.findById(replyId);
    if (!reply) {
      return res.status(404).json({ success: false, message: 'Reply not found' });
    }

    if (reply.userId.toString() !== req.user._id.toString() && req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await DiscussionReply.deleteOne({ _id: replyId });

    res.json({ success: true, message: 'Reply deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resolveThread = async (req, res) => {
  try {
    const threadId = req.params.threadId || req.params.id;
    const thread = await DiscussionThread.findById(threadId);

    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }

    // Only instructor or the student who created it can resolve
    if (thread.studentId.toString() !== req.user._id.toString() && req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, message: 'Not authorized to resolve this thread' });
    }

    thread.resolved = true;
    await thread.save();

    // Notify student if instructor resolved it
    if (req.user.role === 'instructor' && thread.studentId.toString() !== req.user._id.toString()) {
        const notification = new Notification({
            userId: thread.studentId,
            type: 'QUESTION_RESOLVED',
            title: 'Question Resolved',
            message: `Your question "${thread.title}" was marked as resolved by an instructor.`,
            link: `/course/${thread.courseId}?lecture=${thread.lectureId}&thread=${thread._id}`
        });
        await notification.save();
    }

    res.json({ success: true, message: 'Thread resolved', thread });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const voteThread = async (req, res) => {
  try {
    const threadId = req.params.threadId || req.params.id;
    const thread = await DiscussionThread.findById(threadId);
    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });

    thread.votes += 1; // Simple upvote for now
    await thread.save();

    res.json({ success: true, votes: thread.votes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const voteReply = async (req, res) => {
  try {
    const { replyId } = req.params;
    const reply = await DiscussionReply.findById(replyId);
    if (!reply) return res.status(404).json({ success: false, message: 'Reply not found' });

    reply.helpfulVotes += 1;
    await reply.save();

    res.json({ success: true, helpfulVotes: reply.helpfulVotes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const pinReply = async (req, res) => {
  try {
    if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only instructors can pin replies' });
    }

    const { replyId } = req.params;
    const reply = await DiscussionReply.findById(replyId);
    if (!reply) return res.status(404).json({ success: false, message: 'Reply not found' });

    // Unpin other replies in this thread
    await DiscussionReply.updateMany({ threadId: reply.threadId }, { pinned: false });

    reply.pinned = true;
    await reply.save();

    res.json({ success: true, message: 'Reply pinned' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInstructorAnalytics = async (req, res) => {
  try {
    if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Need to find threads for courses taught by this instructor
    // For simplicity, we'll fetch all threads if they are the sole instructor, 
    // or we'd need to join. Since this is an isolated module and we don't have course-to-instructor strict ownership in this simplified setup,
    // let's assume they want all threads, or we filter by the courses they own.
    // Let's import Course and filter.
    const { default: Course } = await import('../models/Course.js');
    const courses = await Course.find({ instructor: req.user._id }).select('_id');
    const courseIds = courses.map(c => c._id);

    const totalQuestions = await DiscussionThread.countDocuments({ courseId: { $in: courseIds } });
    const resolvedQuestions = await DiscussionThread.countDocuments({ courseId: { $in: courseIds }, resolved: true });
    
    // Unanswered questions = threads with 0 replies.
    // We can do an aggregation or just fetch threads and count. Aggregation is better.
    const unansweredAggregation = await DiscussionThread.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      {
        $lookup: {
          from: 'discussionreplies',
          localField: '_id',
          foreignField: 'threadId',
          as: 'replies'
        }
      },
      { $match: { replies: { $size: 0 } } },
      { $count: 'unansweredCount' }
    ]);

    const unansweredQuestions = unansweredAggregation.length > 0 ? unansweredAggregation[0].unansweredCount : 0;

    res.json({
      success: true,
      analytics: {
        totalQuestions,
        resolvedQuestions,
        unansweredQuestions
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
