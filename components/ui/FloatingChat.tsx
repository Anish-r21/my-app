'use client';

import { useState } from 'react';

const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const subjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'English',
    'History',
    'Geography',
    'General'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !subject) return;

    setLoading(true);
    setResponse('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, subject }),
      });

      const data = await res.json();
      
      if (data.success) {
        setResponse(data.response);
      } else {
        setResponse('Sorry, I encountered an error. Please try again.');
      }
    } catch (error) {
      setResponse('Sorry, I encountered an error. Please try again.');
    }

    setLoading(false);
  };

  const clearChat = () => {
    setQuery('');
    setResponse('');
    setSubject('');
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-all duration-300"
        style={{
          fontSize: '24px',
        }}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[90vw] bg-white rounded-lg shadow-2xl border z-50 max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="bg-blue-500 text-white p-4 rounded-t-lg">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">AI Study Assistant</h3>
              <button
                onClick={clearChat}
                className="text-white hover:text-gray-200 text-sm"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Chat Content */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a subject</option>
                  {subjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Question
                </label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask your question here..."
                  className="w-full p-2 border rounded-md h-20 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !query.trim() || !subject}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-md transition-colors"
              >
                {loading ? 'Thinking...' : 'Ask AI'}
              </button>
            </form>

            {/* Response */}
            {(response || loading) && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium text-gray-700 mb-2">Response:</h4>
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-gray-500">AI is thinking...</span>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded-md max-h-48 overflow-y-auto">
                    <p className="text-gray-800 whitespace-pre-wrap">{response}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}


    </>
  );
};

export default FloatingChat;