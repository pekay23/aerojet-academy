'use client'

import { sanitizeHtml } from '@/lib/utils/sanitize'
import { useEditor, EditorContent, Node, mergeAttributes } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { FontFamily } from '@tiptap/extension-font-family'
import { TextAlign } from '@tiptap/extension-text-align'
import { Link } from '@tiptap/extension-link'
import { Image } from '@tiptap/extension-image'
import { Placeholder } from '@tiptap/extension-placeholder'
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Link as LinkIcon,
  List,
  ListOrdered,
  Image as ImageIcon,
  Music,
  Video,
  Type,
  Loader2,
  Quote,
  Palette,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Baseline,
  Pilcrow,
  CaseSensitive,
  ArrowUpDown,
  Eye,
  PenLine,
  Undo,
  Redo,
  MoreHorizontal,
} from 'lucide-react'
import { UploadButton } from '@/lib/uploads/uploadthing'
import toast from 'react-hot-toast'
import { useEffect, useState } from 'react'

const Audio = Node.create({
  name: 'audio',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      controls: {
        default: true,
      },
      class: {
        default: 'w-full my-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'audio',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['audio', mergeAttributes(HTMLAttributes)]
  },

  addCommands() {
    return {
      setAudio:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },
})

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    audio: {
      /**
       * Insert an audio player
       */
      setAudio: (options: { src: string; controls?: boolean }) => ReturnType
    }
  }
}

interface NewsMarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const brandingColors = [
  { name: 'Aero Blue', color: '#002a5c', class: 'text-aerojet-blue' },
  { name: 'Aero Sky', color: '#4c9ded', class: 'text-aerojet-sky' },
  { name: 'Aero Light', color: '#2880b9', class: 'text-aerojet-light' },
  { name: 'Soft Blue', color: '#0073e6', class: 'text-aerojet-soft-blue' },
  { name: 'Slate', color: '#2c3e50', class: 'text-aerojet-slate' },
]

const fonts = [
  { name: 'Inter', value: 'var(--font-inter)' },
  { name: 'Outfit', value: 'var(--font-outfit)' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'System', value: 'system-ui, sans-serif' },
]

const spacingPresets = [
  { label: '8px', value: 8 },
  { label: '16px', value: 16 },
  { label: '24px', value: 24 },
  { label: '32px', value: 32 },
  { label: '48px', value: 48 },
  { label: '64px', value: 64 },
]

export default function NewsMarkdownEditor({
  value,
  onChange,
  placeholder,
}: NewsMarkdownEditorProps) {
  const [activeMediaTab, setActiveMediaTab] = useState<
    'IMAGE' | 'AUDIO' | 'VIDEO' | 'COLOR' | 'FONT' | 'SPACING' | null
  >(null)
  const [mode, setMode] = useState<'WRITE' | 'SPLIT'>('WRITE')

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontFamily,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image.configure({
        allowBase64: true,
      }),
      Audio,
      Placeholder.configure({
        placeholder: placeholder || 'Start writing your story...',
      }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-slate prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[500px] p-8 prose-headings:text-aerojet-blue prose-headings:font-black prose-headings:tracking-tight prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-aerojet-blue prose-a:text-aerojet-sky prose-a:font-bold prose-a:no-underline hover:prose-a:underline',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Sync value from outside if needed (e.g. after initial load)
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) return null

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white ring-offset-white focus-within:ring-2 focus-within:ring-aerojet-blue/20 dark:border-slate-800 dark:bg-slate-900/50 dark:ring-offset-slate-950">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-slate-100 bg-white/80 p-2 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-blue-50 text-aerojet-blue dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-500 transition-all duration-150 ease-out hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60'}`}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-blue-50 text-aerojet-blue dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-500 transition-all duration-150 ease-out hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60'}`}
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-50 text-aerojet-blue dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-500 transition-all duration-150 ease-out hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60'}`}
        >
          <Heading1 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-50 text-aerojet-blue dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-500 transition-all duration-150 ease-out hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60'}`}
        >
          <Heading2 className="h-4 w-4" />
        </button>

        <div className="mx-1 h-6 w-px bg-slate-100 dark:bg-slate-800" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-blue-50 text-aerojet-blue dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-500 transition-all duration-150 ease-out hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60'}`}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-blue-50 text-aerojet-blue dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-500 transition-all duration-150 ease-out hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60'}`}
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${editor.isActive('blockquote') ? 'bg-blue-50 text-aerojet-blue dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-500 transition-all duration-150 ease-out hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60'}`}
        >
          <Quote className="h-4 w-4" />
        </button>

        <div className="mx-1 h-6 w-px bg-slate-100 dark:bg-slate-800" />

        <button
          type="button"
          onClick={() => {
            const url = window.prompt('URL')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${editor.isActive('link') ? 'bg-blue-50 text-aerojet-blue dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-500 transition-all duration-150 ease-out hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60'}`}
        >
          <LinkIcon className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setActiveMediaTab(activeMediaTab === 'IMAGE' ? null : 'IMAGE')}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${activeMediaTab === 'IMAGE' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 transition-all duration-150 ease-out hover:bg-slate-100'}`}
        >
          <ImageIcon className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setActiveMediaTab(activeMediaTab === 'AUDIO' ? null : 'AUDIO')}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${activeMediaTab === 'AUDIO' ? 'bg-purple-50 text-purple-600' : 'text-slate-500 transition-all duration-150 ease-out hover:bg-slate-100'}`}
        >
          <Music className="h-4 w-4" />
        </button>

        <div className="mx-1 h-6 w-px bg-slate-100 dark:bg-slate-800" />

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-50 text-aerojet-blue dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-500 transition-all duration-150 ease-out hover:bg-slate-100'}`}
        >
          <AlignLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-50 text-aerojet-blue dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-500 transition-all duration-150 ease-out hover:bg-slate-100'}`}
        >
          <AlignCenter className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-50 text-aerojet-blue dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-500 transition-all duration-150 ease-out hover:bg-slate-100'}`}
        >
          <AlignRight className="h-4 w-4" />
        </button>

        <div className="mx-1 h-6 w-px bg-slate-100 dark:bg-slate-800" />

        <button
          type="button"
          onClick={() => setActiveMediaTab(activeMediaTab === 'COLOR' ? null : 'COLOR')}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${activeMediaTab === 'COLOR' ? 'bg-pink-50 text-pink-600' : 'text-slate-500 transition-all duration-150 ease-out hover:bg-slate-100'}`}
        >
          <Palette className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setActiveMediaTab(activeMediaTab === 'FONT' ? null : 'FONT')}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${activeMediaTab === 'FONT' ? 'bg-teal-50 text-teal-600' : 'text-slate-500 transition-all duration-150 ease-out hover:bg-slate-100'}`}
        >
          <CaseSensitive className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setActiveMediaTab(activeMediaTab === 'SPACING' ? null : 'SPACING')}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${activeMediaTab === 'SPACING' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 transition-all duration-150 ease-out hover:bg-slate-100'}`}
        >
          <Pilcrow className="h-4 w-4" />
        </button>

        <div className="mx-1 h-6 w-px bg-slate-100 dark:bg-slate-800" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all duration-150 ease-out hover:bg-slate-100"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all duration-150 ease-out hover:bg-slate-100"
        >
          <Redo className="h-4 w-4" />
        </button>

        <div className="ml-auto flex items-center gap-1 rounded-xl bg-slate-50 p-1 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={() => setMode('WRITE')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all ${
              mode === 'WRITE'
                ? 'bg-white text-aerojet-blue shadow-sm dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:bg-white/60 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-200'
            }`}
          >
            <PenLine className="h-3 w-3" />
            Visual
          </button>
          <button
            type="button"
            onClick={() => setMode('SPLIT')}
            className={`hidden items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all lg:flex ${
              mode === 'SPLIT'
                ? 'bg-white text-aerojet-blue shadow-sm dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:bg-white/60 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-200'
            }`}
          >
            <AlignCenter className="h-3 w-3 rotate-90" />
            Split
          </button>
        </div>
      </div>

      {/* Formatting Drawers */}
      {activeMediaTab === 'COLOR' && (
        <div className="border-b border-slate-50 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
              Text Color
            </h4>
            <button
              onClick={() => setActiveMediaTab(null)}
              className="text-[10px] text-slate-400 hover:text-slate-600"
            >
              Close
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {brandingColors.map((color) => (
              <button
                key={color.name}
                onClick={() => {
                  editor.chain().focus().setColor(color.color).run()
                  setActiveMediaTab(null)
                }}
                className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-1.5 text-[10px] font-medium transition-all duration-150 ease-out hover:border-slate-200 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
              >
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color.color }} />
                {color.name}
              </button>
            ))}
            <button
              onClick={() => {
                editor.chain().focus().unsetColor().run()
                setActiveMediaTab(null)
              }}
              className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-1.5 text-[10px] font-medium transition-all duration-150 ease-out hover:border-slate-200 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {activeMediaTab === 'FONT' && (
        <div className="border-b border-slate-50 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
              Font Family
            </h4>
            <button
              onClick={() => setActiveMediaTab(null)}
              className="text-[10px] text-slate-400 hover:text-slate-600"
            >
              Close
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {fonts.map((font) => (
              <button
                key={font.name}
                onClick={() => {
                  editor.chain().focus().setFontFamily(font.value).run()
                  setActiveMediaTab(null)
                }}
                className={`flex min-w-20 items-center justify-center rounded-lg border border-slate-100 bg-white px-4 py-2 text-[10px] font-bold transition-all duration-150 ease-out hover:border-slate-200 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600`}
                style={{ fontFamily: font.value }}
              >
                {font.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeMediaTab === 'SPACING' && (
        <div className="border-b border-slate-50 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
              Vertical Spacing
            </h4>
            <button
              onClick={() => setActiveMediaTab(null)}
              className="text-[10px] text-slate-400 hover:text-slate-600"
            >
              Close
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {spacingPresets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => {
                  editor
                    .chain()
                    .focus()
                    .insertContent(`<div style="height: ${preset.value}px"></div>`)
                    .run()
                  setActiveMediaTab(null)
                }}
                className={`flex min-w-14 items-center justify-center rounded-lg border border-slate-100 bg-white px-4 py-2 text-[10px] font-bold transition-all duration-150 ease-out hover:border-slate-200 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeMediaTab === 'IMAGE' && (
        <div className="border-b border-slate-50 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
              Insert Image
            </h4>
            <button
              onClick={() => setActiveMediaTab(null)}
              className="text-[10px] text-slate-400 hover:text-slate-600"
            >
              Close
            </button>
          </div>
          <UploadButton
            endpoint="newsImage"
            onClientUploadComplete={(res) => {
              console.log('Image upload response:', res)
              if (res && res[0]) {
                const url =
                  (res[0] as any).ufsUrl || res[0].url || (res[0] as any).serverData?.fileUrl
                editor.chain().focus().setImage({ src: url }).run()
                toast.success(`Image inserted!`)
                setActiveMediaTab(null)
              }
            }}
            onUploadError={(error: Error) => {
              toast.error(`Upload failed: ${error.message}`)
            }}
            appearance={{
              button:
                'ut-ready:bg-slate-900 ut-uploading:cursor-not-allowed rounded-lg px-4 py-2 text-xs font-bold w-full mb-3',
              allowedContent: 'hidden',
            }}
          />
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
            <span className="text-[10px] font-medium text-slate-400 uppercase">Or</span>
            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
          </div>
          <button
            onClick={() => {
              const url = window.prompt('Enter Image URL')
              if (url) {
                editor.chain().focus().setImage({ src: url }).run()
                toast.success(`Image inserted!`)
                setActiveMediaTab(null)
              }
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-all duration-150 ease-out hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600"
          >
            Insert via URL
          </button>
        </div>
      )}

      {activeMediaTab === 'AUDIO' && (
        <div className="border-b border-slate-50 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
              Insert Audio
            </h4>
            <button
              onClick={() => setActiveMediaTab(null)}
              className="text-[10px] text-slate-400 hover:text-slate-600"
            >
              Close
            </button>
          </div>
          <UploadButton
            endpoint="newsAudio"
            onClientUploadComplete={(res) => {
              console.log('Audio upload response:', res)
              if (res && res[0]) {
                const url =
                  (res[0] as any).ufsUrl || res[0].url || (res[0] as any).serverData?.fileUrl
                editor.chain().focus().setAudio({ src: url }).run()
                toast.success(`Audio inserted!`)
                setActiveMediaTab(null)
              }
            }}
            onUploadError={(error: Error) => {
              console.error('Audio upload error:', error)
              toast.error(`Upload failed: ${error.message}`)
            }}
            appearance={{
              button:
                'ut-ready:bg-slate-900 ut-uploading:cursor-not-allowed rounded-lg px-4 py-2 text-xs font-bold w-full mb-3',
              allowedContent: 'hidden',
            }}
          />
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
            <span className="text-[10px] font-medium text-slate-400 uppercase">Or</span>
            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
          </div>
          <button
            onClick={() => {
              const url = window.prompt('Enter Audio URL (mp3, wav, etc.)')
              if (url) {
                editor.chain().focus().setAudio({ src: url }).run()
                toast.success(`Audio inserted!`)
                setActiveMediaTab(null)
              }
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-all duration-150 ease-out hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600"
          >
            Insert via URL
          </button>
        </div>
      )}

      {/* Editor Content */}
      <div className="relative">
        <div
          className={`grid ${mode === 'SPLIT' ? 'lg:grid-cols-2 lg:divide-x lg:divide-slate-100 dark:lg:divide-slate-800' : 'grid-cols-1'}`}
        >
          <div className="relative">
            <EditorContent editor={editor} />
          </div>

          {mode === 'SPLIT' && (
            <div className="max-h-[800px] overflow-y-auto bg-slate-50/30 p-8 dark:bg-slate-950/30">
              <div
                className="prose prose-slate prose-lg dark:prose-invert prose-headings:text-aerojet-blue prose-headings:font-black prose-headings:tracking-tight prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-aerojet-blue prose-a:text-aerojet-sky prose-a:font-bold prose-a:no-underline hover:prose-a:underline max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(editor.getHTML()) }}
              />
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror audio {
          width: 100%;
          border-radius: 0.75rem;
          margin: 1rem 0;
        }
        .prose audio {
          width: 100%;
          border-radius: 0.75rem;
          margin: 1.5rem 0;
          display: block;
        }
      `}</style>
    </div>
  )
}
