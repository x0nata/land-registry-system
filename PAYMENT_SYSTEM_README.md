# Land Registry Payment System

## Overview

The Land Registry Payment System is a comprehensive payment integration that supports Ethiopian payment methods (CBE Birr and TeleBirr) as a mandatory step in the property registration workflow. The system ensures that payments are completed before land officers can approve property registrations.

## Features

### Payment Methods
- **CBE Birr**: Direct bank transfer using Commercial Bank of Ethiopia accounts
- **TeleBirr**: Mobile wallet payment through Ethio Telecom
- **Chapa**: Credit/debit card and other payment methods (existing)

### Payment Workflow
1. **Document Submission**: User uploads property documents
2. **Document Validation**: Land officer validates documents
3. **Payment Required**: System calculates fees and prompts for payment
4. **Payment Processing**: User completes payment via chosen method
5. **Final Approval**: Land officer can approve after payment completion

### Security Features
- Payment authorization middleware
- Rate limiting for payment attempts
- Duplicate payment prevention
- Secure transaction processing
- Payment amount validation
- Audit logging for security events

## Architecture

### Backend Components

#### Models
- **Payment.js**: Enhanced payment model with Ethiopian payment methods
- **Property.js**: Updated with payment status tracking
- **User.js**: Existing user model with payment history

#### Services
- **paymentCalculationService.js**: Fee calculation based on property type and location
- **simulatedPaymentGateway.js**: Simulated CBE Birr and TeleBirr payment processing
- **notificationService.js**: Payment-related notifications

#### Controllers
- **paymentController.js**: Enhanced with new payment endpoints
- **propertyController.js**: Updated with payment workflow integration

#### Middleware
- **paymentAuth.js**: Comprehensive payment authorization and security

### Frontend Components

#### User Interface
- **PaymentMethodSelector.jsx**: Payment method selection interface
- **CBEBirrPayment.jsx**: CBE Birr payment interface
- **TeleBirrPayment.jsx**: TeleBirr payment interface
- **PaymentSuccess.jsx**: Payment completion page
- **PaymentStatusIndicator.jsx**: Payment status display components
- **PaymentHistory.jsx**: Payment history and receipt management
- **PaymentDashboard.jsx**: Comprehensive payment overview

## API Endpoints

### Payment Calculation
```
GET /api/payments/calculate/:propertyId
```
Calculate registration fees for a property.

### CBE Birr Payments
```
POST /api/payments/cbe-birr/initialize/:propertyId
POST /api/payments/cbe-birr/process/:transactionId
```

### TeleBirr Payments
```
POST /api/payments/telebirr/initialize/:propertyId
POST /api/payments/telebirr/process/:transactionId
```

### Payment Management
```
GET /api/payments/stats
GET /api/payments/verify/:transactionId
GET /api/payments/:id/receipt
GET /api/payments (admin/land officer only)
```

### Property Workflow
```
GET /api/properties/:id/payment-requirements
PUT /api/properties/:id/payment-completed
```

## Fee Structure

### Base Registration Fees (ETB)
- **Residential**: Urban 2,500 / Rural 1,500
- **Commercial**: Urban 5,000 / Rural 3,000
- **Industrial**: Urban 7,500 / Rural 4,500
- **Agricultural**: Urban 1,000 / Rural 800

### Additional Fees
- **Processing Fee**: 150 ETB
- **Registration Tax**: 2% of property value
- **Stamp Duty**: 0.5% of property value
- **Area-based multipliers**: Varies by property type and location

### Discounts Available
- First-time property owners: 10%
- Veterans: 15%
- People with disabilities: 20%
- Low-income applicants: 25%

## Payment Workflow States

1. **documents_submitted**: Documents uploaded, validation pending
2. **documents_validated**: Documents approved, payment required
3. **payment_pending**: Payment initiated but not completed
4. **payment_completed**: Payment successful, ready for approval
5. **approved**: Property registration complete

## Security Measures

### Authorization
- Property owners can only pay for their own properties
- Payment verification requires proper authentication
- Role-based access controls for payment management

### Rate Limiting
- Maximum 5 payment attempts per 5-minute window
- Prevents payment abuse and system overload

### Validation
- Payment amounts must match calculated fees
- Workflow state validation prevents out-of-order operations
- Duplicate payment prevention

### Audit Logging
- All payment operations are logged
- Security events tracked for monitoring
- Transaction history maintained

## Testing

### Test Coverage
- Payment calculation accuracy
- Payment method initialization and processing
- Workflow integration and state transitions
- Security controls and authorization
- Error handling and edge cases

### Running Tests
```bash
cd backend
npm test payment.test.js
```

## Deployment

### Environment Variables
```
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
```

### Database Setup
The payment system uses the existing MongoDB database with enhanced schemas for payments and properties.

### Frontend Deployment
```bash
cd user
npm run build
# Deploy to Vercel or preferred hosting
```

### Backend Deployment
```bash
cd backend
npm run build
# Deploy to Vercel serverless functions
```

## Usage Examples

### Initialize CBE Birr Payment
```javascript
const response = await fetch('/api/payments/cbe-birr/initialize/PROPERTY_ID', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    returnUrl: 'https://yourapp.com/property/PROPERTY_ID'
  })
});
```

### Process Payment
```javascript
const response = await fetch('/api/payments/cbe-birr/process/TRANSACTION_ID', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    cbeAccountNumber: '1234567890123456',
    cbePin: '1234'
  })
});
```

## Monitoring and Maintenance

### Payment Statistics
- Track payment success rates
- Monitor payment method usage
- Analyze fee collection trends

### Error Handling
- Failed payments are logged and can be retried
- Users receive clear error messages
- Support team can track payment issues

### Notifications
- Users notified when payment is required
- Success/failure notifications sent
- Land officers alerted when properties are ready for approval

## Support

### Common Issues
1. **Payment Failed**: Check account balance and credentials
2. **Session Expired**: Restart payment process
3. **Amount Mismatch**: Recalculate fees if property details changed

### Contact Information
- Technical Support: support@landregistry.gov.et
- Payment Issues: payments@landregistry.gov.et
- Phone: +251-11-123-4567

## Future Enhancements

### Planned Features
- Real payment gateway integration
- Mobile app payment support
- Bulk payment processing
- Advanced reporting and analytics
- Integration with Ethiopian banking APIs

### Scalability Considerations
- Payment queue processing for high volume
- Distributed payment processing
- Enhanced security monitoring
- Performance optimization

## Compliance

### Ethiopian Regulations
- Complies with Ethiopian banking regulations
- Follows data protection requirements
- Meets government payment standards

### Security Standards
- PCI DSS compliance considerations
- Data encryption in transit and at rest
- Regular security audits recommended
