require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const rawKey = process.env.GEMINI_API_KEY || '';
let cleanKey = rawKey.trim();
if (cleanKey.includes('GEMINI_API_KEY=')) {
  cleanKey = cleanKey.split('GEMINI_API_KEY=')[0].trim();
}
cleanKey = cleanKey.replace(/[\s\r\n]/g, '');

const ai = new GoogleGenAI({ apiKey: cleanKey });

async function list() {
  try {
    const res = await ai.models.list();
    const listArr = [];
    for await (const m of res) {
      listArr.push(m.name);
    }
    console.log('Iterated model names:', listArr.filter(n => n.toLowerCase().includes('gemini')));
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

list();
