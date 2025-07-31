import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Trash2, 
  Sparkles,
  Loader,
  TrendingUp,
  Target
} from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { useNews } from '../contexts/NewsContext';
import { formatDistanceToNow } from 'date-fns';

interface AIChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIChatbot: React.FC<AIChatbotProps> = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { messages, loading, sendMessage, clearChat, generateSummary, analyzeArticle } = useChat();
  const { articles } = useNews();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !loading) {
      const currentMessage = message.trim();
      setMessage('');
      setIsTyping(true);
      
      try {
        await sendMessage(currentMessage);
      } finally {
        setIsTyping(false);
      }
    }
  };

  const handleQuickAction = async (action: string) => {
    if (articles.length === 0) {
      await sendMessage("I don't see any recent news articles. Could you please browse some news first?");
      return;
    }

    const recentArticles = articles.slice(0, 3);
    
    switch (action) {
      case 'summarize':
        await sendMessage(`Can you summarize the latest news: ${recentArticles.map(a => a.title).join(', ')}`);
        break;
      case 'trends':
        await sendMessage("What are the main trends in the current news?");
        break;
      case 'impact':
        await sendMessage("What's the potential impact of today's top stories?");
        break;
      default:
        break;
    }
  };

  const quickActions = [
    { label: 'Summarize Latest', action: 'summarize', icon: Sparkles },
    { label: 'Trend Analysis', action: 'trends', icon: TrendingUp },
    { label: 'Impact Assessment', action: 'impact', icon: Target },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />

          {/* Chat Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="sidebar sidebar-open"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                  <p className="text-xs text-gray-500">Powered by GPT</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-200px)]">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Welcome to AI News Assistant
                  </h3>
                  <p className="text-gray-500 text-sm mb-6">
                    Ask me about news, get summaries, or analyze trends.
                  </p>
                  
                  {/* Quick Actions */}
                  <div className="space-y-2">
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.action}
                          onClick={() => handleQuickAction(action.action)}
                          className="w-full flex items-center space-x-2 p-3 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <Icon className="w-4 h-4 text-primary-600" />
                          <span>{action.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`chat-message ${msg.role === 'user' ? 'chat-user' : 'chat-bot'}`}>
                        <div className="flex items-start space-x-2">
                          {msg.role === 'assistant' && (
                            <Bot className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                          {msg.role === 'user' && (
                            <User className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="chat-bot">
                        <div className="flex items-center space-x-2">
                          <Bot className="w-4 h-4 text-primary-600" />
                          <div className="flex space-x-1">
                            <Loader className="w-4 h-4 animate-spin text-gray-400" />
                            <span className="text-sm text-gray-500">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about news..."
                  disabled={loading}
                  className="flex-1 input-field text-sm"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || loading}
                  className="btn-primary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              
              {/* Clear Chat */}
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="mt-2 w-full flex items-center justify-center space-x-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear Chat</span>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AIChatbot;