'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Loader2, Send, CheckCircle2 } from 'lucide-react'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'

export default function ContactForm() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { executeRecaptcha } = useGoogleReCaptcha()
  const [data, setData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    confirm_email: '',
  })

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)

      if (!executeRecaptcha) {
        toast.error('ReCAPTCHA not ready. Please try again later.')
        setLoading(false)
        return
      }

      try {
        const captchaToken = await executeRecaptcha('contact_form')

        const res = await fetch('/api/public/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${data.firstName} ${data.lastName}`,
            email: data.email,
            phone: data.phone,
            subject: data.subject,
            message: data.message,
            confirm_email: data.confirm_email,
            captchaToken,
          }),
        })

        const responseData = await res.json()

        if (res.ok) {
          setSubmitted(true)
          toast.success('Message sent successfully!')
        } else {
          toast.error(responseData.error || 'Failed to send message')
        }
      } catch (error) {
        console.error('Contact form error:', error)
        toast.error('Something went wrong. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [data, executeRecaptcha]
  )

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="mb-2 text-xl font-black text-aerojet-blue">Message Sent!</h3>
        <p className="max-w-xs text-sm text-slate-500">
          Thank you for reaching out. Our admissions team will get back to you via email shortly.
        </p>
        <button
          onClick={() => {
            setSubmitted(false)
            setData({
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              subject: '',
              message: '',
              confirm_email: '',
            })
          }}
          className="mt-6 text-xs font-bold tracking-widest text-aerojet-sky uppercase hover:underline"
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
          <label htmlFor="firstName" className="mb-1.5 block text-sm font-bold tracking-widest text-slate-700 uppercase">
            First Name
          </label>
          <input
            id="firstName"
            required
            type="text"
            placeholder="John"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-aerojet-sky"
            value={data.firstName}
            onChange={(e) => setData({ ...data, firstName: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="lastName" className="mb-1.5 block text-sm font-bold tracking-widest text-slate-700 uppercase">
            Last Name
          </label>
          <input
            id="lastName"
            required
            type="text"
            placeholder="Doe"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-aerojet-sky"
            value={data.lastName}
            onChange={(e) => setData({ ...data, lastName: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-bold tracking-widest text-slate-700 uppercase">
          Email Address
        </label>
        <input
          id="email"
          required
          type="email"
          placeholder="john@example.com"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-aerojet-sky"
          value={data.email}
          onChange={(e) => setData({ ...data, email: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="phone" className="mb-1.5 block text-sm font-bold tracking-widest text-slate-700 uppercase">
          Phone Number <span className="font-normal text-slate-400 normal-case">(optional)</span>
        </label>
        <input
          id="phone"
          type="tel"
          placeholder="+233 XX XXX XXXX"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-aerojet-sky"
          value={data.phone}
          onChange={(e) => {
            // strip out any characters that are not numbers, spaces, or valid symbols
            const val = e.target.value.replace(/[^0-9+\-\s()]/g, '')
            setData({ ...data, phone: val })
          }}
        />
      </div>

      <div>
        <label htmlFor="subject" className="mb-1.5 block text-sm font-bold tracking-widest text-slate-700 uppercase">
          Subject
        </label>
        <div className="relative">
          <select
            id="subject"
            required
            value={data.subject}
            onChange={(e) => setData({ ...data, subject: e.target.value })}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-aerojet-sky"
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
        <label htmlFor="message" className="mb-1.5 block text-sm font-bold tracking-widest text-slate-700 uppercase">
          Message
        </label>
        <textarea
          id="message"
          required
          minLength={10}
          rows={5}
          placeholder="Tell us about your enquiry..."
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-aerojet-sky"
          value={data.message}
          onChange={(e) => setData({ ...data, message: e.target.value })}
        />
      </div>

      {/* Honeypot field for bots - Wrapped and labeled to satisfy accessibility scanners and silence console logs */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <label htmlFor="confirm_email">Do not fill this field</label>
        <input
          id="confirm_email"
          type="text"
          name="confirm_email"
          autoComplete="off"
          tabIndex={-1}
          value={data.confirm_email}
          onChange={(e) => setData({ ...data, confirm_email: e.target.value })}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-aerojet-blue py-4 font-bold text-white shadow-lg transition-all hover:bg-aerojet-sky"
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
