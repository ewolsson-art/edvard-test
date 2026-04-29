import { Link } from "react-router-dom";
import { AuthNavbar } from "@/components/AuthNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { SEO } from "@/components/seo/SEO";
import { blogPosts } from "@/content/blogPosts";
import { ArrowRight } from "lucide-react";

const Blog = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Blogg – Toddy | Stämningsdagbok, bipolär, depression"
        description="Artiklar om psykisk hälsa, stämningsdagbok, bipolär sjukdom, depression och anhörigskap — skrivna med vården och forskningen som grund."
        path="/blogg"
      />
      <AuthNavbar />

      <main className="flex-1 pt-32 pb-20 px-5 md:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-16">
            <p className="text-sm uppercase tracking-widest text-primary/80 mb-3">Toddy Journal</p>
            <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-foreground mb-5">
              Förstå ditt mående
            </h1>
            <p className="text-lg text-foreground/60 max-w-xl leading-relaxed">
              Praktiska guider om stämningsdagbok, bipolär, depression och hur du som anhörig kan hjälpa.
            </p>
          </div>

          <div className="space-y-6">
            {blogPosts.map((post) => (
              <Link
                key={post.slug}
                to={`/blogg/${post.slug}`}
                className="group block p-6 md:p-8 rounded-2xl border border-white/[0.06] hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.04] transition-all"
              >
                <div className="flex items-center gap-3 text-xs text-foreground/40 mb-3">
                  <span className="text-primary/80">{post.category}</span>
                  <span>·</span>
                  <span>{post.readingTime}</span>
                </div>
                <h2 className="text-xl md:text-2xl font-display font-semibold text-foreground group-hover:text-primary transition-colors mb-3">
                  {post.title}
                </h2>
                <p className="text-foreground/60 leading-relaxed mb-4">
                  {post.description}
                </p>
                <div className="flex items-center gap-2 text-sm text-primary/80 group-hover:text-primary transition-colors">
                  Läs artikel
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export default Blog;
