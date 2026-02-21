import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Aerojet Aviation uses and protects your data.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-50 pt-20">
      <div className="grow container mx-auto px-6 py-12 max-w-4xl">
        <div className="bg-white p-8 md:p-16 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden">

          {/* Header */}
          <div className="mb-12 border-b border-slate-100 pb-8 text-center md:text-left">
            <span className="bg-blue-50 text-[#4c9ded] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
              Legal Policy
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-aerojet-blue uppercase tracking-tight leading-tight">
              Website Privacy Policy
            </h1>
            <p className="text-slate-400 mt-4 font-medium text-sm italic">
              Last Updated: February 2026
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-slate max-w-none 
            prose-headings:text-[#002a5c] prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-headings:mt-10 prose-headings:mb-4
            prose-p:text-slate-600 prose-p:leading-relaxed prose-p:mb-6
            prose-strong:text-slate-900 prose-strong:font-bold
            prose-li:text-slate-600 prose-li:my-1
            prose-a:text-[#4c9ded] prose-a:no-underline prose-a:font-bold hover:prose-a:underline hover:prose-a:text-[#002a5c] transition-colors">

            <p className="text-lg font-medium text-slate-700">
              This privacy policy ("policy") will help you understand how <strong className="text-aerojet-blue">Aerojet Aviation</strong> ("us", "we", "our") uses and protects the data you provide to us when you visit and use <Link href="/" className="text-aerojet-blue hover:underline">www.aerojet-academy.com</Link>.
            </p><br></br>

            <p className="text-lg font-medium text-slate-700">
              We reserve the right to change this policy at any given time, of which you will be promptly updated. If you want to make sure that you are up to date with the latest changes, we advise you to frequently visit this page.
            </p><br></br>

            <h3><strong>What User Data We Collect</strong></h3>
            <p className="text-lg font-medium text-slate-700">When you visit the website, we may collect the following data:</p>
            <ul className="list-disc pl-6 space-y-2 marker:text-[#4c9ded] text-lg font-medium text-slate-700">
              <li>Your IP address.</li>
              <li>First name and last name.</li>
              <li>Your contact information and email address.</li>
              <li>Other information such as interests and preferences.</li>
            </ul><br></br>

            <h3><strong>Why We Collect Your Data</strong></h3>
            <p className="text-lg font-medium text-slate-700">We are collecting your data for several reasons:</p>
            <ul className="list-disc pl-6 space-y-2 marker:text-[#4c9ded] text-lg font-medium text-slate-700" >
              <li>To better understand your needs.</li>
              <li>To improve our services and products.</li>
              <li>To send you promotional emails containing the information we think you will find interesting.</li>
              <li>To contact You.</li>
              <li>For other purposes: We may use Your information for other purposes, such as data analysis, identifying usage trends, determining the effectiveness of our promotional campaigns and to evaluate and improve our Service, products, services, marketing and your experience.</li>
            </ul><br></br>

            <h3><strong>Retention of Your Personal Data</strong></h3>
            <p className="text-lg font-medium text-slate-700">
              The Company will retain Your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use Your Personal Data to the extent necessary to comply with our legal obligations (for example, if we are required to retain your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies.
            </p>
            <p className="text-lg font-medium text-slate-700">
              The Company will also retain Usage Data for internal analysis purposes. Usage Data is generally retained for a shorter period of time, except when this data is used to strengthen the security or to improve the functionality of Our Service, or We are legally obligated to retain this data for longer time periods.
            </p>
            <br></br>

            <h3><strong>Safeguarding and Securing the Data</strong></h3>
            <p className="text-lg font-medium text-slate-700">
              <strong>Aerojet Aviation</strong> is committed to securing your data and keeping it confidential. Aerojet Aviation has done all in its power to prevent data theft, unauthorized access, and disclosure by implementing the latest technologies and software, which help us safeguard all the information we collect online.
            </p>
            <br></br>

            <h2><strong>Disclosure of Your Personal Data</strong></h2>
            <br></br>

            <p className="text-lg font-medium text-slate-700"><strong>Business Transactions</strong><br />
              If the Company is involved in a merger, acquisition or asset sale, Your Personal Data may be transferred. We will provide notice before Your Personal Data is transferred and becomes subject to a different Privacy Policy.</p>
            <br></br>

            <p className="text-lg font-medium text-slate-700"><strong>Law Enforcement</strong><br />
              Under certain circumstances, the Company may be required to disclose Your Personal Data if required to do so by law or in response to valid requests by public authorities (e.g. a court or a government agency).</p>
            <br></br>
            <p className="text-lg font-medium text-slate-700"><strong>Other Legal Requirements</strong><br />
              The Company may disclose Your Personal Data in the good faith belief that such action is necessary to:</p>
            <ul className="list-disc pl-6 space-y-2 marker:text-[#4c9ded]">
              <li className="text-lg font-medium text-slate-700">Comply with a legal obligation.</li>
              <li className="text-lg font-medium text-slate-700">Protect and defend the rights or property of the Company.</li>
              <li className="text-lg font-medium text-slate-700">Prevent or investigate possible wrongdoing in connection with the Service.</li>
              <li className="text-lg font-medium text-slate-700">Protect the personal safety of Users of the Service or the public.</li>
              <li className="text-lg font-medium text-slate-700">Protect against legal liability.</li>
            </ul>
            <br></br>

            <h3><strong>Our Cookie Policy</strong></h3>
            <p className="text-lg font-medium text-slate-700">
              Once you agree to allow our website to use cookies, you also agree to use the data it collects regarding your online behavior (analyze web traffic, web pages you visit and spend the most time on).
            </p><br></br>
            <p className="text-lg font-medium text-slate-700">
              The data we collect by using cookies is used to customize our website to your needs. After we use the data for statistical analysis, the data is completely removed from our systems. Please note that cookies don't allow us to gain control of your computer in any way. They are strictly used to monitor which pages you find useful and which you do not so that we can provide a better experience for you.
            </p><br></br>
            <p className="text-lg font-medium text-slate-700">
              If you want to disable cookies, you can do it by accessing the settings of your internet browser. You can visit <Link href="https://www.internetcookies.com" target="_blank" rel="noopener noreferrer">https://www.internetcookies.com</Link>, which contains comprehensive information on how to do this on a wide variety of browsers and devices.
            </p><br></br>

            <h3><strong>"Do Not Track" Policy</strong></h3>
            <p className="text-lg font-medium text-slate-700">
              Our Service does not respond to Do Not Track signals. However, some third-party websites do keep track of Your browsing activities. If You are visiting such websites, You can set Your preferences in Your web browser to inform websites that You do not want to be tracked. You can enable or disable DNT by visiting the preferences or settings page of Your web browser.
            </p><br></br>

            <h3><strong>Children's Privacy</strong></h3>
            <p className="text-lg font-medium text-slate-700">
              Our Service does not address anyone under the age of 16. We do not knowingly collect personally identifiable information from anyone under the age of 16. If You are a parent or guardian and You are aware that Your child has provided Us with Personal Data, please contact Us. If We become aware that We have collected Personal Data from anyone under the age of 16 without verification of parental consent, We take steps to remove that information from Our servers.
            </p><br></br>

            <h3><strong>Links to Other Websites</strong></h3>
            <p className="text-lg font-medium text-slate-700">
              Our website contains links that lead to other websites. If you click on these links Aerojet Aviation is not held responsible for your data and privacy protection. Visiting those websites is not governed by this privacy policy agreement. Make sure to read the privacy policy documentation of the website you go to from our website.
            </p><br></br>

            <h3><strong>Restricting the Collection of your Personal Data</strong></h3>
            <p className="text-lg font-medium text-slate-700">At some point, you might wish to restrict the use and collection of your personal data. You can achieve this by doing the following:</p>
            <ul className="list-disc pl-6 space-y-2 marker:text-[#4c9ded]">
              <li className="text-lg font-medium text-slate-700">When you are filling the forms on the website, make sure to check if there is a box which you can leave unchecked, if you don't want to disclose your personal information.</li>
              <li className="text-lg font-medium text-slate-700">If you have already agreed to share your information with us, feel free to contact us via email and we will be more than happy to change this for you.</li>
            </ul><br></br>
            <p className="text-lg font-medium text-slate-700">
              Aerojet Aviation will not lease, sell or distribute your personal information to any third parties, unless we have your permission. We might do so if the law forces us. Your personal information will be used when we need to send you promotional materials if you agree to this privacy policy.
            </p>

            {/* Contact Section */}
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 mt-12 not-prose">
              <h3 className="text-xl font-black text-aerojet-blue uppercase tracking-tight mb-4">Contact Us</h3>
              <p className="text-slate-600 text-sm mb-4">If you have any questions about this Privacy Policy, You can contact us:</p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-[#4c9ded] font-bold">•</span>
                  <span>By visiting this page on our website: <Link href="/" className="text-[#4c9ded] font-bold hover:underline">www.aerojet-academy.com</Link></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#4c9ded] font-bold">•</span>
                  <span>By sending us an email: <a href="mailto:info@aerojet-academy.com" className="text-[#4c9ded] font-bold hover:underline">info@aerojet-academy.com</a></span>
                </li>
              </ul>
            </div>

            {/* Footer Section inside Card */}
            <div className="mt-16 pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 not-prose">
              <div>
                <p className="font-black text-aerojet-blue uppercase text-sm">Have Questions?</p>
                <p className="text-xs text-slate-500">Contact our Data Protection Officer.</p>
              </div>
              <div className="flex items-center gap-6">
                <Link href="/contact" className="text-[#4c9ded] font-bold text-xs uppercase tracking-widest hover:underline">
                  Contact Us
                </Link>
                <Link href="/register" className="bg-aerojet-sky text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-aerojet-blue transition-all shadow-md">
                  Start Registration
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
