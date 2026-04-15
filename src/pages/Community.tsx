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
import { useTranslation } from 'react-i18next';
import { sv, enUS } from 'date-fns/locale';

const CATEGORY_KEYS: Record<string, string> = {
  general: 'catGeneral',
  recovery: 'catRecovery',
  low: 'catLow',
  tips: 'catTips',
  medication: 'catMedication',
  'side-effects': 'catSideEffects',
  family: 'catFamily',
  work: 'catWork',
  sleep: 'catSleep',
  exercise: 'catExercise',
  therapy: 'catTherapy',
  selfcare: 'catSelfcare',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  general: '💬', recovery: '☀️', low: '🌊', tips: '💡', medication: '💊',
  'side-effects': '⚠️', family: '👨‍👩‍👧', work: '💼', sleep: '😴',
  exercise: '🏃', therapy: '🧠', selfcare: '🧘',
};

const CATEGORY_IDS = Object.keys(CATEGORY_KEYS);

const Community = () => {
  const { t, i18n } = useTranslation();
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

  const dateFnsLocale = i18n.language === 'sv' ? sv : enUS;

  const getCatLabel = (id: string) => t(`communityPage.${CATEGORY_KEYS[id]}`);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(t('communityPage.imageMax'));
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
          <div className="flex-1 max-w-2xl space-y-4 md:space-y-6">
            <div>
              <h1 className="font-display text-3xl font-bold">{t('communityPage.title')}</h1>
              <p className="text-sm text-muted-foreground mt-1">{t('communityPage.subtitle')}</p>
            </div>

            <div className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/20 overflow-hidden">
              <button onClick={() => setRulesOpen(!rulesOpen)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground/90">
                    {filterCategory ? `${CATEGORY_EMOJIS[filterCategory]} ${getCatLabel(filterCategory)}` : t('communityPage.allCategories')}
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
                    {t('communityPage.allCategories')}
                  </button>
                  {CATEGORY_IDS.map(id => (
                    <button
                      key={id}
                      onClick={() => { setFilterCategory(filterCategory === id ? null : id); setRulesOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filterCategory === id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'}`}
                    >
                      {CATEGORY_EMOJIS[id]} {getCatLabel(id)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">{t('communityPage.noThreads')}</p>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {filteredPosts.map(post => (
                  <ThreadListItem key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>

          <aside className="hidden lg:block w-72 xl:w-80 shrink-0">
            <div className="sticky top-8 space-y-4">
              {user && (
                <Button onClick={() => setDesktopFormOpen(true)} className="w-full rounded-xl gap-2">
                  <Plus className="h-4 w-4" />
                  {t('communityPage.postButton')}
                </Button>
              )}
              <div className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/20 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground/90">{t('communityPage.popularThreads')}</h2>
                </div>
                {popularPosts.length === 0 ? (
                  <p className="text-xs text-muted-foreground/50">{t('communityPage.noPopular')}</p>
                ) : (
                  <div className="space-y-1">
                    {popularPosts.map((post) => {
                      const postTitle = post.title || post.content.slice(0, 50) + (post.content.length > 50 ? '…' : '');
                      return (
                        <button key={post.id} onClick={() => navigate(`/forum/${post.id}`)} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors group">
                          <p className="text-[13px] font-medium text-foreground/80 leading-snug line-clamp-2 group-hover:text-foreground transition-colors">{postTitle}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            {post.reaction_count > 0 && (
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/40"><Heart className="h-3 w-3" strokeWidth={1.8} />{post.reaction_count}</span>
                            )}
                            {post.replies.length > 0 && (
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/40"><MessageCircle className="h-3 w-3" strokeWidth={1.8} />{post.replies.length}</span>
                            )}
                            <span className="text-[10px] text-muted-foreground/30">
                              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: dateFnsLocale })}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/20 p-4">
                <h2 className="text-sm font-semibold text-foreground/90 mb-3">{t('communityPage.categories')}</h2>
                <div className="space-y-1">
                  {CATEGORY_IDS.map(id => {
                    const count = posts.filter(p => p.category === id).length;
                    return (
                      <button key={id} onClick={() => setFilterCategory(filterCategory === id ? null : id)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-colors ${filterCategory === id ? 'bg-primary/10 text-primary' : 'text-muted-foreground/60 hover:text-foreground/80 hover:bg-white/[0.03]'}`}>
                        <span>{CATEGORY_EMOJIS[id]} {getCatLabel(id)}</span>
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

      {user && (desktopFormOpen || mobileFormOpen) && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/10">
            <span className="text-base font-semibold text-foreground">{t('communityPage.newPost')}</span>
            <button onClick={() => { setDesktopFormOpen(false); setMobileFormOpen(false); }} className="text-muted-foreground hover:text-destructive transition-colors p-1">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto p-4 overflow-y-auto">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('communityPage.titlePlaceholder')} className="bg-transparent border border-white/20 focus-visible:ring-0 text-base font-semibold placeholder:text-muted-foreground/40 px-3 h-auto rounded-lg mb-3" maxLength={120} />
            <div className="flex-1 flex flex-col border border-white/20 rounded-lg overflow-hidden min-h-[200px]">
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={t('communityPage.contentPlaceholder')} className="flex-1 min-h-[160px] bg-transparent border-0 resize-none focus-visible:ring-0 text-[15px] placeholder:text-muted-foreground/50 p-3" maxLength={2000} />

              {imagePreview && (
                <div className="relative mx-3 mb-3 rounded-lg overflow-hidden border border-white/20 max-h-48">
                  <img src={imagePreview} alt={t('communityPage.preview')} className="w-full h-full object-cover max-h-48" />
                  <button onClick={clearImage} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {pollMode && (
                <div className="mx-3 mb-3 space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">{t('communityPage.pollOptions')}</span>
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input value={opt} onChange={(e) => { const next = [...pollOptions]; next[i] = e.target.value; setPollOptions(next); }} placeholder={`${t('communityPage.pollOptions').split(' ')[0]} ${i + 1}`} className="bg-transparent border border-white/20 focus-visible:ring-0 text-sm placeholder:text-muted-foreground/40 h-9 rounded-lg" maxLength={100} />
                      {pollOptions.length > 2 && (
                        <button onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="text-muted-foreground/50 hover:text-destructive transition-colors shrink-0">
                          <Minus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 6 && (
                    <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                      <Plus className="h-3 w-3" /> {t('communityPage.addOption')}
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-1 px-2 py-2 border-t border-white/10">
                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                <button onClick={() => imageInputRef.current?.click()} className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-all" title={t('communityPage.addImage')}>
                  <ImagePlus className="h-6 w-6" />
                </button>
                <button onClick={() => setPollMode(!pollMode)} className={`p-2.5 rounded-lg transition-all ${pollMode ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.05]'}`} title={t('communityPage.addPoll')}>
                  <BarChart3 className="h-6 w-6" />
                </button>
                <button onClick={() => setIsAnonymous(!isAnonymous)} className={`p-2.5 rounded-lg transition-all flex items-center gap-2 ${isAnonymous ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.05]'}`} title={isAnonymous ? t('communityPage.anonymousOn') : t('communityPage.withName')}>
                  {isAnonymous ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                  <span className="text-xs font-medium">{isAnonymous ? t('communityPage.anonymousOn') : t('communityPage.withName')}</span>
                </button>
              </div>
            </div>

            <div className="mt-3">
              <button onClick={() => setRulesOpen(prev => !prev)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <span>{CATEGORY_EMOJIS[selectedCategory]} {getCatLabel(selectedCategory)}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${rulesOpen ? 'rotate-180' : ''}`} />
              </button>
              {rulesOpen && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {CATEGORY_IDS.map(id => (
                    <button key={id} onClick={() => { setSelectedCategory(id); setRulesOpen(false); }} className={`text-xs px-2.5 py-1 rounded-full transition-all ${selectedCategory === id ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08] border border-transparent'}`}>
                      {CATEGORY_EMOJIS[id]} {getCatLabel(id)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 mt-auto">
              <button onClick={handleSubmit} disabled={!content.trim() || isPosting} className="px-6 py-2.5 rounded-full bg-[hsl(45_85%_55%)] text-[hsl(225_30%_7%)] font-bold text-sm tracking-wide shadow-[0_4px_24px_hsl(45_85%_55%/0.35)] hover:shadow-[0_8px_32px_hsl(45_85%_55%/0.5)] hover:bg-[hsl(45_85%_62%)] hover:scale-105 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none inline-flex items-center gap-2">
                <Send className="h-4 w-4" />
                {t('communityPage.postButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {user && !mobileFormOpen && !desktopFormOpen && (
        <button onClick={() => setMobileFormOpen(true)} className="fixed bottom-6 right-6 z-40 lg:hidden w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center transition-all active:scale-95">
          <Plus className="h-7 w-7" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export default Community;
