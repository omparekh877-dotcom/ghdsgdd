interface Notification {
  id: string
  type: "success" | "error" | "warning" | "info"
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface BusinessNotification {
  id: string
  businessId: string
  recipientId?: string // If null, it's for all business users
  type: "staff_request" | "payment_success" | "payment_failed" | "plan_upgrade" | "system" | "info"
  title: string
  message: string
  read: boolean
  actionUrl?: string
  metadata?: Record<string, any>
  createdAt: string
}

class NotificationService {
  private notifications: (Notification | BusinessNotification)[] = []
  private listeners: ((notifications: (Notification | BusinessNotification)[]) => void)[] = []

  subscribe(listener: (notifications: (Notification | BusinessNotification)[]) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.notifications))
  }

  // Server-backed notifications API
  async getNotifications(_businessId?: string): Promise<BusinessNotification[]> {
    try {
      const url = window.location.origin ? `${window.location.origin}/api/notifications` : '/api/notifications';
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) return [];
      const data = await res.json().catch(() => []);
      return Array.isArray(data) ? data as BusinessNotification[] : [];
    } catch (e) {
      // Silent failure to avoid noisy console errors in preview environments where backend isn't reachable
      return []
    }
  }

  async markAsRead(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/notifications/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      })
      if (!res.ok) throw new Error(`Failed to mark as read: ${res.status}`)
    } catch (e) {
      // ignore failures in preview environment
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      const res = await fetch('/api/notifications/mark-all-read', { method: 'POST' })
      if (!res.ok) throw new Error(`Failed to mark all as read: ${res.status}`)
    } catch (e) {
      // ignore failures in preview environment
    }
  }

  show(notification: Omit<Notification, "id">) {
    const id = Date.now().toString()
    const newNotification: Notification = {
      id,
      duration: 5000,
      ...notification,
    }

    this.notifications.push(newNotification)
    this.notify()

    if (newNotification.duration) {
      setTimeout(() => {
        this.dismiss(id)
      }, newNotification.duration)
    }

    return id
  }

  success(title: string, message: string, duration?: number) {
    return this.show({
      type: "success",
      title,
      message,
      duration,
    })
  }

  error(title: string, message: string, duration?: number) {
    return this.show({
      type: "error",
      title,
      message,
      duration: duration || 8000, // Errors stay longer
    })
  }

  warning(title: string, message: string, duration?: number) {
    return this.show({
      type: "warning",
      title,
      message,
      duration,
    })
  }

  info(title: string, message: string, duration?: number) {
    return this.show({
      type: "info",
      title,
      message,
      duration,
    })
  }

  dismiss(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id)
    this.notify()
  }

  clear() {
    this.notifications = []
    this.notify()
  }

  getAll() {
    return this.notifications
  }

  showStaffRequest(staffName: string, role: string) {
    return this.show({
      type: "info",
      title: "New Staff Request",
      message: `${staffName} has requested to join as ${role}`,
      duration: 10000,
      action: {
        label: "Review",
        onClick: () => (window.location.href = "/dashboard/staff/requests"),
      },
    })
  }

  showPaymentSuccess(plan: string, amount: number) {
    return this.show({
      type: "success",
      title: "Payment Successful",
      message: `Successfully upgraded to ${plan} plan for ��${amount}`,
      duration: 8000,
    })
  }

  showPaymentFailed(reason?: string) {
    return this.show({
      type: "error",
      title: "Payment Failed",
      message: reason || "Payment could not be processed. Please try again.",
      duration: 10000,
    })
  }

  showPlanUpgrade(plan: string) {
    return this.show({
      type: "success",
      title: "Plan Upgraded",
      message: `Welcome to ${plan}! You now have access to premium features.`,
      duration: 8000,
    })
  }
}

export const notificationService = new NotificationService()
export type { Notification, BusinessNotification }
