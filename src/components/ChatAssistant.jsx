import { useState } from 'react';

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const question = input; 
    setInput('');
    setLoading(true);

    try {

      const response = await fetch('https://leasing-ai-assistant.rresnik2.workers.dev/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          question,
          conversationHistory: messages 
        }),
      });

      const data = await response.json();

      const aiMessage = {
        role: 'assistant',
        content: data.answer || 'Sorry, I encountered an error.'
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { 
      role: 'assistant', 
      content: 'Sorry, I could not process your request.' 
    };
    setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all z-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold">Leasing AI Assistant</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-gray-500 text-center mt-8">
                <p className="mb-2">👋 Hi! I can help you query your leads.</p>
                <p className="text-sm">Try asking:</p>
                <ul className="text-sm mt-2 space-y-1">
                  <li>"How many leads toured this week?"</li>
                  <li>"Show me all approved applications"</li>
                  <li>"Which leads need follow-up?"</li>
                </ul>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${msg.role === 'user'
                      ? 'bg-blue-600 text-white ml-auto max-w-[80%]'
                      : 'bg-gray-100 text-gray-900 mr-auto max-w-[80%]'
                    }`}
                >
                  {msg.content}
                </div>
              ))
            )}
            {loading && (
              <div className="bg-gray-100 text-gray-900 p-3 rounded-lg mr-auto max-w-[80%]">
                Thinking...
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about your leads..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}