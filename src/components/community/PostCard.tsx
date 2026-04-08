import { useState, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Heart, Trash2, MessageCircle, Send, EyeOff, Eye, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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

interface PostCardProps {
  post: CommunityPost;
  userId?: string;
  onToggleReaction: (postId: string) => void;
  onDeletePost: (postId: string) => void;
  onCreateReply: (postId: string, content: string, isAnonymous: boolean) => Promise<boolean>;
  onDeleteReply: (replyId: string) => void;
  onVotePoll?: (postId: string, optionId: string) => void;
  expanded?: boolean;
}

export const PostCard = ({ post, userId, onToggleReaction, onDeletePost, onCreateReply, onDeleteReply, onVotePoll, expanded = false }: PostCardProps) => {
  const [showReplies, setShowReplies] = useState(expanded);

  const [replyContent, setReplyContent] = useState('');
  const [replyAnonymous, setReplyAnonymous] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [heartAnimation, setHeartAnimation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleLike = () => {
    if (!userId) return;
    if (!post.user_has_reacted) {
      setHeartAnimation(true);
      setTimeout(() => setHeartAnimation(false), 600);
    }
    onToggleReaction(post.id);
  };

  const handleDoubleClick = () => {
    if (!userId || post.user_has_reacted) return;
    setHeartAnimation(true);
    setTimeout(() => setHeartAnimation(false), 600);
    onToggleReaction(post.id);
  };

  const focusReplyInput = () => {
    if (!userId) return;
    setShowReplyForm(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="bg-card/40 backdrop-blur-sm border-b border-border/10 md:rounded-xl md:border md:border-border/20 overflow-hidden transition-all">
      {/* Header — Instagram style */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {post.author_name?.charAt(0) || '?'}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-foreground">{post.author_name}</span>
              {post.is_anonymous && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-muted-foreground/50">anonym</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground/40">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: sv })}
              </span>
              {cat && (
                <span className="text-[10px] text-muted-foreground/40">· {cat.emoji} {cat.label}</span>
              )}
            </div>
          </div>
        </div>
        {isOwn && (
          <button
            onClick={() => onDeletePost(post.id)}
            className="text-muted-foreground/30 hover:text-destructive transition-colors p-1"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Title */}
      {post.title && (
        <div className="px-4 pb-1">
          <h3 className="text-base font-bold text-foreground leading-snug">{post.title}</h3>
        </div>
      )}

      {/* Image */}
      {post.image_url && (
        <div className="px-4 pb-2">
          <img src={post.image_url} alt="Inläggsbild" className="w-full rounded-lg object-cover max-h-96" loading="lazy" />
        </div>
      )}

      {/* Content — double-tap to like */}
      <div className="relative px-4 pb-3 select-none" onDoubleClick={handleDoubleClick}>
        <p className="text-[15px] text-foreground/85 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        
        {/* Double-tap heart animation */}
        {heartAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart 
              className="h-20 w-20 text-red-500 animate-in zoom-in-50 fade-in duration-300" 
              fill="currentColor" 
              style={{ animationFillMode: 'forwards' }}
            />
          </div>
        )}
      </div>

      {/* Poll */}
      {post.poll_options.length > 0 && (
        <div className="px-4 pb-3 space-y-1.5">
          {(() => {
            const totalVotes = post.poll_options.reduce((s, o) => s + o.vote_count, 0);
            const hasVoted = !!post.user_voted_option_id;
            return post.poll_options.map(option => {
              const pct = totalVotes > 0 ? Math.round((option.vote_count / totalVotes) * 100) : 0;
              const isSelected = post.user_voted_option_id === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => userId && onVotePoll?.(post.id, option.id)}
                  disabled={!userId}
                  className={`w-full relative rounded-lg overflow-hidden text-left transition-all ${
                    isSelected ? 'border border-primary/40' : 'border border-border/30 hover:border-border/50'
                  } ${!userId ? 'cursor-default' : ''}`}
                >
                  {hasVoted && (
                    <div
                      className="absolute inset-0 bg-primary/10 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  )}
                  <div className="relative flex items-center justify-between px-3 py-2.5">
                    <span className={`text-[13px] ${isSelected ? 'font-semibold text-foreground' : 'text-foreground/80'}`}>
                      {option.option_text}
                    </span>
                    {hasVoted && (
                      <span className="text-[12px] text-muted-foreground/60 font-medium ml-2">{pct}%</span>
                    )}
                  </div>
                </button>
              );
            });
          })()}
          {post.poll_options.reduce((s, o) => s + o.vote_count, 0) > 0 && (
            <p className="text-[11px] text-muted-foreground/40 pt-0.5">
              {post.poll_options.reduce((s, o) => s + o.vote_count, 0)} röster
            </p>
          )}
        </div>
      )}

      {/* Action bar — Instagram layout */}
      <div className="flex items-center justify-between px-4 pb-1">
        <div className="flex items-center gap-4">
          {/* Like */}
          <button
            onClick={handleLike}
            disabled={!userId}
            className={`transition-all active:scale-125 ${
              post.user_has_reacted ? 'text-red-500' : 'text-foreground/70 hover:text-foreground/90'
            } ${!userId ? 'opacity-40 cursor-default' : ''}`}
          >
            <Heart className="h-6 w-6" fill={post.user_has_reacted ? 'currentColor' : 'none'} strokeWidth={1.8} />
          </button>

          {/* Comment */}
          <button
            onClick={focusReplyInput}
            className="text-foreground/70 hover:text-foreground/90 transition-all active:scale-110"
          >
            <MessageCircle className="h-6 w-6" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Like count */}
      {post.reaction_count > 0 && (
        <div className="px-4 pb-1">
          <span className="text-[13px] font-semibold text-foreground/90">
            {post.reaction_count} {post.reaction_count === 1 ? 'gilla-markering' : 'gilla-markeringar'}
          </span>
        </div>
      )}

      {/* View replies link */}
      {replyCount > 0 && (
        <button
          onClick={() => setShowReplies(!showReplies)}
          className="block px-4 pb-1 text-[13px] text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors"
        >
          {showReplies ? 'Dölj kommentarer' : `Visa alla ${replyCount} kommentarer`}
        </button>
      )}

      {/* Replies */}
      {showReplies && replyCount > 0 && (
        <div className="px-4 pb-2 space-y-2">
          {post.replies.map(reply => (
            <div key={reply.id} className="flex gap-2.5 group">
              <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] font-bold text-foreground/50 shrink-0 mt-0.5">
                {reply.author_name?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] leading-relaxed">
                  <span className="font-semibold text-foreground/90 mr-1.5">{reply.author_name}</span>
                  <span className="text-foreground/70">{reply.content}</span>
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[11px] text-muted-foreground/40">
                    {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: sv })}
                  </span>
                  {reply.is_anonymous && (
                    <span className="text-[9px] text-muted-foreground/40">anonym</span>
                  )}
                  {reply.user_id === userId && (
                    <button
                      onClick={() => onDeleteReply(reply.id)}
                      className="text-muted-foreground/0 group-hover:text-muted-foreground/40 hover:!text-destructive transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply input — Instagram-style inline */}
      {showReplyForm && userId ? (
        <div className="flex items-center gap-3 px-4 py-3 border-t border-border/10">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setReplyAnonymous(!replyAnonymous)}
              className="text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors"
              title={replyAnonymous ? 'Byt till med namn' : 'Byt till anonymt'}
            >
              {replyAnonymous ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                (e.target as HTMLInputElement).blur();
                handleReply();
              }
            }}
            placeholder={replyAnonymous ? 'Lägg till en kommentar anonymt...' : 'Lägg till en kommentar...'}
            className="flex-1 bg-transparent text-base md:text-[13px] text-foreground placeholder:text-muted-foreground/40 outline-none"
            maxLength={500}
          />
          {replyContent.trim() && (
            <button
              onClick={handleReply}
              disabled={isReplying}
              className="text-primary font-semibold text-[13px] hover:text-primary/80 transition-colors disabled:opacity-50"
            >
              Publicera
            </button>
          )}
        </div>
      ) : userId ? (
        <button
          onClick={focusReplyInput}
          className="w-full text-left px-4 py-3 border-t border-border/10 text-[13px] text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
        >
          Lägg till en kommentar...
        </button>
      ) : null}
    </div>
  );
};
