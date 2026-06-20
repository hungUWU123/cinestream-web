'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsAPI } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { MessageSquare, Heart, Trash2, Send, CornerDownRight, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { getAvatarUrl, type Comment } from '@/types';

interface CommentSectionProps {
  movieId: string;
}

export default function CommentSection({ movieId }: CommentSectionProps) {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Fetch comments
  const { data = { data: [] }, isLoading } = useQuery<{ data: Comment[] }>({
    queryKey: ['comments', movieId],
    queryFn: () => commentsAPI.getByMovie(movieId),
  });

  const comments = data.data;

  // Create comment mutation
  const createMutation = useMutation({
    mutationFn: commentsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', movieId] });
      setCommentText('');
      setReplyText('');
      setReplyingTo(null);
      toast.success('Đã gửi bình luận');
    },
    onError: () => {
      toast.error('Gửi bình luận thất bại');
    },
  });

  // Like comment mutation
  const likeMutation = useMutation({
    mutationFn: commentsAPI.like,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', movieId] });
    },
  });

  // Delete comment mutation
  const deleteMutation = useMutation({
    mutationFn: commentsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', movieId] });
      toast.success('Đã xóa bình luận');
    },
    onError: () => {
      toast.error('Xóa bình luận thất bại');
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    createMutation.mutate({ movieId, content: commentText.trim() });
  };

  const handleSubmitReply = (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    createMutation.mutate({ movieId, content: replyText.trim(), parentId });
  };

  const handleLike = (commentId: string) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thích bình luận');
      return;
    }
    likeMutation.mutate(commentId);
  };

  const handleDelete = (commentId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      deleteMutation.mutate(commentId);
    }
  };

  // Report comment mutation
  const reportMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => commentsAPI.report(id, reason),
    onSuccess: () => {
      toast.success('Báo cáo của bạn đã được gửi tới ban quản trị để kiểm duyệt.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Báo cáo thất bại');
    },
  });

  const handleReport = (commentId: string) => {
    const reason = prompt('Nhập lý do báo cáo bình luận này (Spam, quấy rối, ngôn từ kích động, v.v.):');
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error('Lý do báo cáo không được để trống');
      return;
    }
    reportMutation.mutate({ id: commentId, reason: reason.trim() });
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
      addSuffix: true,
      locale: vi,
    });

    const isAuthor = user?.id === comment.userId;
    const isAdmin = user?.role === 'ADMIN';
    const isCommentAuthorAdmin = comment.user.role === 'ADMIN';

    return (
      <div key={comment.id} className={`flex gap-3 p-4 rounded-xl bg-white/5 border border-white/5 ${isReply ? 'ml-8 mt-2' : 'mt-4'}`}>
        {/* Avatar */}
        {comment.user.avatar ? (
          <img
            src={getAvatarUrl(comment.user.avatar)}
            alt={comment.user.displayName || comment.user.username}
            className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {comment.user.displayName?.[0] || comment.user.username[0]}
          </div>
        )}

        {/* Content */}
        <div className="flex-grow space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {comment.user.displayName || comment.user.username}
              </span>
              {comment.user.role === 'ADMIN' && (
                <span className="badge badge-red text-[9px] px-1 py-0 scale-90">Admin</span>
              )}
              <span className="text-xs text-gray-500">{timeAgo}</span>
            </div>
            {(isAuthor || isAdmin) && (
              <button
                onClick={() => handleDelete(comment.id)}
                className="text-gray-500 hover:text-red-500 transition-colors p-1"
                title="Xóa bình luận"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <p className="text-sm text-gray-300 leading-relaxed pr-2">{comment.content}</p>

          {/* Action Bar */}
          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={() => handleLike(comment.id)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              <Heart className={`w-3.5 h-3.5 ${comment._count?.likes ? 'fill-red-500 text-red-500' : ''}`} />
              <span>{comment._count?.likes || 0}</span>
            </button>

            {!isReply && isAuthenticated && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Trả lời</span>
              </button>
            )}

            {isAuthenticated && !isAuthor && !isCommentAuthorAdmin && (
              <button
                onClick={() => handleReport(comment.id)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-yellow-500 hover:font-semibold transition-all ml-auto"
                title="Báo cáo bình luận vi phạm"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Báo cáo</span>
              </button>
            )}
          </div>

          {/* Reply Form */}
          {replyingTo === comment.id && (
            <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="flex gap-2 mt-3">
              <input
                type="text"
                placeholder="Viết câu trả lời..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="input-dark text-xs py-1.5 flex-grow"
                style={{ borderRadius: 'var(--radius-sm)' }}
                autoFocus
              />
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="btn btn-primary p-2 rounded-lg"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* Render Replies */}
          {comment.replies && comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-red-500" />
        Bình Luận ({comments.length})
      </h3>

      {/* Main Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="flex gap-3">
          {user?.avatar ? (
            <img
              src={getAvatarUrl(user.avatar)}
              alt={user.displayName || user.username}
              className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.displayName?.[0] || user?.username[0]}
            </div>
          )}
          <div className="flex-grow flex gap-2">
            <input
              type="text"
              placeholder="Chia sẻ suy nghĩ của bạn về phim..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="input-dark py-2 flex-grow"
              style={{ borderRadius: 'var(--radius-md)' }}
            />
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn btn-primary px-4 rounded-xl flex items-center gap-2 font-bold"
            >
              <Send className="w-4 h-4" />
              Gửi
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center p-6 bg-white/5 border border-white/5 rounded-2xl">
          <p className="text-gray-400 text-sm mb-3">Vui lòng đăng nhập để gửi bình luận</p>
          <a href="/login" className="btn btn-primary text-xs py-2 px-4 rounded-lg font-bold">
            Đăng Nhập Ngay
          </a>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="skeleton h-20 rounded-xl" />
          <div className="skeleton h-20 rounded-xl" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-6">Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nghĩ!</p>
      ) : (
        <div className="space-y-2">
          {comments.filter(c => !c.parentId).map(c => renderComment(c))}
        </div>
      )}
    </div>
  );
}
