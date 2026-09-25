import { Resend } from 'resend';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unavailable';
  return `${date.toLocaleDateString('en-US', { timeZone: 'UTC' })} ${date.toLocaleTimeString('en-US', {
    timeZone: 'UTC', hour: 'numeric', minute: '2-digit',
  })} UTC`;
}

function formatDuration(startValue, endValue) {
  const start = new Date(startValue).getTime();
  const end = new Date(endValue).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 'Unavailable';
  const totalMinutes = Math.floor((end - start) / 60000);
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { entries, recipientEmail } = request.body ?? {};
  if (!Array.isArray(entries) || entries.length === 0) {
    return response.status(400).json({ error: 'Provide at least one time entry.' });
  }
  if (typeof recipientEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    return response.status(400).json({ error: 'Provide a valid recipient email address.' });
  }
  if (entries.some((entry) => !entry || typeof entry.taskName !== 'string'
    || !entry.taskName.trim() || !Number.isFinite(new Date(entry.startTime).getTime())
    || !Number.isFinite(new Date(entry.endTime).getTime())
    || new Date(entry.endTime) <= new Date(entry.startTime))) {
    return response.status(400).json({ error: 'Each entry must have a task name and valid start and end times.' });
  }

  if (!process.env.RESEND_API_KEY) {
    return response.status(500).json({ error: 'Email service is not configured. Set RESEND_API_KEY.' });
  }

  const rows = entries.map((entry) => `
    <tr>
      <td style="padding:10px;border:1px solid #e2e8f0">${escapeHtml(entry.taskName)}</td>
      <td style="padding:10px;border:1px solid #e2e8f0">${escapeHtml(formatDateTime(entry.startTime))}</td>
      <td style="padding:10px;border:1px solid #e2e8f0">${escapeHtml(formatDateTime(entry.endTime))}</td>
      <td style="padding:10px;border:1px solid #e2e8f0">${escapeHtml(formatDuration(entry.startTime, entry.endTime))}</td>
      <td style="padding:10px;border:1px solid #e2e8f0;white-space:pre-wrap">${escapeHtml(entry.notes || '')}</td>
    </tr>`).join('');
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#0f172a">
    <h1 style="font-size:22px">Your Time Entry Summary</h1>
    <table style="border-collapse:collapse;width:100%;text-align:left">
      <thead><tr>${['Task', 'Start', 'End', 'Duration', 'Notes'].map((heading) => `<th style="padding:10px;border:1px solid #e2e8f0;background:#f1f5f9">${heading}</th>`).join('')}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </body></html>`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: recipientEmail,
      subject: 'Your Time Entry Summary',
      html,
    });
    if (error) {
      console.error('Resend email failed:', error);
      return response.status(502).json({ error: error.message || 'The email could not be sent.' });
    }
    return response.status(200).json({ success: true, message: 'Summary email sent.', id: data?.id });
  } catch (error) {
    console.error('Summary email request failed:', error);
    return response.status(502).json({ error: 'The email could not be sent. Please try again.' });
  }
}
