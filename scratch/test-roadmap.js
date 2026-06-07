import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CareerRoadmap from '../server/models/CareerRoadmap.js';
import RoadmapMilestone from '../server/models/RoadmapMilestone.js';
import RoadmapTask from '../server/models/RoadmapTask.js';
import User from '../server/models/User.js';

dotenv.config({ path: './.env' });

async function testRoadmap() {
  await mongoose.connect('mongodb+srv://helloguys2367paagal_db_user:helloguys2367@cluster0.plmfjxz.mongodb.net/lms?retryWrites=true&w=majority&appName=Cluster0');
  console.log("Connected to DB");

  const student = await User.findOne({ role: 'student' });
  if (!student) {
    console.log("No student found");
    process.exit(0);
  }

  // Clear existing
  await CareerRoadmap.deleteMany({ studentId: student._id });
  await RoadmapMilestone.deleteMany({});
  await RoadmapTask.deleteMany({});

  // 1. Create Roadmap
  const roadmap = await CareerRoadmap.create({
    studentId: student._id,
    title: "Test Roadmap",
    targetRole: "Developer",
    durationWeeks: 2
  });

  const m1 = await RoadmapMilestone.create({
    roadmapId: roadmap._id,
    weekNumber: 1,
    title: "Week 1",
  });

  const m2 = await RoadmapMilestone.create({
    roadmapId: roadmap._id,
    weekNumber: 2,
    title: "Week 2",
  });

  const t1 = await RoadmapTask.create({
    roadmapId: roadmap._id,
    milestoneId: m1._id,
    taskTitle: "Task 1",
    estimatedTime: 2
  });

  const t2 = await RoadmapTask.create({
    roadmapId: roadmap._id,
    milestoneId: m1._id,
    taskTitle: "Task 2",
    estimatedTime: 3
  });

  const t3 = await RoadmapTask.create({
    roadmapId: roadmap._id,
    milestoneId: m2._id,
    taskTitle: "Task 3",
    estimatedTime: 5
  });

  console.log("Roadmap created:", roadmap._id);

  // 2. Mark task 1 complete (simulating controller logic)
  const completeTaskLogic = async (taskId) => {
    const task = await RoadmapTask.findById(taskId);
    task.completed = true;
    task.completedAt = new Date();
    await task.save();

    const milestone = await RoadmapMilestone.findById(task.milestoneId);
    const allMilestoneTasks = await RoadmapTask.find({ milestoneId: milestone._id });
    const completedMTasks = allMilestoneTasks.filter(t => t.completed).length;
    milestone.completionPercentage = Math.round((completedMTasks / allMilestoneTasks.length) * 100);
    if (milestone.completionPercentage === 100) {
      milestone.status = 'Completed';
    } else {
      milestone.status = 'In Progress';
    }
    await milestone.save();

    const rm = await CareerRoadmap.findById(task.roadmapId);
    const allMilestones = await RoadmapMilestone.find({ roadmapId: rm._id });
    let totalPerc = 0;
    allMilestones.forEach(m => totalPerc += m.completionPercentage);
    
    rm.completionPercentage = Math.round(totalPerc / allMilestones.length);
    rm.totalHoursInvested += task.estimatedTime;
    
    await rm.save();
    return { milestonePerc: milestone.completionPercentage, roadmapPerc: rm.completionPercentage };
  };

  let res1 = await completeTaskLogic(t1._id);
  console.log("After T1:", res1);
  
  let res2 = await completeTaskLogic(t2._id);
  console.log("After T2:", res2);

  let res3 = await completeTaskLogic(t3._id);
  console.log("After T3:", res3);

  process.exit(0);
}

testRoadmap();
