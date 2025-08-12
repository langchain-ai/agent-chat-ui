// src/app/api/transcribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    console.log('Audio file received:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type
    });

    // Create a proper File object for Groq API
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile, // Pass the File directly, not a Blob
      model: "whisper-large-v3-turbo",
      response_format: "text",
      language: "fr",
    });

    console.log('Transcription result:', transcription);

    return NextResponse.json({ 
      transcription: typeof transcription === 'string' ? transcription : transcription.text 
    });
    
  } catch (error) {
    console.error('Transcription error:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { error: 'Failed to transcribe audio', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}