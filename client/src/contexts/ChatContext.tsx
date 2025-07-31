import React, { createContext, useContext, useReducer, useState } from 'react';
import { useMutation } from 'react-query';
import axios from 'axios';
import { ChatContextType, ChatMessage, NewsArticle, AISummary, AIAnalysis } from '../types';

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
}

type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'CLEAR_ERROR' };

const initialState: ChatState = {
  messages: [],
  loading: false,
  error: null,
};

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Send message mutation
  const sendMessageMutation = useMutation(
    async (message: string) => {
      const response = await axios.post('/api/ai/chat', {
        message,
        context: state.messages.slice(-10), // Send last 10 messages for context
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        const botMessage: ChatMessage = {
          id: data.messageId,
          role: 'assistant',
          content: data.response,
          timestamp: data.timestamp,
        };
        dispatch({ type: 'ADD_MESSAGE', payload: botMessage });
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'CLEAR_ERROR' });
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error || 'Failed to send message';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        dispatch({ type: 'SET_LOADING', payload: false });
      },
    }
  );

  // Generate summary mutation
  const generateSummaryMutation = useMutation(
    async (article: NewsArticle) => {
      const response = await axios.post('/api/ai/summarize', {
        title: article.title,
        content: article.description,
        url: article.url,
      });
      return response.data;
    }
  );

  // Analyze article mutation
  const analyzeArticleMutation = useMutation(
    async (article: NewsArticle) => {
      const response = await axios.post('/api/ai/analyze', {
        title: article.title,
        content: article.description,
        category: article.category,
      });
      return response.data;
    }
  );

  // Send message
  const sendMessage = async (message: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    sendMessageMutation.mutate(message);
  };

  // Clear chat
  const clearChat = () => {
    dispatch({ type: 'CLEAR_MESSAGES' });
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Generate summary
  const generateSummary = async (article: NewsArticle): Promise<AISummary> => {
    try {
      const result = await generateSummaryMutation.mutateAsync(article);
      return result;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to generate summary');
    }
  };

  // Analyze article
  const analyzeArticle = async (article: NewsArticle): Promise<AIAnalysis> => {
    try {
      const result = await analyzeArticleMutation.mutateAsync(article);
      return result;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to analyze article');
    }
  };

  const value: ChatContextType = {
    messages: state.messages,
    loading: state.loading,
    sendMessage,
    clearChat,
    generateSummary,
    analyzeArticle,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};