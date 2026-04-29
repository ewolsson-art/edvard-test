import { Link, useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AuthNavbar } from "@/components/AuthNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { SEO } from "@/components/seo/SEO";
import { BlogContent } from "@/components/blog/BlogContent";
import { blogPosts } from "@/content/blogPosts";
import { ArrowLeft, ArrowRight } from "lucide-react";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return <Navigate to="/blogg" replace />;
  }

  const currentIdx = blogPosts.findIndex((p) => p.slug === slug);
  const nextPost = blogPosts[currentIdx + 1] ?? blogPosts[0];

  // JSON-LD för Article — hjälper Google ranka och visa rich snippets
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: {
      "@type": "Organization",
      name: "Toddy",
      url: "https://toddy.se",
    },
    publisher: {
      "@type": "Organization",
      name: "Toddy",
      logo: {
        "@type": "ImageObject",
        url: "https://toddy.se/app-icon.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://toddy.se/blogg/${post.slug}`,
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={`${post.title} | Toddy`}
        description={post.description}
        path={`/blogg/${post.slug}`}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
      </Helmet>
      <AuthNavbar />

      <main className="flex-1 pt-32 pb-20 px-5 md:px-8">
        <article className="max-w-2xl mx-auto">
          <Link
            to="/blogg"
            className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors mb-10"
          >
            <ArrowLeft className="w-4 h-4" />
            Tillbaka till bloggen
          </Link>

          <div className="mb-10">
            <div className="flex items-center gap-3 text-sm text-foreground/40 mb-4">
              <span className="text-primary/80">{post.category}</span>
              <span>·</span>
              <span>{post.readingTime}</span>
              <span>·</span>
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString("sv-SE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-foreground leading-tight">
              {post.title}
            </h1>
          </div>

          <BlogContent content={post.content} />

          <div className="mt-20 pt-10 border-t border-white/[0.06]">
            <p className="text-sm text-foreground/40 mb-3">Läs nästa</p>
            <Link
              to={`/blogg/${nextPost.slug}`}
              className="group flex items-center justify-between gap-4 p-6 rounded-2xl border border-white/[0.06] hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.04] transition-all"
            >
              <div>
                <p className="text-xs text-primary/80 mb-2">{nextPost.category}</p>
                <h3 className="text-lg font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                  {nextPost.title}
                </h3>
              </div>
              <ArrowRight className="w-5 h-5 text-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
            </Link>
          </div>
        </article>
      </main>

      <LandingFooter />
    </div>
  );
};

export default BlogPost;
