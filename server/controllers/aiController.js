import { openrouter } from '../config/openrouter.js';
import AIChat from '../models/AIChat.js';
import Course from '../models/Course.js';
import AINote from '../models/AINote.js';
import AIGeneratedQuiz from '../models/AIGeneratedQuiz.js';
import AIQuizAttempt from '../models/AIQuizAttempt.js';
import PDFDocument from 'pdfkit';
export const healthCheck = async (req, res) => {
  try {
    const response = await openrouter.chat.completions.create({
      model: "deepseek/deepseek-chat",
      messages: [{ role: "user", content: "Hello" }],
      max_tokens: 1500
    });
    res.json({ success: true, message: 'OpenRouter connectivity successful', response: response.choices[0].message.content });
  } catch (error) {
    console.error('OpenRouter Health Check Error:', error);
    res.status(500).json({ success: false, message: 'OpenRouter connectivity failed', error: error.message });
  }
};

// Helper to fetch context
const getContextString = async (courseId, lectureId) => {
  let contextStr = '';
  if (courseId) {
    const course = await Course.findById(courseId).populate({
      path: 'sections',
      populate: {
        path: 'lectures'
      }
    });
    if (course) {
      contextStr += `\nCourse Title: ${course.title}\nCourse Description: ${course.description}\n`;
      if (lectureId) {
        // Find the specific lecture
        let targetLecture = null;
        for (const section of course.sections) {
          if (!section.lectures) {
            continue;
          }

          const lec = section.lectures.find(
            sv => sv._id?.toString() === lectureId
          );

          if (lec) {
            targetLecture = lec;
            break;
          }
        }
        if (targetLecture) {
          contextStr += `\nCurrent Lecture: ${targetLecture.title}\nLecture Description: ${targetLecture.description || 'No description provided'}\n`;
        }
      }
    }
  }
  return contextStr;
};

export const chat = async (req, res) => {
  try {
    const { courseId, lectureId, message } = req.body;
    const studentId = req.userId;

    console.log("AI CHAT USER =", studentId);

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const contextStr = await getContextString(courseId, lectureId);
    console.log("COURSE ID =", courseId);
    console.log("LECTURE ID =", lectureId);
    console.log("CONTEXT =", contextStr);

    // Find or create chat history
    let chatSession = await AIChat.findOne({ studentId, courseId });
    if (!chatSession) {
      chatSession = new AIChat({ studentId, courseId, lectureId, messages: [] });
    } else if (lectureId && chatSession.lectureId?.toString() !== lectureId) {
      // Update lectureId if it changed
      chatSession.lectureId = lectureId;
    }

    // Format history for OpenRouter
    const history = [
      {
        role: 'system',
        content: `System Instruction: You are an expert AI Tutor for a Learning Management System. 
Respond in a helpful, encouraging, and clear manner. Format your responses using markdown.
Here is the context of what the student is currently learning:
${contextStr}

Please acknowledge this context and say hello.`
      },
      {
        role: 'assistant',
        content: 'Hello! I am your AI Tutor. I see you are studying this course. How can I help you today?'
      }
    ];

    // Add previous messages from DB
    chatSession.messages.forEach(msg => {
      history.push({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.content
      });
    });

    // Add the current user message
    history.push({
      role: 'user',
      content: message
    });

    const completion = await openrouter.chat.completions.create({
      model: "deepseek/deepseek-chat",
      messages: history,
      max_tokens: 800
    });

    const responseText = completion.choices[0].message.content;

    // Save to DB
    chatSession.messages.push({ role: 'user', content: message });
    chatSession.messages.push({ role: 'model', content: responseText });
    await chatSession.save();

    res.json({ success: true, message: responseText });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to process AI request' });
  }
};

export const getHistory = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.userId;

    const chatSession = await AIChat.findOne({ studentId, courseId });

    res.json({
      success: true,
      messages: chatSession ? chatSession.messages : []
    });
  } catch (error) {
    console.error('Get History Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch chat history' });
  }
};

export const generateNotes = async (req, res) => {
  try {
    const { courseId, lectureId } = req.body;

    const contextStr = await getContextString(courseId, lectureId);
    console.log("NOTES COURSE ID =", courseId);
    console.log("NOTES LECTURE ID =", lectureId);
    console.log("NOTES CONTEXT =", contextStr);
    
    if (!contextStr) {
      return res.status(400).json({ success: false, message: 'Course or lecture context not found' });
    }

    const prompt = `Based on the following lecture details, generate concise, well-structured revision notes using markdown formatting. Include key points, a brief summary, and any important concepts.
    
    Context:
    ${contextStr}`;

    const completion = await openrouter.chat.completions.create({
      model: "deepseek/deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500
    });
    const responseText = completion.choices[0].message.content;

    res.json({ success: true, notes: responseText });
  } catch (error) {
    console.error('Generate Notes Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate notes' });
  }
};

export const generateQuiz = async (req, res) => {
  try {
    const { courseId, lectureId } = req.body;

    const contextStr = await getContextString(courseId, lectureId);
    console.log("QUIZ COURSE ID =", courseId);
    console.log("QUIZ LECTURE ID =", lectureId);
    console.log("QUIZ CONTEXT =", contextStr);
    
    if (!contextStr) {
      return res.status(400).json({ success: false, message: 'Course or lecture context not found' });
    }

    const prompt = `Based on the following lecture details, generate a 3-question multiple choice quiz.
    
    Return the output STRICTLY as a JSON array of objects. Do not include any markdown formatting like \`\`\`json or \`\`\`. Just the raw JSON array.
    Each object must have the following structure:
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0, // index of the correct option
      "explanation": "Brief explanation of why the answer is correct"
    }

    Context:
    ${contextStr}`;

    const completion = await openrouter.chat.completions.create({
      model: "deepseek/deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500
    });
    
    let responseText = completion.choices[0].message.content;

    // Clean up potential markdown formatting from OpenRouter
    let cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

    // Find first '[' and last ']' if model returned extra conversational text
    const startIndex = cleanedText.indexOf('[');
    const endIndex = cleanedText.lastIndexOf(']');
    
    if (startIndex !== -1 && endIndex !== -1) {
      cleanedText = cleanedText.substring(startIndex, endIndex + 1);
    }

    let quiz;
    try {
      quiz = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse quiz JSON:', cleanedText);
      return res.status(500).json({ success: false, message: 'AI returned invalid quiz format. Please try again.' });
    }

    res.json({ success: true, quiz });
  } catch (error) {
    console.error('Generate Quiz Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate quiz. Please try again.' });
  }
};

export const clearChatHistory = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.userId;
    
    await AIChat.findOneAndDelete({ studentId, courseId });
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    console.error('Clear Chat History Error:', error);
    res.status(500).json({ success: false, message: 'Failed to clear chat history' });
  }
};

export const saveNote = async (req, res) => {
  try {
    const { courseId, lectureId, content } = req.body;
    const studentId = req.userId;

    const note = new AINote({ studentId, courseId, lectureId, content });
    await note.save();

    res.json({ success: true, note });
  } catch (error) {
    console.error('Save Note Error:', error);
    res.status(500).json({ success: false, message: 'Failed to save note' });
  }
};

export const getNotes = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.userId;

    const notes = await AINote.find({ studentId, courseId }).sort({ createdAt: -1 });
    res.json({ success: true, notes });
  } catch (error) {
    console.error('Get Notes Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notes' });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.userId;

    await AINote.findOneAndDelete({ _id: id, studentId });
    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete Note Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete note' });
  }
};

export const generateNotePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.userId;

    const note = await AINote.findOne({ _id: id, studentId });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Note_${id}.pdf`);

    doc.pipe(res);

    doc.fontSize(20).text('AI Generated Notes', { align: 'center' });
    doc.moveDown();
    
    // Very basic markdown stripping for PDF since pdfkit doesn't support markdown natively
    let textContent = note.content
      .replace(/#/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/```/g, '\n')
      .replace(/`/g, '');

    doc.fontSize(12).text(textContent, {
      align: 'left',
      lineGap: 4
    });

    doc.end();
  } catch (error) {
    console.error('Generate PDF Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate PDF' });
    }
  }
};

export const saveQuiz = async (req, res) => {
  try {
    const { courseId, lectureId, questions } = req.body;
    const studentId = req.userId;

    const quiz = new AIGeneratedQuiz({ studentId, courseId, lectureId, questions });
    await quiz.save();

    res.json({ success: true, quiz });
  } catch (error) {
    console.error('Save Quiz Error:', error);
    res.status(500).json({ success: false, message: 'Failed to save quiz' });
  }
};

export const getQuizzes = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.userId;

    const quizzes = await AIGeneratedQuiz.find({ studentId, courseId }).sort({ createdAt: -1 });
    res.json({ success: true, quizzes });
  } catch (error) {
    console.error('Get Quizzes Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quizzes' });
  }
};

export const saveQuizAttempt = async (req, res) => {
  try {
    const { quizId, courseId, answers, score, totalQuestions, percentage } = req.body;
    const studentId = req.userId;

    const attempt = new AIQuizAttempt({
      studentId,
      quizId,
      courseId,
      answers,
      score,
      totalQuestions,
      percentage
    });
    
    await attempt.save();
    res.json({ success: true, attempt });
  } catch (error) {
    console.error('Save Quiz Attempt Error:', error);
    res.status(500).json({ success: false, message: 'Failed to save quiz attempt' });
  }
};

export const getQuizAttempts = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.userId;

    const attempts = await AIQuizAttempt.find({ studentId, courseId })
      .populate('quizId')
      .sort({ createdAt: -1 });
      
    res.json({ success: true, attempts });
  } catch (error) {
    console.error('Get Quiz Attempts Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quiz attempts' });
  }
};
