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
          <div className="mb-12 border-b border-slate-100 pb-8">
            <span className="bg-blue-50 text-[#4c9ded] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
                Legal Policy
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-aerojet-blue uppercase tracking-tight leading-tight">
              Privacy Policy
            </h1>
            <p className="text-slate-400 mt-4 font-medium text-sm italic">
              Last Updated: February 2026
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-slate max-w-none 
            prose-headings:text-[#002a5c] prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
            prose-p:text-slate-600 prose-p:leading-relaxed
            prose-strong:text-slate-900 prose-strong:font-bold
            prose-li:text-slate-600 prose-a:text-[#4c9ded] prose-a:no-underline prose-a:font-bold hover:prose-a:underline">
            
            <p className="text-lg font-medium text-slate-700">
              This privacy policy ("policy") will help you understand how <strong className="text-aerojet-blue">Aerojet Aviation</strong> ("us", "we", "our") uses and protects the data you provide to us when you visit and use <Link href="https://www.aerojet-academy.com">www.aerojet-academy.com</Link>.
            </p>
            <p>
              We reserve the right to change this policy at any given time, of which you will be promptly updated. If you want to make sure that you are up to date with the latest changes, we advise you to frequently visit this page.
            </p>

            <h3>What User Data We Collect</h3>
            <p>When you visit the website, we may collect the following data:</p>
            <ul>
              <li>Your IP address.</li>
              <li>First name and last name.</li>
              <li>Your contact information and email address.</li>
              <li>Other information such as interests and preferences.</li>
            </ul>

            <h3>Why We Collect Your Data</h3>
            <p>We are collecting your data for several reasons:</p>
            <ul>
              <li>To better understand your needs.</li>
              <li>To improve our services and products.</li>
              <li>To send you promotional emails containing the information we think you will find interesting.</li>
              <li>To contact You.</li>
              <li>For other purposes: We may use Your information for other purposes, such as data analysis, identifying usage trends, determining the effectiveness of our promotional campaigns and to evaluate and improve our Service, products, services, marketing and your experience.</li>
            </ul>

            <h3>Retention of Your Personal Data</h3>
            <p>
              The Company will retain Your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use Your Personal Data to the extent necessary to comply with our legal obligations (for example, if we are required to retain your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies.
            </p>
            <p>
              The Company will also retain Usage Data for internal analysis purposes. Usage Data is generally retained for a shorter period of time, except when this data is used to strengthen the security or to improve the functionality of Our Service, or We are legally obligated to retain this data for longer time periods.
            </p>

            <h3>Safeguarding and Securing the Data</h3>
            <p>
              <strong>Aerojet Aviation</strong> is committed to securing your data and keeping it confidential. Aerojet Aviation has done all in its power to prevent data theft, unauthorized access, and disclosure by implementing the latest technologies and software, which help us safeguard all the information we collect online.
            </p>

            <h3>Disclosure of Your Personal Data</h3>
            <p><strong>Business Transactions:</strong> If the Company is involved in a merger, acquisition or asset sale, Your Personal Data may be transferred. We will provide notice before Your Personal Data is transferred and becomes subject to a different Privacy Policy.</p>
            <p><strong>Law enforcement:</strong> Under certain circumstances, the Company may be required to disclose Your Personal Data if required to do so by law or in response to valid requests by public authorities (e.g. a court or a government agency).</p>
            <p><strong>Other legal requirements:</strong> The Company may disclose Your Personal Data in the good faith belief that such action is necessary to:</p>
            <ul>
              <li>Comply with a legal obligation.</li>
              <li>Protect and defend the rights or property of the Company.</li>
              <li>Prevent or investigate possible wrongdoing in connection with the Service.</li>
              <li>Protect the personal safety of Users of the Service or the public.</li>
              <li>Protect against legal liability.</li>
            </ul>

            <h3>Our Cookie Policy</h3>
            <p>
              Once you agree to allow our website to use cookies, you also agree to use the data it collects regarding your online behavior (analyze web traffic, web pages you visit and spend the most time on).
            </p>
            <p>
              The data we collect by using cookies is used to customize our website to your needs. After we use the data for statistical analysis, the data is completely removed from our systems. Please note that cookies don't allow us to gain control of your computer in any way. They are strictly used to monitor which pages you find useful and which you do not so that we can provide a better experience for you.
            </p>
            <p>
              If you want to disable cookies, you can do it by accessing the settings of your internet browser. You can visit <Link href="https://www.internetcookies.com" target="_blank" rel="noopener noreferrer">https://www.internetcookies.com</Link>, which contains comprehensive information on how to do this on a wide variety of browsers and devices.
            </p>

            <h3>"Do Not Track" Policy</h3>
            <p>
              Our Service does not respond to Do Not Track signals. However, some third-party websites do keep track of Your browsing activities. If You are visiting such websites, You can set Your preferences in Your web browser to inform websites that You do not want to be tracked. You can enable or disable DNT by visiting the preferences or settings page of Your web browser.
            </p>

            <h3>Children's Privacy</h3>
            <p>
              Our Service does not address anyone under the age of 16. We do not knowingly collect personally identifiable information from anyone under the age of 16. If You are a parent or guardian and You are aware that Your child has provided Us with Personal Data, please contact Us. If We become aware that We have collected Personal Data from anyone under the age of 16 without verification of parental consent, We take steps to remove that information from Our servers.
            </p>

            <h3>Links to Other Websites</h3>
            <p>
              Our website contains links that lead to other websites. If you click on these links Aerojet Aviation is not held responsible for your data and privacy protection. Visiting those websites is not governed by this privacy policy agreement. Make sure to read the privacy policy documentation of the website you go to from our website.
            </p>

            <h3>Restricting the Collection of your Personal Data</h3>
            <p>At some point, you might wish to restrict the use and collection of your personal data. You can achieve this by doing the following:</p>
            <ul>
              <li>When you are filling the forms on the website, make sure to check if there is a box which you can leave unchecked, if you don't want to disclose your personal information.</li>
              <li>If you have already agreed to share your information with us, feel free to contact us via email and we will be more than happy to change this for you.</li>
            </ul>
            <p>
              Aerojet Aviation will not lease, sell or distribute your personal information to any third parties, unless we have your permission. We might do so if the law forces us. Your personal information will be used when we need to send you promotional materials if you agree to this privacy policy.
            </p>

            {/* Footer Section inside Card */}
            <div className="mt-16 pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <p className="font-black text-aerojet-blue uppercase text-sm">Have Questions?</p>
                    <p className="text-xs text-slate-500">Send us an enquiry.</p>
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
