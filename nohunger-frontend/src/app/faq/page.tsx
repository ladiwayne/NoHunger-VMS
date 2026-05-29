'use client';

import Link from 'next/link';
import AppLayout from '@/components/AppLayout';

const faqs = [
  {
    question: 'What is the Volunteer Dashboard for?',
    answer:
      'Your dashboard is the home page for volunteers. It highlights your total hours, events attended, pending invitations, and active check-in sessions, plus upcoming activities and weekly progress.',
  },
  {
    question: 'How do I respond to a volunteer invitation?',
    answer:
      'Pending invitations appear on the dashboard. Use the accept or reject buttons to respond, and the dashboard updates automatically.',
  },
  {
    question: 'How do I check in for an activity?',
    answer:
      'Enter the check-in code from the event organizer on the dashboard and follow the check-in flow. The app also tracks your active session timer once you are checked in.',
  },
  {
    question: 'What fields are required to complete my profile?',
    answer:
      'Complete your profile with name, phone number, location, shirt size, bio, skills, and availability. This helps admins approve your access and match you with the right volunteer opportunities.',
  },
  {
    question: 'Why is the security question and answer important?',
    answer:
      'The security question protects your account and helps confirm your identity during password recovery. Choose an answer only you know and keep it secure so your volunteer account remains safe.',
  },
  {
    question: 'How are my volunteer hours calculated?',
    answer:
      'Hours are based on completed check-ins. Once you check out from an activity, your service time is logged and added to your total hours on the dashboard.',
  },
  {
    question: 'Why is my account status still pending?',
    answer:
      'Pending status means your volunteer account or profile is awaiting admin approval. You can continue to complete your profile while you wait.',
  },
  {
    question: 'Can I use the Volunteer Dashboard on mobile?',
    answer:
      'Yes. The dashboard is responsive and works on both desktop and mobile devices so you can stay connected on the go.',
  },
];

export default function FAQPage() {
  return (
    <AppLayout activePath="/faq">
      <div className="max-w-5xl mx-auto space-y-8">
        <section className="rounded-[28px] border border-border bg-card p-8 shadow-sm">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary/80">Volunteer Support</p>
            <h1 className="mt-4 text-3xl sm:text-4xl font-700 text-foreground">Volunteer Dashboard FAQ</h1>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-7">
              Everything volunteers need to know about using the dashboard, responding to invitations, tracking hours, and staying connected with No Hunger Initiatives.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {faqs.map((item) => (
            <div key={item.question} className="rounded-3xl border border-border bg-white p-6 shadow-sm hover:border-primary/40 transition-all">
              <h2 className="text-lg font-700 text-foreground">{item.question}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.answer}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/80">Need more help?</p>
              <h2 className="mt-2 text-2xl font-700 text-foreground">Contact our support team</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
                If you still have questions, we&apos;re here to help. Reach out to support for help with onboarding, activity invitations, or volunteer profiles.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-700 text-white transition hover:bg-primary/90"
            >
              Visit Contact & Support
            </Link>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
