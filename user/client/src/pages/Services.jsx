import React from 'react';
import { Link } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  HomeIcon, 
  DocumentDuplicateIcon, 
  ArrowPathIcon, 
  ShieldCheckIcon, 
  MagnifyingGlassIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const Services = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="bg-primary text-white rounded-lg p-8 mb-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Our Services</h1>
          <p className="text-xl">
            Comprehensive property registration and land administration services to meet your needs.
          </p>
        </div>
      </div>

      {/* Main Services */}
      <div className="max-w-6xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Core Services</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Property Registration */}
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 bg-primary-lighter rounded-full flex items-center justify-center mb-4">
              <HomeIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Property Registration</h3>
            <p className="text-gray-700 mb-4">
              Register your property with our streamlined online system. Our digital platform 
              simplifies the process, reducing paperwork and processing time.
            </p>
            <ul className="text-gray-700 space-y-2 mb-4">
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                New property registration
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                Transfer of ownership
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                Property subdivision
              </li>
            </ul>
            <Link to="/register" className="text-primary font-medium hover:text-primary-dark">
              Get Started →
            </Link>
          </div>
          
          {/* Document Verification */}
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 bg-primary-lighter rounded-full flex items-center justify-center mb-4">
              <DocumentTextIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Document Verification</h3>
            <p className="text-gray-700 mb-4">
              Our expert team verifies all property documents to ensure legal compliance and 
              authenticity, protecting your investment and providing peace of mind.
            </p>
            <ul className="text-gray-700 space-y-2 mb-4">
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                Title deed verification
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                Survey plan validation
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                Legal document authentication
              </li>
            </ul>
            <Link to="/login" className="text-primary font-medium hover:text-primary-dark">
              Learn More →
            </Link>
          </div>
          
          {/* Certificate Issuance */}
                <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-primary-lighter rounded-full flex items-center justify-center mb-4">
                  <DocumentDuplicateIcon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Certificate Issuance</h3>
                <p className="text-gray-700 mb-4">
                  Receive official property certificates and documentation through our secure 
                  system, with options for digital and physical copies.
                </p>
                <ul className="text-gray-700 space-y-2 mb-4">
                  <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  Digital certificates
                  </li>
                  <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  Physical certificate delivery
                  </li>
                  <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  Certificate replacement
                  </li>
                </ul>
                <Link to="/login" className="text-primary font-medium hover:text-primary-dark">
                  Request Certificate →
                </Link>
                </div>
              </div>
              </div>

              {/* Additional Services */}
              <div className="max-w-6xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-center mb-12">Additional Services</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Property Search */}
                <div className="bg-white p-6 rounded-lg shadow-md flex">
                <div className="mr-4">
                  <div className="w-12 h-12 bg-primary-lighter rounded-full flex items-center justify-center">
                  <MagnifyingGlassIcon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Property Search</h3>
                  <p className="text-gray-700">
                  Search our comprehensive database for property information, ownership history, 
                  and legal status. Access detailed property records with our user-friendly search tools.
                  </p>
                </div>
                </div>
                
                {/* Property Updates */}
                <div className="bg-white p-6 rounded-lg shadow-md flex">
                <div className="mr-4">
                  <div className="w-12 h-12 bg-primary-lighter rounded-full flex items-center justify-center">
                  <ArrowPathIcon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Property Updates</h3>
                  <p className="text-gray-700">
                  Update your property information, including boundary changes, improvements, 
                  and usage modifications. Keep your property records current and accurate.
                  </p>
                </div>
                </div>
                
                {/* Dispute Resolution */}
                <div className="bg-white p-6 rounded-lg shadow-md flex">
                <div className="mr-4">
                  <div className="w-12 h-12 bg-primary-lighter rounded-full flex items-center justify-center">
                  <ShieldCheckIcon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Dispute Resolution</h3>
                  <p className="text-gray-700">
                  Our specialized team assists in resolving property disputes through mediation 
                  and legal guidance, helping to protect your property rights.
                  </p>
                </div>
                </div>      
              </div>
              </div>

{/* Process Section */}
      <div className="max-w-5xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Our Registration Process</h2>
        
        <div className="relative">
          {/* Process Timeline */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-primary-lighter transform -translate-x-1/2"></div>
          
          <div className="space-y-12">
            {/* Step 1 */}
            <div className="relative flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 md:pr-12 md:text-right mb-4 md:mb-0">
                <h3 className="text-xl font-semibold mb-2">Account Creation</h3>
                <p className="text-gray-700">
                  Register for an account on our platform to access our services. Provide basic 
                  information and verify your identity to get started.
                </p>
              </div>
              <div className="z-10 flex items-center justify-center w-12 h-12 bg-primary text-white rounded-full">
                1
              </div>
              <div className="md:w-1/2 md:pl-12 hidden md:block"></div>
            </div>
            
            {/* Step 2 */}
            <div className="relative flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 md:pr-12 hidden md:block"></div>
              <div className="z-10 flex items-center justify-center w-12 h-12 bg-primary text-white rounded-full">
                2
              </div>
              <div className="md:w-1/2 md:pl-12 mb-4 md:mb-0">
                <h3 className="text-xl font-semibold mb-2">Document Submission</h3>
                <p className="text-gray-700">
                  Upload all required documents, including proof of ownership, survey plans, 
                  and identification. Our system accepts various file formats for your convenience.
                </p>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="relative flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 md:pr-12 md:text-right mb-4 md:mb-0">
                <h3 className="text-xl font-semibold mb-2">Fee Payment</h3>
                <p className="text-gray-700">
                  Our land officers review your documents and verify their authenticity. 
                  This thorough process ensures the legal validity of your property registration.
                </p>
              </div>
              <div className="z-10 flex items-center justify-center w-12 h-12 bg-primary text-white rounded-full">
                3
              </div>
              <div className="md:w-1/2 md:pl-12 hidden md:block"></div>
            </div>
            
            {/* Step 4 */}
            <div className="relative flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 md:pr-12 hidden md:block"></div>
              <div className="z-10 flex items-center justify-center w-12 h-12 bg-primary text-white rounded-full">
                4
              </div>
              <div className="md:w-1/2 md:pl-12 mb-4 md:mb-0">
                <h3 className="text-xl font-semibold mb-2">Verification Process</h3>
                <p className="text-gray-700">
                   Our land officers review your documents and verify their authenticity. 
                  This thorough process ensures the legal validity of your property registration.
                </p>
              </div>
            </div>
            
            {/* Step 5 */}
            <div className="relative flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 md:pr-12 md:text-right mb-4 md:mb-0">
                <h3 className="text-xl font-semibold mb-2">Certificate Issuance</h3>
                <p className="text-gray-700">
                  Receive your official property registration certificate, available in both 
                  digital and physical formats. Your property is now officially registered.
                </p>
              </div>
              <div className="z-10 flex items-center justify-center w-12 h-12 bg-primary text-white rounded-full">
                5
              </div>
              <div className="md:w-1/2 md:pl-12 hidden md:block"></div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary text-white rounded-lg p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Register Your Property?</h2>
        <p className="text-xl mb-6 max-w-2xl mx-auto">
          Join thousands of satisfied property owners who have secured their land rights through our platform.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/register" className="bg-white text-primary px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors">
            Register Now
          </Link>
          <Link to="/contact" className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-md font-medium hover:bg-white hover:text-primary transition-colors">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Services;
