import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { PageMeta } from "@/components/PageMeta";
import { useLanguage } from "@/i18n/LanguageContext";
import { getPostBySlug, getTranslations, sanitizeHtml, type BlogPost, type BlogLocale } from "@/lib/blogApi";
import BlogComments from "@/components/blog/BlogComments";

const GOLD = "hsl(var(--primary))";

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { locale: appLocale } = useLanguage();
  const locale: BlogLocale = appLocale === "en" ? "en" : "da";


  const [post, setPost] = useState<BlogPost | null>(null);
  const [translations, setTranslations] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    (async () => {
      try {
        let p = await getPostBySlug(locale, slug);
        if (!p) {
          // try the other locale
          const other: BlogLocale = locale === "da" ? "en" : "da";
          p = await getPostBySlug(other, slug);
        }
        if (!p) { setNotFound(true); return; }
        setPost(p);
        const group = await getTranslations(p.translation_group_id);
        setTranslations(group);
      } catch (e) {
        console.error(e);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, locale]);

  if (loading) {
    return (
      <LandingLayout>
        <div style={{ padding: 80, textAlign: "center", color: "hsl(var(--muted-foreground))" }}>…</div>
      </LandingLayout>
    );
  }

  if (notFound || !post) {
    return (
      <LandingLayout>
        <PageMeta title="Not found · Sportstalent" />
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "100px 24px", textAlign: "center" }}>
          <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 16 }}>404</h1>
          <p style={{ color: "hsl(var(--muted-foreground))", marginBottom: 24 }}>Artiklen findes ikke / Article not found.</p>
          <Button onClick={() => navigate("/blog")} style={{ padding: "12px 24px", borderRadius: 8, border: "none", background: GOLD, color: "hsl(var(--primary-foreground))", fontWeight: 800, cursor: "pointer" }}>
            ← Blog
          </Button>
        </div>
      </LandingLayout>
    );
  }

  const otherLangPost = translations.find((t) => t.id !== post.id);
  const safeHtml = sanitizeHtml(post.content_html);
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.cover_image_url || undefined,
    datePublished: post.published_at || undefined,
    inLanguage: post.locale,
    author: {
      "@type": "Organization",
      name: "Sportstalent",
      url: "https://sportstalent.dk",
    },
    publisher: {
      "@type": "Organization",
      name: "Sportstalent",
      url: "https://sportstalent.dk",
    },
    mainEntityOfPage: `https://sportstalent.dk/blog/${post.slug}`,
  };

  // Trim title to keep <title> under ~60 chars after the " · Sportstalent" suffix
  const SUFFIX = " · Sportstalent";
  const maxTitle = 60 - SUFFIX.length;
  const safeTitle = post.title.length > maxTitle ? post.title.slice(0, maxTitle - 1).trimEnd() + "…" : post.title;

  return (
    <LandingLayout>
      <PageMeta
        title={`${safeTitle}${SUFFIX}`}
        description={post.excerpt || post.title}
        canonical={`https://sportstalent.dk/blog/${post.slug}`}
        ogType="article"
        ogImage={post.cover_image_url || undefined}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />


      <article style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px 80px" }}>
        <Button
          onClick={() => navigate("/blog")}
          style={{ background: "transparent", border: "none", color: "hsl(var(--muted-foreground))", cursor: "pointer", fontSize: 13, marginBottom: 24, padding: 0 }}
        >
          ← Blog
        </Button>

        <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginBottom: 12, letterSpacing: "0.05em" }}>
          {post.published_at && new Date(post.published_at).toLocaleDateString(post.locale === "da" ? "da-DK" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
          <span style={{ marginLeft: 12, padding: "2px 8px", border: "0.5px solid hsl(var(--border))", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
            {post.locale.toUpperCase()}
          </span>
        </div>

        <h1 style={{ fontSize: "52px", fontWeight: 900, letterSpacing: "0", lineHeight: 1.1, margin: "0 0 16px" }}>
          {post.title}
        </h1>

        {post.excerpt && (
          <p style={{ fontSize: 18, color: "hsl(var(--muted-foreground))", lineHeight: 1.55, margin: "0 0 32px" }}>{post.excerpt}</p>
        )}

        {otherLangPost && (
          <div style={{ marginBottom: 28, fontSize: 13 }}>
            <Button
              onClick={() => navigate(`/blog/${otherLangPost.slug}`)}
              style={{ background: "hsl(var(--primary) / 0.1)", border: `0.5px solid ${GOLD}`, color: GOLD, borderRadius: 8, padding: "6px 14px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}
            >
              {otherLangPost.locale === "en" ? "Read in English" : "Læs på dansk"}
            </Button>
          </div>
        )}

        {post.cover_image_url && (
          <img
            src={post.cover_image_url}
            alt=""
            style={{ width: "100%", borderRadius: 8, marginBottom: 32, display: "block" }}
          />
        )}

        <div
          className="prose max-w-none"
          style={{
            fontSize: 17,
            lineHeight: 1.75,
            color: "hsl(var(--muted-foreground))",
          }}
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />

        <BlogComments postId={post.id} postLocale={post.locale} />
      </article>
    </LandingLayout>
  );
};

export default BlogPostPage;
