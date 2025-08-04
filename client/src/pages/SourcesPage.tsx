import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Helmet } from 'react-helmet-async';
import { 
  Plus, 
  Loader, 
  ExternalLink, 
  Trash2, 
  CheckCircle,
  XCircle,
  Rss,
  Radio,
  Mail,
  Globe,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

interface CustomSource {
  _id: string;
  name: string;
  url: string;
  type: 'rss' | 'api' | 'podcast' | 'newsletter' | 'website';
  category: string;
  description?: string;
  isActive: boolean;
  lastFetchedAt?: string;
  errorCount: number;
  lastError?: {
    message: string;
    occurredAt: string;
  };
}

const SourcesPage: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [testingSource, setTestingSource] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    type: 'rss' as const,
    category: 'other',
    description: '',
  });

  // Fetch sources
  const { data: sources, isLoading } = useQuery<CustomSource[]>('customSources', async () => {
    const response = await axios.get('/api/custom-sources');
    return response.data;
  });

  // Add source mutation
  const addSourceMutation = useMutation(
    async (data: typeof formData) => {
      const response = await axios.post('/api/custom-sources', data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customSources');
        toast.success('Source added successfully!');
        setShowAddForm(false);
        setFormData({
          name: '',
          url: '',
          type: 'rss',
          category: 'other',
          description: '',
        });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to add source');
      },
    }
  );

  // Delete source mutation
  const deleteSourceMutation = useMutation(
    async (id: string) => {
      await axios.delete(`/api/custom-sources/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customSources');
        toast.success('Source deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete source');
      },
    }
  );

  // Test source
  const testSource = async (id: string) => {
    setTestingSource(id);
    try {
      const response = await axios.post(`/api/custom-sources/${id}/test`);
      if (response.data.success) {
        toast.success(`Found ${response.data.articlesFound} articles!`);
      } else {
        toast.error(response.data.error || 'Test failed');
      }
    } catch (error) {
      toast.error('Failed to test source');
    } finally {
      setTestingSource(null);
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'rss':
        return Rss;
      case 'podcast':
        return Radio;
      case 'newsletter':
        return Mail;
      default:
        return Globe;
    }
  };

  const categories = [
    'technology', 'business', 'entertainment', 'health', 
    'science', 'sports', 'politics', 'world', 'lifestyle', 'other'
  ];

  const sourceTypes = [
    { value: 'rss', label: 'RSS Feed', icon: Rss },
    { value: 'podcast', label: 'Podcast', icon: Radio },
    { value: 'newsletter', label: 'Newsletter', icon: Mail },
    { value: 'api', label: 'API', icon: Globe },
  ];

  return (
    <>
      <Helmet>
        <title>Custom Sources - NewsHub</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Custom Sources</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Add your favorite news sources, podcasts, and newsletters
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Source</span>
          </button>
        </div>

        {/* Add Source Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Add New Source
              </h2>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                addSourceMutation.mutate(formData);
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent"
                      placeholder="e.g., TechCrunch"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {sourceTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, type: type.value as any })}
                          className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                            formData.type === type.value
                              ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                          }`}
                        >
                          <type.icon className="h-4 w-4" />
                          <span className="text-sm">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent"
                    placeholder="https://example.com/feed.xml"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent"
                    rows={2}
                    placeholder="Brief description of this source"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addSourceMutation.isLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    {addSourceMutation.isLoading ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    <span>Add Source</span>
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sources List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : sources && sources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sources.map((source) => {
              const Icon = getSourceIcon(source.type);
              return (
                <motion.div
                  key={source._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {source.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {source.type} • {source.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {source.isActive ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>

                  {source.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      {source.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center space-x-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>View Source</span>
                    </a>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => testSource(source._id)}
                        disabled={testingSource === source._id}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        {testingSource === source._id ? (
                          <Loader className="h-4 w-4 animate-spin text-gray-600 dark:text-gray-400" />
                        ) : (
                          <RefreshCw className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this source?')) {
                            deleteSourceMutation.mutate(source._id);
                          }
                        }}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>

                  {source.lastError && (
                    <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Error: {source.lastError.message}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No custom sources added yet
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              Add Your First Source
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default SourcesPage;