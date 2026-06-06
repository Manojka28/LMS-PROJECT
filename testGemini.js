import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

async function runTest() {
  console.log('--- GEMINI CONNECTIVITY TEST ---');
  console.log('API Key Starts With:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 5) : 'MISSING');
  console.log('SDK: @google/genai');

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    console.log('Model: gemini-2.0-flash');
    console.log('Sending: "Hello"');
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: 'Hello',
    });

    console.log('\n--- RESPONSE ---');
    console.log(response.text);
    console.log('----------------\nSUCCESS!');
  } catch (error) {
    console.error('\n--- ERROR ---');
    console.error(error);
  }
}

runTest();
