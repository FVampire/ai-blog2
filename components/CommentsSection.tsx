'use client';

import React, { useState, useEffect } from 'react';

import { v4 as uuidv4 } from 'uuid';

interface Comment {
  id: number;
  visitor_id: string;
  content: string;
  city?: string;
  created_at: string;
  status?: string;
}

interface CommentsProps {
  postId: string | number;
}

const CommentsSection: React.FC<CommentsProps> = ({ postId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [visitorId, setVisitorId] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 初始化或获取访客ID
  useEffect(() => {
    let id = localStorage.getItem('visitorId');
    if (!id) {
      id = uuidv4();
      localStorage.setItem('visitorId', id);
    }
    setVisitorId(id);
  }, []);

  // 加载评论
  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts/${postId}/comments`);
      const data = await response.json();
      if (data.success) {
        setComments(data.data);
      }
    } catch (error) {
      console.error('Load comments error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setMessage({ type: 'error', text: '请输入评论内容' });
      return;
    }

    if (content.length > 1000) {
      setMessage({ type: 'error', text: '评论内容不能超过1000个字符' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visitorId,
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        const created = data.data as Partial<Comment> | undefined;
        const isPending = data.needsReview === true || created?.status === 'pending';

        const newComment: Comment = {
          id: created?.id ?? Date.now(),
          visitor_id: created?.visitor_id ?? visitorId,
          content: created?.content ?? content.trim(),
          city: created?.city || undefined,
          created_at: created?.created_at ?? new Date().toISOString(),
          status: isPending ? 'pending' : 'approved',
        };

        setComments((previous) => [newComment, ...previous]);
        setContent('');

        setMessage({
          type: 'success',
          text: isPending ? '评论提交成功，审核通过后公开显示' : '评论发表成功！',
        });
      } else {
        setMessage({ type: 'error', text: data.message || '提交失败' });
      }
    } catch (error) {
      console.error('Submit comment error:', error);
      setMessage({ type: 'error', text: '提交失败，请稍后重试' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateVisitorId = (id: string) => {
    return `访客 ${id.substring(0, 8)}...`;
  };

  return (
    <div className="comments-section">
      <h2 className="comments-title">评论 ({comments.length})</h2>

      {/* 评论表单 */}
      <form onSubmit={handleSubmit} className="comment-form">
        <div className="form-group">
          <label htmlFor="comment-content">发表评论</label>
          <textarea
            id="comment-content"
            name="comment-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="说点什么..."
            rows={4}
            maxLength={1000}
            disabled={submitting}
            className="comment-textarea"
          />
          <div className="comment-form-footer">
            <small className="text-muted">
              {content.length}/1000 字符
            </small>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="btn-comment-submit"
            >
              {submitting ? '提交中...' : '提交评论'}
            </button>
          </div>
        </div>
      </form>

      {/* 提示消息 */}
      {message && (
        <div className={`comment-message comment-message-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* 评论列表 */}
      <div className="comments-list">
        {loading ? (
          <div className="comments-loading">加载评论中...</div>
        ) : comments.length === 0 ? (
          <div className="comments-empty">暂无评论，快来发表第一条评论吧！</div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`comment-item ${comment.status === 'pending' ? 'comment-item-pending' : ''}`}
            >
              <div className="comment-header">
                <span className="comment-author">
                  {truncateVisitorId(comment.visitor_id)}
                </span>
                {comment.city && <span className="comment-city">{comment.city}</span>}
                <span className="comment-date">
                  {formatDateTime(comment.created_at)}
                </span>
              </div>
              <div className="comment-content">
                {comment.content}
              </div>
              {comment.status === 'pending' && (
                <div className="comment-pending-badge">审核后公开</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentsSection;
