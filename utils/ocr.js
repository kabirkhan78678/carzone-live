import Tesseract from 'tesseract.js';

export async function extractVRN(imagePath) {
  const { data: { text } } = await Tesseract.recognize(imagePath, 'eng');
  const vrnMatch = text.match(/[A-Z0-9]{6,10}/);
  return vrnMatch ? vrnMatch[0] : null;
}