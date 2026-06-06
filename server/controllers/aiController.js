import { GoogleGenAI } from '@google/genai';
import AIChat from '../models/AIChat.js';
import Course from '../models/Course.js';

export const healthCheck = async (req, res) => {
  try {
    const ai = getGeminiModel();
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'Hello',
    });
    res.json({ success: true, message: 'Gemini connectivity successful', response: result.text });
  } catch (error) {
    console.error('Gemini Health Check Error:', error);
    res.status(500).json({ success: false, message: 'Gemini connectivity failed', error: error.message });
  }
};

const getGeminiModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to fetch context
const getContextString = async (courseId, lectureId) => {
  let contextStr = '';
  if (courseId) {
    const course = await Course.findById(courseId).populate('sections');
    if (course) {
      contextStr += `\nCourse Title: ${course.title}\nCourse Description: ${course.description}\n`;
      if (lectureId) {
        // Find the specific lecture
        let targetLecture = null;
        for (const section of course.sections) {
          const lec = section.lectures.id(lectureId);
          if (lec) {
            targetLecture = lec;
            break;
          }
        }
        if (targetLecture) {
          contextStr += `\nCurrent Lecture: ${targetLecture.title}\nLecture Description: ${targetLecture.description}\n`;
        }
      }
    }
  }
  return contextStr;
};

export const chat = async (req, res) => {
  try {
    const { courseId, lectureId, message } = req.body;
    const studentId = req.user._id;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const contextStr = await getContextString(courseId, lectureId);
    
    // Find or create chat history
    let chatSession = await AIChat.findOne({ studentId, courseId });
    if (!chatSession) {
      chatSession = new AIChat({ studentId, courseId, lectureId, messages: [] });
    } else if (lectureId && chatSession.lectureId?.toString() !== lectureId) {
        // Update lectureId if it changed
        chatSession.lectureId = lectureId;
    }

    // Format history for Gemini
    const history = [
      {
        role: 'user',
        parts: [{ text: `System Instruction: You are an expert AI Tutor for a Learning Management System. 
Respond in a helpful, encouraging, and clear manner. Format your responses using markdown.
Here is the context of what the student is currently learning:
${contextStr}

Please acknowledge this context and say hello.` }]
      },
      {
        role: 'model',
        parts: [{ text: 'Hello! I am your AI Tutor. I see you are studying this course. How can I help you today?' }]
      }
    ];

    // Add previous messages from DB
    chatSession.messages.forEach(msg => {
      history.push({
        role: msg.role,
        parts: [{ text: msg.content }]
      });
    });

    const ai = getGeminiModel();
    const chatInstance = ai.chats.create({
      model: 'gemini-2.0-flash',
      config: {
        history: history
      }
    });

    const result = await chatInstance.sendMessage({ message });
    const responseText = result.text;

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
    const studentId = req.user._id;

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
    if (!contextStr) {
      return res.status(400).json({ success: false, message: 'Course or lecture context not found' });
    }

    const prompt = `Based on the following lecture details, generate concise, well-structured revision notes using markdown formatting. Include key points, a brief summary, and any important concepts.
    
    Context:
    ${contextStr}`;

    const ai = getGeminiModel();
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    const responseText = result.text;

    res.json({ success: true, notes: responseText });
  } catch (error) {
    console.error('Generate Notes Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate notes' });
  }
};

export const generateQuiz = async (req, res) => {
  try {
    const { courseId, lectureId } = req.body;
    
    const contextStr = await getContextString(courseId, lectureId);
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

    const ai = getGeminiModel();
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    let responseText = result.text;
    
    // Clean up potential markdown formatting from Gemini
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const quiz = JSON.parse(responseText);

    res.json({ success: true, quiz });
  } catch (error) {
    console.error('Generate Quiz Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate quiz. Please try again.' });
  }
};
