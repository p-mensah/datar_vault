import { InvoiceData, DocumentType } from '../types';

interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

// Email service configuration
const EMAIL_CONFIG: EmailConfig = {
  apiKey: process.env.VITE_SENDGRID_API_KEY || '', // You'll need to add this to your env
  fromEmail: 'noreply@datarvault.app',
  fromName: 'Data Vault'
};

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
}

export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    // For now, we'll use a mock implementation
    // In production, replace this with actual email service (SendGrid, Mailgun, etc.)

    if (!EMAIL_CONFIG.apiKey) {
      console.warn('Email service not configured. Using fallback mailto link.');
      // Fallback to mailto
      const mailtoLink = `mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.html.replace(/<[^>]*>/g, ''))}`;
      window.location.href = mailtoLink;
      return true;
    }

    // SendGrid API implementation (replace with your preferred service)
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EMAIL_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: emailData.to }],
          subject: emailData.subject,
        }],
        from: {
          email: EMAIL_CONFIG.fromEmail,
          name: EMAIL_CONFIG.fromName,
        },
        content: [{
          type: 'text/html',
          value: emailData.html,
        }],
        attachments: emailData.attachments,
      }),
    });

    if (response.ok) {
      console.log('Email sent successfully');
      return true;
    } else {
      const error = await response.text();
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  } catch (error) {
    console.error('Email service error:', error);

    // Fallback to mailto if email service fails
    const mailtoLink = `mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.html.replace(/<[^>]*>/g, ''))}`;
    window.location.href = mailtoLink;

    return false;
  }
};

export const generateInvoiceEmail = async (
  invoiceData: InvoiceData,
  pdfBlob?: Blob
): Promise<EmailData> => {
  const { to, from, documentType, documentNumber, dueDate, currency } = invoiceData;

  // Calculate totals
  const subtotal = invoiceData.items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
  const taxAmount = (subtotal * invoiceData.taxRate) / 100;
  const total = subtotal + taxAmount - invoiceData.discount;
  const balanceDue = total - invoiceData.amountPaid;

  // Generate email subject
  const subject = `${documentType} #${documentNumber} from ${from.isBusiness ? from.businessName : from.name}`;

  // Generate email HTML content
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .content { margin: 20px 0; }
        .invoice-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .total { font-size: 18px; font-weight: bold; color: #2563eb; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>${documentType} from ${from.isBusiness ? from.businessName : from.name}</h2>
        <p>Dear ${to.isBusiness ? to.businessName : to.name},</p>
      </div>

      <div class="content">
        <p>Please find attached your ${documentType.toLowerCase()} details.</p>

        <div class="invoice-details">
          <h3>Invoice Details</h3>
          <p><strong>${documentType} Number:</strong> ${documentNumber}</p>
          <p><strong>Issue Date:</strong> ${new Date(invoiceData.issueDate).toLocaleDateString()}</p>
          ${dueDate ? `<p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>` : ''}

          <h4>Items:</h4>
          <ul>
            ${invoiceData.items.map(item =>
              `<li>${item.description} - ${item.quantity} x ${formatCurrency(item.rate, currency)} = ${formatCurrency(item.quantity * item.rate, currency)}</li>`
            ).join('')}
          </ul>

          <p><strong>Subtotal:</strong> ${formatCurrency(subtotal, currency)}</p>
          ${invoiceData.taxRate > 0 ? `<p><strong>Tax (${invoiceData.taxRate}%):</strong> ${formatCurrency(taxAmount, currency)}</p>` : ''}
          ${invoiceData.discount > 0 ? `<p><strong>Discount:</strong> -${formatCurrency(invoiceData.discount, currency)}</p>` : ''}
          <p class="total"><strong>Total: ${formatCurrency(total, currency)}</strong></p>
          ${balanceDue > 0 ? `<p><strong>Balance Due: ${formatCurrency(balanceDue, currency)}</strong></p>` : '<p><strong>Status: Paid</strong></p>'}
        </div>

        <p>If you have any questions about this ${documentType.toLowerCase()}, please don't hesitate to contact us.</p>

        <p>Thank you for your business!</p>
      </div>

      <div class="footer">
        <p><strong>${from.isBusiness ? from.businessName : from.name}</strong></p>
        ${from.email ? `<p>Email: ${from.email}</p>` : ''}
        ${from.phone ? `<p>Phone: ${from.phone}</p>` : ''}
        ${from.address ? `<p>Address: ${from.address.replace(/,/g, ', ')}</p>` : ''}

        <p style="margin-top: 15px;">
          This email was sent by Data Vault - AI Document Generator.<br>
          Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `;

  // Prepare attachments
  const attachments: EmailData['attachments'] = [];

  if (pdfBlob) {
    // Convert blob to base64
    const base64Content = await blobToBase64(pdfBlob);
    attachments.push({
      content: base64Content.split(',')[1], // Remove data:application/pdf;base64, prefix
      filename: `${documentType}-${documentNumber}.pdf`,
      type: 'application/pdf',
      disposition: 'attachment',
    });
  }

  return {
    to: to.email,
    subject,
    html,
    attachments: attachments.length > 0 ? attachments : undefined,
  };
};

// Helper function to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Helper function to format currency
const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch (e) {
    return `$${amount.toFixed(2)}`;
  }
};

// Email templates for different scenarios
export const EMAIL_TEMPLATES = {
  invoice: {
    subject: (data: InvoiceData) => `${data.documentType} #${data.documentNumber} - Payment Due`,
    greeting: (data: InvoiceData) => `Dear ${data.to.isBusiness ? data.to.businessName : data.to.name},`,
    content: (data: InvoiceData) => `
      Please find attached your ${data.documentType.toLowerCase()} for services rendered.
      The payment is due by ${new Date(data.dueDate).toLocaleDateString()}.
    `,
  },
  reminder: {
    subject: (data: InvoiceData) => `Payment Reminder - ${data.documentType} #${data.documentNumber}`,
    greeting: (data: InvoiceData) => `Dear ${data.to.isBusiness ? data.to.businessName : data.to.name},`,
    content: (data: InvoiceData) => `
      This is a friendly reminder that payment for ${data.documentType.toLowerCase()} #${data.documentNumber}
      is due by ${new Date(data.dueDate).toLocaleDateString()}.
    `,
  },
  overdue: {
    subject: (data: InvoiceData) => `OVERDUE - ${data.documentType} #${data.documentNumber}`,
    greeting: (data: InvoiceData) => `Dear ${data.to.isBusiness ? data.to.businessName : data.to.name},`,
    content: (data: InvoiceData) => `
      Your payment for ${data.documentType.toLowerCase()} #${data.documentNumber} is now overdue.
      Please remit payment immediately to avoid additional fees.
    `,
  },
};