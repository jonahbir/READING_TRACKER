import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, Announcement } from '../../api/api';

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input 
    {...props} 
    className={`w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/20 transition-all border border-white/10 ${props.className || ''}`} 
  />
);

const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea 
    {...props} 
    className={`w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/20 transition-all border border-white/10 min-h-[120px] ${props.className || ''}`} 
  />
);

const Button: React.FC<{
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'emerald';
  className?: string;
  'aria-label'?: string;
  'aria-expanded'?: boolean;
}> = ({ children, onClick, type = 'button', variant = 'primary', className = '', 'aria-label': ariaLabel, 'aria-expanded': ariaExpanded }) => {
  const baseClasses = "px-4 py-2 rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center justify-center space-x-2";
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    emerald: "bg-emerald-600 hover:bg-emerald-700 text-white"
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
    >
      {children}
    </motion.button>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <motion.div 
    className="rounded-xl p-6 bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <h2 className="text-white font-semibold text-xl mb-4 flex items-center">
      <span className="mr-2">📢</span>{title}
    </h2>
    {children}
  </motion.div>
);

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-600 text-white';
    case 'medium':
      return 'bg-yellow-600 text-white';
    case 'low':
      return 'bg-green-600 text-white';
    default:
      return 'bg-gray-600 text-white';
  }
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'high':
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    case 'medium':
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414l2 2a1 1 0 002.828 0l2-2a1 1 0 00-1.414-1.414L11 7.586 8.707 5.293z" clipRule="evenodd" />
        </svg>
      );
    case 'low':
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 002.828 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    default:
      return null;
  }
};

const truncateText = (text: string, maxLength: number = 120) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const formatShortDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Date not available';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Date not available';
  }
};

const AnnouncementItem: React.FC<{ announcement: Announcement; onEdit: (a: Announcement) => void; onDelete: (id: string) => void; editing: boolean; editingId: string | null; onSave: (a: Announcement) => void; onCancel: () => void; editingAnnouncement?: Announcement; expanded: boolean; onToggleExpand: (id: string) => void }> = ({ announcement, onEdit, onDelete, editing, editingId, onSave, onCancel, editingAnnouncement, expanded, onToggleExpand }) => (
  <motion.div
    className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-xl relative"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    {editing && editingId === announcement.id ? (
      <form onSubmit={(e) => { e.preventDefault(); onSave(editingAnnouncement!); }} className="space-y-4">
        <Input 
          placeholder="Title" 
          value={editingAnnouncement?.title || ''} 
          onChange={(e) => onSave({ ...editingAnnouncement!, title: e.target.value })} 
          aria-label="Announcement title"
        />
        <TextArea 
          placeholder="Content" 
          value={editingAnnouncement?.content || ''} 
          onChange={(e) => onSave({ ...editingAnnouncement!, content: e.target.value })} 
          aria-label="Announcement content"
        />
        <div className="flex items-center gap-4">
          <select 
            value={editingAnnouncement?.priority || 'low'} 
            onChange={(e) => onSave({ ...editingAnnouncement!, priority: e.target.value as any })} 
            className="px-4 py-2 rounded-lg bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Priority level"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <label className="flex items-center gap-2 text-white/80 text-sm">
            <input 
              type="checkbox" 
              checked={editingAnnouncement?.is_active || false} 
              onChange={(e) => onSave({ ...editingAnnouncement!, is_active: e.target.checked })} 
              className="rounded"
              aria-label="Active status"
            /> Active
          </label>
          <Button type="submit" variant="emerald" className="px-6" aria-label="Save changes">Save</Button>
          <Button type="button" onClick={onCancel} variant="secondary" className="px-6" aria-label="Cancel editing">Cancel</Button>
        </div>
      </form>
    ) : (
      <>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold text-lg">{announcement.title}</h3>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
            {getPriorityIcon(announcement.priority)}
            <span className="ml-1">{announcement.priority} {announcement.is_active ? '• Active' : '• Inactive'}</span>
          </span>
        </div>
        <p className={`text-gray-300 whitespace-pre-wrap mb-4 transition-all ${expanded ? '' : 'line-clamp-3'}`}>
          {expanded ? announcement.content : truncateText(announcement.content)}
        </p>
        {!expanded && (
          <Button variant="secondary" onClick={() => onToggleExpand(announcement.id)} className="mb-4" aria-label="Read more of the announcement">
            Read More
          </Button>
        )}
        {expanded && (
          <Button variant="secondary" onClick={() => onToggleExpand(announcement.id)} className="mb-4" aria-label="Read less of the announcement" aria-expanded={true}>
            Read Less
          </Button>
        )}
        <div className="text-gray-400 text-sm mb-4 flex items-center justify-between">
          <span>{formatShortDate(announcement.created_at)}</span>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs mr-2">
              {(announcement.author_name || 'A').charAt(0).toUpperCase()}
            </div>
            <span className="text-blue-200 text-xs font-medium">
              {announcement.author_name || 'Administrator'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="text-sm px-3 py-1" onClick={() => onEdit(announcement)} aria-label="Edit announcement">Edit</Button>
          <Button variant="danger" className="text-sm px-3 py-1" onClick={() => onDelete(announcement.id)} aria-label="Delete announcement">Delete</Button>
        </div>
      </>
    )}
  </motion.div>
);

const AdminAnnouncementsPage: React.FC = () => {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{ title: string; content: string; priority: 'low' | 'medium' | 'high' }>(
    { title: '', content: '', priority: 'low' }
  );
  const [editing, setEditing] = useState<Announcement | undefined>(undefined);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAnnouncements(100);
      const sorted = (res.announcements || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(sorted);
    } catch (e: any) {
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAnnouncement(form);
      setForm({ title: '', content: '', priority: 'low' });
      load();
    } catch (e: any) {
      alert(e.message || 'Failed to create');
    }
  };

  const onEdit = (announcement: Announcement) => {
    setEditing(announcement);
  };

  const onSave = (updated: Announcement) => {
    if (!editing) return;
    updateAnnouncement(editing.id, { 
      title: updated.title, 
      content: updated.content, 
      priority: updated.priority, 
      is_active: updated.is_active 
    }).then(() => {
      setEditing(undefined);
      load();
    }).catch((e: any) => {
      alert(e.message || 'Failed to update');
    });
  };

  const onCancel = () => {
    setEditing(undefined);
  };

  const onDelete = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await deleteAnnouncement(id);
      load();
    } catch (e: any) {
      alert(e.message || 'Failed to delete');
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-650 via-blue-900 to-black p-6 pt-10 relative overflow-hidden space-y-8">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '50px 50px' }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-white text-3xl font-bold mb-2">📢 Announcements</h1>
            <p className="text-white/70">Manage and broadcast important updates</p>
          </div>
          <Button variant="primary" onClick={load} className="mt-4 sm:mt-0" aria-label="Refresh announcements">
            Refresh
          </Button>
        </motion.div>

        {/* Create Section */}
        <Section title="Create New Announcement">
          <form onSubmit={onCreate} className="space-y-4">
            <Input 
              placeholder="Announcement Title" 
              value={form.title} 
              onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} 
              required 
              aria-label="Announcement title"
            />
            <TextArea 
              placeholder="Announcement Content" 
              value={form.content} 
              onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))} 
              required 
              aria-label="Announcement content"
            />
            <div className="flex items-center gap-4">
              <select 
                value={form.priority} 
                onChange={(e) => setForm((s) => ({ ...s, priority: e.target.value as any }))} 
                className="px-4 py-3 rounded-lg bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1"
                required
                aria-label="Priority level"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <Button type="submit" variant="primary" className="px-8" aria-label="Publish announcement">Publish</Button>
            </div>
          </form>
        </Section>

        {/* List Section */}
        <Section title={`All Announcements (${items.length})`}>
          {loading ? (
            <div className="text-white text-center py-12">Loading announcements...</div>
          ) : error ? (
            <div className="text-red-300 text-center py-12">{error}</div>
          ) : items.length === 0 ? (
            <div className="text-white/50 text-center py-12">
              <p className="text-2xl mb-4">📭 No announcements yet</p>
              <p>Create your first one above!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((a) => (
                <AnnouncementItem
                  key={a.id}
                  announcement={a}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  editing={!!editing}
                  editingId={editing?.id ?? null}
                  onSave={onSave}
                  onCancel={onCancel}
                  editingAnnouncement={editing}
                  expanded={expandedItems.has(a.id)}
                  onToggleExpand={toggleExpand}
                />
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
};

export default AdminAnnouncementsPage;