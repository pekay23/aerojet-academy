'use client'

interface Question {
  questionId: string
  category: string
  questionType: string
  text: string
  options: string[] | null
  selectedAnswer: string | null
}

interface QuestionCardProps {
  question: Question
  index: number
  total: number
  onAnswer: (questionId: string, answer: string) => void
}

export default function QuestionCard({ question, index, total, onAnswer }: QuestionCardProps) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black tracking-widest text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          Question {index + 1} of {total}
        </span>
        <span className="text-xs font-bold text-aerojet-blue">{question.category.replace('_', ' ')}</span>
      </div>

      <h2 className="mb-8 text-xl font-medium leading-relaxed text-slate-800 dark:text-slate-200 md:text-2xl">
        {question.text}
      </h2>

      <div className="space-y-3">
        {question.questionType === 'MCQ' && question.options && Array.isArray(question.options) && (
          question.options.map((opt: string, i: number) => (
            <button
              key={i}
              onClick={() => onAnswer(question.questionId, opt)}
              className={`w-full rounded-xl border p-4 text-left transition-all ${
                question.selectedAnswer === opt
                  ? 'border-aerojet-blue bg-blue-50/50 shadow-sm dark:border-blue-500 dark:bg-blue-900/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold ${
                  question.selectedAnswer === opt 
                    ? 'border-aerojet-blue bg-aerojet-blue text-white dark:border-blue-500 dark:bg-blue-500' 
                    : 'border-slate-300 text-slate-500 dark:border-slate-700'
                }`}>
                  {String.fromCharCode(65 + i)}
                </div>
                <span className={`font-medium ${question.selectedAnswer === opt ? 'text-aerojet-blue dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {opt}
                </span>
              </div>
            </button>
          ))
        )}

        {question.questionType === 'TRUE_FALSE' && (
          ['True', 'False'].map((opt) => (
            <button
              key={opt}
              onClick={() => onAnswer(question.questionId, opt)}
              className={`w-full rounded-xl border p-4 text-left transition-all ${
                question.selectedAnswer === opt
                  ? 'border-aerojet-blue bg-blue-50/50 shadow-sm dark:border-blue-500 dark:bg-blue-900/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold ${
                  question.selectedAnswer === opt 
                    ? 'border-aerojet-blue bg-aerojet-blue text-white dark:border-blue-500 dark:bg-blue-500' 
                    : 'border-slate-300 text-slate-500 dark:border-slate-700'
                }`}>
                  {opt.charAt(0)}
                </div>
                <span className={`font-medium ${question.selectedAnswer === opt ? 'text-aerojet-blue dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {opt}
                </span>
              </div>
            </button>
          ))
        )}

        {question.questionType === 'NUMERIC_INPUT' && (
          <div className="pt-2">
            <input
              type="number"
              value={question.selectedAnswer || ''}
              onChange={(e) => onAnswer(question.questionId, e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-4 text-lg font-medium shadow-sm focus:border-aerojet-blue focus:outline-none focus:ring-2 focus:ring-aerojet-blue/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-blue-500"
              placeholder="Enter exact number..."
            />
          </div>
        )}
      </div>
    </div>
  )
}
