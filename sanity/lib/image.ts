import { createImageUrlBuilder } from '@sanity/image-url'
import type { Image } from 'sanity'

import { dataset, projectId } from '../env'

const builder = createImageUrlBuilder({
  projectId: projectId || '',
  dataset: dataset || '',
})

export function urlForImage(source: Image) {
  // Correctly return the builder instance
  return builder.image(source)
}

/** Alias for urlForImage for backward compatibility */
export const urlFor = urlForImage
