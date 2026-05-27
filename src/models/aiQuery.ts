/**
 * Client for the Leasing CRM AI assistant. Calls the FastAPI backend
 * (lead-score/main.py) which holds the Anthropic API key and queries Firestore.
 *
 * @author Reece Resnik
 * @version v2.0
 */

export type Message = { role: 'user' | 'assistant'; content: string };

const API_URL =
  (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL
  || 'http://localhost:8000';

export async function query(question: string, conversationHistory: Message[] = []): Promise<string> {
  const response = await fetch(`${API_URL}/api/ai-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, history: conversationHistory }),
  });

  if (!response.ok) {
    throw new Error(`AI query failed: ${response.status} ${response.statusText}`);
  }

  const data: { answer: string } = await response.json();
  return data.answer;
}
