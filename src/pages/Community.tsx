import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Heart, Send, Eye, EyeOff, Trash2, MessageCircle, LogIn, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { useCommunityPosts } from '@/hooks/useCommunityPosts';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Logo } from '@/components/Logo';

const CATEGORIES = [
  { id: 'general', label: 'Allmänt', emoji: '💬' },
  { id: 'recovery', label: 'Återhämtning', emoji: '☀️' },
  { id: 'low', label: 'Tunga dagar', emoji: '🌊' },
  { id: 'tips', label: 'Tips', emoji: '💡' },
];

const Community = () => {
  const { user } = useAuth();
  const { posts, loading, createPost, toggleReaction, deletePost } = useCommunityPosts();
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || isPosting) return;
    setIsPosting(true);
    const success = await createPost(content, selectedCategory, isAnonymous);
    if (success) {
      setContent('');
    }
    setIsPosting(false);
  };

  const filteredPosts = filterCategory
    ? posts.filter(p => p.category === filterCategory)
    : posts;

  return (
    <div className="min-h-screen">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/30">
        <div className="px-5 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <Logo size="sm" showText={false} />
            </Link>
            <h1 className="text-xl font-bold text-foreground">Forum</h1>
          </div>
          {!user && (
            <Link to="/logga-in">
              <Button size="sm" variant="outline" className="rounded-full gap-2 text-xs">
                <LogIn className="h-3.5 w-3.5" />
                Logga in
              </Button>
            </Link>
          )}
          {user && (
            <Link to="/">
              <Button size="sm" variant="ghost" className="rounded-full text-xs text-muted-foreground">
                Tillbaka till appen
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="px-5 md:px-8 py-6 max-w-2xl mx-auto space-y-6">
        {/* Group rules */}
        <div className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/20 overflow-hidden">
          <button
            onClick={() => setRulesOpen(!rulesOpen)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground/90">Gruppens regler</span>
            </div>
            {rulesOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground/50" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground/50" />
            )}
          </button>
          
          {rulesOpen && (
            <div className="px-4 pb-4 space-y-2.5 border-t border-border/10 pt-3">
              {[
                'Alla är vi olika, jämför inte varandra.',
                'Våra diagnoser kan skiljas åt, likaså behandling och den skall ej ställas av oss utan av läkare.',
                'Det är ok att prata medicin och behandling men alla skall prata med läkare angående sin egen medicinering. Man får ej rekommendera behandling eller naturläkemedel för andra.',
                'Vi respekterar varandras religion, åsikter kring andlighet och sexuell läggning.',
                'Inga dejtinginlägg eller meddelanden av dess slag till medlemmar.',
                'Det är strikt förbjudet att dela inlägg från gruppen.',
                'Inget valarbete, politiska inlägg eller diskussioner kring politik.',
                'TW (triggervarning) används vid självmord samt självskadeinlägg. Eventuell bild skall läggas i kommentarerna.',
                'Inget köp och sälj är tillåtet och man får inte söka ekonomiskt stöd här.',
                'Olagliga droger får ej diskuteras som alternativ medicin. Trådar raderas omedelbart.',
                'Inga efterlysningar till intervjuer — detta är en stödgrupp.',
                'Det är inte tillåtet att dela eller länka till andra grupper eller bloggar.',
                'Det är ok att lägga upp vardagliga saker men man ska respektera alla regler.',
                'Det är inte tillåtet att blockera admins.',
                'Otrevliga inlägg undanbedes. PM är rätt väg för klagomål. Otrevligheter leder till uteslutning.',
                'Allvarliga regelbrott kan leda till omedelbar uteslutning. I annat fall gäller 1 varning innan avstängning.',
              ].map((rule, i) => (
                <div key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-muted-foreground/70">
                  <span className="text-primary/60 font-medium shrink-0 w-5 text-right">{i + 1}.</span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New post form - only for logged in users */}
        {user ? (
          <div className="bg-card/60 backdrop-blur-sm rounded-xl border border-border/30 p-4 space-y-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Dela dina tankar..."
              className="min-h-[80px] bg-transparent border-0 resize-none focus-visible:ring-0 text-[15px] placeholder:text-muted-foreground/50 p-0"
              maxLength={1000}
            />

            {/* Category chips */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08] border border-transparent'
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                {isAnonymous ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-xs text-muted-foreground">
                  {isAnonymous ? 'Anonymt' : 'Med namn'}
                </span>
                <Switch
                  checked={!isAnonymous}
                  onCheckedChange={(checked) => setIsAnonymous(!checked)}
                  className="scale-75"
                />
              </div>

              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!content.trim() || isPosting}
                className="rounded-full gap-2 px-4"
              >
                <Send className="h-3.5 w-3.5" />
                Posta
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/20 p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Logga in eller skapa ett konto för att dela dina tankar
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/logga-in">
                <Button size="sm" className="rounded-full">Logga in</Button>
              </Link>
              <Link to="/skapa-konto">
                <Button size="sm" variant="outline" className="rounded-full">Skapa konto</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setFilterCategory(null)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
              !filterCategory
                ? 'bg-white/10 text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Alla
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
              className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                filterCategory === cat.id
                  ? 'bg-white/10 text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">Inga inlägg ännu. Var den första!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map(post => {
              const cat = CATEGORIES.find(c => c.id === post.category);
              const isOwn = post.user_id === user?.id;

              return (
                <div
                  key={post.id}
                  className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/20 p-4 space-y-3 transition-all hover:border-border/40"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground/90">
                        {post.author_name}
                      </span>
                      {post.is_anonymous && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-muted-foreground/60">
                          anonym
                        </span>
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
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-1">
                    {user ? (
                      <button
                        onClick={() => toggleReaction(post.id)}
                        className={`flex items-center gap-1.5 text-xs transition-all ${
                          post.user_has_reacted
                            ? 'text-red-400'
                            : 'text-muted-foreground/50 hover:text-red-400/70'
                        }`}
                      >
                        <Heart
                          className="h-4 w-4"
                          fill={post.user_has_reacted ? 'currentColor' : 'none'}
                        />
                        {post.reaction_count > 0 && (
                          <span>{post.reaction_count}</span>
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/40">
                        <Heart className="h-4 w-4" />
                        {post.reaction_count > 0 && <span>{post.reaction_count}</span>}
                      </div>
                    )}

                    {isOwn && (
                      <button
                        onClick={() => deletePost(post.id)}
                        className="text-muted-foreground/30 hover:text-destructive transition-colors ml-auto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Community;
