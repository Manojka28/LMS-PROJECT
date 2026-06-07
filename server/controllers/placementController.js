import { openrouter } from '../config/openrouter.js';
import PlacementReadinessProfile from '../models/PlacementReadinessProfile.js';
import InterviewSession from '../models/InterviewSession.js';
import InterviewQuestion from '../models/InterviewQuestion.js';
import InterviewReport from '../models/InterviewReport.js';

// Helper to sanitize JSON
const sanitizeJSON = (text) => {
  const match = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
  return match ? match[1].trim() : text.trim();
};

export const getProfile = async (req, res) => {
  try {
    let profile = await PlacementReadinessProfile.findOne({ studentId: req.user.id });
    if (!profile) {
      profile = await PlacementReadinessProfile.create({ studentId: req.user.id });
    }
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const startInterview = async (req, res) => {
  try {
    const { interviewType, companyTarget, round } = req.body;
    
    const session = await InterviewSession.create({
      studentId: req.user.id,
      interviewType,
      companyTarget,
      round,
      difficulty: 'Intermediate' // Default start
    });

    const prompt = `
You are a Senior Technical Interviewer at a ${companyTarget}.
This is Round ${round} of an interview for a ${interviewType} role.
The current difficulty level is "Intermediate".
Generate the FIRST question for the candidate. Keep it strictly focused on the round topic.
If it's Round 1 (Aptitude), ask a logic/math puzzle. If Round 2 (DSA), ask a data structure question. If Round 5 (System Design), ask a scaling question.

Return ONLY raw JSON adhering to this exact schema (use these exact keys):
{
  "questionText": "String",
  "category": "String (e.g. Core Java, Scaling, Arrays)",
  "expectedConcepts": ["String"]
}
`;

    const response = await openrouter.chat.completions.create({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: prompt }],
      max_tokens: 1200
    });

    const aiOutput = JSON.parse(sanitizeJSON(response.choices[0].message.content));

    const question = await InterviewQuestion.create({
      sessionId: session._id,
      questionText: aiOutput.questionText || "Please introduce yourself and your background.",
      category: aiOutput.category || "General",
      difficulty: 'Intermediate',
      expectedConcepts: aiOutput.expectedConcepts || []
    });

    res.status(201).json({ success: true, session, question });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to start interview' });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const { questionId, studentAnswer } = req.body;
    const question = await InterviewQuestion.findById(questionId);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    const session = await InterviewSession.findById(question.sessionId);

    const previousQuestionsCount = await InterviewQuestion.countDocuments({ sessionId: session._id, answeredAt: { $ne: null } });
    const isLastQuestion = previousQuestionsCount >= 4;

    // 1. Evaluate Answer via AI
    const evalPrompt = `
You are evaluating a candidate's answer to an interview question.
Question: "${question.questionText}"
Expected Concepts: ${question.expectedConcepts.join(', ')}
Candidate Answer: "${studentAnswer}"

Evaluate the answer. Score technicalScore (0-100), communicationScore (0-100), problemSolvingScore (0-100), and confidenceScore (0-100).
Provide brief constructive feedback. List any missed concepts.
${isLastQuestion ? `This is the final question of the interview. Do NOT generate a next question. Return null for nextQuestion.` : `Then, determine the NEXT question to ask in the interview.
- If the technical score is >= 80, the next question should be HARDER (Advanced/Expert).
- If the technical score is < 50, the next question should be EASIER (Beginner).
- Otherwise, keep it the same difficulty.`}

Return ONLY raw JSON using exactly these keys:
{
  "evaluation": {
    "technicalScore": Number,
    "communicationScore": Number,
    "problemSolvingScore": Number,
    "confidenceScore": Number,
    "feedback": "String",
    "missedConcepts": ["String"]
  },
  "nextQuestion": ${isLastQuestion ? "null" : `{
    "questionText": "String",
    "category": "String",
    "difficulty": "String (must be one of: Beginner, Intermediate, Advanced, Expert)",
    "expectedConcepts": ["String"]
  }`}
}
`;

    const response = await openrouter.chat.completions.create({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: evalPrompt }],
      max_tokens: 1200
    });

    const aiOutput = JSON.parse(sanitizeJSON(response.choices[0].message.content));
    const evalData = aiOutput.evaluation || {};
    
    // 2. Determine Next Question First to ensure atomicity
    let nextQuestion = null;
    let fallbackDifficulty = session.difficulty;
    
    if (!isLastQuestion) {
      const nq = aiOutput.nextQuestion || {};
      const validDifficulties = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
      if (nq.difficulty && validDifficulties.includes(nq.difficulty)) {
        fallbackDifficulty = nq.difficulty;
      } else {
        fallbackDifficulty = session.difficulty || 'Intermediate';
      }
      session.difficulty = fallbackDifficulty;
      
      nextQuestion = await InterviewQuestion.create({
        sessionId: session._id,
        questionText: nq.questionText || "Follow-up question based on your previous answer.",
        category: nq.category || question.category || "General",
        difficulty: fallbackDifficulty,
        expectedConcepts: nq.expectedConcepts || []
      });
    }

    // 3. Update current question
    question.studentAnswer = studentAnswer;
    question.answeredAt = new Date();
    question.technicalScore = evalData.technicalScore || evalData.technical_score || evalData.technicalCorrectness || 0;
    question.communicationScore = evalData.communicationScore || evalData.communication_score || evalData.communicationClarity || 0;
    question.problemSolvingScore = evalData.problemSolvingScore || evalData.problem_solving_score || 0;
    question.confidenceScore = evalData.confidenceScore || evalData.confidence_score || 0;
    question.score = Math.round((question.technicalScore + question.communicationScore + question.problemSolvingScore + question.confidenceScore) / 4);
    question.feedback = evalData.feedback || "Good effort.";
    question.missedConcepts = evalData.missedConcepts || [];
    await question.save();

    // 4. Update Session Scores
    const allQuestions = await InterviewQuestion.find({ sessionId: session._id, answeredAt: { $ne: null } });
    let totTech = 0, totComm = 0, totProb = 0, totConf = 0;
    allQuestions.forEach(q => {
      totTech += q.technicalScore || 0;
      totComm += q.communicationScore || 0;
      totProb += q.problemSolvingScore || 0;
      totConf += q.confidenceScore || 0;
    });
    session.technicalScore = Math.round(totTech / allQuestions.length) || 0;
    session.communicationScore = Math.round(totComm / allQuestions.length) || 0;
    session.problemSolvingScore = Math.round(totProb / allQuestions.length) || 0;
    session.confidenceScore = Math.round(totConf / allQuestions.length) || 0;
    session.overallScore = Math.round((session.technicalScore + session.communicationScore + session.problemSolvingScore + session.confidenceScore) / 4) || 0;
    
    await session.save();

    res.json({ 
      success: true, 
      isComplete: isLastQuestion,
      evaluation: {
        score: question.score,
        feedback: question.feedback,
        missedConcepts: question.missedConcepts
      },
      nextQuestion 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to process answer' });
  }
};

export const endInterview = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await InterviewSession.findById(sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    session.status = 'Completed';
    session.completedAt = new Date();
    
    // Recommendation Logic based on score
    if (session.overallScore >= 90) session.recommendation = 'Strong Hire';
    else if (session.overallScore >= 75) session.recommendation = 'Hire';
    else if (session.overallScore >= 60) session.recommendation = 'Leaning Hire';
    else session.recommendation = 'No Hire';
    
    await session.save();

    const questions = await InterviewQuestion.find({ sessionId: session._id, answeredAt: { $ne: null } });
    
    // Generate Final Report AI
    const reportPrompt = `
Generate a final interview report based on the candidate's performance.
Role: ${session.interviewType}
Company Type: ${session.companyTarget}
Overall Score: ${session.overallScore}
Total Questions Answered: ${questions.length}

Return ONLY raw JSON:
{
  "strengths": ["String"],
  "weaknesses": ["String"],
  "knowledgeGaps": ["String"],
  "suggestedProjects": ["String"],
  "suggestedRoadmapTasks": ["String"],
  "expectedPreparationTimeWeeks": Number
}
`;
    
    const response = await openrouter.chat.completions.create({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: reportPrompt }],
      max_tokens: 1200
    });

    const rData = JSON.parse(sanitizeJSON(response.choices[0].message.content));

    const report = await InterviewReport.create({
      sessionId: session._id,
      studentId: session.studentId,
      strengths: rData.strengths,
      weaknesses: rData.weaknesses,
      knowledgeGaps: rData.knowledgeGaps,
      suggestedProjects: rData.suggestedProjects,
      suggestedRoadmapTasks: rData.suggestedRoadmapTasks,
      expectedPreparationTimeWeeks: rData.expectedPreparationTimeWeeks,
      hiringRecommendation: session.recommendation,
      readinessScoreDelta: session.overallScore > 70 ? 5 : -2
    });

    // Update Profile
    let profile = await PlacementReadinessProfile.findOne({ studentId: session.studentId });
    if (profile) {
      profile.totalInterviewsTaken += 1;
      profile.avgTechnicalScore = Math.round(((profile.avgTechnicalScore * (profile.totalInterviewsTaken - 1)) + session.technicalScore) / profile.totalInterviewsTaken) || 0;
      profile.avgCommunicationScore = Math.round(((profile.avgCommunicationScore * (profile.totalInterviewsTaken - 1)) + session.communicationScore) / profile.totalInterviewsTaken) || 0;
      
      if (profile.totalInterviewsTaken === 1) {
        profile.interviewReadinessScore = session.overallScore;
      } else {
        profile.interviewReadinessScore = Math.min(100, Math.max(0, profile.interviewReadinessScore + report.readinessScoreDelta));
      }
      
      profile.technicalReadinessScore = profile.avgTechnicalScore;
      profile.communicationReadinessScore = profile.avgCommunicationScore;
      profile.placementReadinessScore = Math.round((profile.interviewReadinessScore + profile.technicalReadinessScore + profile.communicationReadinessScore) / 3) || 0;
      
      // Update streak
      const now = new Date();
      if (!profile.lastInterviewDate) {
        profile.currentInterviewStreak = 1;
      } else {
        const diffDays = Math.ceil(Math.abs(now - profile.lastInterviewDate) / (1000 * 60 * 60 * 24));
        if (diffDays <= 2) profile.currentInterviewStreak += 1; // within 48 hours keeps streak alive
        else profile.currentInterviewStreak = 1;
      }
      if (profile.currentInterviewStreak > profile.highestInterviewStreak) profile.highestInterviewStreak = profile.currentInterviewStreak;
      profile.lastInterviewDate = now;
      
      await profile.save();
    }

    const NotificationModel = (await import('../models/Notification.js')).default;
    await NotificationModel.create({
      userId: session.studentId,
      type: 'MOCK_INTERVIEW_COMPLETED',
      title: 'Mock Interview Completed',
      message: `Your report for the ${session.interviewType} interview is ready!`,
      link: '/student/placement'
    });

    res.json({ success: true, session, report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error ending interview' });
  }
};

export const getPastInterviews = async (req, res) => {
  try {
    const sessions = await InterviewSession.find({ studentId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

export const getReport = async (req, res) => {
  try {
    const report = await InterviewReport.findOne({ sessionId: req.params.sessionId });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

export const getSessionState = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    
    const questions = await InterviewQuestion.find({ sessionId: session._id }).sort({ createdAt: 1 });
    
    res.json({ success: true, session, questions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
