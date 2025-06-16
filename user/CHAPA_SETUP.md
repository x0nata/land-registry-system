# Chapa Payment Integration Setup Guide

## Quick Start (Development)

To get the server running without Chapa configuration errors, the system now gracefully handles missing Chapa credentials. However, to enable payment functionality, you'll need to configure Chapa.

## 1. Get Chapa Credentials

### For Testing (Recommended for Development)
1. Visit [Chapa Developer Portal](https://developer.chapa.co/)
2. Sign up for a developer account
3. Get your test credentials:
   - Test Secret Key
   - Test Public Key
   - Webhook Secret (optional for development)

### For Production
1. Complete Chapa business verification
2. Get production credentials

## 2. Configure Environment Variables

Add these variables to your `server/.env` file:

```bash
# Chapa Payment Configuration
CHAPA_SECRET_KEY=CHASECK_TEST-your-test-secret-key-here
CHAPA_PUBLIC_KEY=CHAPUBK_TEST-your-test-public-key-here
CHAPA_BASE_URL=https://api.chapa.co/v1
CHAPA_WEBHOOK_SECRET=your-webhook-secret-here

# Required URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
```

## 3. Test Credentials (For Development)

You can use these test credentials to get started:

```bash
# Test credentials (replace with your actual test keys)
CHAPA_SECRET_KEY=CHASECK_TEST-your-actual-test-key
CHAPA_PUBLIC_KEY=CHAPUBK_TEST-your-actual-public-key
CHAPA_BASE_URL=https://api.chapa.co/v1
```

## 4. Webhook Configuration

### Development
For local development, you can use tools like ngrok to expose your local server:

1. Install ngrok: `npm install -g ngrok`
2. Expose your local server: `ngrok http 5000`
3. Use the ngrok URL for webhook configuration in Chapa dashboard
4. Webhook endpoint: `https://your-ngrok-url.ngrok.io/api/payments/chapa/callback`

### Production
Set your production webhook URL in Chapa dashboard:
- Webhook URL: `https://your-domain.com/api/payments/chapa/callback`

## 5. Testing Payment Flow

### Without Chapa Configuration
- Server will start normally
- Payment buttons will show "Payment service unavailable" message
- All other functionality works normally

### With Chapa Configuration
1. Register a property
2. Upload and validate documents (as land officer)
3. Initiate payment (as user)
4. Complete payment through Chapa test interface
5. Verify payment completion
6. Approve property (as land officer)

## 6. Payment Flow Testing

### Test Payment Data
When testing, you can use these test values:
- Amount: Any amount (minimum 100 ETB)
- Currency: ETB
- Test Cards: Use Chapa's test card numbers

### Test Scenarios
1. **Successful Payment**: Complete payment flow
2. **Failed Payment**: Test with invalid card details
3. **Webhook Handling**: Verify webhook receives payment confirmation
4. **Payment Verification**: Test manual payment verification

## 7. Production Checklist

Before going live:

- [ ] Replace test credentials with production credentials
- [ ] Configure production webhook URL
- [ ] Test with real payment methods
- [ ] Verify webhook signature validation
- [ ] Set up proper error monitoring
- [ ] Configure payment receipt generation
- [ ] Test refund functionality (if implemented)

## 8. Troubleshooting

### Common Issues

1. **Server crashes with "CHAPA_SECRET_KEY required"**
   - Solution: The system now handles this gracefully. Update your code if you see this error.

2. **Payment initialization fails**
   - Check if Chapa credentials are correctly set
   - Verify network connectivity to Chapa API
   - Check API key permissions

3. **Webhook not receiving callbacks**
   - Verify webhook URL is accessible
   - Check webhook signature validation
   - Ensure webhook endpoint is properly configured

4. **Payment verification fails**
   - Check transaction reference format
   - Verify API credentials
   - Check Chapa API status

### Debug Mode

To enable debug logging for payments, add to your `.env`:
```bash
DEBUG_PAYMENTS=true
```

## 9. Security Notes

1. **Never expose secret keys** in frontend code
2. **Always verify payments** on the backend
3. **Validate webhook signatures** in production
4. **Use HTTPS** for all payment-related endpoints
5. **Log payment activities** for audit purposes

## 10. Support

- Chapa Documentation: https://developer.chapa.co/docs
- Chapa Support: support@chapa.co
- Test Environment: Use test credentials for development

## Current Implementation Status

✅ **Implemented Features:**
- Payment initialization with Chapa
- Webhook handling for payment confirmation
- Payment verification
- Processing fee calculation
- Error handling for missing configuration
- Graceful degradation when Chapa is not configured

🔄 **Next Steps:**
- Configure your Chapa credentials
- Test the complete payment flow
- Set up webhook URL in Chapa dashboard
- Deploy to production with proper credentials
