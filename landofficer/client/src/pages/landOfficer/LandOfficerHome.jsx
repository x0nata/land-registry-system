import React from 'react';
import { Link } from 'react-router-dom';
import GovernmentSeal from '../../assets/government-seal.svg';

const LandOfficerHome = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-emerald-900 flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img
                src={GovernmentSeal}
                alt="Government Seal"
                className="w-10 h-10"
              />
              <span className="text-white font-semibold text-lg">Land Administration Portal</span>
            </div>
            <div className="hidden md:flex space-x-6">
              <Link to="/about" className="text-white/80 hover:text-white transition-colors">About</Link>
              <Link to="/services" className="text-white/80 hover:text-white transition-colors">Services</Link>
              <Link to="/contact" className="text-white/80 hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-6xl w-full">
          {/* Hero Section */}
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="flex justify-center items-center gap-6 mb-8">
              <img
                src={GovernmentSeal}
                alt="Government Seal"
                className="w-24 h-24 md:w-32 md:h-32 animate-pulse-glow"
              />
              <div className="text-left">
                <h1 className="text-4xl md:text-6xl font-bold text-white tracking-wide leading-tight">
                  Federal Land
                  <br />
                  <span className="text-blue-200">Administration Portal</span>
                </h1>
                <p className="mt-4 text-xl md:text-2xl text-blue-200 font-light">
                  Ministry of Land & Property Management
                </p>
                <p className="mt-2 text-lg text-white/80">
                  Federal Democratic Republic of Ethiopia
                </p>
              </div>
            </div>

            <div className="max-w-3xl mx-auto">
              <p className="text-xl text-white/90 leading-relaxed mb-8">
                Secure, efficient, and transparent land registration services for government officials.
                Our digital platform streamlines property verification, document validation, and administrative processes.
              </p>
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="glass-effect rounded-xl p-8 text-center hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Property Verification</h3>
              <p className="text-white/80">Comprehensive land title verification and validation services</p>
            </div>

            <div className="glass-effect rounded-xl p-8 text-center hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Document Management</h3>
              <p className="text-white/80">Secure document authentication and digital record keeping</p>
            </div>

            <div className="glass-effect rounded-xl p-8 text-center hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Secure Processing</h3>
              <p className="text-white/80">Advanced security protocols and fraud prevention systems</p>
            </div>
          </div>

          {/* Login Section */}
          <div className="text-center mb-16 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
            <div className="glass-effect rounded-2xl p-8 max-w-md mx-auto hover:bg-white/15 transition-all duration-300">
              <h2 className="text-2xl font-bold text-white mb-4">Official Access</h2>
              <p className="text-white/80 mb-6">Authorized personnel login for land administration services</p>
              <Link
                to="/login/land-officer"
                className="inline-flex items-center justify-center w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl focus:ring-4 focus:ring-blue-300/50"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure Officer Login
              </Link>
            </div>
          </div>

          {/* Information Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-8">
              <h3 className="text-xl font-semibold text-blue-200 mb-6">System Features</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-white font-medium">Real-time Property Tracking</p>
                    <p className="text-white/70 text-sm">Monitor application status and processing stages</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-white font-medium">Digital Document Verification</p>
                    <p className="text-white/70 text-sm">Automated validation of legal documents</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-white font-medium">Integrated Payment System</p>
                    <p className="text-white/70 text-sm">Secure online payment processing</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-white font-medium">Comprehensive Reporting</p>
                    <p className="text-white/70 text-sm">Detailed analytics and audit trails</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-xl p-8">
              <h3 className="text-xl font-semibold text-blue-200 mb-6">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <p className="text-white font-medium">Emergency Hotline</p>
                    <p className="text-white/70">+251-911-2020 (24/7)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-white font-medium">Support Email</p>
                    <p className="text-white/70">land-support@gov.et</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-white font-medium">Head Office</p>
                    <p className="text-white/70">Kirkos Subcity, Addis Ababa</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/5 backdrop-blur-md border-t border-white/20 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-white font-medium">© {new Date().getFullYear()} Federal Democratic Republic of Ethiopia</p>
              <p className="text-white/80">Ministry of Land & Property Management</p>
            </div>
            <div className="flex items-center space-x-6">
              <Link to="/about" className="text-white/80 hover:text-white transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link to="/services" className="text-white/80 hover:text-white transition-colors text-sm">
                Terms of Service
              </Link>
              <Link
                to="/admin-login"
                className="text-xs text-white/60 hover:text-white/80 transition-colors border border-white/20 px-3 py-1 rounded-md hover:border-white/40"
              >
                Admin Access
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandOfficerHome;