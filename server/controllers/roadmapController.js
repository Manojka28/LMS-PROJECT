import { openrouter } from '../config/openrouter.js';
import mongoose from 'mongoose';
import CareerRoadmap from '../models/CareerRoadmap.js';
import RoadmapMilestone from '../models/RoadmapMilestone.js';
import RoadmapTask from '../models/RoadmapTask.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// Helper to sanitize JSON from markdown
const sanitizeJSON = (text) => {
  const match = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
  return match ? match[1].trim() : text.trim();
};

export const generateRoadmap = async (req, res) => {
  let cleanedText = "";
  try {
    const studentId = req.user.id;
    const { targetRole, currentSkills, experienceLevel, durationWeeks } = req.body;

    if (!targetRole || !durationWeeks) {
      return res.status(400).json({ success: false, message: 'Missing targetRole or durationWeeks' });
    }

    // Check if roadmap already exists
    const existing = await CareerRoadmap.findOne({ studentId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have an active roadmap.' });
    }

    // 1. Fetch available courses to inform the AI (LMS Integration Phase)
    const availableCourses = await Course.find({ status: 'published' }).select('_id title category level tags');
    const courseCatalog = availableCourses.map(c => `ID: ${c._id}, Title: ${c.title}, Category: ${c.category}`).join('\n');

    // 2. Build AI Prompt
    const prompt = `
You are a Principal AI Career Architect.
Your task is to generate a personalized ${durationWeeks}-week career roadmap for a student aiming to become a "${targetRole}".

Student Context:
- Experience Level: ${experienceLevel || 'Beginner'}
- Current Skills: ${currentSkills || 'None specified'}

Available LMS Courses in our database:
${courseCatalog || 'No courses available right now.'}

Instructions:
1. Break down the learning journey into exactly ${durationWeeks} weekly milestones.
2. For each milestone, provide maximum 2 actionable tasks.
3. Task types must be one of: "Learning", "Project", "Practice", "Interview", "Revision".
4. If a task aligns with an available LMS course, strongly recommend the Course ID in the "lmsCourseId" field. If no match, leave it empty.
5. Identify the skill gaps and respect skill dependencies (e.g., HTML before React).
6. Progressively introduce projects (e.g., Netflix Clone, E-Commerce).

Return ONLY raw valid JSON adhering EXACTLY to this schema:
{
  "title": "String - e.g. Full Stack Engineer Roadmap",
  "jobReadinessInitial": Number (0-100),
  "milestones": [
    {
      "weekNumber": Number,
      "title": "String",
      "description": "String",
      "estimatedHours": Number,
      "isRevisionWeek": Boolean,
      "tasks": [
        {
          "taskTitle": "String",
          "taskDescription": "String",
          "taskType": "String",
          "targetSkills": ["String"],
          "lmsCourseId": "String (or empty)",
          "estimatedTime": Number
        }
      ]
    }
  ]
}

IMPORTANT:
Return ONLY valid JSON.
Do not use markdown.
Do not use code fences.
Do not explain anything.
Output must be a complete JSON object.
Never truncate output.
Keep roadmap concise enough to fit inside response limits.
`;

    // 3. Call OpenRouter
    const response = await openrouter.chat.completions.create({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 6000
    });

    const responseText = response.choices[0].message.content;

    cleanedText = responseText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const startIndex = cleanedText.indexOf('{');
    const endIndex = cleanedText.lastIndexOf('}');

    if (startIndex !== -1 && endIndex !== -1) {
      cleanedText = cleanedText.substring(startIndex, endIndex + 1);
    }

    console.log("RAW ROADMAP RESPONSE =", responseText);
    console.log("CLEANED ROADMAP RESPONSE =", cleanedText);
    console.log("ROADMAP RESPONSE LENGTH =", cleanedText.length);

    if (
      !cleanedText.trim().endsWith("}") &&
      !cleanedText.trim().endsWith("]")
    ) {
      throw new Error(
        "OpenRouter returned incomplete roadmap JSON"
      );
    }

    const roadmapData = JSON.parse(cleanedText);

    // 4. Save to Database
    const roadmap = await CareerRoadmap.create({
      studentId,
      title: roadmapData.title || `Roadmap to ${targetRole}`,
      targetRole,
      experienceLevel,
      durationWeeks,
      jobReadiness: roadmapData.jobReadinessInitial || 0,
      interviewReadiness: 0,
      skillCoverage: 0,
      currentStatus: 'Active'
    });

    for (const m of roadmapData.milestones) {
      const milestone = await RoadmapMilestone.create({
        roadmapId: roadmap._id,
        weekNumber: m.weekNumber,
        title: m.title,
        description: m.description,
        estimatedHours: m.estimatedHours || 10,
        isRevisionWeek: m.isRevisionWeek || false
      });

      if (m.tasks && m.tasks.length > 0) {
        const tasksToInsert = m.tasks.map(t => ({
          roadmapId: roadmap._id,
          milestoneId: milestone._id,
          taskTitle: t.taskTitle,
          taskDescription: t.taskDescription,
          taskType: t.taskType,
          targetSkills: t.targetSkills || [],
          lmsCourseId: (t.lmsCourseId && mongoose.Types.ObjectId.isValid(t.lmsCourseId)) ? t.lmsCourseId : undefined,
          estimatedTime: t.estimatedTime || 2
        }));
        await RoadmapTask.insertMany(tasksToInsert);
      }
    }

    const NotificationModel = (await import('../models/Notification.js')).default;
    await NotificationModel.create({
      userId: studentId,
      type: 'ROADMAP_CREATED',
      title: 'Career Roadmap Created',
      message: `Your ${durationWeeks}-week roadmap for ${targetRole} is ready!`,
      link: '/student/roadmap'
    });

    res.status(201).json({ success: true, message: 'Roadmap generated successfully!', roadmapId: roadmap._id });

  } catch (error) {
    console.error('Roadmap Generation Error:', error);
    console.error("RAW CLEANED RESPONSE:", cleanedText);
    res.status(500).json({ success: false, message: 'Failed to generate roadmap', error: error.message });
  }
};

export const getStudentRoadmap = async (req, res) => {
  try {
    const studentId = req.user.id;
    const roadmap = await CareerRoadmap.findOne({ studentId });
    if (!roadmap) {
      return res.status(200).json({ success: true, hasRoadmap: false });
    }

    const milestones = await RoadmapMilestone.find({ roadmapId: roadmap._id }).sort({ weekNumber: 1 });
    const tasks = await RoadmapTask.find({ roadmapId: roadmap._id }).populate('lmsCourseId', 'title thumbnail');

    // Group tasks into milestones
    const populatedMilestones = milestones.map(m => {
      const mObj = m.toObject();
      mObj.tasks = tasks.filter(t => t.milestoneId.toString() === m._id.toString());
      return mObj;
    });

    res.status(200).json({ 
      success: true, 
      hasRoadmap: true, 
      roadmap, 
      milestones: populatedMilestones 
    });

  } catch (error) {
    console.error('Fetch Roadmap Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const completeTask = async (req, res) => {
  try {
    const { taskId } = req.body;
    const studentId = req.user.id;

    const task = await RoadmapTask.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date() : null;
    await task.save();

    // Cascading Updates
    const milestone = await RoadmapMilestone.findById(task.milestoneId);
    const allMilestoneTasks = await RoadmapTask.find({ milestoneId: milestone._id });
    const completedMTasks = allMilestoneTasks.filter(t => t.completed).length;
    milestone.completionPercentage = Math.round((completedMTasks / allMilestoneTasks.length) * 100);
    
    const oldStatus = milestone.status;
    if (milestone.completionPercentage === 100) {
      milestone.status = 'Completed';
      if (oldStatus !== 'Completed') {
        const NotificationModel = (await import('../models/Notification.js')).default;
        await NotificationModel.create({
          userId: studentId,
          type: 'ROADMAP_MILESTONE',
          title: 'Milestone Completed!',
          message: `You have completed the milestone: ${milestone.title}`,
          link: '/student/roadmap'
        });
      }
    } else if (milestone.completionPercentage > 0) {
      milestone.status = 'In Progress';
    } else {
      milestone.status = 'Pending';
    }
    await milestone.save();

    const roadmap = await CareerRoadmap.findById(task.roadmapId);
    const allMilestones = await RoadmapMilestone.find({ roadmapId: roadmap._id });
    let totalPerc = 0;
    allMilestones.forEach(m => totalPerc += m.completionPercentage);
    
    roadmap.completionPercentage = Math.round(totalPerc / allMilestones.length);
    roadmap.totalHoursInvested += task.completed ? task.estimatedTime : -task.estimatedTime;
    
    // Streaks
    if (task.completed) {
      const now = new Date();
      if (!roadmap.lastActiveDate) {
        roadmap.currentStreak = 1;
        roadmap.highestStreak = 1;
      } else {
        const isSameDay = now.toDateString() === roadmap.lastActiveDate.toDateString();
        if (!isSameDay) {
          const diffTime = Math.abs(now - roadmap.lastActiveDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          if (diffDays <= 2) { 
            roadmap.currentStreak += 1;
            if (roadmap.currentStreak > roadmap.highestStreak) roadmap.highestStreak = roadmap.currentStreak;
          } else {
            roadmap.currentStreak = 1; 
          }
        }
      }
      roadmap.lastActiveDate = now;
    }
    
    // Calculate Readiness
    roadmap.jobReadiness = Math.min(100, Math.round(roadmap.completionPercentage * 1.1));
    roadmap.skillCoverage = roadmap.completionPercentage;
    const interviewTasks = await RoadmapTask.find({ roadmapId: roadmap._id, taskType: 'Interview' });
    const compIntTasks = interviewTasks.filter(t => t.completed).length;
    roadmap.interviewReadiness = interviewTasks.length > 0 ? Math.round((compIntTasks / interviewTasks.length) * 100) : 0;
    
    await roadmap.save();

    res.json({ success: true, message: 'Task updated', roadmap });

  } catch (error) {
    console.error('Complete Task Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getAICoachReview = async (req, res) => {
  try {
    const studentId = req.user.id;
    const roadmap = await CareerRoadmap.findOne({ studentId });
    if (!roadmap) return res.status(404).json({ success: false, message: 'No roadmap found' });

    const milestones = await RoadmapMilestone.find({ roadmapId: roadmap._id });
    
    const prompt = `
You are an AI Career Coach. 
Analyze this student's progress and provide a brief encouraging weekly review.
- Roadmap Title: ${roadmap.title}
- Completion: ${roadmap.completionPercentage}%
- Streak: ${roadmap.currentStreak} days
- Job Readiness: ${roadmap.jobReadiness}%
- Milestones completed: ${milestones.filter(m => m.status === 'Completed').length} / ${milestones.length}

Format the output strictly as JSON:
{
  "progressAnalysis": "String (Encouraging paragraph analyzing progress)",
  "strengths": ["String"],
  "weaknesses": ["String"],
  "improvementSuggestions": ["String"],
  "recommendedLMSCourses": ["String"],
  "nextWeekGoals": ["String"]
}
`;

    const response = await openrouter.chat.completions.create({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500
    });

    const responseText = response.choices[0].message.content;

    let cleanedText = responseText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const startIndex = cleanedText.indexOf('{');
    const endIndex = cleanedText.lastIndexOf('}');

    if (startIndex !== -1 && endIndex !== -1) {
      cleanedText = cleanedText.substring(startIndex, endIndex + 1);
    }

    console.log("RAW AI COACH RESPONSE =", responseText);
    console.log("CLEANED AI COACH RESPONSE =", cleanedText);

    const reviewData = JSON.parse(cleanedText);

    const NotificationModel = (await import('../models/Notification.js')).default;
    await NotificationModel.create({
      userId: studentId,
      type: 'AI_COACH_REVIEW',
      title: 'AI Coach Review Generated',
      message: `Your personalized weekly progress review is ready.`,
      link: '/student/roadmap'
    });

    res.json({ success: true, review: reviewData });

  } catch (error) {
    console.error('AI Coach Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const deleteRoadmap = async (req, res) => {
  try {
    const studentId = req.user.id;
    const roadmap = await CareerRoadmap.findOne({ studentId });
    if (!roadmap) return res.status(404).json({ success: false, message: 'No roadmap found' });

    await RoadmapTask.deleteMany({ roadmapId: roadmap._id });
    await RoadmapMilestone.deleteMany({ roadmapId: roadmap._id });
    await CareerRoadmap.findByIdAndDelete(roadmap._id);

    res.json({ success: true, message: 'Roadmap deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
