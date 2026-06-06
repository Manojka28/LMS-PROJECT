import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export default function DiscussionForum({ courseId, lectureId }) {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, resolved, unresolved
  const [activeThread, setActiveThread] = useState(null);
  
  // Create Thread Form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  
  // Edit State
  const [editingThread, setEditingThread] = useState(null);
  const [editingReply, setEditingReply] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  
  // View Thread State
  const [replies, setReplies] = useState([]);
  const [newReply, setNewReply] = useState('');

  useEffect(() => {
    if (courseId && lectureId) {
      fetchThreads();
    }
  }, [courseId, lectureId, search, filter]);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/discussion/threads?courseId=${courseId}&lectureId=${lectureId}&search=${search}&filter=${filter}`);
      if (res.success) {
        setThreads(res.threads);
      }
    } catch (error) {
      console.error('Failed to fetch threads', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (threadId) => {
    try {
      const res = await api.get(`/discussion/threads/${threadId}/replies`);
      if (res.success) {
        setReplies(res.replies);
      }
    } catch (error) {
      console.error('Failed to fetch replies', error);
    }
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      const res = await api.post('/discussion/threads', {
        courseId,
        lectureId,
        title: newTitle,
        content: newContent
      });
      if (res.success) {
        setThreads([res.thread, ...threads]);
        setShowCreateForm(false);
        setNewTitle('');
        setNewContent('');
      }
    } catch (error) {
      alert('Failed to post question');
    }
  };

  const handleDeleteThread = async (threadId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await api.delete(`/discussion/threads/${threadId}`);
      if (res.success) {
        setThreads(threads.filter(t => t._id !== threadId));
        if (activeThread && activeThread._id === threadId) {
          setActiveThread(null);
        }
      }
    } catch (error) {
      alert('Failed to delete question');
    }
  };

  const handleCreateReply = async (e) => {
    e.preventDefault();
    if (!newReply.trim()) return;

    try {
      const res = await api.post('/discussion/reply', {
        threadId: activeThread._id,
        content: newReply
      });
      if (res.success) {
        setReplies([...replies, res.reply]);
        setNewReply('');
        // Update thread reply count locally
        setThreads(threads.map(t => t._id === activeThread._id ? { ...t, replyCount: t.replyCount + 1 } : t));
      }
    } catch (error) {
      alert('Failed to post reply');
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;
    try {
      const res = await api.delete(`/discussion/replies/${replyId}`);
      if (res.success) {
        setReplies(replies.filter(r => r._id !== replyId));
        setThreads(threads.map(t => t._id === activeThread._id ? { ...t, replyCount: Math.max(0, t.replyCount - 1) } : t));
      }
    } catch (error) {
      alert('Failed to delete reply');
    }
  };

  const handleVoteThread = async (threadId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.post(`/discussion/${threadId}/upvote`);
      if (res.success) {
        setThreads(threads.map(t => t._id === threadId ? { ...t, votes: res.votes } : t));
        if (activeThread && activeThread._id === threadId) {
          setActiveThread({ ...activeThread, votes: res.votes });
        }
      }
    } catch (error) {
      console.error('Failed to vote');
    }
  };

  const handleVoteReply = async (replyId) => {
    try {
      const res = await api.put(`/discussion/replies/${replyId}/vote`);
      if (res.success) {
        setReplies(replies.map(r => r._id === replyId ? { ...r, helpfulVotes: res.helpfulVotes } : r));
      }
    } catch (error) {
      console.error('Failed to vote');
    }
  };

  const handleResolveThread = async (threadId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.patch(`/discussion/${threadId}/resolve`);
      if (res.success) {
        setThreads(threads.map(t => t._id === threadId ? { ...t, resolved: true } : t));
        if (activeThread && activeThread._id === threadId) {
          setActiveThread({ ...activeThread, resolved: true });
        }
      }
    } catch (error) {
      alert('Failed to mark resolved');
    }
  };

  const handlePinReply = async (replyId) => {
    try {
      const res = await api.put(`/discussion/replies/${replyId}/pin`);
      if (res.success) {
        setReplies(replies.map(r => {
          if (r._id === replyId) return { ...r, pinned: true };
          return { ...r, pinned: false };
        }).sort((a, b) => b.pinned - a.pinned || new Date(a.createdAt) - new Date(b.createdAt)));
      }
    } catch (error) {
      alert('Failed to pin reply');
    }
  };

  const handleEditThread = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/discussion/threads/${editingThread._id}`, {
        title: editTitle,
        content: editContent
      });
      if (res.success) {
        setThreads(threads.map(t => t._id === editingThread._id ? { ...t, title: editTitle, content: editContent } : t));
        if (activeThread && activeThread._id === editingThread._id) {
          setActiveThread({ ...activeThread, title: editTitle, content: editContent });
        }
        setEditingThread(null);
      }
    } catch (error) {
      alert('Failed to update question');
    }
  };

  const handleEditReply = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/discussion/replies/${editingReply._id}`, {
        content: editContent
      });
      if (res.success) {
        setReplies(replies.map(r => r._id === editingReply._id ? { ...r, content: editContent } : r));
        setEditingReply(null);
      }
    } catch (error) {
      alert('Failed to update reply');
    }
  };

  const openThread = (thread) => {
    setActiveThread(thread);
    fetchReplies(thread._id);
  };

  const closeThread = () => {
    setActiveThread(null);
    setReplies([]);
  };

  // ----------------------------------------------------
  // RENDER THREAD LIST
  // ----------------------------------------------------
  if (!activeThread) {
    return (
      <div className="discussion-forum" style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: 300 }}>
            <input 
              type="text" 
              placeholder="Search discussion..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, padding: '10px 15px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: '#fff' }}
            />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              style={{ padding: '10px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: '#fff' }}
            >
              <option value="all">All</option>
              <option value="resolved">Resolved</option>
              <option value="unresolved">Unresolved</option>
            </select>
          </div>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{ padding: '10px 20px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            {showCreateForm ? 'Cancel' : 'Ask a Question'}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateThread} style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px', border: '1px solid #333', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 15px 0' }}>Post a New Question</h4>
            <input 
              type="text" 
              placeholder="Question Title" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#222', border: '1px solid #444', borderRadius: '4px', color: '#fff' }}
            />
            <textarea 
              placeholder="Describe your problem or question in detail..." 
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              required
              rows={4}
              style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#222', border: '1px solid #444', borderRadius: '4px', color: '#fff', resize: 'vertical' }}
            />
            <button type="submit" style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
              Post Question
            </button>
          </form>
        )}

        <div className="threads-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {loading ? (
            <div style={{ color: '#888' }}>Loading discussions...</div>
          ) : threads.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', background: '#111', border: '1px dashed #333', borderRadius: '8px', color: '#666' }}>
              No discussions found. Be the first to ask a question!
            </div>
          ) : (
            threads.map(thread => (
              <div 
                key={thread._id} 
                style={{ background: '#111', border: '1px solid #222', borderRadius: '8px', padding: '15px', cursor: 'pointer', transition: 'border-color 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = '#444'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = '#222'}
                onClick={() => openThread(thread)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {thread.title}
                    {thread.resolved && <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>Resolved</span>}
                  </h4>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: '#888' }}>
                    <button 
                      onClick={(e) => handleVoteThread(thread._id, e)} 
                      style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                    >
                      <i className="ri-thumb-up-line" /> Upvote ({thread.votes})
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); openThread(thread); }}
                      style={{ background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                    >
                      <i className="ri-reply-line" /> Reply ({thread.replyCount || 0})
                    </button>
                  </div>
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#94a3b8', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {thread.content}
                </p>
                <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>By {thread.studentId?.name || 'Unknown User'} • {dayjs(thread.createdAt).fromNow()}</span>
                  {(user.role === 'instructor' || user.role === 'admin' || user._id === thread.studentId?._id) && !thread.resolved && (
                    <button 
                      onClick={(e) => handleResolveThread(thread._id, e)}
                      style={{ background: 'none', border: '1px solid #10b981', color: '#10b981', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                    >
                      <i className="ri-check-double-line"/> Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER ACTIVE THREAD VIEW
  // ----------------------------------------------------
  return (
    <div className="discussion-thread-view" style={{ marginTop: '30px', background: '#0a0a0a', borderRadius: '8px', border: '1px solid #222' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #222', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
          <button 
            onClick={() => handleVoteThread(activeThread._id)}
            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '20px' }}
          >
            <i className="ri-arrow-up-s-line" />
          </button>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{activeThread.votes}</span>
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {editingThread && editingThread._id === activeThread._id ? (
              <form onSubmit={handleEditThread} style={{ width: '100%' }}>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ width: '100%', padding: '8px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px', marginBottom: '10px' }} />
                <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={3} style={{ width: '100%', padding: '8px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px', marginBottom: '10px' }} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={{ padding: '6px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                  <button type="button" onClick={() => setEditingThread(null)} style={{ padding: '6px 12px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </form>
            ) : (
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {activeThread.title}
                  {activeThread.resolved && <span style={{ fontSize: '12px', padding: '2px 8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}><i className="ri-check-line"/> Resolved</span>}
                </h3>
                <p style={{ margin: '0 0 15px 0', fontSize: '15px', lineHeight: 1.6, color: '#ccc' }}>{activeThread.content}</p>
              </div>
            )}
            {!editingThread && <button onClick={closeThread} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '24px' }}><i className="ri-close-line"/></button>}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666', borderTop: '1px solid #222', paddingTop: '15px', marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px' }}>
                {activeThread.studentId?.name?.charAt(0) || 'U'}
              </div>
              <span>{activeThread.studentId?.name || 'Unknown User'} asked {dayjs(activeThread.createdAt).fromNow()}</span>
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              {(user.role === 'instructor' || user.role === 'admin' || user._id === activeThread.studentId?._id) && !activeThread.resolved && (
                <button onClick={() => handleResolveThread(activeThread._id)} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer' }}><i className="ri-check-double-line"/> Mark Resolved</button>
              )}
              {user._id === activeThread.studentId?._id && !activeThread.resolved && (
                <button onClick={() => { setEditingThread(activeThread); setEditTitle(activeThread.title); setEditContent(activeThread.content); }} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}><i className="ri-edit-line"/> Edit</button>
              )}
              {(user.role === 'admin' || user._id === activeThread.studentId?._id) && (
                <button onClick={() => handleDeleteThread(activeThread._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><i className="ri-delete-bin-line"/> Delete</button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px', background: '#111' }}>
        <h4 style={{ margin: '0 0 20px 0', color: '#888' }}>{replies.length} Replies</h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
          {replies.map(reply => (
            <div key={reply._id} style={{ display: 'flex', gap: '15px', background: reply.pinned ? 'rgba(139, 92, 246, 0.05)' : 'transparent', border: reply.pinned ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid #222', padding: '15px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', minWidth: '60px' }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: reply.helpfulVotes > 0 ? '#10b981' : '#888' }}>{reply.helpfulVotes}</span>
                <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Helpful</span>
              </div>
              
              <div style={{ flex: 1 }}>
                {reply.pinned && <div style={{ fontSize: '12px', color: '#8b5cf6', marginBottom: '8px', fontWeight: 600 }}><i className="ri-pushpin-fill"/> Pinned Answer</div>}
                
                {editingReply && editingReply._id === reply._id ? (
                  <form onSubmit={handleEditReply} style={{ width: '100%', marginBottom: '15px' }}>
                    <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={2} style={{ width: '100%', padding: '8px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px', marginBottom: '10px' }} />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="submit" style={{ padding: '4px 10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Save</button>
                      <button type="button" onClick={() => setEditingReply(null)} style={{ padding: '4px 10px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <p style={{ margin: '0 0 15px 0', fontSize: '14px', lineHeight: 1.6, color: '#ddd' }}>{reply.content}</p>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: reply.isInstructor ? '#8b5cf6' : '#444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px' }}>
                      {reply.userId?.name?.charAt(0) || 'U'}
                    </div>
                    <span>{reply.userId?.name || 'Unknown'} {reply.isInstructor && <span style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px' }}>Instructor</span>} • {dayjs(reply.createdAt).fromNow()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => handleVoteReply(reply._id)} 
                      style={{ background: 'none', border: '1px solid #10b981', color: '#10b981', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
                    >
                      <i className="ri-thumb-up-line"/> Mark Helpful
                    </button>
                    {(user.role === 'instructor' || user.role === 'admin') && !reply.pinned && (
                      <button onClick={() => handlePinReply(reply._id)} style={{ background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer' }}>Pin</button>
                    )}
                    {user._id === reply.userId?._id && !activeThread.resolved && (
                      <button onClick={() => { setEditingReply(reply); setEditContent(reply.content); }} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}>Edit</button>
                    )}
                    {(user.role === 'admin' || user._id === reply.userId?._id) && (
                      <button onClick={() => handleDeleteReply(reply._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Delete</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!activeThread.resolved && (
          <form onSubmit={handleCreateReply} style={{ background: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
            <textarea 
              placeholder="Write your reply..." 
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              required
              rows={3}
              style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#222', border: '1px solid #444', borderRadius: '4px', color: '#fff', resize: 'vertical' }}
            />
            <button type="submit" style={{ padding: '8px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
              Post Reply
            </button>
          </form>
        )}
        {activeThread.resolved && (
          <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(16, 185, 129, 0.05)', color: '#10b981', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <i className="ri-lock-line" style={{ marginRight: '8px' }}/> This thread has been resolved and is closed for new replies.
          </div>
        )}
      </div>
    </div>
  );
}
