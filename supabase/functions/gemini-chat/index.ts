import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, context = "general" } = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Build context-specific system prompt
    let systemPrompt = "You are PlaceAI, an AI assistant helping students with placement preparation.";
    
    switch (context) {
      case "resume":
        systemPrompt += " You specialize in resume building, ATS optimization, and providing specific, actionable feedback to improve resumes for job applications.";
        break;
      case "interview":
        systemPrompt += " You specialize in interview preparation, helping students practice answers, providing company-specific questions, and giving feedback on responses.";
        break;
      case "study":
        systemPrompt += " You help students with study materials, creating summaries, flashcards, and practice questions from their uploaded content.";
        break;
      case "coding":
        systemPrompt += " You assist with coding practice, code review, and providing optimization suggestions for programming problems.";
        break;
      case "career":
        systemPrompt += " You provide career guidance, skill assessments, and personalized learning roadmaps for students.";
        break;
      case "college_suggestion":
        systemPrompt += " You provide suggestions for college names, degree programs, and educational institutions based on the user's input. Search the internet for real colleges and universities.";
        break;
      case "company_suggestion":
        systemPrompt += " You provide suggestions for company names, positions, and job descriptions based on the user's input. Search the internet for real companies and job roles.";
        break;
      case "skill_suggestion":
        systemPrompt += " You provide suggestions for technical skills, programming languages, frameworks, and tools relevant to the user's field. Search the internet for current industry trends.";
        break;
      default:
        systemPrompt += " You provide comprehensive assistance across all aspects of placement preparation including resumes, interviews, coding, and career guidance.";
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\nUser: ${prompt}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini API response:', JSON.stringify(data, null, 2));

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

    return new Response(JSON.stringify({ 
      response: aiResponse,
      context 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gemini-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to process your request. Please try again.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});