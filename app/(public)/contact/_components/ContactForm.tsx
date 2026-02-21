'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Send, CheckCircle2 } from 'lucide-react'

export default function ContactForm() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [data, setData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone,
          subject: data.subject,
          message: data.message,
        }),
      })

      const responseData = await res.json()

      if (res.ok) {
        setSubmitted(true)
        toast.success('Message sent successfully!')
      } else {
        toast.error(responseData.error || 'Failed to send message')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="mb-2 text-xl font-black text-[#002a5c]">Message Sent!</h3>
        <p className="max-w-xs text-sm text-slate-500">
          Thank you for reaching out. Our admissions team will get back to you via email shortly.
        </p>
        <button
          onClick={() => {
            setSubmitted(false)
            setData({ firstName: '', lastName: '', email: '', phone: '', subject: '', message: '' })
          }}
          className="mt-6 text-xs font-bold tracking-widest text-[#4c9ded] uppercase hover:underline"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-widest text-slate-700 uppercase">
            First Name
          </label>
          <input
            required
            type="text"
            placeholder="John"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-[#4c9ded]"
            value={data.firstName}
            onChange={(e) => setData({ ...data, firstName: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-widest text-slate-700 uppercase">
            Last Name
          </label>
          <input
            required
            type="text"
            placeholder="Doe"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-[#4c9ded]"
            value={data.lastName}
            onChange={(e) => setData({ ...data, lastName: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold tracking-widest text-slate-700 uppercase">
          Email Address
        </label>
        <input
          required
          type="email"
          placeholder="john@example.com"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-[#4c9ded]"
          value={data.email}
          onChange={(e) => setData({ ...data, email: e.target.value })}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold tracking-widest text-slate-700 uppercase">
          Phone Number <span className="font-normal text-slate-400 normal-case">(optional)</span>
        </label>
        <input
          type="tel"
          placeholder="+233 XX XXX XXXX"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-[#4c9ded]"
          value={data.phone}
          onChange={(e) => setData({ ...data, phone: e.target.value })}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold tracking-widest text-slate-700 uppercase">
          Subject
        </label>
        <div className="relative">
          <select
            required
            value={data.subject}
            onChange={(e) => setData({ ...data, subject: e.target.value })}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-[#4c9ded]"
          >
            <option value="" disabled>
              Select a subject...
            </option>
            <option value="EASA Part-66 Full-Time Programme">
              EASA Part-66 Full-Time Programme
            </option>
            <option value="Modular Training">Modular Training</option>
            <option value="Exam Only">Exam Only</option>
            <option value="Revision Support">Revision Support</option>
            <option value="Fees & Payment">Fees & Payment</option>
            <option value="General Enquiry">General Enquiry</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
            <svg
              className="h-4 w-4 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold tracking-widest text-slate-700 uppercase">
          Message
        </label>
        <textarea
          required
          minLength={10}
          rows={5}
          placeholder="Tell us about your enquiry..."
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-[#4c9ded]"
          value={data.message}
          onChange={(e) => setData({ ...data, message: e.target.value })}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#002a5c] py-4 font-bold text-white shadow-lg transition-all hover:bg-[#4c9ded]"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            Send Message <Send className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  )
}
