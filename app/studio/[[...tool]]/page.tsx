"use client"

import { NextStudio } from 'next-sanity/studio'
import config from '../../../sanity.config' // Adjust path to root config

export default function StudioPage() {
  return <NextStudio config={config} />
}
