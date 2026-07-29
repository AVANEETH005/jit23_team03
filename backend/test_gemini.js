require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const rawKey = process.env.GEMINI_API_KEY || '';
let cleanKey = rawKey.trim();
if (cleanKey.includes('GEMINI_API_KEY=')) {
  cleanKey = cleanKey.split('GEMINI_API_KEY=')[0].trim();
}
cleanKey = cleanKey.replace(/[\s\r\n]/g, '');

const ai = new GoogleGenAI({ apiKey: cleanKey });

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: 'Say Hello',
    });
    console.log('Success! Response:', response.text);
  } catch (error) {
    console.error('Error connecting to Gemini API:', error);
  }
}

test();
