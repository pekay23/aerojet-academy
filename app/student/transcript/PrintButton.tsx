'use client'

import { Download } from 'lucide-react'

export default function DownloadTranscriptButton() {
  return (
    <a
      href="/api/pdf/student-transcript"
      target="_blank"
      rel="noopener noreferrer"
      className="bg-aerojet-blue hover:bg-aerojet-blue/90 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition-colors print:hidden"
    >
      <Download className="h-4 w-4" />
      Download PDF
    </a>
  )
}
