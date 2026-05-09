import Anthropic from "@anthropic-ai/sdk";

/**
 *  This is the Leasing CRM assistant powered by Claude Sonnet 4.6.
 *
 * @author Reece Resnik
 * @version v2.0
 */

interface Lead {
  address: string;
  email: string;
  employer: string;
  moveInDate: string;       // ISO date string like "2025-01-30"
  moveReason: string;
  name: string;
  notes: string;
  occupants: number;
  pets: string;
  phone: string;
  status: string;
  unitType: string;
}
// Firestore returns data in a nested format, so we need to define types for that
interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  booleanValue?: boolean;
  doubleValue?: number;
}
// Firestore document structure
interface FirestoreDocument {
  name?: string;
  fields: Record<string, FirestoreValue>;
}
// Firestore response structure
interface FirestoreResponse {
  documents?: FirestoreDocument[];
}
// Request body structure
interface RequestBody {
  question: any;
  conversationHistory?: never[] | undefined;
}
// Environment variables
interface Env {
  ANTHROPIC_API_KEY: string;
}

// Shared message type used by both the worker and the client
export type Message = { role: 'user' | 'assistant'; content: string };

const WORKER_URL = 'https://leasing-ai-assistant.rresnik2.workers.dev/';

// Client-side function — calls the Cloudflare Worker and returns the AI's text response
export async function queryLeads(question: string, conversationHistory: Message[]): Promise<string> {
  const response = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, conversationHistory }),
  });

  if (!response.ok) {
    throw new Error(`Worker error: ${response.status}`);
  }

  const data = await response.json();
  // Worker returns { answer: AnthropicResponse } — extract the text content
  return data.answer?.content?.[0]?.text || 'Sorry, I encountered an error.';
}

// Function to parse Firestore response into a more usable format
function parseFirestoreData(firestoreResponse: FirestoreResponse): Lead[] {
  const documents = firestoreResponse.documents || [];

  return documents.map(doc => {
    const fields = doc.fields;
    const cleanData: Record<string, string | number> = {};

    for (const [key, value] of Object.entries(fields)) {
      if (value.stringValue !== undefined) {
        cleanData[key] = value.stringValue;
      } else if (value.integerValue !== undefined) {
        cleanData[key] = Number(value.integerValue);
      }
    }

    return cleanData as unknown as Lead;
  });
}
export default {
  // Handle incoming requests
  async fetch(request: Request, env: Env) {
    const anthropic = new Anthropic({
      // defaults to process.env["ANTHROPIC_API_KEY"]
      apiKey: env.ANTHROPIC_API_KEY,
    });
    // Handle CORS for browser requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      // Get the question from the request body
      const { question, conversationHistory = [] } = await request.json();

      if (!question) {
        return new Response(JSON.stringify({ error: 'No question provided' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Fetch leads from Firestore
      const projectId = "leasing-crm-6a808";
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/leads`;

      const firestoreResponse = await fetch(firestoreUrl);
      const firestoreData = await firestoreResponse.json();
      const leads = parseFirestoreData(firestoreData);

      // Build conversation context
      let conversationContext: string | never[] = [];
      if (conversationHistory.length > 0) {
        conversationHistory.forEach((msg: { role: string; content: any; }) => {
          conversationContext += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
        });
      }
      const leadsDescription = leads.map((lead: Lead, index: number) =>
        `[${index + 1}] ${Object.entries(lead).map(([k,v]) => `${k}=${v}`).join(', ')}`).join('\n');

      const prompt = `Database records:
        ${leadsDescription}
        Question: ${question}`;

      // Ask the AI
      const aiResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        temperature: 0.3,
        system: `You're job is to review all prospects in the database and answer the leasing agents questions. When listing names, use the actual name field values, not the row numbers. Use the notes field for additional context. Use A-Star for searching through data. If not in data, say "I don't have that information".`,
        messages: [
          ...conversationHistory,
          { role: "user", content: prompt }
        ],
        thinking: {
            "type": "disabled"
            },
        output_config: {"effort":"medium"}
        });

      // Return the response with CORS headers
      return new Response(JSON.stringify({
        answer: aiResponse
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (error : any) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
