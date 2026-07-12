function formatDisplayDate(date: string): string {
  try {
    const [y, m, d] = date.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return date;
  }
}

/** Optional: set RESEND_API_KEY + EMAIL_TO in Netlify env to enable alerts. */
export async function sendHostEmail(name: string, date: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.EMAIL_TO;
  const from = process.env.EMAIL_FROM || "Kids Mahaber <onboarding@resend.dev>";
  const siteUrl =
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "https://kidsmahaber.netlify.app";

  if (!apiKey || !to) {
    console.log(`[email skipped] ${name} hosting on ${date}`);
    return;
  }

  const formatted = formatDisplayDate(date);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Mahaber Host Alert: ${name} is Hosting the Next Gathering`,
      text: `${name} has confirmed to host the next family gathering on ${formatted}.\n\nOpen the tracker to RSVP: ${siteUrl}`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("Email failed:", res.status, body);
  }
}
