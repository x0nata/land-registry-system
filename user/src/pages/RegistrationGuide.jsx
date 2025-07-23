import { Link } from 'react-router-dom';

const RegistrationGuide = () => {
  return (
    <div className="bg-white">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-primary to-primary-dark text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Land Registration Guide
            </h1>
            <p className="text-xl">
              Complete step-by-step manual for registering your property in Ethiopia
            </p>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
              <h2 className="text-2xl font-bold text-blue-800 mb-2">Registration Overview</h2>
              <p className="text-blue-700">
                The land registration process involves four main stages: Document Preparation → 
                Property Validation → Payment Processing → Land Officer Approval. 
                The entire process typically takes 15-30 business days depending on document completeness and verification requirements.
              </p>
            </div>

            {/* Process Timeline */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-6">Registration Timeline</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-green-600 font-bold text-lg mb-2">Step 1</div>
                  <div className="text-sm font-semibold">Document Submission</div>
                  <div className="text-xs text-gray-600 mt-1">1-2 days</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-blue-600 font-bold text-lg mb-2">Step 2</div>
                  <div className="text-sm font-semibold">Property Validation</div>
                  <div className="text-xs text-gray-600 mt-1">7-14 days</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="text-yellow-600 font-bold text-lg mb-2">Step 3</div>
                  <div className="text-sm font-semibold">Payment Processing</div>
                  <div className="text-xs text-gray-600 mt-1">1-2 days</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-purple-600 font-bold text-lg mb-2">Step 4</div>
                  <div className="text-sm font-semibold">Final Approval</div>
                  <div className="text-xs text-gray-600 mt-1">5-10 days</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step 1: Document Preparation */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4">
                1
              </div>
              <h2 className="text-3xl font-bold">Document Preparation & Requirements</h2>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-xl font-semibold mb-4 text-green-600">Required Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Primary Documents</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Valid Ethiopian ID or Passport
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Property deed or title document
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Survey plan and coordinates
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Tax clearance certificate
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Supporting Documents</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Proof of purchase (if applicable)
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Inheritance documents (if inherited)
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Neighbor consent letters
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Environmental clearance (if required)
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Document Requirements</h4>
              <ul className="text-yellow-700 space-y-1">
                <li>• All documents must be original or certified copies</li>
                <li>• Documents in foreign languages must be translated to Amharic</li>
                <li>• Digital copies should be clear, high-resolution scans (PDF format preferred)</li>
                <li>• File size limit: 10MB per document</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Step 2: Property Validation */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4">
                2
              </div>
              <h2 className="text-3xl font-bold">Property Validation Process</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-blue-600">Validation Steps</h3>
                <ol className="space-y-3">
                  <li className="flex items-start">
                    <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                    <div>
                      <div className="font-medium">Document Review</div>
                      <div className="text-sm text-gray-600">Initial verification of submitted documents</div>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                    <div>
                      <div className="font-medium">Property Survey</div>
                      <div className="text-sm text-gray-600">Physical inspection and boundary verification</div>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                    <div>
                      <div className="font-medium">Legal Verification</div>
                      <div className="text-sm text-gray-600">Checking for liens, disputes, or legal issues</div>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                    <div>
                      <div className="font-medium">Validation Report</div>
                      <div className="text-sm text-gray-600">Comprehensive assessment and recommendations</div>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-blue-600">What to Expect</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">📋</span>
                    You'll receive status updates via email and SMS
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">🔍</span>
                    Land officers may request additional documents
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">📍</span>
                    Site visit may be scheduled for verification
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">⏱️</span>
                    Process typically takes 7-14 business days
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step 3: Payment Procedures */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4">
                3
              </div>
              <h2 className="text-3xl font-bold">Payment Procedures</h2>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-xl font-semibold mb-4 text-yellow-600">Payment Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-bold">CBE</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">CBE Birr</h4>
                      <p className="text-sm text-gray-600">Commercial Bank of Ethiopia</p>
                    </div>
                  </div>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Secure bank transfer</li>
                    <li>• Real-time processing</li>
                    <li>• Transaction receipt provided</li>
                    <li>• Available 24/7</li>
                  </ul>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-green-600 font-bold">TB</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">TeleBirr</h4>
                      <p className="text-sm text-gray-600">Mobile Money Service</p>
                    </div>
                  </div>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Mobile wallet payment</li>
                    <li>• Instant confirmation</li>
                    <li>• SMS notifications</li>
                    <li>• Convenient and fast</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-xl font-semibold mb-4 text-yellow-600">Fee Structure</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">Service</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Fee (ETB)</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Processing Fee</td>
                      <td className="border border-gray-300 px-4 py-2 font-semibold">300</td>
                      <td className="border border-gray-300 px-4 py-2">Document processing and validation</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Administrative Tax</td>
                      <td className="border border-gray-300 px-4 py-2 font-semibold">200</td>
                      <td className="border border-gray-300 px-4 py-2">Government administrative charges</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Service Tax</td>
                      <td className="border border-gray-300 px-4 py-2 font-semibold">100</td>
                      <td className="border border-gray-300 px-4 py-2">System maintenance and support</td>
                    </tr>
                    <tr className="bg-yellow-50">
                      <td className="border border-gray-300 px-4 py-2 font-semibold">Total</td>
                      <td className="border border-gray-300 px-4 py-2 font-bold text-lg">600</td>
                      <td className="border border-gray-300 px-4 py-2">Complete registration fee</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <h4 className="font-semibold text-green-800 mb-2">Payment Process</h4>
              <ol className="text-green-700 space-y-1">
                <li>1. Complete document validation successfully</li>
                <li>2. Receive payment notification with amount and reference</li>
                <li>3. Choose your preferred payment method (CBE Birr or TeleBirr)</li>
                <li>4. Complete payment through secure gateway</li>
                <li>5. Receive payment confirmation and proceed to final approval</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Step 4: Land Officer Review */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4">
                4
              </div>
              <h2 className="text-3xl font-bold">Land Officer Review & Approval</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-purple-600">Review Process</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-1">
                      <span className="text-purple-600 text-sm font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Final Document Review</h4>
                      <p className="text-sm text-gray-600">Land officer reviews all validated documents and payment confirmation</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-1">
                      <span className="text-purple-600 text-sm font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Legal Compliance Check</h4>
                      <p className="text-sm text-gray-600">Verification of compliance with local land laws and regulations</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-1">
                      <span className="text-purple-600 text-sm font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Certificate Generation</h4>
                      <p className="text-sm text-gray-600">Official land registration certificate is prepared and digitally signed</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-purple-600">Approval Outcomes</h3>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-green-500 text-xl mr-3">✅</span>
                    <div>
                      <div className="font-medium text-green-800">Approved</div>
                      <div className="text-sm text-green-600">Certificate issued and available for download</div>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-yellow-500 text-xl mr-3">⚠️</span>
                    <div>
                      <div className="font-medium text-yellow-800">Conditional Approval</div>
                      <div className="text-sm text-yellow-600">Minor corrections required before final approval</div>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-red-500 text-xl mr-3">❌</span>
                    <div>
                      <div className="font-medium text-red-800">Rejected</div>
                      <div className="text-sm text-red-600">Significant issues found, resubmission required</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Common Issues and Troubleshooting */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Common Issues & Troubleshooting</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-red-600">Common Issues</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-red-800">Document Rejection</h4>
                    <p className="text-sm text-gray-600 mb-2">Poor quality scans or missing information</p>
                    <p className="text-xs text-blue-600">Solution: Ensure clear, high-resolution scans with all required fields visible</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-800">Payment Failures</h4>
                    <p className="text-sm text-gray-600 mb-2">Network issues or insufficient funds</p>
                    <p className="text-xs text-blue-600">Solution: Check internet connection and account balance before payment</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-800">Boundary Disputes</h4>
                    <p className="text-sm text-gray-600 mb-2">Conflicting property boundaries with neighbors</p>
                    <p className="text-xs text-blue-600">Solution: Obtain neighbor consent letters and updated survey plans</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-green-600">Quick Solutions</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-green-800">Application Status</h4>
                    <p className="text-sm text-gray-600">Check your dashboard for real-time updates and notifications</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-green-800">Document Updates</h4>
                    <p className="text-sm text-gray-600">Upload corrected documents through the application details page</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-green-800">Payment Issues</h4>
                    <p className="text-sm text-gray-600">Contact support with transaction reference for payment-related problems</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-green-800">Technical Support</h4>
                    <p className="text-sm text-gray-600">Use the help center or contact form for technical assistance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact and Support */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Need Help?</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Phone Support</h3>
                <p className="text-gray-600 mb-3">Speak with our support team</p>
                <p className="text-blue-600 font-medium">+251-11-123-4567</p>
                <p className="text-sm text-gray-500">Mon-Fri: 8:00 AM - 6:00 PM</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Email Support</h3>
                <p className="text-gray-600 mb-3">Send us your questions</p>
                <p className="text-green-600 font-medium">support@landregistry.gov.et</p>
                <p className="text-sm text-gray-500">Response within 24 hours</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Visit Office</h3>
                <p className="text-gray-600 mb-3">In-person assistance</p>
                <p className="text-purple-600 font-medium">Land Management Bureau</p>
                <p className="text-sm text-gray-500">Central District, Block 02</p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                to="/contact"
                className="inline-flex items-center px-6 py-3 bg-primary text-white font-medium rounded-md hover:bg-primary-dark transition-colors"
              >
                Contact Support Team
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start CTA */}
      <section className="py-12 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Registration?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Follow this guide and complete your land registration efficiently and securely.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              to="/register"
              className="btn bg-secondary text-white hover:bg-secondary-dark px-6 py-3 rounded-md font-medium"
            >
              Create Account
            </Link>
            <Link
              to="/login"
              className="btn border-2 border-white text-white hover:bg-white hover:text-primary px-6 py-3 rounded-md font-medium"
            >
              Login to Continue
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RegistrationGuide;
