'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/types';
import { Send, Bot, User as UserIcon, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatBotProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isAIAvailable: boolean;
}

export default function ChatBot({ messages, onSendMessage, isAIAvailable }: ChatBotProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !isAIAvailable) return;

    const message = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);

    try {
      await onSendMessage(message);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestedQuestions = [
    "What's the latest in technology news?",
    "Analyze the impact of recent business news",
    "Summarize today's top stories",
    "What are the trending topics?"
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI News Assistant</h3>
            <p className="text-sm text-gray-500">
              {isAIAvailable ? 'Ask me about the news' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!isAIAvailable && (
          <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              AI assistant is unavailable. Please check your OpenAI API configuration.
            </p>
          </div>
        )}

        {messages.length === 0 && isAIAvailable && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Bot className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Welcome! I'm your AI news assistant</h4>
              <p className="text-sm text-gray-600 mb-4">
                I can help you understand news articles, analyze trends, and answer questions about current events.
              </p>
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium">Try asking:</p>
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(question)}
                    className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded"
                  >
                    "{question}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex space-x-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-white" />
              </div>
            )}
            
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {formatDistanceToNow(message.timestamp, { addSuffix: true })}
              </p>
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                <UserIcon className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex space-x-3 justify-start">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={isAIAvailable ? "Ask me about the news..." : "AI assistant unavailable"}
            disabled={!isAIAvailable || isTyping}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || !isAIAvailable || isTyping}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}