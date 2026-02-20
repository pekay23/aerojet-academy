"use client";

import { motion } from "framer-motion";

const steps = [
  { num: "01", title: "Register Online", desc: "Pay the GHS 350 registration fee and create your portal account." },
  { num: "02", title: "Complete Application", desc: "Submit your documents and complete the online application form." },
  { num: "03", title: "Get Approved", desc: "Our team reviews your application and issues a confirmation invoice." },
  { num: "04", title: "Begin Training", desc: "Pay your confirmation fee, get onboarded, and start your journey." },
];

export default function EnrollmentSteps() {
  return (
    <section className="py-20 sm:py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-[#4c9ded] font-bold text-xs uppercase tracking-[0.2em] mb-3 block">How to Enroll</span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#002a5c] uppercase tracking-tight">
            Four Simple Steps
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative group"
            >
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 hover:shadow-xl hover:border-[#4c9ded] transition-all duration-500 h-full">
                <span className="text-5xl sm:text-6xl font-black text-public-secondary group-hover:text-public-primary transition-colors duration-300 block leading-none">
                  {step.num}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-4 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
              {/* Connector line on desktop */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-slate-200" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}