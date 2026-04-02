import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// Shared email header/footer builder
const emailWrapper = (headerBg: string, headerContent: string, bodyContent: string) => `
  <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e8e0d8;">
    <div style="background: ${headerBg}; padding: 32px 40px;">
      ${headerContent}
    </div>
    <div style="padding: 32px 40px;">
      ${bodyContent}
    </div>
    <div style="background: #fef8f4; padding: 20px 40px; border-top: 1px solid #e8e0d8;">
      <p style="color: #9e8e82; font-size: 12px; margin: 0;">© 2026 NoHunger Initiative · Nigeria · <a href="https://nohunger5912.builtwithrocket.new" style="color: #e8621a;">nohunger.org</a></p>
    </div>
  </div>
`;

const ctaButton = (href: string, label: string, color = '#e8621a') =>
  `<a href="${href}" style="display: inline-block; background: ${color}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; margin-top: 16px;">${label} →</a>`;

export const emailService = {
  // ─── Invitation ───────────────────────────────────────────────────────────
  async sendInvitation(
    to: string,
    volunteerName: string,
    activityTitle: string,
    activityDate: string,
    activityLocation: string,
    message?: string
  ) {
    try {
      await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject: `You're invited: ${activityTitle} — NoHunger Initiative`,
          type: 'invitation',
          html: emailWrapper(
            'linear-gradient(135deg, #e8621a, #c44d0f)',
            `<h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">❤️ Nohunger Initiative</h1>
             <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Nohunger Champion Hub</p>`,
            `<h2 style="color: #1e1208; font-size: 20px; margin: 0 0 16px;">Hi ${volunteerName},</h2>
             <p style="color: #6b5c4e; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">You've been personally invited to join us for an upcoming volunteering activity!</p>
             ${message ? `<div style="background: #fef8f4; border-left: 4px solid #e8621a; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;"><p style="color: #6b5c4e; margin: 0; font-style: italic;">"${message}"</p></div>` : ''}
             <div style="background: #fef8f4; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
               <h3 style="color: #e8621a; margin: 0 0 16px; font-size: 18px;">${activityTitle}</h3>
               <p style="color: #6b5c4e; margin: 0 0 8px; font-size: 14px;">📅 <strong>${activityDate}</strong></p>
               <p style="color: #6b5c4e; margin: 0; font-size: 14px;">📍 <strong>${activityLocation}</strong></p>
             </div>
             ${ctaButton('https://nohunger5912.builtwithrocket.new/invitations', 'View Invitation & Respond')}
             <p style="color: #9e8e82; font-size: 13px; margin-top: 24px;">This invitation will expire soon. Please respond at your earliest convenience.</p>`
          ),
        },
      });
    } catch (err) {
      console.log('Email send error:', err);
    }
  },

  // ─── Check-in Confirmation ────────────────────────────────────────────────
  async sendCheckinConfirmation(
    to: string,
    volunteerName: string,
    activityTitle: string,
    checkinTime: string
  ) {
    try {
      await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject: `Check-in confirmed: ${activityTitle} — NoHunger`,
          type: 'checkin_confirmed',
          html: emailWrapper(
            'linear-gradient(135deg, #e8621a, #c44d0f)',
            `<h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">✅ Check-in Confirmed</h1>`,
            `<h2 style="color: #1e1208; font-size: 20px; margin: 0 0 16px;">Hi ${volunteerName}!</h2>
             <p style="color: #6b5c4e; font-size: 15px; line-height: 1.6;">Your check-in for <strong>${activityTitle}</strong> has been approved at <strong>${checkinTime}</strong>. Thank you for showing up!</p>
             ${ctaButton('https://nohunger5912.builtwithrocket.new/volunteer-dashboard', 'View Dashboard')}`
          ),
        },
      });
    } catch (err) {
      console.log('Email send error:', err);
    }
  },

  // ─── Broadcast ────────────────────────────────────────────────────────────
  async sendBroadcast(recipients: string[], title: string, message: string, senderName: string) {
    try {
      await supabase.functions.invoke('send-email', {
        body: {
          to: recipients,
          subject: `📢 ${title} — NoHunger Initiative`,
          type: 'broadcast',
          html: emailWrapper(
            'linear-gradient(135deg, #e8621a, #c44d0f)',
            `<h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">📢 Broadcast Message</h1>
             <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">NoHunger Initiative</p>`,
            `<h2 style="color: #1e1208; font-size: 20px; margin: 0 0 16px;">${title}</h2>
             <div style="background: #fef8f4; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
               <p style="color: #3d2e22; font-size: 15px; line-height: 1.7; margin: 0;">${message}</p>
             </div>
             <p style="color: #9e8e82; font-size: 13px;">Sent by <strong>${senderName}</strong> · NoHunger Initiative</p>
             ${ctaButton('https://nohunger5912.builtwithrocket.new/volunteer-dashboard', 'Open Portal')}`
          ),
        },
      });
    } catch (err) {
      console.log('Email send error:', err);
    }
  },

  // ─── Application Approved ─────────────────────────────────────────────────
  async sendApplicationApproved(to: string, volunteerName: string, activityTitle: string) {
    try {
      await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject: `Application approved: ${activityTitle} — NoHunger`,
          type: 'application_approved',
          html: emailWrapper(
            'linear-gradient(135deg, #16a34a, #15803d)',
            `<h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">🎉 Application Approved!</h1>`,
            `<h2 style="color: #1e1208; font-size: 20px; margin: 0 0 16px;">Congratulations, ${volunteerName}!</h2>
             <p style="color: #6b5c4e; font-size: 15px; line-height: 1.6;">Your application to volunteer at <strong>${activityTitle}</strong> has been approved. We look forward to seeing you there!</p>
             ${ctaButton('https://nohunger5912.builtwithrocket.new/activities', 'View Activity', '#16a34a')}`
          ),
        },
      });
    } catch (err) {
      console.log('Email send error:', err);
    }
  },

  // ─── Welcome Email (new template) ─────────────────────────────────────────
  async sendWelcome(to: string, volunteerName: string) {
    try {
      await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject: `Welcome to NoHunger, ${volunteerName}! 🌱`,
          type: 'welcome',
          html: emailWrapper(
            'linear-gradient(135deg, #16a34a, #15803d)',
            `<h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">🌱 Welcome to NoHunger!</h1>
             <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">You're now part of the family</p>`,
            `<h2 style="color: #1e1208; font-size: 20px; margin: 0 0 16px;">Hi ${volunteerName}, welcome aboard! 👋</h2>
             <p style="color: #6b5c4e; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">Thanks for joining the Nohunger Initiative Champion community. Your commitment to fighting hunger in Nigeria means a lot to us and to the families we serve.</p>
             <div style="background: #f0fdf4; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
               <h3 style="color: #15803d; margin: 0 0 12px; font-size: 16px;">🚀 Getting Started</h3>
               <ul style="color: #6b5c4e; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                 <li>Complete your volunteer profile</li>
                 <li>Browse upcoming activities and sign up</li>
                 <li>Attend your first event and check in with your code</li>
                 <li>Track your hours and earn achievement badges</li>
               </ul>
             </div>
             <div style="background: #fef8f4; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
               <p style="color: #3d2e22; font-size: 14px; margin: 0; line-height: 1.6;"><strong>Your account is pending admin approval.</strong> You'll receive another email once approved and ready to join activities.</p>
             </div>
             ${ctaButton('https://nohunger5912.builtwithrocket.new/volunteer-dashboard', 'Go to Your Dashboard', '#16a34a')}`
          ),
        },
      });
    } catch (err) {
      console.log('Email send error:', err);
    }
  },

  // ─── Champion Account Approved (new template) ─────────────────────────────
  async sendVolunteerApproved(to: string, volunteerName: string) {
    try {
      await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject: `Your Nohunger Champion account is approved! ✅`,
          type: 'volunteer_approved',
          html: emailWrapper(
            'linear-gradient(135deg, #16a34a, #15803d)',
            `<h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">✅ Account Approved!</h1>
             <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Nohunger Champion Hub</p>`,
            `<h2 style="color: #1e1208; font-size: 20px; margin: 0 0 16px;">Great news, ${volunteerName}!</h2>
             <p style="color: #6b5c4e; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">Your Champion account has been reviewed and approved by our admin team. You now have full access to browse activities, sign up, and start making a difference!</p>
             <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
               <p style="color: #15803d; font-size: 14px; margin: 0; font-weight: 600;">🎉 You can now:</p>
               <ul style="color: #6b5c4e; font-size: 14px; line-height: 1.8; margin: 8px 0 0; padding-left: 20px;">
                 <li>Sign up for upcoming volunteer activities</li>
                 <li>Check in at events using your unique code</li>
                 <li>Log hours and track your impact</li>
                 <li>Earn badges and certificates</li>
               </ul>
             </div>
             ${ctaButton('https://nohunger5912.builtwithrocket.new/activities', 'Browse Activities', '#16a34a')}`
          ),
        },
      });
    } catch (err) {
      console.log('Email send error:', err);
    }
  },

  // ─── Hours Milestone (new template) ──────────────────────────────────────
  async sendHoursMilestone(to: string, volunteerName: string, hours: number) {
    const milestoneEmoji = hours >= 100 ? '👑' : hours >= 50 ? '💎' : hours >= 25 ? '🏆' : '⭐';
    try {
      await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject: `${milestoneEmoji} You've reached ${hours} volunteer hours! — NoHunger`,
          type: 'hours_milestone',
          html: emailWrapper(
            'linear-gradient(135deg, #d97706, #b45309)',
            `<h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">${milestoneEmoji} Milestone Reached!</h1>
             <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">NoHunger Volunteer Achievement</p>`,
            `<h2 style="color: #1e1208; font-size: 20px; margin: 0 0 16px;">Amazing work, ${volunteerName}!</h2>
             <p style="color: #6b5c4e; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">You've just crossed a major milestone — <strong>${hours} Champion hours</strong> with Nohunger Initiative. Your dedication is making a real difference for families across Nigeria.</p>
             <div style="background: #fffbeb; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #fde68a; text-align: center;">
               <p style="font-size: 48px; margin: 0 0 8px;">${milestoneEmoji}</p>
               <p style="color: #92400e; font-size: 28px; font-weight: 800; margin: 0;">${hours} Hours</p>
               <p style="color: #b45309; font-size: 14px; margin: 8px 0 0;">of volunteer service</p>
             </div>
             <p style="color: #6b5c4e; font-size: 14px; line-height: 1.6;">A certificate of achievement is available for download in your volunteer profile. Keep up the incredible work!</p>
             ${ctaButton('https://nohunger5912.builtwithrocket.new/profile', 'View Your Achievements', '#d97706')}`
          ),
        },
      });
    } catch (err) {
      console.log('Email send error:', err);
    }
  },

  // ─── Custom Message from Admin (new template) ─────────────────────────────
  async sendCustomMessage(
    to: string,
    volunteerName: string,
    subject: string,
    message: string,
    adminName: string
  ) {
    try {
      await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject: `${subject} — NoHunger Initiative`,
          type: 'custom_message',
          html: emailWrapper(
            'linear-gradient(135deg, #1e40af, #1d4ed8)',
            `<h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">💬 Message from Admin</h1>
             <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">NoHunger Initiative</p>`,
            `<h2 style="color: #1e1208; font-size: 20px; margin: 0 0 16px;">Hi ${volunteerName},</h2>
             <div style="background: #eff6ff; border-left: 4px solid #1d4ed8; border-radius: 0 8px 8px 0; padding: 20px; margin-bottom: 24px;">
               <p style="color: #1e3a8a; font-size: 15px; line-height: 1.7; margin: 0;">${message}</p>
             </div>
             <p style="color: #9e8e82; font-size: 13px;">Sent by <strong>${adminName}</strong> · NoHunger Admin Team</p>
             ${ctaButton('https://nohunger5912.builtwithrocket.new/volunteer-dashboard', 'Open Portal', '#1d4ed8')}`
          ),
        },
      });
    } catch (err) {
      console.log('Email send error:', err);
    }
  },

  // ─── Activity Reminder (new template) ────────────────────────────────────
  async sendActivityReminder(
    to: string,
    volunteerName: string,
    activityTitle: string,
    activityDate: string,
    activityLocation: string,
    checkinCode: string
  ) {
    try {
      await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject: `Reminder: ${activityTitle} is tomorrow — NoHunger`,
          type: 'activity_reminder',
          html: emailWrapper(
            'linear-gradient(135deg, #7c3aed, #6d28d9)',
            `<h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">🔔 Activity Reminder</h1>
             <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Nohunger Champion Hub</p>`,
            `<h2 style="color: #1e1208; font-size: 20px; margin: 0 0 16px;">Hi ${volunteerName},</h2>
             <p style="color: #6b5c4e; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">This is a friendly reminder that you're signed up for an upcoming activity. We're looking forward to seeing you!</p>
             <div style="background: #faf5ff; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #e9d5ff;">
               <h3 style="color: #7c3aed; margin: 0 0 16px; font-size: 18px;">${activityTitle}</h3>
               <p style="color: #6b5c4e; margin: 0 0 8px; font-size: 14px;">📅 <strong>${activityDate}</strong></p>
               <p style="color: #6b5c4e; margin: 0 0 16px; font-size: 14px;">📍 <strong>${activityLocation}</strong></p>
               <div style="background: white; border-radius: 8px; padding: 12px 16px; border: 1px solid #e9d5ff;">
                 <p style="color: #6b5c4e; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Your Check-in Code</p>
                 <p style="color: #7c3aed; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: 0.1em;">${checkinCode}</p>
               </div>
             </div>
             ${ctaButton('https://nohunger5912.builtwithrocket.new/activities', 'View Activity Details', '#7c3aed')}`
          ),
        },
      });
    } catch (err) {
      console.log('Email send error:', err);
    }
  },
};
