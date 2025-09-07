import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query, subject } = await request.json();

    if (!query || !subject) {
      return NextResponse.json(
        { success: false, error: 'Query and subject are required' },
        { status: 400 }
      );
    }

    // Use your API key (same one from your GoogleService)
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyCgOeVEHs5Dw-7on2QsUKdj6gxa0BHPPrc';
    const baseURL = 'https://generativelanguage.googleapis.com/v1beta';

    // Create a context-aware prompt
    const prompt = `You are a helpful study assistant for students. 
    Subject: ${subject}
    Student Question: ${query}
    
    Please provide a clear, educational answer that helps the student understand the topic. 
    Keep your response informative but concise, suitable for a student learning environment.
    If the question is not related to the specified subject, gently redirect them to ask subject-relevant questions.`;

    // Use the same format as your GoogleService
    const requestBody = {
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
        topP: 1,
      }
    };

    // Use gemini-1.5-flash model (same as your GoogleService likely uses)
    const response = await fetch(`${baseURL}/models/gemini-1.5-flash:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received';

    return NextResponse.json({
      success: true,
      response: text,
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get response from AI assistant' 
      },
      { status: 500 }
    );
  }
}