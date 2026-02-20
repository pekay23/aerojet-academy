"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Award, Globe, Users } from "lucide-react";

const stats = [
  { icon: ShieldCheck, label: "EASA Part 147 Certified", value: "Certified" },
  { icon: Award, label: "Licence Categories", value: "B1 & B2" },
  { icon: Globe, label: "International Recognition", value: "Worldwide" },
  { icon: Users, label: "Max Class Size", value: "28 Students" },
];

export default function TrustStrip() {
  return (
    <section className="relative z-20 -mt-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100 grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100"
        >
          {stats.map((stat, i) => (
            <div key={i} className="p-5 sm:p-8 text-center group">
              <stat.icon className="w-6 h-6 mx-auto mb-3 text-[#4c9ded] group-hover:scale-110 transition-transform duration-300" />
              <div className="text-lg sm:text-2xl font-black text-[#002a5c] tracking-tight">{stat.value}</div>
              <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}