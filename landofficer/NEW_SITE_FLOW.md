# New Property Registration Site Flow

## Overview
This document outlines the new property registration flow that includes document validation, Chapa payment integration, and conditional approval based on payment completion.

## New Site Flow

### 1. User Registration & Property Submission
- User registers a property and uploads required documents
- Property status: `pending` → `documents_pending`

### 2. Document Validation by Land Officers
- Land officers review and validate uploaded documents
- Each document can be: `verified`, `rejected`, or `needs_update`
- When ALL documents are validated: Property status → `documents_validated`
- Property field `documentsValidated` set to `true`

### 3. Payment Processing via Chapa
- User can initiate payment only after all documents are validated
- Payment integration with Chapa payment gateway
- Property status: `documents_validated` → `payment_pending` → `payment_completed`
- Property field `paymentCompleted` set to `true`

### 4. Final Approval by Land Officers
- Land officers can approve/reject property only after payment completion
- Approval requires both: `documentsValidated: true` AND `paymentCompleted: true`
- Final status: `approved` or `rejected`

## Technical Implementation

### Backend Changes

#### 1. Property Model Updates (`server/models/Property.js`)
```javascript
// New status enum values
status: {
  enum: ["pending", "documents_pending", "documents_validated", "payment_pending", "payment_completed", "under_review", "approved", "rejected"]
}

// New fields
documentsValidated: { type: Boolean, default: false }
paymentCompleted: { type: Boolean, default: false }
chapaTransactionRef: { type: String, sparse: true }
```

#### 2. Chapa Payment Service (`server/services/chapaService.js`)
- Payment initialization with Chapa API
- Payment verification
- Webhook signature validation
- Processing fee calculation
- Transaction reference generation

#### 3. Payment Controller Updates (`server/controllers/paymentController.js`)
- `initializeChapaPayment()` - Initialize payment with Chapa
- `handleChapaCallback()` - Handle payment webhooks
- `verifyChapaPayment()` - Verify payment status

#### 4. Document Controller Updates (`server/controllers/documentController.js`)
- `checkAllDocumentsValidated()` - Helper function to check if all documents are validated
- Updated `verifyDocument()` and `rejectDocument()` to update property status
- Automatic property status updates based on document validation

#### 5. Property Controller Updates (`server/controllers/propertyController.js`)
- Updated `approveProperty()` to require both document validation and payment completion
- Enhanced validation checks before approval

#### 6. New Payment Routes (`server/routes/paymentRoutes.js`)
```javascript
POST /api/payments/chapa/initialize/:propertyId  // Initialize Chapa payment
POST /api/payments/chapa/callback               // Handle Chapa webhooks
GET  /api/payments/chapa/verify/:txRef          // Verify payment status
```

### Frontend Changes

#### 1. Property Details Page (`client/src/pages/user/PropertyDetails.jsx`)
- Real API integration (replaced mock data)
- Payment status indicators
- Conditional payment button based on document validation status
- Enhanced status badges for new flow states

#### 2. New Payment Page (`client/src/pages/user/PropertyPayment.jsx`)
- Dedicated payment page for Chapa integration
- Processing fee calculation and display
- Payment method information
- Conditional payment based on document validation

#### 3. Land Officer Verification Page (`client/src/pages/landOfficer/PropertyDetailVerification.jsx`)
- Updated approval logic to require payment completion
- Payment status display
- Enhanced process status indicators
- Conditional approval buttons

#### 4. Payment Service (`client/src/services/paymentService.js`)
- `initializeChapaPayment()` - Initialize payment
- `verifyChapaPayment()` - Verify payment status

#### 5. New Route
```javascript
/property/:id/payment  // Dedicated payment page
```

## Environment Variables

### Required Chapa Configuration (`.env`)
```bash
# Chapa Payment Configuration
CHAPA_SECRET_KEY=your-chapa-secret-key-here
CHAPA_PUBLIC_KEY=your-chapa-public-key-here
CHAPA_BASE_URL=https://api.chapa.co/v1
CHAPA_WEBHOOK_SECRET=your-chapa-webhook-secret-here

# Frontend/Backend URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
```

## Status Flow Diagram

```
User Registers Property
         ↓
   documents_pending
         ↓
Land Officer Validates Documents
         ↓
   documents_validated
         ↓
User Makes Payment via Chapa
         ↓
   payment_pending → payment_completed
         ↓
Land Officer Final Approval
         ↓
     approved/rejected
```

## Key Features

### 1. Document Validation Flow
- Land officers can verify/reject individual documents
- Automatic property status updates when all documents are validated
- Document validation status tracking

### 2. Chapa Payment Integration
- Secure payment processing with Chapa
- Webhook handling for payment confirmation
- Processing fee calculation based on property type and area
- Payment status tracking

### 3. Conditional Approval
- Approval blocked until both documents are validated AND payment is completed
- Clear status indicators for land officers
- Enhanced user experience with step-by-step flow

### 4. Enhanced Notifications
- Status-based notifications throughout the process
- Payment completion notifications
- Document validation notifications

## Testing

### 1. Document Validation Testing
- Upload documents for a property
- Verify documents as land officer
- Check property status updates

### 2. Payment Flow Testing
- Ensure payment button appears only after document validation
- Test Chapa payment initialization
- Test webhook handling (use Chapa test environment)
- Verify payment status updates

### 3. Approval Flow Testing
- Ensure approval is blocked without payment completion
- Test approval after payment completion
- Verify final status updates

## Security Considerations

1. **Webhook Security**: Chapa webhook signature validation
2. **Payment Verification**: Always verify payments with Chapa API
3. **Authorization**: Proper role-based access control
4. **Data Validation**: Input validation for all payment-related data

## Future Enhancements

1. **Payment Receipts**: Generate and store payment receipts
2. **Refund Handling**: Implement refund functionality
3. **Multiple Payment Methods**: Support additional payment gateways
4. **Payment History**: Enhanced payment tracking and reporting
5. **Automated Notifications**: Email/SMS notifications for status changes
