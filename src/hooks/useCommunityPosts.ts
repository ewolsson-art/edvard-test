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

export interface CommunityReply {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  is_anonymous: boolean;
  anonymous_name: string | null;
  created_at: string;
  author_name: string;
}

export interface PollOption {
  id: string;
  option_text: string;
  sort_order: number;
  vote_count: number;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  category: string;
  is_anonymous: boolean;
  anonymous_name: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  author_name?: string;
  reaction_count: number;
  user_has_reacted: boolean;
  replies: CommunityReply[];
  poll_options: PollOption[];
  user_voted_option_id: string | null;
}

export function useCommunityPosts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
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

    // Fetch replies
    const { data: repliesData } = await supabase
      .from('community_replies')
      .select('*')
      .order('created_at', { ascending: true });

    // Fetch poll options and votes
    const { data: pollOptions } = await supabase
      .from('poll_options')
      .select('*')
      .order('sort_order', { ascending: true });

    const { data: pollVotes } = await supabase
      .from('poll_votes')
      .select('option_id, user_id');

    // Fetch profile names for non-anonymous posts and replies
    const allUserIds = new Set<string>();
    (postsData || []).filter(p => !p.is_anonymous).forEach(p => allUserIds.add(p.user_id));
    (repliesData || []).filter(r => !r.is_anonymous).forEach(r => allUserIds.add(r.user_id));
    const nonAnonUserIds = [...allUserIds];

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
      const postReplies: CommunityReply[] = (repliesData || [])
        .filter(r => r.post_id === post.id)
        .map(r => ({
          ...r,
          author_name: r.is_anonymous
            ? (r.anonymous_name || getAnonymousName(r.user_id, post.id))
            : (profileMap[r.user_id] || 'Användare'),
        }));

      const postPollOptions: PollOption[] = (pollOptions || [])
        .filter(o => o.post_id === post.id)
        .map(o => ({
          id: o.id,
          option_text: o.option_text,
          sort_order: o.sort_order,
          vote_count: (pollVotes || []).filter(v => v.option_id === o.id).length,
        }));

      const userVote = user
        ? (pollVotes || []).find(v => v.user_id === user.id && postPollOptions.some(o => o.id === v.option_id))
        : null;

      return {
        ...post,
        author_name: post.is_anonymous 
          ? (post.anonymous_name || getAnonymousName(post.user_id))
          : (profileMap[post.user_id] || 'Användare'),
        reaction_count: postReactions.length,
        user_has_reacted: user ? postReactions.some(r => r.user_id === user.id) : false,
        replies: postReplies,
        poll_options: postPollOptions,
        user_voted_option_id: userVote?.option_id || null,
      };
    });

    setPosts(enrichedPosts);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('forum-images').upload(path, file);
    if (error) {
      toast({ title: 'Kunde inte ladda upp bild', variant: 'destructive' });
      return null;
    }
    const { data } = supabase.storage.from('forum-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const createPost = async (content: string, category: string, isAnonymous: boolean, title?: string, imageFile?: File | null, pollOptionTexts?: string[]) => {
    if (!user) return false;

    const anonymousName = isAnonymous ? getAnonymousName(user.id) : null;
    let imageUrl: string | null = null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
      if (!imageUrl) return false;
    }

    const { data: postData, error } = await supabase.from('community_posts').insert({
      user_id: user.id,
      title: title?.trim() || null,
      content: content.trim(),
      category,
      is_anonymous: isAnonymous,
      anonymous_name: anonymousName,
      image_url: imageUrl,
    } as any).select('id').single();

    if (error || !postData) {
      toast({ title: 'Kunde inte skapa inlägg', variant: 'destructive' });
      return false;
    }

    // Create poll options if provided
    if (pollOptionTexts && pollOptionTexts.length >= 2) {
      const options = pollOptionTexts.map((text, i) => ({
        post_id: postData.id,
        option_text: text.trim(),
        sort_order: i,
      }));
      await supabase.from('poll_options').insert(options as any);
    }

    await fetchPosts();
    return true;
  };

  const votePoll = async (postId: string, optionId: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    // Remove existing vote for this poll
    if (post.user_voted_option_id) {
      await supabase.from('poll_votes').delete()
        .eq('option_id', post.user_voted_option_id)
        .eq('user_id', user.id);
    }

    // Cast new vote (unless clicking same option to unvote)
    if (post.user_voted_option_id !== optionId) {
      await supabase.from('poll_votes').insert({
        option_id: optionId,
        user_id: user.id,
      } as any);
    }

    await fetchPosts();
  };

  const createReply = async (postId: string, content: string, isAnonymous: boolean) => {
    if (!user) return false;

    const anonymousName = isAnonymous ? getAnonymousName(user.id, postId) : null;

    const { error } = await supabase.from('community_replies').insert({
      post_id: postId,
      user_id: user.id,
      content: content.trim(),
      is_anonymous: isAnonymous,
      anonymous_name: anonymousName,
    });

    if (error) {
      toast({ title: 'Kunde inte skapa svar', variant: 'destructive' });
      return false;
    }

    await fetchPosts();
    return true;
  };

  const deleteReply = async (replyId: string) => {
    const { error } = await supabase
      .from('community_replies')
      .delete()
      .eq('id', replyId);

    if (error) {
      toast({ title: 'Kunde inte ta bort svar', variant: 'destructive' });
      return;
    }

    await fetchPosts();
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

  return { posts, loading, createPost, createReply, deleteReply, toggleReaction, deletePost };
}
