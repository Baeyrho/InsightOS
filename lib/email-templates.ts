const BASE_STYLES = {
  body: "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0;",
  container: "max-width: 480px; margin: 0 auto; padding: 24px;",
  card: "background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);",
  logo: "font-size: 20px; font-weight: 700; letter-spacing: -0.02em; color: #111827;",
  h2: "font-size: 20px; font-weight: 600; color: #111827; margin: 0 0 8px 0;",
  text: "font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0 0 16px 0;",
  button: "display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;",
  footer: "font-size: 12px; color: #9ca3af; text-align: center; margin-top: 24px;",
}

export function resetPasswordEmail(recipientName: string, resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="${BASE_STYLES.body}">
        <div style="${BASE_STYLES.container}">
          <div style="${BASE_STYLES.card}">
            <div style="${BASE_STYLES.logo}">InsightOS</div>
            <h2 style="${BASE_STYLES.h2}">Reset your password</h2>
            <p style="${BASE_STYLES.text}">
              Hi${recipientName ? ` ${recipientName}` : ""},
            </p>
            <p style="${BASE_STYLES.text}">
              We received a request to reset your InsightOS account password.
              Click the button below to set a new password. This link expires in 1 hour.
            </p>
            <p style="text-align: center; margin: 24px 0;">
              <a href="${resetUrl}" style="${BASE_STYLES.button}">
                Reset password
              </a>
            </p>
            <p style="${BASE_STYLES.text}">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
          <p style="${BASE_STYLES.footer}">
            InsightOS — UX Research Intelligence
          </p>
        </div>
      </body>
    </html>
  `
}

export function welcomeEmail(recipientName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="${BASE_STYLES.body}">
        <div style="${BASE_STYLES.container}">
          <div style="${BASE_STYLES.card}">
            <div style="${BASE_STYLES.logo}">InsightOS</div>
            <h2 style="${BASE_STYLES.h2}">Welcome to InsightOS</h2>
            <p style="${BASE_STYLES.text}">
              Hi${recipientName ? ` ${recipientName}` : ""},
            </p>
            <p style="${BASE_STYLES.text}">
              Your account is ready. Start uploading research artifacts and transform
              raw user feedback into prioritised product decisions.
            </p>
            <p style="text-align: center; margin: 24px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" style="${BASE_STYLES.button}">
                Go to dashboard
              </a>
            </p>
          </div>
          <p style="${BASE_STYLES.footer}">
            InsightOS — UX Research Intelligence
          </p>
        </div>
      </body>
    </html>
  `
}

function wrap(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="${BASE_STYLES.body}">
        <div style="${BASE_STYLES.container}">
          <div style="${BASE_STYLES.card}">${content}</div>
          <p style="${BASE_STYLES.footer}">
            InsightOS — UX Research Intelligence
          </p>
        </div>
      </body>
    </html>
  `
}

export function passwordChangedEmail(recipientName: string, supportEmail: string): string {
  return wrap(`
    <div style="${BASE_STYLES.logo}">InsightOS</div>
    <h2 style="${BASE_STYLES.h2}">Your password was changed</h2>
    <p style="${BASE_STYLES.text}">
      Hi${recipientName ? ` ${recipientName}` : ""},
    </p>
    <p style="${BASE_STYLES.text}">
      Your InsightOS account password was just changed. If this was you,
      no action is needed.
    </p>
    <p style="${BASE_STYLES.text}">
      If you didn't make this change, please contact
      <a href="mailto:${supportEmail}" style="color: #2563eb;">${supportEmail}</a>
      immediately and secure your account.
    </p>
  `)
}

export function analysisReadyEmail(recipientName: string, projectName: string, insightsLink: string): string {
  return wrap(`
    <div style="${BASE_STYLES.logo}">InsightOS</div>
    <h2 style="${BASE_STYLES.h2}">Your insights for "${projectName}" are ready</h2>
    <p style="${BASE_STYLES.text}">
      Hi${recipientName ? ` ${recipientName}` : ""},
    </p>
    <p style="${BASE_STYLES.text}">
      We've finished analysing your research for "${projectName}". View your
      pain points, jobs-to-be-done, opportunity areas, recommendations, and
      design considerations.
    </p>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${insightsLink}" style="${BASE_STYLES.button}">
        View insights
      </a>
    </p>
  `)
}

export function analysisFailedEmail(recipientName: string, projectName: string, retryLink: string): string {
  return wrap(`
    <div style="${BASE_STYLES.logo}">InsightOS</div>
    <h2 style="${BASE_STYLES.h2}">We couldn't finish analysing "${projectName}"</h2>
    <p style="${BASE_STYLES.text}">
      Hi${recipientName ? ` ${recipientName}` : ""},
    </p>
    <p style="${BASE_STYLES.text}">
      Your analysis for "${projectName}" didn't complete — no inputs were lost.
      You can retry the analysis.
    </p>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${retryLink}" style="${BASE_STYLES.button}">
        Retry analysis
      </a>
    </p>
    <p style="${BASE_STYLES.text}">
      If it keeps happening, please contact support.
    </p>
  `)
}

export function subscriptionActivatedEmail(recipientName: string, planName: string, renewDate: string): string {
  return wrap(`
    <div style="${BASE_STYLES.logo}">InsightOS</div>
    <h2 style="${BASE_STYLES.h2}">You're now on InsightOS ${planName}</h2>
    <p style="${BASE_STYLES.text}">
      Hi${recipientName ? ` ${recipientName}` : ""},
    </p>
    <p style="${BASE_STYLES.text}">
      Your upgrade to ${planName} is active. Your plan renews on ${renewDate}.
    </p>
    <p style="${BASE_STYLES.text}">
      Thanks for upgrading.
    </p>
  `)
}

export function subscriptionCancelledEmail(recipientName: string, planName: string, endDate: string): string {
  return wrap(`
    <div style="${BASE_STYLES.logo}">InsightOS</div>
    <h2 style="${BASE_STYLES.h2}">Your InsightOS ${planName} has been cancelled</h2>
    <p style="${BASE_STYLES.text}">
      Hi${recipientName ? ` ${recipientName}` : ""},
    </p>
    <p style="${BASE_STYLES.text}">
      Your ${planName} subscription has been cancelled. You'll keep access
      until ${endDate}, then move to the Free plan.
    </p>
    <p style="${BASE_STYLES.text}">
      You can resubscribe anytime.
    </p>
  `)
}

export function quotaNearlyReachedEmail(recipientName: string, used: number, limit: number, billingLink: string): string {
  return wrap(`
    <div style="${BASE_STYLES.logo}">InsightOS</div>
    <h2 style="${BASE_STYLES.h2}">You've used 80% of your monthly analyses</h2>
    <p style="${BASE_STYLES.text}">
      Hi${recipientName ? ` ${recipientName}` : ""},
    </p>
    <p style="${BASE_STYLES.text}">
      You've used ${used} of ${limit} analyses this month. Upgrade for more.
    </p>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${billingLink}" style="${BASE_STYLES.button}">
        Upgrade plan
      </a>
    </p>
  `)
}

export function renewalReminderEmail(recipientName: string, planName: string, renewDate: string, billingLink: string, isCancelled: boolean): string {
  const heading = isCancelled
    ? `Your InsightOS ${planName} ends on ${renewDate}`
    : `Your InsightOS ${planName} renews on ${renewDate}`

  const body = isCancelled
    ? `A reminder that your ${planName} plan ends on ${renewDate} and won't renew.`
    : `A reminder that your ${planName} plan renews on ${renewDate}. No action needed to continue.`

  return wrap(`
    <div style="${BASE_STYLES.logo}">InsightOS</div>
    <h2 style="${BASE_STYLES.h2}">${heading}</h2>
    <p style="${BASE_STYLES.text}">
      Hi${recipientName ? ` ${recipientName}` : ""},
    </p>
    <p style="${BASE_STYLES.text}">
      ${body}
    </p>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${billingLink}" style="${BASE_STYLES.button}">
        Manage subscription
      </a>
    </p>
  `)
}
