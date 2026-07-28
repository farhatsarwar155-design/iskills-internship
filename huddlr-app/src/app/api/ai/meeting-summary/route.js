import { NextResponse } from "next/server";
import { db, doc, getDoc } from "@/lib/firebase";
import { verifyJWT } from "@/lib/auth";
import { cookies } from "next/headers";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are an expert meeting assistant. Analyze the provided meeting transcript and return a structured JSON summary.

Your response MUST be valid JSON in exactly this format:
{
  "keyPoints": ["point 1", "point 2", ...],
  "decisions": ["decision 1", "decision 2", ...],
  "actionItems": [
    { "task": "task description", "assignee": "person name or null", "priority": "high|medium|low" },
    ...
  ],
  "rawText": "A 2-3 sentence executive summary of the meeting"
}

Extract:
- keyPoints: The main topics and discussion points (3-7 items)
- decisions: Clear decisions that were made during the meeting (1-5 items)  
- actionItems: Specific tasks assigned or implied, with the assignee if mentioned by name (2-8 items)
- rawText: A brief executive summary paragraph

Return ONLY the JSON object, no markdown, no explanation.`;

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    return await verifyJWT(token);
  } catch (err) {
    return null;
  }
}

export async function POST(request) {
  try {
    const { transcript, meetingId } = await request.json();

    if (!transcript || !transcript.trim()) {
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
    }

    if (!meetingId) {
      return NextResponse.json({ error: "No meeting ID provided" }, { status: 400 });
    }

    // Authenticate user
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Retrieve meeting
    const meetingRef = doc(db, "meetings", meetingId);
    const meetingSnap = await getDoc(meetingRef);
    if (!meetingSnap.exists()) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const meetingData = meetingSnap.data();
    const isHost = meetingData.hostId === user.email || meetingData.createdBy === user.email;
    if (!isHost) {
      return NextResponse.json({ error: "Forbidden: Only the host can generate summaries" }, { status: 403 });
    }

    // --- Try Gemini API first ---
    if (GEMINI_API_KEY) {
      try {
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `${SYSTEM_PROMPT}\n\nPlease analyze this meeting transcript and return the structured JSON summary:\n\n${transcript}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2048,
              },
            }),
          }
        );

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          const rawContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          
          try {
            const cleaned = rawContent.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
            const summary = JSON.parse(cleaned);
            return NextResponse.json({ summary });
          } catch (parseErr) {
            console.error("[AI Summary] Gemini returned invalid JSON, falling back:", rawContent.substring(0, 200));
          }
        } else {
          const errBody = await geminiResponse.text();
          console.error("[AI Summary] Gemini API error:", geminiResponse.status, errBody.substring(0, 200));
        }
      } catch (geminiErr) {
        console.error("[AI Summary] Gemini fetch error:", geminiErr.message);
      }
    }

    // --- Try Anthropic API as fallback ---
    if (ANTHROPIC_API_KEY) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Please analyze this meeting transcript and return the structured JSON summary:\n\n${transcript}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error("[AI Summary] Anthropic API error:", response.status, errBody);
        return NextResponse.json(
          { error: `AI API error: ${response.status}. Check server logs.` },
          { status: 500 }
        );
      }

      const data = await response.json();
      const rawContent = data.content?.[0]?.text || "";

      let summary;
      try {
        const cleaned = rawContent.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
        summary = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error("[AI Summary] Failed to parse JSON from AI:", rawContent);
        return NextResponse.json({ error: "AI returned invalid JSON. Try again." }, { status: 500 });
      }

      return NextResponse.json({ summary });
    }

    // --- MOCK FALLBACK (no API key configured) ---
    // Parses the transcript to extract real names mentioned and simulate a useful summary
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simple name extraction: look for capitalized words after "will", "should", "to"
    const namePattern = /(?:will|should|to|assigned to|by)\s+([A-Z][a-z]+)/g;
    const names = [];
    let match;
    while ((match = namePattern.exec(transcript)) !== null) {
      if (!names.includes(match[1])) names.push(match[1]);
    }

    // Extract sentences ending in action-like words
    const sentences = transcript.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 20);
    
    const mockSummary = {
      keyPoints: sentences.slice(0, 3).map(s => s.substring(0, 80)) || [
        "Team discussed the new feature roadmap for Q3",
        "Budget constraints require prioritizing high-impact features",
        "Integration with third-party APIs was reviewed",
      ],
      decisions: [
        "Launch MVP by end of month",
        "Use Firebase Storage for file uploads",
        "Postpone analytics dashboard to Q4",
      ],
      actionItems: [
        { task: "Set up Firebase Storage bucket", assignee: names[0] || null, priority: "high" },
        { task: "Write API integration tests", assignee: names[1] || null, priority: "medium" },
        { task: "Draft Q3 roadmap document", assignee: names[2] || null, priority: "medium" },
      ],
      rawText: `This is a mock AI summary (no ANTHROPIC_API_KEY configured). The transcript was analyzed and ${sentences.length} discussion points were identified. Add your Anthropic API key to .env.local to get real AI-powered summaries.`
    };

    return NextResponse.json({ summary: mockSummary });

  } catch (err) {
    console.error("[AI Summary] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
