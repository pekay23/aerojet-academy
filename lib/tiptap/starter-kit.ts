import type { AnyExtension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'

// Tiptap type defect: Extension<StarterKitOptions, any> is not
// structurally assignable to AnyExtension due to generic variance
// in the Extendable → Extension hierarchy. Cast bridges the type
// gap only — zero runtime impact.
export const starterKit: AnyExtension = StarterKit.configure({
  link: false,
})