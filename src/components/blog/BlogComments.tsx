import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const GOLD = "hsl(var(--primary))";

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface Props {
  postId: string;
  postLocale: "da" | "en";
}

export default function BlogComments({ postId, postLocale }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDa = postLocale === "da";
  const T = {
    heading: isDa ? "Kommentarer" : "Comments",
    empty: isDa ? "Bliv den første til at kommentere." : "Be the first to comment.",
    formTitle: isDa ? "Skriv en kommentar" : "Leave a comment",
    name: isDa ? "Navn" : "Name",
    email: "Email",
    comment: isDa ? "Kommentar" : "Comment",
    submit: isDa ? "Send kommentar" : "Submit comment",
    sending: isDa ? "Sender…" : "Sending…",
    emailNote: isDa
      ? "Din email vises ikke offentligt og bruges kun til at bekræfte kommentaren."
      : "Your email is not shown publicly and is only used to confirm your comment.",
    success: isDa
      ? "Tjek din email for at bekræfte din kommentar."
      : "Check your email to confirm your comment.",
    errorGeneric: isDa
      ? "Noget gik galt. Prøv igen om lidt."
      : "Something went wrong. Please try again.",
    errorRate: isDa
      ? "Du har sendt for mange kommentarer. Prøv igen senere."
      : "You've submitted too many comments. Try again later.",
    errorInvalid: isDa ? "Ugyldig email." : "Invalid email.",
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data } = await (supabase.rpc as any)("get_blog_comments", { _post_id: postId });
      if (mounted) {
        setComments((data || []) as Comment[]);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [postId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("submit-blog-comment", {
        body: {
          post_id: postId,
          author_name: name.trim(),
          author_email: email.trim(),
          content: content.trim(),
          website, // honeypot
        },
      });
      if (invokeError) throw invokeError;
      if ((data as any)?.error === "rate_limited") {
        setError(T.errorRate);
        return;
      }
      if ((data as any)?.error === "invalid_email") {
        setError(T.errorInvalid);
        return;
      }
      if ((data as any)?.error) {
        setError(T.errorGeneric);
        return;
      }
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError(T.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "hsl(var(--border))",
    border: "0.5px solid hsl(var(--border))",
    borderRadius: 8,
    padding: "12px 14px",
    color: "hsl(var(--foreground))",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "hsl(var(--muted-foreground))",
    marginBottom: 6,
    letterSpacing: "0.02em",
  };

  return (
    <section style={{ marginTop: 56, paddingTop: 40, borderTop: "0.5px solid hsl(var(--border))" }}>
      <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "0", marginBottom: 24, color: "hsl(var(--foreground))" }}>
        {T.heading} {comments.length > 0 && (
          <span style={{ color: "hsl(var(--muted-foreground))", fontWeight: 700, fontSize: 18 }}>({comments.length})</span>
        )}
      </h2>

      {loading ? (
        <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 14 }}>…</p>
      ) : comments.length === 0 ? (
        <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 14, marginBottom: 32 }}>{T.empty}</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 40px", display: "flex", flexDirection: "column", gap: 16 }}>
          {comments.map((c) => (
            <li
              key={c.id}
              style={{
                background: "hsl(var(--border))",
                border: "0.5px solid hsl(var(--border))",
                borderRadius: 8,
                padding: "16px 18px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, gap: 8, flexWrap: "wrap" }}>
                <strong style={{ color: "hsl(var(--foreground))", fontSize: 14, fontWeight: 700 }}>{c.author_name}</strong>
                <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 11 }}>
                  {new Date(c.created_at).toLocaleDateString(isDa ? "da-DK" : "en-US", {
                    year: "numeric", month: "short", day: "numeric",
                  })}
                </span>
              </div>
              <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 14, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
                {c.content}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div
        style={{
          background: "hsl(var(--border))",
          border: "0.5px solid hsl(var(--border))",
          borderRadius: 8,
          padding: 24,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "hsl(var(--foreground))", margin: "0 0 16px" }}>
          {T.formTitle}
        </h3>

        {submitted ? (
          <p style={{ color: GOLD, fontSize: 14, fontWeight: 600, margin: 0 }}>
            ✓ {T.success}
          </p>
        ) : (
          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle} htmlFor="bc-name">{T.name}</label>
              <input
                id="bc-name"
                type="text"
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle} htmlFor="bc-email">{T.email}</label>
              <input
                id="bc-email"
                type="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
              <p style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", margin: "6px 0 0", lineHeight: 1.5 }}>
                {T.emailNote}
              </p>
            </div>
            <div>
              <label style={labelStyle} htmlFor="bc-content">{T.comment}</label>
              <textarea
                id="bc-content"
                required
                maxLength={5000}
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ ...inputStyle, resize: "vertical", minHeight: 120 }}
              />
            </div>

            {/* Honeypot — invisible to humans, but bots tend to fill all inputs */}
            <div style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }} aria-hidden="true">
              <label>
                Website
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </label>
            </div>

            {error && (
              <p style={{ color: "hsl(var(--destructive))", fontSize: 13, margin: 0 }}>{error}</p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              style={{
                background: GOLD,
                color: "hsl(var(--primary-foreground))",
                border: "none",
                borderRadius: 8,
                padding: "12px 22px",
                fontWeight: 800,
                fontSize: 14,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.6 : 1,
                alignSelf: "flex-start",
              }}
            >
              {submitting ? T.sending : T.submit}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
