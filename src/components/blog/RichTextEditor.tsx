import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Link as LinkIcon, Image as ImageIcon, Quote, Undo, Redo, Code2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

export function RichTextEditor({ value, onChange, onImageUpload }: Props) {
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [htmlDraft, setHtmlDraft] = useState(value || "");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { HTMLAttributes: { class: "list-disc pl-6 my-3 space-y-1" } },
        orderedList: { HTMLAttributes: { class: "list-decimal pl-6 my-3 space-y-1" } },
        listItem: { HTMLAttributes: { class: "leading-relaxed" } },
        heading: { levels: [1, 2, 3, 4] },
        blockquote: { HTMLAttributes: { class: "border-l-4 border-border pl-4 italic my-3 text-muted-foreground" } },
        codeBlock: { HTMLAttributes: { class: "bg-muted rounded p-3 font-mono text-sm my-3 overflow-x-auto" } },
      }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
      Image.configure({ HTMLAttributes: { class: "rounded-lg my-4 max-w-full h-auto" } }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "tiptap-editor max-w-none min-h-[300px] focus:outline-none px-4 py-3 text-foreground " +
          "[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 " +
          "[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 " +
          "[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-2 " +
          "[&_h4]:text-lg [&_h4]:font-semibold [&_h4]:mt-3 [&_h4]:mb-1 " +
          "[&_p]:my-2 [&_p]:leading-relaxed " +
          "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 " +
          "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 " +
          "[&_li]:my-1 [&_li>p]:my-0 " +
          "[&_a]:text-primary [&_a]:underline " +
          "[&_strong]:font-bold [&_em]:italic " +
          "[&_hr]:my-4 [&_hr]:border-border",
      },
    },
  });

  useEffect(() => {
    if (mode === "visual" && editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, mode]);

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt("URL:");
    if (!url) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = async () => {
    if (!onImageUpload) {
      const url = window.prompt("Image URL:");
      if (url) editor.chain().focus().setImage({ src: url }).run();
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const url = await onImageUpload(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch (e) {
        console.error(e);
        alert("Upload failed");
      }
    };
    input.click();
  };

  const toggleMode = () => {
    if (mode === "visual") {
      setHtmlDraft(editor.getHTML());
      setMode("html");
    } else {
      editor.commands.setContent(htmlDraft || "", { emitUpdate: false });
      onChange(htmlDraft);
      setMode("visual");
    }
  };

  const btn = (active: boolean, onClick: () => void, icon: React.ReactNode, label: string, disabled = false) => (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "ghost"}
      className="h-8 w-8 p-0"
      onClick={onClick}
      title={label}
      aria-label={label}
      disabled={disabled}
    >
      {icon}
    </Button>
  );

  const isHtml = mode === "html";

  return (
    <div className="rounded-lg border border-border bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-2">
        {btn(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), <Bold className="h-4 w-4" />, "Bold", isHtml)}
        {btn(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), <Italic className="h-4 w-4" />, "Italic", isHtml)}
        {btn(editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 className="h-4 w-4" />, "H2", isHtml)}
        {btn(editor.isActive("heading", { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), <Heading3 className="h-4 w-4" />, "H3", isHtml)}
        {btn(editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), <List className="h-4 w-4" />, "Bullet list", isHtml)}
        {btn(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered className="h-4 w-4" />, "Numbered list", isHtml)}
        {btn(editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), <Quote className="h-4 w-4" />, "Quote", isHtml)}
        {btn(editor.isActive("link"), addLink, <LinkIcon className="h-4 w-4" />, "Link", isHtml)}
        {btn(false, addImage, <ImageIcon className="h-4 w-4" />, "Image", isHtml)}
        <div className="ml-auto flex gap-1 items-center">
          <Button
            type="button"
            size="sm"
            variant={isHtml ? "default" : "ghost"}
            className="h-8 px-2 gap-1"
            onClick={toggleMode}
            title={isHtml ? "Switch to visual editor" : "Edit HTML source"}
            aria-label="Toggle HTML source"
          >
            <Code2 className="h-4 w-4" />
            <span className="text-xs font-mono">{isHtml ? "Visual" : "HTML"}</span>
          </Button>
          {btn(false, () => editor.chain().focus().undo().run(), <Undo className="h-4 w-4" />, "Undo", isHtml)}
          {btn(false, () => editor.chain().focus().redo().run(), <Redo className="h-4 w-4" />, "Redo", isHtml)}
        </div>
      </div>
      {isHtml ? (
        <textarea
          value={htmlDraft}
          onChange={(e) => {
            setHtmlDraft(e.target.value);
            onChange(e.target.value);
          }}
          spellCheck={false}
          className="w-full min-h-[300px] bg-background text-foreground font-mono text-sm px-4 py-3 focus:outline-none resize-y"
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
}
