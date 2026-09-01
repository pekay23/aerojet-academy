import 'server-only'

export interface ExtractedQuestion {
  text: string
  options: string[]
  correctAnswer: string
  subTopic?: string
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
  points?: number
  explanation?: string
  confidence: number
  rawText: string
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

function splitQuestions(raw: string): string[] {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim())
  const chunks: string[] = []
  let current: string[] = []

  for (const line of lines) {
    if (/^(Question\s+\d+|Q\d+|\d+\.)\b/i.test(line.trim())) {
      if (current.length) chunks.push(current.join('\n'))
      current = [line]
    } else {
      current.push(line)
    }
  }
  if (current.length) chunks.push(current.join('\n'))
  return chunks
}

function parseOptionLine(line: string): { label: string; text: string } | null {
  const m = line.trim().match(/^([A-F])[\.\)\-]\s*(.+)$/i)
  if (!m) return null
  return { label: m[1].toUpperCase(), text: m[2].trim() }
}

function detectCorrectAnswer(text: string): string | null {
  const patterns = [
    /(?:Answer|Correct|✓|✔|Right answer)[\s:]+([A-F])/i,
    /(?:=>|→)\s*([A-F])$/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return m[1].toUpperCase()
  }
  return null
}

export function detectConfidence(q: ExtractedQuestion): number {
  let score = 0
  if (q.text.length > 20) score += 0.3
  if (q.options.length >= 3) score += 0.3
  if (q.correctAnswer) score += 0.2
  if (q.options.some((o) => o.toLowerCase().includes(q.correctAnswer?.toLowerCase() || ''))) score += 0.2
  return Math.min(1, score)
}

export function classifySeverity(confidence: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (confidence < 0.5) return 'LOW'
  if (confidence < 0.8) return 'MEDIUM'
  return 'HIGH'
}

export async function extractFromTxt(content: string): Promise<ExtractedQuestion[]> {
  const chunks = splitQuestions(content)
  return chunks.map((chunk) => {
    const lines = chunk.split(/\r?\n/)
    const options: { label: string; text: string }[] = []
    let text = ''
    let correctAnswer: string | null = null

    for (const line of lines) {
      const parsed = parseOptionLine(line)
      if (parsed) {
        options.push(parsed)
      } else if (!correctAnswer) {
        text += (text ? ' ' : '') + line.trim()
      }
      correctAnswer = detectCorrectAnswer(chunk) || correctAnswer
    }

    const question: ExtractedQuestion = {
      text: text.replace(/\s+/g, ' ').trim(),
      options: options.map((o) => o.text),
      correctAnswer: correctAnswer || options[0]?.label || 'A',
      confidence: 0,
      rawText: chunk,
    }
    question.confidence = detectConfidence(question)
    return question
  })
}

export async function extractFromJson(content: string): Promise<ExtractedQuestion[]> {
  const parsed = JSON.parse(content)
  const arr = Array.isArray(parsed) ? parsed : [parsed]
  return arr.map((q: any) => {
    const question: ExtractedQuestion = {
      text: q.text || '',
      options: Array.isArray(q.options) ? q.options : [],
      correctAnswer: q.correctAnswer || q.correct_answer || '',
      subTopic: q.subTopic || q.sub_topic,
      difficulty: q.difficulty,
      points: q.points,
      explanation: q.explanation,
      confidence: 0,
      rawText: JSON.stringify(q),
    }
    question.confidence = detectConfidence(question)
    return question
  })
}

export async function extractFromDocx(buffer: Buffer): Promise<ExtractedQuestion[]> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  return extractFromTxt(result.value)
}

export async function extractFromPdf(buffer: Buffer): Promise<ExtractedQuestion[]> {
  const { PDFParse } = await import('pdf-parse')
  const parser = new PDFParse({ data: buffer })
  const result = await parser.getText()
  return extractFromTxt(result.text)
}
