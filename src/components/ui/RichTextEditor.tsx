"use client";

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Image from '@tiptap/extension-image';
import { useEffect, useCallback } from 'react';

// ─── Toolbar Button ───────────────────────────────────────────────────────────

function ToolBtn({
  onClick,
  active,
  title,
  children,
  danger,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`px-2 py-1 rounded text-xs font-medium transition-all select-none ${
        danger
          ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent'
          : active
          ? 'bg-yellow-500/25 text-yellow-400 border border-yellow-500/40'
          : 'text-neutral-400 hover:text-white hover:bg-white/10 border border-transparent'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px self-stretch bg-white/10 mx-0.5" />;
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[9px] text-neutral-600 font-montserrat uppercase tracking-wider px-1 self-center select-none">
      {children}
    </span>
  );
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const setLink = useCallback(() => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enter URL', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
    }
  }, [editor]);

  const insertImage = useCallback(() => {
    const url = window.prompt('Image URL', 'https://');
    if (!url || url === 'https://') return;
    const alt = window.prompt('Alt text (optional)', '') ?? '';
    editor.chain().focus().setImage({ src: url, alt }).run();
  }, [editor]);

  const setColor = useCallback(() => {
    const color = window.prompt('Hex color (e.g. #ff6600)', editor.getAttributes('textStyle').color ?? '#ffffff');
    if (color === null) return;
    if (color === '') {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(color).run();
    }
  }, [editor]);

  const currentColor: string = editor.getAttributes('textStyle').color ?? '';

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-white/10 bg-black/20">

      {/* ── Headings ─────────────────────────────────────── */}
      <GroupLabel>Head</GroupLabel>
      <ToolBtn title="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        H1
      </ToolBtn>
      <ToolBtn title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </ToolBtn>
      <ToolBtn title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        H3
      </ToolBtn>
      <ToolBtn title="Heading 4" active={editor.isActive('heading', { level: 4 })} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>
        H4
      </ToolBtn>
      <ToolBtn title="Paragraph" active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()}>
        ¶
      </ToolBtn>

      <Divider />

      {/* ── Inline formatting ────────────────────────────── */}
      <GroupLabel>Format</GroupLabel>
      <ToolBtn title="Bold (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <span className="font-bold">B</span>
      </ToolBtn>
      <ToolBtn title="Italic (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <span className="italic">I</span>
      </ToolBtn>
      <ToolBtn title="Underline (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <span className="underline">U</span>
      </ToolBtn>
      <ToolBtn title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <span className="line-through">S</span>
      </ToolBtn>
      <ToolBtn title="Highlight" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()}>
        <span className={editor.isActive('highlight') ? 'bg-yellow-400/40 px-0.5 rounded' : ''}>Hi</span>
      </ToolBtn>
      <ToolBtn title="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
        <code className="text-[10px]">`c`</code>
      </ToolBtn>
      <ToolBtn title="Superscript (e.g. x²)" active={editor.isActive('superscript')} onClick={() => editor.chain().focus().toggleSuperscript().run()}>
        X<sup>2</sup>
      </ToolBtn>
      <ToolBtn title="Subscript (e.g. H₂O)" active={editor.isActive('subscript')} onClick={() => editor.chain().focus().toggleSubscript().run()}>
        X<sub>2</sub>
      </ToolBtn>
      {/* Text color */}
      <button
        type="button"
        title={`Text color${currentColor ? ` (${currentColor})` : ''}`}
        onClick={setColor}
        className="px-2 py-1 rounded text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/10 border border-transparent transition-all select-none flex items-center gap-0.5"
      >
        <span style={{ color: currentColor || '#a3a3a3' }} className="font-bold">A</span>
        <span
          className="w-3 h-1 rounded-sm block"
          style={{ backgroundColor: currentColor || '#a3a3a3' }}
        />
      </button>

      <Divider />

      {/* ── Alignment ────────────────────────────────────── */}
      <GroupLabel>Align</GroupLabel>
      <ToolBtn title="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
        ⬅
      </ToolBtn>
      <ToolBtn title="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
        ↔
      </ToolBtn>
      <ToolBtn title="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
        ➡
      </ToolBtn>
      <ToolBtn title="Justify" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
        ☰
      </ToolBtn>

      <Divider />

      {/* ── Lists ────────────────────────────────────────── */}
      <GroupLabel>Lists</GroupLabel>
      <ToolBtn title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        • List
      </ToolBtn>
      <ToolBtn title="Ordered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1. List
      </ToolBtn>
      <ToolBtn title="Task / checklist" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()}>
        ☑ Task
      </ToolBtn>

      <Divider />

      {/* ── Block elements ───────────────────────────────── */}
      <GroupLabel>Block</GroupLabel>
      <ToolBtn title="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        ❝
      </ToolBtn>
      <ToolBtn title="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        {'</>'}
      </ToolBtn>
      <ToolBtn title="Horizontal rule (divider line)" active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        ──
      </ToolBtn>
      <ToolBtn title="Hard line break (Shift+Enter)" active={false} onClick={() => editor.chain().focus().setHardBreak().run()}>
        ↵
      </ToolBtn>
      {/* Indent / Outdent */}
      <ToolBtn title="Increase indent" active={false} onClick={() => editor.chain().focus().sinkListItem('listItem').run()}>
        →|
      </ToolBtn>
      <ToolBtn title="Decrease indent" active={false} onClick={() => editor.chain().focus().liftListItem('listItem').run()}>
        |←
      </ToolBtn>

      <Divider />

      {/* ── Media / Links ────────────────────────────────── */}
      <GroupLabel>Insert</GroupLabel>
      <ToolBtn title="Insert / edit link" active={editor.isActive('link')} onClick={setLink}>
        🔗
      </ToolBtn>
      <ToolBtn title="Insert image (URL)" active={false} onClick={insertImage}>
        🖼
      </ToolBtn>

      <Divider />

      {/* ── History ──────────────────────────────────────── */}
      <ToolBtn title="Undo (Ctrl+Z)" active={false} onClick={() => editor.chain().focus().undo().run()}>
        ↩
      </ToolBtn>
      <ToolBtn title="Redo (Ctrl+Y)" active={false} onClick={() => editor.chain().focus().redo().run()}>
        ↪
      </ToolBtn>

      <Divider />

      {/* ── Clear ────────────────────────────────────────── */}
      <ToolBtn title="Clear all formatting" active={false} danger onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
        ✕
      </ToolBtn>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number; // px
}

export default function RichTextEditor({
  label,
  value,
  onChange,
  placeholder,
  minHeight = 180,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({
        placeholder: placeholder ?? 'Start writing…',
        emptyEditorClass: 'is-editor-empty',
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: false }),
      Superscript,
      Subscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextStyle,
      Color,
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'rich-editor-content outline-none',
        style: `min-height:${minHeight}px`,
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Sync external value (e.g. when loading an existing record)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div>
      <label className="block text-xs font-medium text-neutral-400 mb-1.5 font-montserrat uppercase tracking-wider">
        {label}
      </label>
      <div className="rounded-xl overflow-hidden border border-white/10 focus-within:border-yellow-500/60 transition-all bg-white/5">
        <Toolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
