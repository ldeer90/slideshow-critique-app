import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import pdf from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '$env/static/private'; // Import from private env vars

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set.');
}

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Use the specified model

export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('presentation') as File | null;

    if (!file) {
      throw error(400, 'No presentation file uploaded.');
    }

    if (file.type !== 'application/pdf') {
      throw error(400, 'Invalid file type. Please upload a PDF.');
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Parse PDF text
    let pdfTextContent = '';
    try {
      const data = await pdf(buffer);
      // Combine text from all pages, maybe add separators
      pdfTextContent = data.text; // Consider data.numpages for per-page analysis later
      console.log(`PDF Parsed: ${data.numpages} pages, ${pdfTextContent.length} characters.`);
    } catch (parseError) {
      console.error('PDF Parsing Error:', parseError);
      throw error(500, 'Failed to parse PDF content.');
    }

    if (!pdfTextContent.trim()) {
        throw error(400, 'Could not extract text from the PDF.');
    }

    // Construct the prompt for Gemini
    // TODO: Refine this prompt significantly based on desired output format and criteria
    const prompt = `
      Analyze the following text content extracted from a slideshow presentation.
      Provide a critique focusing on these aspects for each logical slide or section if possible:
      1. Text Clarity & Verbosity: How well does the text get the message across? Is it too verbose or missing clarity? Could it be better presented visually?
      2. Image Relevance (based on text): How well might images (not provided here, infer based on text) relate to the text? (Acknowledge limitation of not seeing images).
      3. Graphic Design (Hypothetical): Based on the text content, suggest potential graphic design improvements or considerations by modern standards. (Acknowledge limitation).
      4. Overall Slide Assessment: Provide a summary judgment for the slide/section.

      Keep the critique concise and actionable. Structure the output clearly.

      Presentation Text:
      ---
      ${pdfTextContent.substring(0, 100000)} // Limit context window for safety
      ---
      Critique:
    `;

    // Call Gemini API
    let critiqueResult = '';
    try {
      console.log('Sending prompt to Gemini...');
      const result = await model.generateContent(prompt);
      const response = result.response;
      critiqueResult = response.text();
      console.log('Gemini response received.');
    } catch (apiError) {
      console.error('Gemini API Error:', apiError);
      throw error(500, 'Failed to get critique from AI model.');
    }

    return json({ critique: critiqueResult });

  } catch (err: any) {
    // Handle specific errors thrown by `error()` or other exceptions
    console.error('Critique API Error:', err);
    const statusCode = err.status || 500;
    const message = err.body?.message || err.message || 'Internal Server Error';
    // Ensure we return a valid Response object
    return json({ error: message }, { status: statusCode });
  }
};
