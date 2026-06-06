import express from 'express';
import { protect, attachUser } from '../middleware/auth.js';
import {
  getThreads,
  createThread,
  updateThread,
  deleteThread,
  getThreadReplies,
  createReply,
  updateReply,
  deleteReply,
  resolveThread,
  voteThread,
  voteReply,
  pinReply,
  getInstructorAnalytics
} from '../controllers/discussionController.js';

const router = express.Router();

router.use(protect, attachUser);

router.get('/threads', getThreads);
router.post('/threads', createThread);
router.put('/threads/:threadId', updateThread);
router.delete('/threads/:threadId', deleteThread);

router.get('/threads/:threadId/replies', getThreadReplies);
router.post('/replies', createReply);
router.put('/replies/:replyId', updateReply);
router.delete('/replies/:replyId', deleteReply);

router.put('/threads/:threadId/resolve', resolveThread);
router.put('/threads/:threadId/vote', voteThread);
router.put('/replies/:replyId/vote', voteReply);
router.put('/replies/:replyId/pin', pinReply);

// QA expected routes:
router.post('/:id/upvote', voteThread);
router.post('/reply', createReply);
router.patch('/:id/resolve', resolveThread);

router.get('/analytics/instructor', getInstructorAnalytics);

export default router;
