import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Heart, MessageCircle, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CommunityPost } from '@/hooks/useCommunityPosts';

const CATEGORIES = [
  { id: 'general', label: 'Allmänt', emoji: '💬' },
  { id: 'recovery', label: 'Återhämtning', emoji: '☀️' },
  { id: 'low', label: 'Tunga dagar', emoji: '🌊' },
  { id: 'tips', label: 'Tips', emoji: '💡' },
  { id: 'medication', label: 'Läkemedel', emoji: '💊' },
  { id: 'side-effects', label: 'Biverkningar', emoji: '⚠️' },
  { id: 'family', label: 'Anhöriga', emoji: '👨‍👩‍👧' },
  { id: 'work', label: 'Jobb & studier', emoji: '💼' },
  { id: 'sleep', label: 'Sömn', emoji: '😴' },
  { id: 'exercise', label: 'Träning', emoji: '🏃' },
  { id: 'therapy', label: 'Terapi', emoji: '🧠' },
  { id: 'selfcare', label: 'Egenvård', emoji: '🧘' },
];

interface ThreadListItemProps {
  post: CommunityPost;
}

export const ThreadListItem = ({ post }: ThreadListItemProps) => {
  const navigate = useNavigate();
  const cat = CATEGORIES.find(c => c.id === post.category);
  const replyCount = post.replies.length;
  const hasPoll = post.poll_options.length > 0;
  const title = post.title || post.content.slice(0, 60) + (post.content.length > 60 ? '…' : '');

  return (
    <button
      onClick={() => navigate(`/forum/${post.id}`)}
      className="w-full text-left rounded-2xl bg-card/60 border border-border/40 p-5 hover:bg-card/80 transition-all active:scale-[0.99]"
    >
      {/* Author info */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center text-[11px] font-bold text-primary">
          {post.author_name?.charAt(0) || '?'}
        </div>
        <span className="text-sm font-semibold text-foreground/90">{post.author_name}</span>
        {post.is_anonymous && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-muted-foreground/50">anonym</span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-foreground/90 leading-snug mb-1.5">
        {title}
      </h3>

      {/* Preview of content (only if there's a real title) */}
      {post.title && (
        <p className="text-sm text-foreground/50 leading-relaxed line-clamp-3 mb-3">
          {post.content}
        </p>
      )}

      {/* Image thumbnail */}
      {post.image_url && (
        <div className="mb-3 rounded-lg overflow-hidden max-h-40">
          <img src={post.image_url} alt="" className="w-full h-full object-cover max-h-40" loading="lazy" />
        </div>
      )}

      {/* Footer: category + time + stats */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20">
        <div className="flex items-center gap-2">
          {cat && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/[0.06] text-muted-foreground/60">
              {cat.emoji} {cat.label}
            </span>
          )}
          <span className="text-xs text-muted-foreground/50">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: sv })}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {hasPoll && (
            <span className="flex items-center gap-1.5 text-sm text-primary/60">
              <BarChart3 className="h-4 w-4" strokeWidth={1.8} />
            </span>
          )}
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground/50">
            <Heart className="h-4.5 w-4.5" fill={post.user_has_reacted ? 'currentColor' : 'none'} strokeWidth={1.8}
                   style={{ color: post.user_has_reacted ? 'rgb(239 68 68)' : undefined }} />
            {post.reaction_count}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground/50">
            <MessageCircle className="h-4.5 w-4.5" strokeWidth={1.8} />
            {replyCount}
          </span>
        </div>
      </div>
    </button>
  );
};
