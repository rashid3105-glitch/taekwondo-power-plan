import { supabase } from "@/integrations/supabase/client";
import DOMPurify from "dompurify";

export type BlogLocale = "da" | "en";
export type BlogStatus = "draft" | "published";

export interface BlogPost {
  id: string;
  locale: BlogLocale;
  slug: string;
  title: string;
  excerpt: string | null;
  content_html: string;
  cover_image_url: string | null;
  status: BlogStatus;
  published_at: string | null;
  expires_at: string | null;
  author_id: string | null;
  translation_group_id: string;
  created_at: string;
  updated_at: string;
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export const sanitizeHtml = (html: string) =>
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s", "h1", "h2", "h3", "h4",
      "ul", "ol", "li", "blockquote", "a", "img", "pre", "code", "hr",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "class"],
  });

export async function listPublishedPosts(locale: BlogLocale): Promise<BlogPost[]> {
  const { data, error } = await (supabase.from as any)("blog_posts")
    .select("*")
    .eq("locale", locale)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data || []) as BlogPost[];
}

export async function getPostBySlug(locale: BlogLocale, slug: string): Promise<BlogPost | null> {
  const { data, error } = await (supabase.from as any)("blog_posts")
    .select("*")
    .eq("locale", locale)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as BlogPost) || null;
}

export async function getTranslations(translationGroupId: string): Promise<BlogPost[]> {
  const { data, error } = await (supabase.from as any)("blog_posts")
    .select("*")
    .eq("translation_group_id", translationGroupId);
  if (error) throw error;
  return (data || []) as BlogPost[];
}

// Admin
export async function listAllPostsAdmin(): Promise<BlogPost[]> {
  const { data, error } = await (supabase.from as any)("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as BlogPost[];
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  const { data, error } = await (supabase.from as any)("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as BlogPost) || null;
}

export async function createPost(input: Partial<BlogPost>): Promise<BlogPost> {
  const payload: any = {
    ...input,
    content_html: sanitizeHtml(input.content_html || ""),
  };
  const { data, error } = await (supabase.from as any)("blog_posts")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as BlogPost;
}

export async function updatePost(id: string, input: Partial<BlogPost>): Promise<BlogPost> {
  const payload: any = { ...input };
  if (input.content_html !== undefined) {
    payload.content_html = sanitizeHtml(input.content_html);
  }
  const { data, error } = await (supabase.from as any)("blog_posts")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as BlogPost;
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await (supabase.from as any)("blog_posts").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadBlogImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("blog-images").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
  return data.publicUrl;
}
