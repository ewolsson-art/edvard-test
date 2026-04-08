import { useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Send, Eye, EyeOff, MessageCircle, ChevronDown, ChevronUp, Plus, X, Heart, TrendingUp, ImagePlus, BarChart3, Minus } from 'lucide-react';
import { useCommunityPosts } from '@/hooks/useCommunityPosts';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ThreadListItem } from '@/components/community/ThreadListItem';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

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


const Community = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { posts, loading, createPost } = useCommunityPosts();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [mobileFormOpen, setMobileFormOpen] = useState(false);
  const [desktopFormOpen, setDesktopFormOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [pollMode, setPollMode] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Bilden får vara max 5 MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!content.trim() || isPosting) return;
    const validPollOptions = pollMode ? pollOptions.filter(o => o.trim()) : [];
    if (pollMode && validPollOptions.length < 2) return;
    setIsPosting(true);
    const success = await createPost(content, selectedCategory, isAnonymous, title, imageFile, validPollOptions.length >= 2 ? validPollOptions : undefined);
    if (success) {
      setContent('');
      setTitle('');
      clearImage();
      setPollMode(false);
      setPollOptions(['', '']);
      setMobileFormOpen(false);
      setDesktopFormOpen(false);
    }
    setIsPosting(false);
  };

  const filteredPosts = filterCategory ? posts.filter(p => p.category === filterCategory) : posts;

  const popularPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => (b.reaction_count + b.replies.length) - (a.reaction_count + a.replies.length))
      .filter(p => p.reaction_count + p.replies.length > 0)
      .slice(0, 5);
  }, [posts]);


  return (
    <div className="min-h-screen">
      <div className="p-5 md:p-8 pb-24">
        <div className="flex gap-8">
          {/* Main column */}
          <div className="flex-1 max-w-2xl space-y-4 md:space-y-6">
            <div>
              <h1 className="font-display text-3xl font-bold">Forum</h1>
              <p className="text-sm text-muted-foreground mt-1">Läs och dela inlägg från andra användare. Du är alltid anonym om du vill.</p>
            </div>

            {/* Categories dropdown */}
            <div className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/20 overflow-hidden">
              <button onClick={() => setRulesOpen(!rulesOpen)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground/90">
                    {filterCategory ? `${CATEGORIES.find(c => c.id === filterCategory)?.emoji} ${CATEGORIES.find(c => c.id === filterCategory)?.label}` : 'Alla kategorier'}
                  </span>
                </div>
                {rulesOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground/50" /> : <ChevronDown className="h-4 w-4 text-muted-foreground/50" />}
              </button>
              {rulesOpen && (
                <div className="px-4 pb-3 border-t border-border/10 pt-2 space-y-0.5">
                  <button
                    onClick={() => { setFilterCategory(null); setRulesOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!filterCategory ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'}`}
                  >
                    Alla kategorier
                  </button>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { setFilterCategory(filterCategory === cat.id ? null : cat.id); setRulesOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filterCategory === cat.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'}`}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* CTA for non-logged-in users (shown on all screen sizes) */}

            {/* Thread list */}
            {loading ? (
              <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">Inga trådar ännu. Var den första!</p>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {filteredPosts.map(post => (
                  <ThreadListItem key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>

          {/* Right sidebar — popular threads (desktop only) */}
          <aside className="hidden lg:block w-72 xl:w-80 shrink-0">
            <div className="sticky top-8 space-y-4">
              {/* Post button + collapsible form */}
              {user && (
                <Button
                  onClick={() => setDesktopFormOpen(true)}
                  className="w-full rounded-xl gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Posta inlägg
                </Button>
              )}
              <div className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/20 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground/90">Populära trådar</h2>
                </div>
                {popularPosts.length === 0 ? (
                  <p className="text-xs text-muted-foreground/50">Inga populära trådar ännu.</p>
                ) : (
                  <div className="space-y-1">
                    {popularPosts.map((post) => {
                      const postTitle = post.title || post.content.slice(0, 50) + (post.content.length > 50 ? '…' : '');
                      return (
                        <button
                          key={post.id}
                          onClick={() => navigate(`/forum/${post.id}`)}
                          className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors group"
                        >
                          <p className="text-[13px] font-medium text-foreground/80 leading-snug line-clamp-2 group-hover:text-foreground transition-colors">
                            {postTitle}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5">
                            {post.reaction_count > 0 && (
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/40">
                                <Heart className="h-3 w-3" strokeWidth={1.8} />
                                {post.reaction_count}
                              </span>
                            )}
                            {post.replies.length > 0 && (
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/40">
                                <MessageCircle className="h-3 w-3" strokeWidth={1.8} />
                                {post.replies.length}
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground/30">
                              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: sv })}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Category overview */}
              <div className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/20 p-4">
                <h2 className="text-sm font-semibold text-foreground/90 mb-3">Kategorier</h2>
                <div className="space-y-1">
                  {CATEGORIES.map(cat => {
                    const count = posts.filter(p => p.category === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-colors ${
                          filterCategory === cat.id
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground/60 hover:text-foreground/80 hover:bg-white/[0.03]'
                        }`}
                      >
                        <span>{cat.emoji} {cat.label}</span>
                        <span className="text-[11px] text-muted-foreground/30">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Fullscreen post overlay (both mobile & desktop) */}
      {user && (desktopFormOpen || mobileFormOpen) && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/10">
            <span className="text-base font-semibold text-foreground">Nytt inlägg</span>
            <button
              onClick={() => { setDesktopFormOpen(false); setMobileFormOpen(false); }}
              className="text-muted-foreground hover:text-destructive transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content area */}
          <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto p-4 overflow-y-auto">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Rubrik (valfritt)"
              className="bg-transparent border border-white/20 focus-visible:ring-0 text-base font-semibold placeholder:text-muted-foreground/40 px-3 h-auto rounded-lg mb-3"
              maxLength={120}
            />
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Skriv ditt inlägg..."
              className="flex-1 min-h-[200px] bg-transparent border border-white/20 resize-none focus-visible:ring-0 text-[15px] placeholder:text-muted-foreground/50 p-3 rounded-lg"
              maxLength={2000}
            />

            {/* Image preview */}
            {imagePreview && (
              <div className="relative mt-3 rounded-lg overflow-hidden border border-white/20 max-h-60">
                <img src={imagePreview} alt="Förhandsvisning" className="w-full h-full object-cover max-h-60" />
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Poll options */}
            {pollMode && (
              <div className="mt-3 space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Omröstningsalternativ</span>
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const next = [...pollOptions];
                        next[i] = e.target.value;
                        setPollOptions(next);
                      }}
                      placeholder={`Alternativ ${i + 1}`}
                      className="bg-transparent border border-white/20 focus-visible:ring-0 text-sm placeholder:text-muted-foreground/40 h-9 rounded-lg"
                      maxLength={100}
                    />
                    {pollOptions.length > 2 && (
                      <button
                        onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground/50 hover:text-destructive transition-colors shrink-0"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 6 && (
                  <button
                    onClick={() => setPollOptions([...pollOptions, ''])}
                    className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Lägg till alternativ
                  </button>
                )}
              </div>
            )}

            {/* Category selector — compact */}
            <div className="mt-3">
              <button
                onClick={() => setRulesOpen(prev => !prev)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>{CATEGORIES.find(c => c.id === selectedCategory)?.emoji} {CATEGORIES.find(c => c.id === selectedCategory)?.label}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${rulesOpen ? 'rotate-180' : ''}`} />
              </button>
              {rulesOpen && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat.id); setRulesOpen(false); }}
                      className={`text-xs px-2.5 py-1 rounded-full transition-all ${selectedCategory === cat.id ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08] border border-transparent'}`}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 mt-auto">
              <div className="flex items-center gap-3">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Lägg till bild"
                >
                  <ImagePlus className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                  {isAnonymous ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-xs text-muted-foreground">{isAnonymous ? 'Anonymt' : 'Med namn'}</span>
                  <Switch checked={!isAnonymous} onCheckedChange={(checked) => setIsAnonymous(!checked)} className="scale-75" />
                </div>
              </div>
              <Button size="sm" onClick={handleSubmit} disabled={!content.trim() || isPosting} className="rounded-full gap-2 px-4">
                <Send className="h-3.5 w-3.5" />Posta inlägg
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile FAB */}
      {user && !mobileFormOpen && !desktopFormOpen && (
        <button
          onClick={() => setMobileFormOpen(true)}
          className="fixed bottom-6 right-6 z-40 lg:hidden w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center transition-all active:scale-95"
        >
          <Plus className="h-7 w-7" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export default Community;
