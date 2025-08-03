import React, { useState } from 'react';
import { NewsSource } from '../types';
import { Plus, Trash2, Globe, Rss, Podcast, Mail, X } from 'lucide-react';
import { Dialog } from '@headlessui/react';

interface SourceManagerProps {
  sources: NewsSource[];
  onAddSource: (source: Omit<NewsSource, 'id' | 'addedAt'>) => void;
  onRemoveSource: (id: string) => void;
  onToggleSource: (id: string) => void;
}

const sourceTypeIcons = {
  api: <Globe size={18} />,
  rss: <Rss size={18} />,
  podcast: <Podcast size={18} />,
  newsletter: <Mail size={18} />,
  custom: <Globe size={18} />
};

export const SourceManager: React.FC<SourceManagerProps> = ({
  sources,
  onAddSource,
  onRemoveSource,
  onToggleSource
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newSource, setNewSource] = useState<Partial<NewsSource>>({
    name: '',
    url: '',
    type: 'rss',
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSource.name && newSource.url && newSource.type) {
      onAddSource({
        name: newSource.name,
        url: newSource.url,
        type: newSource.type as NewsSource['type'],
        apiKey: newSource.apiKey,
        isActive: true
      });
      setNewSource({ name: '', url: '', type: 'rss', isActive: true });
      setIsOpen(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Custom News Sources</h2>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Add Source
        </button>
      </div>

      <div className="space-y-3">
        {sources.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No custom sources added yet. Click "Add Source" to get started.
          </p>
        ) : (
          sources.map((source) => (
            <div
              key={source.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="text-gray-600">
                  {sourceTypeIcons[source.type]}
                </div>
                <div>
                  <h3 className="font-medium">{source.name}</h3>
                  <p className="text-sm text-gray-500">{source.url}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={source.isActive}
                    onChange={() => onToggleSource(source.id)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <button
                  onClick={() => onRemoveSource(source.id)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold">
                Add News Source
              </Dialog.Title>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source Name
                </label>
                <input
                  type="text"
                  value={newSource.name || ''}
                  onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Tech News RSS"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source Type
                </label>
                <select
                  value={newSource.type}
                  onChange={(e) => setNewSource({ ...newSource, type: e.target.value as NewsSource['type'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="rss">RSS Feed</option>
                  <option value="api">API Endpoint</option>
                  <option value="podcast">Podcast</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="custom">Custom URL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={newSource.url || ''}
                  onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/feed"
                  required
                />
              </div>

              {newSource.type === 'api' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key (optional)
                  </label>
                  <input
                    type="text"
                    value={newSource.apiKey || ''}
                    onChange={(e) => setNewSource({ ...newSource, apiKey: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your API key"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Source
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};