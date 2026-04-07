import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Heart, Trash2, MessageCircle, Send, EyeOff, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { CommunityPost } from '@/hooks/useCommunityPosts';

const CATEGORIES = [
  { id: 'general', label: 'Allmänt', emoji: '💬' },
  { id: 'recovery', label: 'Återhämtning', emoji: '☀️' },
  { id: 'low', label: 'Tunga dagar', emoji: '🌊' },
  { id: 'tips', label: 'Tips', emoji: '💡' },
];

interface PostCardProps {
  post: CommunityPost;
  userId?: string;
  onToggleReaction: (postId: string) => void;
  onDeletePost: (postId: string) => void;
  onCreateReply: (postId: string, content: string, isAnonymous: boolean) => Promise<boolean>;
  onDeleteReply: (replyId: string) => void;
}

export const PostCard = ({ post, userId, onToggleReaction, onDeletePost, onCreateReply, onDeleteReply }: PostCardProps) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyAnonymous, setReplyAnonymous] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const cat = CATEGORIES.find(c => c.id === post.category);
  const isOwn = post.user_id === userId;
  const replyCount = post.replies.length;

  const handleReply = async () => {
    if (!replyContent.trim() || isReplying) return;
    setIsReplying(true);
    const success = await onCreateReply(post.id, replyContent, replyAnonymous);
    if (success) {
      setReplyContent('');
      setShowReplyForm(false);
      setShowReplies(true);
    }
    setIsReplying(false);
  };

  return (
    <div className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/20 overflow-hidden transition-all hover:border-border/40">
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground/90">{post.author_name}</span>
            {post.is_anonymous && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-muted-foreground/60">anonym</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {cat && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-muted-foreground/50">
                {cat.emoji} {cat.label}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground/40">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: sv })}
            </span>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{post.content}</p>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          {userId ? (
            <button
              onClick={() => onToggleReaction(post.id)}
              className={`flex items-center gap-1.5 text-xs transition-all ${
                post.user_has_reacted ? 'text-red-400' : 'text-muted-foreground/50 hover:text-red-400/70'
              }`}
            >
              <Heart className="h-4 w-4" fill={post.user_has_reacted ? 'currentColor' : 'none'} />
              {post.reaction_count > 0 && <span>{post.reaction_count}</span>}
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/40">
              <Heart className="h-4 w-4" />
              {post.reaction_count > 0 && <span>{post.reaction_count}</span>}
            </div>
          )}

          <button
            onClick={() => {
              if (replyCount > 0) setShowReplies(!showReplies);
              if (userId) setShowReplyForm(!showReplyForm);
            }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-foreground/70 transition-all"
          >
            <MessageCircle className="h-4 w-4" />
            {replyCount > 0 && <span>{replyCount}</span>}
          </button>

          {isOwn && (
            <button
              onClick={() => onDeletePost(post.id)}
              className="text-muted-foreground/30 hover:text-destructive transition-colors ml-auto"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Replies */}
      {replyCount > 0 && (
        <button
          onClick={() => setShowReplies(!showReplies)}
          className="w-full flex items-center gap-1.5 px-4 py-2 text-xs text-muted-foreground/50 hover:text-muted-foreground/70 border-t border-border/10 transition-colors"
        >
          {showReplies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {replyCount} {replyCount === 1 ? 'svar' : 'svar'}
        </button>
      )}

      {showReplies && replyCount > 0 && (
        <div className="border-t border-border/10">
          {post.replies.map(reply => (
            <div key={reply.id} className="px-4 py-3 border-b border-border/5 last:border-b-0 ml-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground/80">{reply.author_name}</span>
                  {reply.is_anonymous && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-white/[0.04] text-muted-foreground/50">anonym</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground/40">
                    {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: sv })}
                  </span>
                  {reply.user_id === userId && (
                    <button
                      onClick={() => onDeleteReply(reply.id)}
                      className="text-muted-foreground/30 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-foreground/70 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reply form */}
      {showReplyForm && userId && (
        <div className="border-t border-border/10 p-3 space-y-2">
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Skriv ett svar..."
            className="min-h-[50px] bg-transparent border-0 resize-none focus-visible:ring-0 text-[13px] placeholder:text-muted-foreground/40 p-0"
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {replyAnonymous ? <EyeOff className="h-3 w-3 text-muted-foreground/60" /> : <Eye className="h-3 w-3 text-muted-foreground/60" />}
              <span className="text-[10px] text-muted-foreground/60">{replyAnonymous ? 'Anonymt' : 'Med namn'}</span>
              <Switch checked={!replyAnonymous} onCheckedChange={(c) => setReplyAnonymous(!c)} className="scale-[0.6]" />
            </div>
            <Button size="sm" onClick={handleReply} disabled={!replyContent.trim() || isReplying} className="rounded-full gap-1.5 px-3 h-7 text-[11px]">
              <Send className="h-3 w-3" />
              Svara
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
