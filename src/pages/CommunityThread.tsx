import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useCommunityPosts } from '@/hooks/useCommunityPosts';
import { useAuth } from '@/hooks/useAuth';
import { PostCard } from '@/components/community/PostCard';

const CommunityThread = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { posts, loading, toggleReaction, deletePost, createReply, deleteReply } = useCommunityPosts();

  const post = posts.find(p => p.id === threadId);

  return (
    <div className="min-h-screen">
      <div className="p-5 md:p-8 max-w-2xl md:mx-0 space-y-4 pb-24">
        {/* Back button */}
        <button
          onClick={() => navigate('/forum')}
          className="flex items-center gap-2 text-sm text-muted-foreground/70 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka till forumet
        </button>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !post ? (
          <div className="text-center py-16 space-y-3">
            <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">Tråden kunde inte hittas</p>
          </div>
        ) : (
          <PostCard
            post={post}
            userId={user?.id}
            onToggleReaction={toggleReaction}
            onDeletePost={(id) => { deletePost(id); navigate('/forum'); }}
            onCreateReply={createReply}
            onDeleteReply={deleteReply}
            expanded
          />
        )}
      </div>
    </div>
  );
};

export default CommunityThread;
