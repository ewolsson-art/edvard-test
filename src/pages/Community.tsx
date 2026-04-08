import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Eye, EyeOff, MessageCircle, ShieldCheck, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { useCommunityPosts } from '@/hooks/useCommunityPosts';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ThreadListItem } from '@/components/community/ThreadListItem';

const CATEGORIES = [
  { id: 'general', label: 'Allmänt', emoji: '💬' },
  { id: 'recovery', label: 'Återhämtning', emoji: '☀️' },
  { id: 'low', label: 'Tunga dagar', emoji: '🌊' },
  { id: 'tips', label: 'Tips', emoji: '💡' },
];

const RULES = [
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
];

const Community = () => {
  const { user } = useAuth();
  const { posts, loading, createPost } = useCommunityPosts();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [mobileFormOpen, setMobileFormOpen] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || isPosting) return;
    setIsPosting(true);
    const success = await createPost(content, selectedCategory, isAnonymous, title);
    if (success) {
      setContent('');
      setTitle('');
      setMobileFormOpen(false);
    }
    setIsPosting(false);
  };

  const filteredPosts = filterCategory ? posts.filter(p => p.category === filterCategory) : posts;

  const PostForm = () => (
    <div className="bg-card/60 backdrop-blur-sm rounded-xl border border-border/30 p-4 space-y-3">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Rubrik på din tråd..."
        className="bg-transparent border-0 focus-visible:ring-0 text-base font-semibold placeholder:text-muted-foreground/40 px-0 h-auto"
        maxLength={120}
      />
      <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Skriv ditt inlägg..." className="min-h-[80px] bg-transparent border-0 resize-none focus-visible:ring-0 text-[15px] placeholder:text-muted-foreground/50 p-0" maxLength={2000} />
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`text-xs px-3 py-1.5 rounded-full transition-all ${selectedCategory === cat.id ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08] border border-transparent'}`}>
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          {isAnonymous ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
          <span className="text-xs text-muted-foreground">{isAnonymous ? 'Anonymt' : 'Med namn'}</span>
          <Switch checked={!isAnonymous} onCheckedChange={(checked) => setIsAnonymous(!checked)} className="scale-75" />
        </div>
        <Button size="sm" onClick={handleSubmit} disabled={!content.trim() || isPosting} className="rounded-full gap-2 px-4">
          <Send className="h-3.5 w-3.5" />Skapa tråd
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="p-5 md:p-8 max-w-2xl md:mx-0 space-y-4 md:space-y-6 pb-24">
        <div>
          <h1 className="font-display text-3xl font-bold">Forum</h1>
          <p className="text-sm text-muted-foreground mt-1">Dela tankar och stötta varandra.</p>
        </div>

        {/* Rules */}
        <div className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/20 overflow-hidden">
          <button onClick={() => setRulesOpen(!rulesOpen)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground/90">Gruppens regler</span>
            </div>
            {rulesOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground/50" /> : <ChevronDown className="h-4 w-4 text-muted-foreground/50" />}
          </button>
          {rulesOpen && (
            <div className="px-4 pb-4 space-y-2.5 border-t border-border/10 pt-3">
              {RULES.map((rule, i) => (
                <div key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-muted-foreground/70">
                  <span className="text-primary/60 font-medium shrink-0 w-5 text-right">{i + 1}.</span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop post form */}
        {user ? (
          <div className="hidden md:block">
            <PostForm />
          </div>
        ) : (
          <div className="rounded-2xl bg-card/60 border border-border/40 p-5 space-y-3">
            <p className="text-sm font-medium text-foreground">Vill du delta i diskussionen?</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Skapa ett konto för att skriva inlägg, kommentera och gilla – helt anonymt om du vill.
            </p>
            <div className="flex items-center gap-3">
              <Link to="/skapa-konto">
                <Button size="sm" className="rounded-full gap-2 px-5">
                  Skapa konto
                </Button>
              </Link>
              <Link to="/logga-in">
                <Button size="sm" variant="ghost" className="rounded-full text-xs text-muted-foreground hover:text-foreground">
                  Har redan ett konto? Logga in
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterCategory(null)} className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${!filterCategory ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Alla</button>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)} className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${filterCategory === cat.id ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

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

      {/* Mobile FAB + overlay form */}
      {user && (
        <>
          {mobileFormOpen && (
            <div className="fixed inset-0 z-50 md:hidden flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setMobileFormOpen(false)}>
              <div className="w-full max-w-lg bg-card border-t border-border/30 rounded-t-2xl p-5 space-y-4 animate-in slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Ny tråd</span>
                  <button onClick={() => setMobileFormOpen(false)} className="text-destructive">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <PostForm />
              </div>
            </div>
          )}

          {!mobileFormOpen && (
            <button
              onClick={() => setMobileFormOpen(true)}
              className="fixed bottom-6 right-6 z-40 md:hidden w-14 h-14 rounded-full bg-yellow-400 hover:bg-yellow-300 text-black shadow-lg shadow-yellow-400/30 flex items-center justify-center transition-all active:scale-95"
            >
              <Plus className="h-7 w-7" strokeWidth={2.5} />
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default Community;
