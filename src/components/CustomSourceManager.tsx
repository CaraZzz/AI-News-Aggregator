'use client';

import { useState } from 'react';
import { CustomSource } from '@/types';
import { X, Plus, Trash2, Globe, Rss, Mic, Mail, Save } from 'lucide-react';

interface CustomSourceManagerProps {
  customSources: CustomSource[];
  onSave: (sources: CustomSource[]) => void;
  onClose: () => void;
}

export default function CustomSourceManager({ customSources, onSave, onClose }: CustomSourceManagerProps) {
  const [sources, setSources] = useState<CustomSource[]>(customSources);
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [newSource, setNewSource] = useState({
    name: '',
    url: '',
    type: 'rss' as 'rss' | 'api' | 'podcast' | 'newsletter',
    apiKey: '',
    headers: {} as Record<string, string>
  });

  const sourceTypeIcons = {
    rss: Rss,
    api: Globe,
    podcast: Mic,
    newsletter: Mail
  };

  const sourceTypeLabels = {
    rss: 'RSS Feed',
    api: 'API Endpoint',
    podcast: 'Podcast Feed',
    newsletter: 'Newsletter'
  };

  const addSource = () => {
    if (!newSource.name.trim() || !newSource.url.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const source: CustomSource = {
      id: Date.now().toString(),
      name: newSource.name.trim(),
      url: newSource.url.trim(),
      type: newSource.type,
      apiKey: newSource.apiKey || undefined,
      headers: Object.keys(newSource.headers).length > 0 ? newSource.headers : undefined,
      isActive: true,
      createdAt: new Date()
    };

    setSources([...sources, source]);
    setNewSource({
      name: '',
      url: '',
      type: 'rss',
      apiKey: '',
      headers: {}
    });
    setIsAddingSource(false);
  };

  const removeSource = (id: string) => {
    setSources(sources.filter(source => source.id !== id));
  };

  const toggleSourceActive = (id: string) => {
    setSources(sources.map(source => 
      source.id === id ? { ...source, isActive: !source.isActive } : source
    ));
  };

  const handleSave = () => {
    onSave(sources);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Manage Custom Sources</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Add New Source */}
          <div className="mb-6">
            {!isAddingSource ? (
              <button
                onClick={() => setIsAddingSource(true)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                <Plus className="h-5 w-5" />
                <span>Add Custom Source</span>
              </button>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-4">Add New Source</h3>
                
                <div className="space-y-4">
                  {/* Source Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Source Type
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(sourceTypeLabels).map(([type, label]) => {
                        const Icon = sourceTypeIcons[type as keyof typeof sourceTypeIcons];
                        return (
                          <button
                            key={type}
                            onClick={() => setNewSource({ ...newSource, type: type as any })}
                            className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                              newSource.type === type
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="text-sm">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Name and URL */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={newSource.name}
                        onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                        placeholder="e.g., My Custom RSS Feed"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL *
                      </label>
                      <input
                        type="url"
                        value={newSource.url}
                        onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                        placeholder={`e.g., https://example.com/${newSource.type === 'rss' ? 'feed.xml' : 'api/news'}`}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={addSource}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      Add Source
                    </button>
                    <button
                      onClick={() => setIsAddingSource(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Existing Sources */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">
              Your Custom Sources ({sources.length})
            </h3>
            
            {sources.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Rss className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No custom sources added yet.</p>
                <p className="text-sm">Add RSS feeds, APIs, podcasts, or newsletter sources to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sources.map((source) => {
                  const Icon = sourceTypeIcons[source.type];
                  return (
                    <div
                      key={source.id}
                      className={`flex items-center justify-between p-4 border rounded-lg ${
                        source.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-5 w-5 ${source.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                        <div>
                          <h4 className="font-medium text-gray-900">{source.name}</h4>
                          <p className="text-sm text-gray-600">{source.url}</p>
                          <p className="text-xs text-gray-500">
                            {sourceTypeLabels[source.type]} • Added {source.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleSourceActive(source.id)}
                          className={`px-3 py-1 text-sm rounded-full ${
                            source.isActive
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {source.isActive ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => removeSource(source.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}