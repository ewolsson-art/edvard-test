import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const ANIMAL_NAMES = [
  '🐢 Sköldpadda', '🦊 Räv', '🐻 Björn', '🦉 Uggla', '🐬 Delfin',
  '🦋 Fjäril', '🐝 Bi', '🦌 Hjort', '🐧 Pingvin', '🦜 Papegoja',
  '🐨 Koala', '🦦 Utter', '🐼 Panda', '🦩 Flamingo', '🐺 Varg',
  '🦈 Haj', '🐙 Bläckfisk', '🦅 Örn', '🐿️ Ekorre', '🦎 Ödla',
];

function getAnonymousName(userId: string, postId?: string): string {
  const seed = userId + (postId || '');
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return ANIMAL_NAMES[Math.abs(hash) % ANIMAL_NAMES.length];
}

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  category: string;
  is_anonymous: boolean;
  anonymous_name: string | null;
  created_at: string;
  updated_at: string;
  author_name?: string;
  reaction_count: number;
  user_has_reacted: boolean;
}

export function useCommunityPosts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: postsData, error } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      setLoading(false);
      return;
    }

    // Fetch reactions counts
    const { data: reactions } = await supabase
      .from('community_reactions')
      .select('post_id, user_id');

    // Fetch profile names for non-anonymous posts
    const nonAnonUserIds = [...new Set(
      (postsData || []).filter(p => !p.is_anonymous).map(p => p.user_id)
    )];

    let profileMap: Record<string, string> = {};
    if (nonAnonUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name')
        .in('user_id', nonAnonUserIds);
      
      (profiles || []).forEach(p => {
        if (p.first_name) profileMap[p.user_id] = p.first_name;
      });
    }

    const enrichedPosts: CommunityPost[] = (postsData || []).map(post => {
      const postReactions = (reactions || []).filter(r => r.post_id === post.id);
      return {
        ...post,
        author_name: post.is_anonymous 
          ? (post.anonymous_name || getAnonymousName(post.user_id))
          : (profileMap[post.user_id] || 'Användare'),
        reaction_count: postReactions.length,
        user_has_reacted: postReactions.some(r => r.user_id === user.id),
      };
    });

    setPosts(enrichedPosts);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const createPost = async (content: string, category: string, isAnonymous: boolean) => {
    if (!user) return false;

    const anonymousName = isAnonymous ? getAnonymousName(user.id) : null;

    const { error } = await supabase.from('community_posts').insert({
      user_id: user.id,
      content: content.trim(),
      category,
      is_anonymous: isAnonymous,
      anonymous_name: anonymousName,
    });

    if (error) {
      toast({ title: 'Kunde inte skapa inlägg', variant: 'destructive' });
      return false;
    }

    await fetchPosts();
    return true;
  };

  const toggleReaction = async (postId: string) => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.user_has_reacted) {
      await supabase
        .from('community_reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
    } else {
      await supabase.from('community_reactions').insert({
        post_id: postId,
        user_id: user.id,
      });
    }

    await fetchPosts();
  };

  const deletePost = async (postId: string) => {
    const { error } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      toast({ title: 'Kunde inte ta bort inlägg', variant: 'destructive' });
      return;
    }

    await fetchPosts();
  };

  return { posts, loading, createPost, toggleReaction, deletePost };
}
