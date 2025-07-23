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

      // Create application log (only if database is connected)
      try {
        await ApplicationLog.create({
          property: property._id,
          user: user._id,
          action: "other",
          status: "pending",
          performedBy: user._id,
          performedByRole: 'user',
          notes: `Payment required notification sent - Amount: ${amount} ETB`,
          metadata: { notificationType: 'payment_required', amount }
        });
      } catch (logError) {
        console.warn('Could not create application log:', logError.message);
      }

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

      // Create application log (only if database is connected)
      try {
        await ApplicationLog.create({
          property: property._id,
          user: user._id,
          action: "other",
          status: "pending",
          performedBy: user._id,
          performedByRole: 'user',
          notes: `Payment success notification sent - Receipt: ${payment.receiptNumber}`,
          metadata: { notificationType: 'payment_success', paymentId: payment._id }
        });
      } catch (logError) {
        console.warn('Could not create application log:', logError.message);
      }

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

      // Create application log (only if database is connected)
      try {
        await ApplicationLog.create({
          property: property._id,
          user: user._id,
          action: "other",
          status: "pending",
          performedBy: user._id,
          performedByRole: 'user',
          notes: `Payment failed notification sent - Reason: ${reason}`,
          metadata: { notificationType: 'payment_failed', paymentId: payment._id, failureReason: reason }
        });
      } catch (logError) {
        console.warn('Could not create application log:', logError.message);
      }

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

      // Create application log (only if database is connected)
      try {
        await ApplicationLog.create({
          property: property._id,
          user: user._id,
          action: "other",
          status: "pending",
          performedBy: user._id,
          performedByRole: 'user',
          notes: `Property ready for approval notifications sent to ${landOfficers.length} land officers`,
          metadata: { notificationType: 'property_ready_approval', landOfficerCount: landOfficers.length }
        });
      } catch (logError) {
        console.warn('Could not create application log:', logError.message);
      }

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

  /**
   * Send payment completed notification to user
   * @param {Object} property - Property object
   * @param {Object} user - User object
   * @param {Object} payment - Payment object
   */
  static async sendPaymentCompletedNotification(property, user, payment) {
    try {
      const notification = {
        type: 'payment_completed',
        title: 'Payment Completed Successfully',
        message: `Your payment of ${payment.amount} ${payment.currency} for property ${property.plotNumber} has been completed successfully. Your payment is now pending verification by our land officers.`,
        userId: user._id,
        propertyId: property._id,
        priority: 'medium',
        actionRequired: false,
        actionUrl: `/property/${property._id}`,
        metadata: {
          propertyPlotNumber: property.plotNumber,
          paymentAmount: payment.amount,
          paymentCurrency: payment.currency,
          paymentMethod: payment.paymentMethod,
          completionDate: new Date().toISOString()
        }
      };

      await this.createNotification(notification);

      console.log('📧 Payment completion notification sent to user');
    } catch (error) {
      console.error('Error sending payment completion notification:', error);
    }
  }

  /**
   * Send payment verified notification to user
   * @param {Object} property - Property object
   * @param {Object} user - User object
   * @param {Object} payment - Payment object
   * @param {Object} verifiedBy - Land officer who verified the payment
   */
  static async sendPaymentVerifiedNotification(property, user, payment, verifiedBy) {
    try {
      const notification = {
        type: 'payment_verified',
        title: 'Payment Verified Successfully',
        message: `Your payment of ${payment.amount} ${payment.currency} for property ${property.plotNumber} has been verified and approved. Your property registration is now ready for final approval.`,
        userId: user._id,
        propertyId: property._id,
        priority: 'high',
        actionRequired: false,
        actionUrl: `/property/${property._id}`,
        metadata: {
          propertyPlotNumber: property.plotNumber,
          paymentAmount: payment.amount,
          paymentCurrency: payment.currency,
          paymentMethod: payment.paymentMethod,
          verifiedBy: verifiedBy.fullName || verifiedBy.email,
          verifiedByRole: verifiedBy.role,
          verificationDate: new Date().toISOString()
        }
      };

      await this.createNotification(notification);

      console.log('📧 Payment verification notification sent to user');
    } catch (error) {
      console.error('Error sending payment verification notification:', error);
    }
  }

  /**
   * Send payment rejected notification to user
   * @param {Object} property - Property object
   * @param {Object} user - User object
   * @param {Object} payment - Payment object
   * @param {Object} rejectedBy - Land officer who rejected the payment
   * @param {string} reason - Rejection reason
   */
  static async sendPaymentRejectedNotification(property, user, payment, rejectedBy, reason) {
    try {
      const notification = {
        type: 'payment_rejected',
        title: 'Payment Rejected',
        message: `Your payment of ${payment.amount} ${payment.currency} for property ${property.plotNumber} has been rejected. Reason: ${reason || 'No reason provided'}. You can submit a new payment to continue with your registration.`,
        userId: user._id,
        propertyId: property._id,
        priority: 'high',
        actionRequired: true,
        actionUrl: `/property/${property._id}/payment`,
        metadata: {
          propertyPlotNumber: property.plotNumber,
          paymentAmount: payment.amount,
          paymentCurrency: payment.currency,
          paymentMethod: payment.paymentMethod,
          rejectedBy: rejectedBy.fullName || rejectedBy.email,
          rejectedByRole: rejectedBy.role,
          rejectionReason: reason || 'No reason provided',
          rejectionDate: new Date().toISOString()
        }
      };

      await this.createNotification(notification);

      console.log('📧 Payment rejection notification sent to user');
    } catch (error) {
      console.error('Error sending payment rejection notification:', error);
    }
  }
  }

  /**
   * Send dispute submitted notification to admins/land officers
   * @param {Object} dispute - Dispute object
   * @param {Object} property - Property object
   * @param {Object} user - User object (disputant)
   */
  static async sendDisputeSubmittedNotification(dispute, property, user) {
    try {
      const notification = {
        type: 'dispute_submitted',
        title: 'New Dispute Submitted',
        message: `A new dispute has been submitted for property ${property.plotNumber} by ${user.fullName}. Dispute type: ${dispute.disputeType.replace('_', ' ')}. Please review and take appropriate action.`,
        userId: null, // Will be set for each admin/land officer
        propertyId: property._id,
        disputeId: dispute._id,
        priority: 'high',
        actionRequired: true,
        actionUrl: `/admin/disputes/${dispute._id}`,
        metadata: {
          disputeType: dispute.disputeType,
          disputeTitle: dispute.title,
          disputantName: user.fullName,
          disputantEmail: user.email,
          propertyPlotNumber: property.plotNumber,
          propertyLocation: property.location
        }
      };

      // Send notification to all admins and land officers
      // In a real implementation, you would fetch admin/land officer user IDs
      // and send individual notifications
      await this.createNotification(notification);

      console.log('📧 Dispute notification sent to administrators');
    } catch (error) {
      console.error('Error sending dispute notification:', error);
    }
  }

  /**
   * Send dispute status update notification to disputant
   * @param {Object} dispute - Dispute object
   * @param {Object} property - Property object
   * @param {Object} user - User object (disputant)
   * @param {string} newStatus - New dispute status
   * @param {string} notes - Status update notes
   */
  static async sendDisputeStatusUpdateNotification(dispute, property, user, newStatus, notes) {
    try {
      const statusMessages = {
        'under_review': 'Your dispute is now under review by our team.',
        'investigation': 'Your dispute is being investigated. We may contact you for additional information.',
        'mediation': 'Your dispute has been referred to mediation.',
        'resolved': 'Your dispute has been resolved.',
        'dismissed': 'Your dispute has been dismissed.',
        'withdrawn': 'Your dispute has been withdrawn.'
      };

      const notification = {
        type: 'dispute_status_update',
        title: 'Dispute Status Updated',
        message: `Your dispute for property ${property.plotNumber} has been updated to "${newStatus.replace('_', ' ')}". ${statusMessages[newStatus] || ''} ${notes ? `Notes: ${notes}` : ''}`,
        userId: user._id,
        propertyId: property._id,
        disputeId: dispute._id,
        priority: newStatus === 'resolved' || newStatus === 'dismissed' ? 'medium' : 'high',
        actionRequired: newStatus === 'investigation',
        actionUrl: `/disputes/${dispute._id}`,
        metadata: {
          disputeType: dispute.disputeType,
          disputeTitle: dispute.title,
          newStatus,
          statusNotes: notes,
          propertyPlotNumber: property.plotNumber
        }
      };

      await this.createNotification(notification);
    } catch (error) {
      console.error('Error sending dispute status update notification:', error);
    }
  }

  /**
   * Send dispute resolved notification to disputant
   * @param {Object} dispute - Dispute object
   * @param {Object} property - Property object
   * @param {Object} user - User object (disputant)
   * @param {string} decision - Resolution decision
   * @param {string} resolutionNotes - Resolution notes
   */
  static async sendDisputeResolvedNotification(dispute, property, user, decision, resolutionNotes) {
    try {
      const decisionMessages = {
        'in_favor_of_disputant': 'The decision has been made in your favor.',
        'in_favor_of_respondent': 'The decision has been made in favor of the respondent.',
        'compromise': 'A compromise solution has been reached.',
        'dismissed': 'Your dispute has been dismissed.'
      };

      const notification = {
        type: 'dispute_resolved',
        title: 'Dispute Resolved',
        message: `Your dispute for property ${property.plotNumber} has been resolved. ${decisionMessages[decision] || ''} Resolution: ${resolutionNotes}`,
        userId: user._id,
        propertyId: property._id,
        disputeId: dispute._id,
        priority: 'high',
        actionRequired: false,
        actionUrl: `/disputes/${dispute._id}`,
        metadata: {
          disputeType: dispute.disputeType,
          disputeTitle: dispute.title,
          decision,
          resolutionNotes,
          propertyPlotNumber: property.plotNumber
        }
      };

      await this.createNotification(notification);
    } catch (error) {
      console.error('Error sending dispute resolved notification:', error);
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
