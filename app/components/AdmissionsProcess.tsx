import Link from 'next/link';

const steps = [
  {
    step: "01",
    title: "Enquiry & Course Selection",
    description: "Submit an enquiry or select your desired course. We collect your basic contact details to start the process."
  },
  {
    step: "02",
    title: "Pay Registration Fee",
    description: "A registration fee invoice is issued to your email. This must be paid before the application form is released."
  },
  {
    step: "03",
    title: "Submit Application",
    description: "Once your fee is confirmed, you'll receive a link to submit your detailed online application and upload required documents."
  },
  {
    step: "04",
    title: "Application Review",
    description: "Our admissions team carefully reviews your application. We may contact you if additional information is needed."
  },
  {
    step: "05",
    title: "Pay Seat Deposit / Exam Fee", // Updated Title
    description: "Approved Full-Time applicants receive a Seat Confirmation Invoice for a 40% deposit. For Exam-Only options, the full fee is required to secure your seat." // Updated Description
  },
  {
    step: "06",
    title: "Enrollment & Onboarding",
    description: "Once your deposit or fee is confirmed, your seat is secured. You will be officially onboarded into the Student Portal."
  },
  {
    step: "07",
    title: "Start Date Confirmation",
    description: "Your official start date is confirmed via email and the portal once the course cohort meets the minimum enrollment size."
  },
];

export default function AdmissionsProcess() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-aerojet-blue mb-4">
            How Admissions Works
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Our transparent, step-by-step process ensures a fair and structured journey from applicant to enrolled student.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="relative">
            
            <div className="space-y-12">
              {steps.map((item, index) => (
                <div key={index} className="flex items-start"> {/* Kept the flex fix */}
                  <div className="shrink-0 w-12 h-12 bg-aerojet-sky rounded-full flex items-center justify-center text-white font-bold mr-6">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-aerojet-blue mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center mt-16">
          <Link href="/register" className="bg-aerojet-sky text-white px-10 py-4 rounded-md font-bold text-lg hover:bg-aerojet-soft-blue transition shadow-lg">
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
}
