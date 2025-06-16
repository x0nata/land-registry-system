import mongoose from "mongoose";
import User from "../models/User.js";
import Property from "../models/Property.js";

// @desc    Get property statistics
// @route   GET /api/reports/properties
// @access  Admin, Land Officer
export const getPropertyStats = async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.log("Database not connected, returning default stats");
      return res.status(200).json({
        totalProperties: 0,
        pendingProperties: 0,
        approvedProperties: 0,
        rejectedProperties: 0,
        newProperties: 0,
        propertiesByType: [],
        timeframe: req.query.timeframe || 'month',
        message: "Database connection unavailable, showing default values"
      });
    }

    const { timeframe = 'month' } = req.query;

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate;

    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get property statistics with timeout
    const totalProperties = await Property.countDocuments().maxTimeMS(10000);
    const pendingProperties = await Property.countDocuments({ status: 'pending' }).maxTimeMS(10000);
    const approvedProperties = await Property.countDocuments({ status: 'approved' }).maxTimeMS(10000);
    const rejectedProperties = await Property.countDocuments({ status: 'rejected' }).maxTimeMS(10000);
    const newProperties = await Property.countDocuments({
      createdAt: { $gte: startDate }
    }).maxTimeMS(10000);

    // Get properties by type with timeout
    const propertiesByType = await Property.aggregate([
      {
        $group: {
          _id: "$propertyType",
          count: { $sum: 1 }
        }
      }
    ]).maxTimeMS(10000);

    res.json({
      totalProperties,
      pendingProperties,
      approvedProperties,
      rejectedProperties,
      newProperties,
      propertiesByType,
      timeframe
    });
  } catch (error) {
    console.error("Error fetching property statistics:", error);

    // Return default stats instead of error to prevent UI crashes
    res.status(200).json({
      totalProperties: 0,
      pendingProperties: 0,
      approvedProperties: 0,
      rejectedProperties: 0,
      newProperties: 0,
      propertiesByType: [],
      timeframe: req.query.timeframe || 'month',
      message: "Unable to fetch statistics due to database connectivity issues"
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/reports/users
// @access  Admin
export const getUserStats = async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate;

    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalLandOfficers = await User.countDocuments({ role: 'landOfficer' });
    const totalRegularUsers = await User.countDocuments({ role: 'user' });
    const newUsers = await User.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Get user registration trend
    const userTrend = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      totalUsers,
      totalAdmins,
      totalLandOfficers,
      totalRegularUsers,
      newUsers,
      userTrend,
      timeframe
    });
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    res.status(500).json({ message: "Server error while fetching user statistics" });
  }
};

// @desc    Get document statistics
// @route   GET /api/reports/documents
// @access  Admin, Land Officer
export const getDocumentStats = async (req, res) => {
  try {
    // Mock document statistics - In a real application, this would query the Document model
    const documentStats = {
      totalDocuments: 150,
      pendingVerification: 25,
      verifiedDocuments: 120,
      rejectedDocuments: 5,
      documentsByType: [
        { type: 'Title Deed', count: 50 },
        { type: 'Survey Plan', count: 40 },
        { type: 'Tax Certificate', count: 35 },
        { type: 'Identity Document', count: 25 }
      ]
    };

    res.json(documentStats);
  } catch (error) {
    console.error("Error fetching document statistics:", error);
    res.status(500).json({ message: "Server error while fetching document statistics" });
  }
};

// @desc    Get payment statistics
// @route   GET /api/reports/payments
// @access  Admin, Land Officer
export const getPaymentStats = async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;

    // Mock payment statistics - In a real application, this would query the Payment model
    const paymentStats = {
      totalPayments: 75,
      completedPayments: 65,
      pendingPayments: 8,
      failedPayments: 2,
      totalRevenue: 125000,
      averagePayment: 1666.67,
      paymentsByMethod: [
        { method: 'Bank Transfer', count: 40, amount: 80000 },
        { method: 'Mobile Money', count: 25, amount: 35000 },
        { method: 'Cash', count: 10, amount: 10000 }
      ],
      timeframe
    };

    res.json(paymentStats);
  } catch (error) {
    console.error("Error fetching payment statistics:", error);
    res.status(500).json({ message: "Server error while fetching payment statistics" });
  }
};

// @desc    Generate application statistics report
// @route   GET /api/reports/applications
// @access  Admin, Land Officer
export const generateApplicationReport = async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate;

    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get application statistics
    const totalApplications = await Property.countDocuments();
    const newApplications = await Property.countDocuments({
      createdAt: { $gte: startDate }
    });
    const processingTime = await Property.aggregate([
      {
        $match: {
          status: 'approved',
          updatedAt: { $gte: startDate }
        }
      },
      {
        $project: {
          processingDays: {
            $divide: [
              { $subtract: ["$updatedAt", "$createdAt"] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageProcessingTime: { $avg: "$processingDays" }
        }
      }
    ]);

    const applicationTrend = await Property.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      totalApplications,
      newApplications,
      averageProcessingTime: processingTime[0]?.averageProcessingTime || 0,
      applicationTrend,
      timeframe
    });
  } catch (error) {
    console.error("Error generating application report:", error);
    res.status(500).json({ message: "Server error while generating application report" });
  }
};

// @desc    Generate summary report
// @route   GET /api/reports/summary
// @access  Admin
export const generateSummaryReport = async (req, res) => {
  try {
    // Get summary statistics
    const totalUsers = await User.countDocuments();
    const totalProperties = await Property.countDocuments();
    const pendingApplications = await Property.countDocuments({ status: 'pending' });
    const approvedApplications = await Property.countDocuments({ status: 'approved' });

    const summaryReport = {
      overview: {
        totalUsers,
        totalProperties,
        pendingApplications,
        approvedApplications,
        systemUptime: '99.9%',
        lastUpdated: new Date()
      },
      performance: {
        averageProcessingTime: '5.2 days',
        approvalRate: '85%',
        userSatisfaction: '4.2/5'
      },
      trends: {
        userGrowth: '+12%',
        applicationGrowth: '+8%',
        revenueGrowth: '+15%'
      }
    };

    res.json(summaryReport);
  } catch (error) {
    console.error("Error generating summary report:", error);
    res.status(500).json({ message: "Server error while generating summary report" });
  }
};

// @desc    Download report as PDF/Excel
// @route   GET /api/reports/:reportType/download
// @access  Admin
export const downloadReport = async (req, res) => {
  try {
    const { reportType } = req.params;
    const { format = 'pdf' } = req.query;

    // Mock download functionality - In a real application, this would generate actual files
    res.json({
      message: `${reportType} report download in ${format} format would be generated here`,
      reportType,
      format,
      downloadUrl: `/downloads/${reportType}-report.${format}`
    });
  } catch (error) {
    console.error("Error downloading report:", error);
    res.status(500).json({ message: "Server error while downloading report" });
  }
};

// @desc    Get activity logs for reports
// @route   GET /api/reports/activity
// @access  Admin, Land Officer
export const getActivityLogs = async (req, res) => {
  try {
    // Mock activity logs - In a real application, this would query the ActivityLog model
    const activityLogs = [
      {
        id: 1,
        action: 'Property Approved',
        user: 'John Doe',
        timestamp: new Date(),
        details: 'Property #12345 approved'
      },
      {
        id: 2,
        action: 'User Created',
        user: 'Admin',
        timestamp: new Date(Date.now() - 3600000),
        details: 'New user account created'
      }
    ];

    res.json(activityLogs);
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ message: "Server error while fetching activity logs" });
  }
};

// @desc    Get performance metrics
// @route   GET /api/reports/performance
// @access  Admin
export const getPerformanceMetrics = async (req, res) => {
  try {
    // Mock performance metrics - In a real application, this would calculate actual metrics
    const performanceMetrics = {
      systemLoad: '45%',
      responseTime: '250ms',
      errorRate: '0.1%',
      activeUsers: 125,
      peakHours: '9:00 AM - 11:00 AM',
      databaseSize: '2.5 GB'
    };

    res.json(performanceMetrics);
  } catch (error) {
    console.error("Error fetching performance metrics:", error);
    res.status(500).json({ message: "Server error while fetching performance metrics" });
  }
};
