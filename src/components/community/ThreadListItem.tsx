import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Heart, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CommunityPost } from '@/hooks/useCommunityPosts';

const CATEGORIES = [
  { id: 'general', label: 'Allmänt', emoji: '💬' },
  { id: 'recovery', label: 'Återhämtning', emoji: '☀️' },
  { id: 'low', label: 'Tunga dagar', emoji: '🌊' },
  { id: 'tips', label: 'Tips', emoji: '💡' },
];

interface ThreadListItemProps {
  post: CommunityPost;
}

export const ThreadListItem = ({ post }: ThreadListItemProps) => {
  const navigate = useNavigate();
  const cat = CATEGORIES.find(c => c.id === post.category);
  const replyCount = post.replies.length;
  const title = post.title || post.content.slice(0, 60) + (post.content.length > 60 ? '…' : '');

  return (
    <button
      onClick={() => navigate(`/forum/${post.id}`)}
      className="w-full text-left rounded-2xl bg-card/60 border border-border/40 p-4 hover:bg-card/80 transition-all active:scale-[0.99]"
    >
      {/* Category + time */}
      <div className="flex items-center gap-2 mb-1.5">
        {cat && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-muted-foreground/50">
            {cat.emoji} {cat.label}
          </span>
        )}
        <span className="text-[11px] text-muted-foreground/40">
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: sv })}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-[15px] font-semibold text-foreground/90 leading-snug mb-1">
        {title}
      </h3>

      {/* Preview of content (only if there's a real title) */}
      {post.title && (
        <p className="text-[13px] text-foreground/50 leading-relaxed line-clamp-2 mb-2">
          {post.content}
        </p>
      )}

      {/* Footer: author + stats */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
            {post.author_name?.charAt(0) || '?'}
          </div>
          <span className="text-[12px] text-muted-foreground/60">{post.author_name}</span>
          {post.is_anonymous && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.04] text-muted-foreground/40">anonym</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[12px] text-muted-foreground/40">
            <Heart className="h-3.5 w-3.5" fill={post.user_has_reacted ? 'currentColor' : 'none'} strokeWidth={1.8}
                   style={{ color: post.user_has_reacted ? 'rgb(239 68 68)' : undefined }} />
            {post.reaction_count}
          </span>
          <span className="flex items-center gap-1 text-[12px] text-muted-foreground/40">
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
            {replyCount}
          </span>
        </div>
      </div>
    </button>
  );
};
