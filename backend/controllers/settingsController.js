import { validationResult } from "express-validator";

// Mock settings data - In a real application, this would be stored in a database
let systemSettings = {
  systemName: "Property Registration System",
  contactEmail: "admin@propertyregistration.com",
  contactPhone: "+251-11-123-4567",
  maintenanceMode: false,
  registrationFee: 500,
  documentVerificationFee: 100,
  transferFee: 300,
  certificateIssueFee: 200,
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  passwordMinLength: 8,
  sessionTimeout: 30,
  maxLoginAttempts: 5,
  twoFactorAuth: false,
};

// @desc    Get system settings
// @route   GET /api/settings
// @access  Admin
export const getSystemSettings = async (req, res) => {
  try {
    res.json(systemSettings);
  } catch (error) {
    console.error("Error fetching system settings:", error);
    res.status(500).json({ message: "Server error while fetching system settings" });
  }
};

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Admin
export const updateSystemSettings = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      systemName,
      contactEmail,
      contactPhone,
      maintenanceMode,
    } = req.body;

    // Update system settings
    if (systemName !== undefined) systemSettings.systemName = systemName;
    if (contactEmail !== undefined) systemSettings.contactEmail = contactEmail;
    if (contactPhone !== undefined) systemSettings.contactPhone = contactPhone;
    if (maintenanceMode !== undefined) systemSettings.maintenanceMode = maintenanceMode;

    res.json(systemSettings);
  } catch (error) {
    console.error("Error updating system settings:", error);
    res.status(500).json({ message: "Server error while updating system settings" });
  }
};

// @desc    Get fee settings
// @route   GET /api/settings/fees
// @access  Admin
export const getFeeSettings = async (req, res) => {
  try {
    const feeSettings = {
      registrationFee: systemSettings.registrationFee,
      documentVerificationFee: systemSettings.documentVerificationFee,
      transferFee: systemSettings.transferFee,
      certificateIssueFee: systemSettings.certificateIssueFee,
    };

    res.json(feeSettings);
  } catch (error) {
    console.error("Error fetching fee settings:", error);
    res.status(500).json({ message: "Server error while fetching fee settings" });
  }
};

// @desc    Update fee settings
// @route   PUT /api/settings/fees
// @access  Admin
export const updateFeeSettings = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      registrationFee,
      documentVerificationFee,
      transferFee,
      certificateIssueFee,
    } = req.body;

    // Update fee settings
    if (registrationFee !== undefined) systemSettings.registrationFee = parseFloat(registrationFee);
    if (documentVerificationFee !== undefined) systemSettings.documentVerificationFee = parseFloat(documentVerificationFee);
    if (transferFee !== undefined) systemSettings.transferFee = parseFloat(transferFee);
    if (certificateIssueFee !== undefined) systemSettings.certificateIssueFee = parseFloat(certificateIssueFee);

    const feeSettings = {
      registrationFee: systemSettings.registrationFee,
      documentVerificationFee: systemSettings.documentVerificationFee,
      transferFee: systemSettings.transferFee,
      certificateIssueFee: systemSettings.certificateIssueFee,
    };

    res.json(feeSettings);
  } catch (error) {
    console.error("Error updating fee settings:", error);
    res.status(500).json({ message: "Server error while updating fee settings" });
  }
};

// @desc    Get notification settings
// @route   GET /api/settings/notifications
// @access  Admin
export const getNotificationSettings = async (req, res) => {
  try {
    const notificationSettings = {
      emailNotifications: systemSettings.emailNotifications,
      smsNotifications: systemSettings.smsNotifications,
      pushNotifications: systemSettings.pushNotifications,
    };

    res.json(notificationSettings);
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    res.status(500).json({ message: "Server error while fetching notification settings" });
  }
};

// @desc    Update notification settings
// @route   PUT /api/settings/notifications
// @access  Admin
export const updateNotificationSettings = async (req, res) => {
  try {
    const {
      emailNotifications,
      smsNotifications,
      pushNotifications,
    } = req.body;

    // Update notification settings
    if (emailNotifications !== undefined) systemSettings.emailNotifications = emailNotifications;
    if (smsNotifications !== undefined) systemSettings.smsNotifications = smsNotifications;
    if (pushNotifications !== undefined) systemSettings.pushNotifications = pushNotifications;

    const notificationSettings = {
      emailNotifications: systemSettings.emailNotifications,
      smsNotifications: systemSettings.smsNotifications,
      pushNotifications: systemSettings.pushNotifications,
    };

    res.json(notificationSettings);
  } catch (error) {
    console.error("Error updating notification settings:", error);
    res.status(500).json({ message: "Server error while updating notification settings" });
  }
};

// @desc    Get security settings
// @route   GET /api/settings/security
// @access  Admin
export const getSecuritySettings = async (req, res) => {
  try {
    const securitySettings = {
      passwordMinLength: systemSettings.passwordMinLength,
      sessionTimeout: systemSettings.sessionTimeout,
      maxLoginAttempts: systemSettings.maxLoginAttempts,
      twoFactorAuth: systemSettings.twoFactorAuth,
    };

    res.json(securitySettings);
  } catch (error) {
    console.error("Error fetching security settings:", error);
    res.status(500).json({ message: "Server error while fetching security settings" });
  }
};

// @desc    Update security settings
// @route   PUT /api/settings/security
// @access  Admin
export const updateSecuritySettings = async (req, res) => {
  try {
    const {
      passwordMinLength,
      sessionTimeout,
      maxLoginAttempts,
      twoFactorAuth,
    } = req.body;

    // Update security settings
    if (passwordMinLength !== undefined) systemSettings.passwordMinLength = parseInt(passwordMinLength);
    if (sessionTimeout !== undefined) systemSettings.sessionTimeout = parseInt(sessionTimeout);
    if (maxLoginAttempts !== undefined) systemSettings.maxLoginAttempts = parseInt(maxLoginAttempts);
    if (twoFactorAuth !== undefined) systemSettings.twoFactorAuth = twoFactorAuth;

    const securitySettings = {
      passwordMinLength: systemSettings.passwordMinLength,
      sessionTimeout: systemSettings.sessionTimeout,
      maxLoginAttempts: systemSettings.maxLoginAttempts,
      twoFactorAuth: systemSettings.twoFactorAuth,
    };

    res.json(securitySettings);
  } catch (error) {
    console.error("Error updating security settings:", error);
    res.status(500).json({ message: "Server error while updating security settings" });
  }
};
