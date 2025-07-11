import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="text-2xl font-bold text-secondary">
              Land Registry
            </Link>
            <p className="mt-2 text-gray-300">
              Streamlining land administration with modern, secure, and user-friendly solutions.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-secondary">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-secondary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-secondary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-300 hover:text-secondary transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-secondary transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-secondary">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/login" className="text-gray-300 hover:text-secondary transition-colors">
                  Property Registration
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-300 hover:text-secondary transition-colors">
                  Document Management
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-300 hover:text-secondary transition-colors">
                  Payment Processing
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-300 hover:text-secondary transition-colors">
                  Property Tracking
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-secondary">Contact Us</h3>
            <address className="not-italic text-gray-300">
              <p>City Administration</p>
              <p>Land Management Bureau</p>
              <p>Central District, Block 02</p>
              <p>Government Complex</p>
              <p className="mt-2">
                <a href="tel:+1234567890" className="hover:text-secondary transition-colors">
                  +1 (234) 567-890
                </a>
              </p>
              <p>
                <a href="mailto:info@landregistry.gov" className="hover:text-secondary transition-colors">
                  info@landregistry.gov
                </a>
              </p>
            </address>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center text-gray-400">
            <p className="text-center md:text-left mb-4 md:mb-0">
              &copy; {currentYear} Land Registry - Property Registration System. All rights reserved.
            </p>
            <div className="flex items-center space-x-4">
              <Link to="/privacy-policy" className="hover:text-secondary transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link to="/terms-of-service" className="hover:text-secondary transition-colors text-sm">
                Terms of Service
              </Link>
              <Link to="/faq" className="hover:text-secondary transition-colors text-sm">
                FAQ
              </Link>
              <span className="text-gray-600">|</span>
              <Link
                to="/admin-login"
                className="text-xs text-gray-500 hover:text-secondary transition-colors border border-gray-600 px-2 py-1 rounded hover:border-secondary"
                title="Administrative Access"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
