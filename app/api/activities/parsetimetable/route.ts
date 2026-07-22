import { NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided in the request' }, 
        { status: 400 }
      );
    }

    // Convert the uploaded file into a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Explicitly define the absolute worker path to bypass Turbopack path translation issues
    const worker = await createWorker('eng', 1, {
      workerPath: path.join(
        process.cwd(),
        'node_modules/tesseract.js/src/worker/worker-script/node/index.js'
      ),
    });

    try {
      // Perform OCR recognition on the image buffer
      const result = await worker.recognize(buffer);

      console.log(result.data.text)
      
      return NextResponse.json({ 
        success: true, 
        text: result.data.text.trim() 
      });
    } finally {
      // Ensure the worker is always terminated to prevent memory leaks
      await worker.terminate();
    }

  } catch (error) {
    console.error('[OCR API Error]:', error);
    return NextResponse.json(
      { error: 'Internal Server Error during OCR processing' }, 
      { status: 500 }
    );
  }
}