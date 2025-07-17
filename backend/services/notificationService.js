/**
 * Notification Service
 * Handles payment-related and property workflow notifications
 */

import ApplicationLog from "../models/ApplicationLog.js";
import User from "../models/User.js";
import Property from "../models/Property.js";
import Payment from "../models/Payment.js";

class NotificationService {
  /**
   * Send payment required notification to user
   * @param {Object} property - Property object
   * @param {Object} user - User object
   * @param {number} amount - Payment amount
   */
  static async sendPaymentRequiredNotification(property, user, amount) {
    try {
      const notification = {
        type: 'payment_required',
        title: 'Payment Required for Property Registration',
        message: `Payment of ${amount} ETB is required to complete registration for property ${property.plotNumber}. Documents have been validated and payment is now due.`,
        userId: user._id,
        propertyId: property._id,
        priority: 'high',
        actionRequired: true,
        actionUrl: `/property/${property._id}/payment`,
        metadata: {
          amount,
          currency: 'ETB',
          propertyPlotNumber: property.plotNumber,
          paymentType: 'registration_fee'
        }
      };

      await this.createNotification(notification);

      // Create application log
      await ApplicationLog.create({
        property: property._id,
        user: user._id,
        action: "payment_notification_sent",
        status: property.status,
        performedBy: null,
        performedByRole: 'system',
        notes: `Payment required notification sent - Amount: ${amount} ETB`
      });

      return { success: true, notification };
    } catch (error) {
      console.error('Error sending payment required notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send payment successful notification to user
   * @param {Object} payment - Payment object
   * @param {Object} property - Property object
   * @param {Object} user - User object
   */
  static async sendPaymentSuccessNotification(payment, property, user) {
    try {
      const notification = {
        type: 'payment_success',
        title: 'Payment Completed Successfully',
        message: `Your payment of ${payment.amount} ETB for property ${property.plotNumber} has been completed successfully. Your property is now ready for final approval by the land officer.`,
        userId: user._id,
        propertyId: property._id,
        paymentId: payment._id,
        priority: 'medium',
        actionRequired: false,
        metadata: {
          amount: payment.amount,
          currency: payment.currency,
          receiptNumber: payment.receiptNumber,
          transactionId: payment.transactionId,
          paymentMethod: payment.paymentMethod,
          propertyPlotNumber: property.plotNumber
        }
      };

      await this.createNotification(notification);

      // Create application log
      await ApplicationLog.create({
        property: property._id,
        user: user._id,
        action: "payment_success_notification_sent",
        status: property.status,
        performedBy: null,
        performedByRole: 'system',
        notes: `Payment success notification sent - Receipt: ${payment.receiptNumber}`
      });

      return { success: true, notification };
    } catch (error) {
      console.error('Error sending payment success notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send payment failed notification to user
   * @param {Object} payment - Payment object
   * @param {Object} property - Property object
   * @param {Object} user - User object
   * @param {string} reason - Failure reason
   */
  static async sendPaymentFailedNotification(payment, property, user, reason) {
    try {
      const notification = {
        type: 'payment_failed',
        title: 'Payment Failed',
        message: `Your payment of ${payment.amount} ETB for property ${property.plotNumber} has failed. Reason: ${reason}. Please try again or contact support.`,
        userId: user._id,
        propertyId: property._id,
        paymentId: payment._id,
        priority: 'high',
        actionRequired: true,
        actionUrl: `/property/${property._id}/payment`,
        metadata: {
          amount: payment.amount,
          currency: payment.currency,
          transactionId: payment.transactionId,
          paymentMethod: payment.paymentMethod,
          failureReason: reason,
          propertyPlotNumber: property.plotNumber
        }
      };

      await this.createNotification(notification);

      // Create application log
      await ApplicationLog.create({
        property: property._id,
        user: user._id,
        action: "payment_failed_notification_sent",
        status: property.status,
        performedBy: null,
        performedByRole: 'system',
        notes: `Payment failed notification sent - Reason: ${reason}`
      });

      return { success: true, notification };
    } catch (error) {
      console.error('Error sending payment failed notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send property ready for approval notification to land officers
   * @param {Object} property - Property object
   * @param {Object} user - Property owner
   */
  static async sendPropertyReadyForApprovalNotification(property, user) {
    try {
      // Get all land officers
      const landOfficers = await User.find({ role: 'landOfficer' });

      const notifications = [];

      for (const officer of landOfficers) {
        const notification = {
          type: 'property_ready_approval',
          title: 'Property Ready for Approval',
          message: `Property ${property.plotNumber} owned by ${user.fullName} has completed payment and is ready for final approval. All documents have been validated and registration fees have been paid.`,
          userId: officer._id,
          propertyId: property._id,
          priority: 'medium',
          actionRequired: true,
          actionUrl: `/land-officer/properties/${property._id}`,
          metadata: {
            propertyPlotNumber: property.plotNumber,
            ownerName: user.fullName,
            ownerEmail: user.email,
            propertyType: property.propertyType,
            area: property.area,
            location: property.location
          }
        };

        await this.createNotification(notification);
        notifications.push(notification);
      }

      // Create application log
      await ApplicationLog.create({
        property: property._id,
        user: user._id,
        action: "approval_ready_notification_sent",
        status: property.status,
        performedBy: null,
        performedByRole: 'system',
        notes: `Property ready for approval notifications sent to ${landOfficers.length} land officers`
      });

      return { success: true, notifications };
    } catch (error) {
      console.error('Error sending property ready for approval notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send payment reminder notification
   * @param {Object} property - Property object
   * @param {Object} user - User object
   * @param {number} daysOverdue - Days since payment became due
   */
  static async sendPaymentReminderNotification(property, user, daysOverdue) {
    try {
      const notification = {
        type: 'payment_reminder',
        title: 'Payment Reminder',
        message: `Reminder: Payment for property ${property.plotNumber} is ${daysOverdue} days overdue. Please complete your payment to proceed with registration.`,
        userId: user._id,
        propertyId: property._id,
        priority: 'high',
        actionRequired: true,
        actionUrl: `/property/${property._id}/payment`,
        metadata: {
          propertyPlotNumber: property.plotNumber,
          daysOverdue,
          reminderType: 'payment_overdue'
        }
      };

      await this.createNotification(notification);

      return { success: true, notification };
    } catch (error) {
      console.error('Error sending payment reminder notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a notification record (placeholder for actual notification system)
   * In a real implementation, this would integrate with email, SMS, or push notification services
   * @param {Object} notificationData - Notification data
   */
  static async createNotification(notificationData) {
    try {
      // For now, we'll log the notification
      // In a real implementation, you would:
      // 1. Save to a notifications table
      // 2. Send email/SMS
      // 3. Send push notification
      // 4. Update user's notification preferences

      console.log('📧 Notification Created:', {
        timestamp: new Date().toISOString(),
        type: notificationData.type,
        title: notificationData.title,
        userId: notificationData.userId,
        priority: notificationData.priority,
        actionRequired: notificationData.actionRequired
      });

      // Simulate saving to database
      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        read: false,
        delivered: true,
        ...notificationData
      };

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   * @param {string} userId - User ID (optional)
   * @returns {Object} Notification statistics
   */
  static async getNotificationStats(userId = null) {
    try {
      // In a real implementation, this would query the notifications table
      // For now, return mock statistics
      return {
        total: 0,
        unread: 0,
        byType: {
          payment_required: 0,
          payment_success: 0,
          payment_failed: 0,
          property_ready_approval: 0,
          payment_reminder: 0
        },
        recent: []
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return null;
    }
  }

  /**
   * Send bulk notifications for payment reminders
   * This would typically be called by a scheduled job
   */
  static async sendPaymentReminders() {
    try {
      // Find properties with overdue payments
      const overdueProperties = await Property.find({
        documentsValidated: true,
        paymentCompleted: false,
        status: 'documents_validated',
        lastUpdated: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // 7 days ago
      }).populate('owner');

      const reminders = [];

      for (const property of overdueProperties) {
        const daysOverdue = Math.floor(
          (Date.now() - property.lastUpdated.getTime()) / (24 * 60 * 60 * 1000)
        );

        const reminder = await this.sendPaymentReminderNotification(
          property,
          property.owner,
          daysOverdue
        );

        if (reminder.success) {
          reminders.push(reminder.notification);
        }
      }

      return { success: true, remindersSent: reminders.length, reminders };
    } catch (error) {
      console.error('Error sending payment reminders:', error);
      return { success: false, error: error.message };
    }
  }
}

export default NotificationService;
