import { openrouter } from '../config/openrouter.js';
import CourseInsight from '../models/CourseInsight.js';
import LectureInsight from '../models/LectureInsight.js';
import LearningBottleneck from '../models/LearningBottleneck.js';
import CourseOptimizationRecommendation from '../models/CourseOptimizationRecommendation.js';
import Progress from '../models/Progress.js';
import Course from '../models/Course.js';
import Lecture from '../models/Lecture.js';

const sanitizeJSON = (text) => {
  const match = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
  return match ? match[1].trim() : text.trim();
};

export const getCourseIntelligence = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = req.user.id;

    let insight = await CourseInsight.findOne({ courseId });
    if (!insight) {
      insight = await CourseInsight.create({ courseId, instructorId });
    }

    const lectureInsights = await LectureInsight.find({ courseId }).populate('lectureId', 'title order');
    const bottlenecks = await LearningBottleneck.find({ courseId, status: 'Active' }).populate('lectureId', 'title');
    const recommendations = await CourseOptimizationRecommendation.find({ courseId, status: 'Pending' }).sort({ expectedImpactScore: -1 });

    res.json({
      success: true,
      insight,
      lectureInsights,
      bottlenecks,
      recommendations
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error fetching intelligence' });
  }
};

export const runAIAudit = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = req.user.id;

    // 1. Gather Raw Data
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    
    const lectures = await Lecture.find({ course: courseId }).sort({ order: 1 });
    const progresses = await Progress.find({ courseId });
    
    const totalStudents = progresses.length;
    let totalCompleted = 0;
    progresses.forEach(p => {
      if (p.completionPercentage === 100) totalCompleted++;
    });

    const completionRate = totalStudents > 0 ? Math.round((totalCompleted / totalStudents) * 100) : 0;

    // 2. Build the AI Audit Prompt
    const prompt = `
You are a Principal AI Education Architect auditing the course "${course.title}".
Raw Data:
- Total Students Enrolled: ${totalStudents}
- Full Completion Rate: ${completionRate}%
- Total Lectures: ${lectures.length}

Perform a deep predictive analysis. Generate an executive summary, identify a critical learning bottleneck, and provide actionable optimization recommendations.
Generate scores between 0-100 for quality metrics.

Return strictly raw JSON format:
{
  "scores": {
    "courseQualityScore": Number,
    "engagementScore": Number,
    "learningOutcomeScore": Number,
    "dropOffPredictionRisk": "String (Low, Medium, High, Critical)"
  },
  "executiveSummary": "String (A high-level professional summary of the course health and where students are dropping off)",
  "bottlenecks": [
    {
      "bottleneckType": "String (QuizFailure, HighDropOff, PoorRetention, InterviewGap)",
      "description": "String",
      "affectedStudentsPercentage": Number,
      "relatedConcept": "String"
    }
  ],
  "recommendations": [
    {
      "recommendationType": "String (NewLecture, UpdateLecture, AddQuiz, AddPractice, AddProject, AddRevision)",
      "title": "String",
      "description": "String",
      "expectedImpactScore": Number
    }
  ]
}
`;

    const response = await openrouter.chat.completions.create({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: prompt }],
      max_tokens: 1500
    });

    const aiOutput = JSON.parse(sanitizeJSON(response.choices[0].message.content));

    // 3. Update CourseInsight
    let insight = await CourseInsight.findOne({ courseId });
    if (!insight) {
      insight = new CourseInsight({ courseId, instructorId });
    }
    insight.courseQualityScore = aiOutput.scores.courseQualityScore;
    insight.engagementScore = aiOutput.scores.engagementScore;
    insight.learningOutcomeScore = aiOutput.scores.learningOutcomeScore;
    insight.dropOffPredictionRisk = aiOutput.scores.dropOffPredictionRisk;
    insight.completionRatePercentage = completionRate;
    insight.executiveSummary = aiOutput.executiveSummary;
    insight.lastAnalyzedAt = new Date();
    await insight.save();

    // 4. Wipe old active bottlenecks/recommendations and insert new ones
    await LearningBottleneck.deleteMany({ courseId });
    await CourseOptimizationRecommendation.deleteMany({ courseId });

    if (aiOutput.bottlenecks && aiOutput.bottlenecks.length > 0) {
      const inserts = aiOutput.bottlenecks.map(b => ({
        courseId,
        bottleneckType: b.bottleneckType,
        description: b.description,
        affectedStudentsPercentage: b.affectedStudentsPercentage,
        relatedConcept: b.relatedConcept
      }));
      await LearningBottleneck.insertMany(inserts);
    }

    if (aiOutput.recommendations && aiOutput.recommendations.length > 0) {
      const inserts = aiOutput.recommendations.map(r => ({
        courseId,
        instructorId,
        recommendationType: r.recommendationType,
        title: r.title,
        description: r.description,
        expectedImpactScore: r.expectedImpactScore
      }));
      await CourseOptimizationRecommendation.insertMany(inserts);
    }

    // Return the updated data
    res.json({ success: true, message: 'AI Audit Complete' });

  } catch (error) {
    console.error('AI Audit Error:', error);
    res.status(500).json({ success: false, message: 'Audit failed' });
  }
};
