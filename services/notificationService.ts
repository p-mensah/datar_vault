import { DocumentLedger, Notification, NotificationType, DocumentType } from '../types';

export const generateNotifications = (ledger: DocumentLedger): Notification[] => {
  const now = new Date();
  const notifications: Notification[] = [];

  Object.values(ledger).forEach(entry => {
    if (entry.isRecurringTemplate) return;

    const data = entry.data;
    if (data.documentType === DocumentType.Receipt || data.documentType === DocumentType.Contract) return;

    const dueDate = new Date(data.dueDate);
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate balance due
    const subtotal = data.items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
    const taxAmount = (subtotal * data.taxRate) / 100;
    const total = subtotal + taxAmount - data.discount;
    const balanceDue = total - data.amountPaid;

    if (balanceDue <= 0) return; // Fully paid

    const clientName = data.to.isBusiness ? data.to.businessName : data.to.name;

    if (daysUntilDue < 0) {
      // Overdue
      notifications.push({
        id: `${NotificationType.Overdue}-${data.documentNumber}`,
        type: NotificationType.Overdue,
        documentNumber: data.documentNumber,
        documentType: data.documentType,
        clientName,
        amount: balanceDue,
        currency: data.currency,
        dueDate: data.dueDate,
        daysUntilDue,
      });
    } else if (daysUntilDue <= 7) {
      // Payment Reminder
      notifications.push({
        id: `${NotificationType.PaymentReminder}-${data.documentNumber}`,
        type: NotificationType.PaymentReminder,
        documentNumber: data.documentNumber,
        documentType: data.documentType,
        clientName,
        amount: balanceDue,
        currency: data.currency,
        dueDate: data.dueDate,
        daysUntilDue,
      });
    } else if (daysUntilDue <= 14) {
      // Upcoming Due Date
      notifications.push({
        id: `${NotificationType.UpcomingDueDate}-${data.documentNumber}`,
        type: NotificationType.UpcomingDueDate,
        documentNumber: data.documentNumber,
        documentType: data.documentType,
        clientName,
        amount: balanceDue,
        currency: data.currency,
        dueDate: data.dueDate,
        daysUntilDue,
      });
    }
  });

  // Sort by urgency: overdue first, then by days until due
  return notifications.sort((a, b) => {
    if (a.type === NotificationType.Overdue && b.type !== NotificationType.Overdue) return -1;
    if (b.type === NotificationType.Overdue && a.type !== NotificationType.Overdue) return 1;
    return a.daysUntilDue - b.daysUntilDue;
  });
};