import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

const PaymentForm = ({ propertyId, onSuccess }) => {
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  
  // Validation schema
  const validationSchema = Yup.object({
    amount: Yup.number()
      .required('Amount is required')
      .positive('Amount must be a positive number'),
    currency: Yup.string()
      .required('Currency is required')
      .oneOf(['ETB', 'USD'], 'Invalid currency'),
    paymentType: Yup.string()
      .required('Payment type is required')
      .oneOf(
        ['registration_fee', 'tax', 'transfer_fee', 'other'],
        'Invalid payment type'
      ),
    paymentMethod: Yup.string()
      .required('Payment method is required')
      .oneOf(
        ['cbe_birr', 'telebirr', 'credit_card', 'bank_transfer', 'cash'],
        'Invalid payment method'
      ),
    transactionId: Yup.string().when('paymentMethod', {
      is: (method) => method !== 'cash',
      then: Yup.string().required('Transaction ID is required for electronic payments')
    })
  });
  
  // Handle receipt file change
  const handleReceiptChange = (event) => {
    const selectedFile = event.currentTarget.files[0];
    
    if (!selectedFile) {
      setReceipt(null);
      setReceiptPreview(null);
      return;
    }
    
    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit');
      event.target.value = null;
      return;
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Invalid file type. Only images and PDFs are allowed.');
      event.target.value = null;
      return;
    }
    
    setReceipt(selectedFile);
    
    // Create file preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      // For non-image files, just show the file name
      setReceiptPreview(null);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      // In a real app, this would call the API to create a payment
      // For now, we'll simulate a successful payment
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // If receipt upload is shown, check if receipt is selected
      if (showReceiptUpload && !receipt) {
        toast.error('Please upload a receipt');
        setSubmitting(false);
        return;
      }
      
      // Reset form
      resetForm();
      setShowReceiptUpload(false);
      setReceipt(null);
      setReceiptPreview(null);
      
      // Show success message
      toast.success('Payment recorded successfully');
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Get payment type display name
  const getPaymentTypeDisplay = (type) => {
    switch (type) {
      case 'registration_fee':
        return 'Registration Fee';
      case 'tax':
        return 'Property Tax';
      case 'transfer_fee':
        return 'Transfer Fee';
      case 'other':
        return 'Other Payment';
      default:
        return type;
    }
  };
  
  // Get payment method display name
  const getPaymentMethodDisplay = (method) => {
    switch (method) {
      case 'cbe_birr':
        return 'CBE Birr';
      case 'telebirr':
        return 'Telebirr';
      case 'credit_card':
        return 'Credit Card';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'cash':
        return 'Cash';
      default:
        return method;
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Make Payment</h3>
      
      <Formik
        initialValues={{
          amount: '',
          currency: 'ETB',
          paymentType: '',
          paymentMethod: '',
          transactionId: ''
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, values }) => (
          <Form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="form-label">
                  Amount
                </label>
                <Field
                  type="number"
                  name="amount"
                  id="amount"
                  className="form-input"
                  placeholder="e.g., 5000"
                  min="0"
                  step="0.01"
                />
                <ErrorMessage name="amount" component="div" className="form-error" />
              </div>
              
              <div>
                <label htmlFor="currency" className="form-label">
                  Currency
                </label>
                <Field
                  as="select"
                  name="currency"
                  id="currency"
                  className="form-input"
                >
                  <option value="ETB">Ethiopian Birr (ETB)</option>
                  <option value="USD">US Dollar (USD)</option>
                </Field>
                <ErrorMessage name="currency" component="div" className="form-error" />
              </div>
            </div>
            
            <div>
              <label htmlFor="paymentType" className="form-label">
                Payment Type
              </label>
              <Field
                as="select"
                name="paymentType"
                id="paymentType"
                className="form-input"
              >
                <option value="">Select Payment Type</option>
                <option value="registration_fee">Registration Fee</option>
                <option value="tax">Property Tax</option>
                <option value="transfer_fee">Transfer Fee</option>
                <option value="other">Other Payment</option>
              </Field>
              <ErrorMessage name="paymentType" component="div" className="form-error" />
            </div>
            
            <div>
              <label htmlFor="paymentMethod" className="form-label">
                Payment Method
              </label>
              <Field
                as="select"
                name="paymentMethod"
                id="paymentMethod"
                className="form-input"
                onChange={(e) => {
                  const value = e.target.value;
                  // Show receipt upload for electronic payments
                  setShowReceiptUpload(value !== '' && value !== 'cash');
                }}
              >
                <option value="">Select Payment Method</option>
                <option value="cbe_birr">CBE Birr</option>
                <option value="telebirr">Telebirr</option>
                <option value="credit_card">Credit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
              </Field>
              <ErrorMessage name="paymentMethod" component="div" className="form-error" />
            </div>
            
            {values.paymentMethod && values.paymentMethod !== 'cash' && (
              <div>
                <label htmlFor="transactionId" className="form-label">
                  Transaction ID
                </label>
                <Field
                  type="text"
                  name="transactionId"
                  id="transactionId"
                  className="form-input"
                  placeholder="e.g., TRX123456789"
                />
                <ErrorMessage name="transactionId" component="div" className="form-error" />
              </div>
            )}
            
            {showReceiptUpload && (
              <div>
                <label htmlFor="receipt" className="form-label">
                  Upload Receipt
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="receipt-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-ethiopian-green hover:text-ethiopian-green-dark focus-within:outline-none"
                      >
                        <span>Upload a receipt</span>
                        <input
                          id="receipt-upload"
                          name="receipt-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleReceiptChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, PDF up to 5MB
                    </p>
                  </div>
                </div>
                {receiptPreview && (
                  <div className="mt-2">
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
                      className="h-32 object-contain"
                    />
                  </div>
                )}
                {receipt && !receiptPreview && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected file: {receipt.name}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary py-2 px-6 rounded-md"
              >
                {isSubmitting ? 'Processing...' : 'Make Payment'}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default PaymentForm;
