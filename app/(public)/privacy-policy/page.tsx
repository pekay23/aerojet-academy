import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy Policy | Aerojet Academy" };

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-slate-50 pt-20">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white p-6 sm:p-14 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100">
          <div className="mb-10 border-b border-slate-100 pb-6">
            <span className="bg-blue-50 text-aerojet-sky px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4 inline-block">Legal Policy</span>
            <h1 className="text-3xl sm:text-4xl font-black text-aerojet-blue dark:text-white uppercase tracking-tight">Website Privacy Policy</h1>
            <p className="text-slate-400 mt-3 text-sm italic">Last Updated: February 2026</p>
          </div>

          <div className="prose prose-slate max-w-none prose-headings:text-aerojet-blue prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-p:text-slate-600 prose-p:leading-relaxed prose-a:text-aerojet-sky prose-a:font-bold prose-a:no-underline hover:prose-a:underline">
            <p className="text-lg">This privacy policy will help you understand how <strong>Aerojet Aviation</strong> uses and protects the data you provide when you visit <Link href="/">www.aerojet-academy.com</Link>.</p>

            <h3>What User Data We Collect</h3>
            <p>When you visit the website, we may collect your IP address, first and last name, contact information and email address, and other information such as interests and preferences.</p>

            <h3>Why We Collect Your Data</h3>
            <p>We collect your data to better understand your needs, improve our services, send you promotional emails, contact you, and for data analysis and identifying usage trends.</p>

            <h3>Retention of Your Personal Data</h3>
            <p>We retain your Personal Data only for as long as necessary for the purposes set out in this Privacy Policy, including to comply with legal obligations, resolve disputes, and enforce our agreements.</p>

            <h3>Safeguarding and Securing the Data</h3>
            <p>Aerojet Aviation is committed to securing your data by implementing the latest technologies and software to prevent data theft, unauthorised access, and disclosure.</p>

            <h3>Our Cookie Policy</h3>
            <p>Once you agree to allow our website to use cookies, you also agree to use the data it collects regarding your online behaviour. Cookies are strictly used to monitor which pages you find useful.</p>

            <h3>Children's Privacy</h3>
            <p>Our Service does not address anyone under the age of 16. We do not knowingly collect personally identifiable information from anyone under the age of 16.</p>

            <h3>Links to Other Websites</h3>
            <p>Our website contains links to other websites. Visiting those websites is not governed by this privacy policy agreement.</p>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mt-10 not-prose">
              <h3 className="text-lg font-black text-aerojet-blue uppercase tracking-tight mb-3">Contact Us</h3>
              <p className="text-slate-600 text-sm mb-3">Questions about this policy?</p>
              <p className="text-sm">Email: <a href="mailto:info@aerojet-academy.com" className="text-aerojet-sky font-bold">info@aerojet-academy.com</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}