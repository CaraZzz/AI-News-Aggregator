import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Globe, 
  Rss, 
  Headphones, 
  Mail, 
  Trash2, 
  Edit, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { CustomSource } from '../types';
import toast from 'react-hot-toast';

const CustomSources: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<CustomSource | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    type: 'rss' as 'rss' | 'website' | 'podcast' | 'newsletter',
    category: 'general',
  });

  const queryClient = useQueryClient();

  const { data: sources, isLoading, error } = useQuery(
    'custom-sources',
    async () => {
      const response = await axios.get('/api/custom-sources');
      return response.data.sources;
    }
  );

  const addSourceMutation = useMutation(
    async (data: any) => {
      const response = await axios.post('/api/custom-sources', data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('custom-sources');
        toast.success('Custom source added successfully!');
        setIsAddModalOpen(false);
        resetForm();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to add source');
      },
    }
  );

  const updateSourceMutation = useMutation(
    async ({ id, data }: { id: string; data: any }) => {
      const response = await axios.put(`/api/custom-sources/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('custom-sources');
        toast.success('Source updated successfully!');
        setEditingSource(null);
        resetForm();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update source');
      },
    }
  );

  const deleteSourceMutation = useMutation(
    async (id: string) => {
      await axios.delete(`/api/custom-sources/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('custom-sources');
        toast.success('Source deleted successfully!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to delete source');
      },
    }
  );

  const fetchContentMutation = useMutation(
    async (id: string) => {
      const response = await axios.get(`/api/custom-sources/${id}/fetch`);
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success(`Fetched ${data.articles.length} articles from ${data.source}`);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to fetch content');
      },
    }
  );

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      type: 'rss',
      category: 'general',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSource) {
      updateSourceMutation.mutate({ id: editingSource.id, data: formData });
    } else {
      addSourceMutation.mutate(formData);
    }
  };

  const handleEdit = (source: CustomSource) => {
    setEditingSource(source);
    setFormData({
      name: source.name,
      url: source.url,
      type: source.type,
      category: source.category,
    });
    setIsAddModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this source?')) {
      deleteSourceMutation.mutate(id);
    }
  };

  const handleFetchContent = (id: string) => {
    fetchContentMutation.mutate(id);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'rss':
        return <Rss className="w-4 h-4" />;
      case 'website':
        return <Globe className="w-4 h-4" />;
      case 'podcast':
        return <Headphones className="w-4 h-4" />;
      case 'newsletter':
        return <Mail className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'inactive':
        return <Clock className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const SourceCard: React.FC<{ source: CustomSource }> = ({ source }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-hover p-6"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className="flex items-center space-x-2">
              {getTypeIcon(source.type)}
              <span className="text-sm font-medium text-gray-500 uppercase">{source.type}</span>
            </div>
            {getStatusIcon(source.status)}
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{source.name}</h3>
          <p className="text-gray-600 text-sm mb-3 break-all">{source.url}</p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="category-badge category-general">{source.category}</span>
            <span>Last checked: {new Date(source.lastChecked).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => handleFetchContent(source.id)}
            disabled={fetchContentMutation.isLoading}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
            title="Fetch content"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEdit(source)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
            title="Edit source"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(source.id)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors"
            title="Delete source"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  const AddEditModal: React.FC = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 w-full max-w-md"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {editingSource ? 'Edit Source' : 'Add Custom Source'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="Source name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="input-field"
              placeholder="https://example.com/feed"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="input-field"
            >
              <option value="rss">RSS Feed</option>
              <option value="website">Website</option>
              <option value="podcast">Podcast</option>
              <option value="newsletter">Newsletter</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input-field"
            >
              <option value="general">General</option>
              <option value="technology">Technology</option>
              <option value="business">Business</option>
              <option value="science">Science</option>
              <option value="sports">Sports</option>
              <option value="entertainment">Entertainment</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={addSourceMutation.isLoading || updateSourceMutation.isLoading}
              className="btn-primary flex-1"
            >
              {editingSource ? 'Update' : 'Add'} Source
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingSource(null);
                resetForm();
              }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading custom sources...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Sources</h2>
          <p className="text-gray-600">Failed to load custom sources</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Custom Sources</h1>
          <p className="text-gray-600">
            Add your own news sources, RSS feeds, podcasts, and newsletters
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Source</span>
        </button>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources?.map((source: CustomSource) => (
          <SourceCard key={source.id} source={source} />
        ))}
      </div>

      {/* Empty State */}
      {sources?.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No custom sources yet</h3>
          <p className="text-gray-600 mb-6">
            Add your first custom source to start personalizing your news feed.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary"
          >
            Add Your First Source
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isAddModalOpen && <AddEditModal />}
    </div>
  );
};

export default CustomSources;