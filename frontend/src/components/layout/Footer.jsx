import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
          <div className="md:col-span-1">
            <span className="text-2xl font-bold text-white tracking-wide">
              HomeFix
            </span>
            <p className="mt-4 text-sm text-gray-400 leading-relaxed max-w-xs mx-auto md:mx-0">
              Your one-stop solution for all home service needs in Bangalore.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-base">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="#" className="hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-primary transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-primary transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-base">
              Services
            </h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link
                  to="/services"
                  className="hover:text-primary transition-colors"
                >
                  Plumbing
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  className="hover:text-primary transition-colors"
                >
                  Electrical
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  className="hover:text-primary transition-colors"
                >
                  Cleaning
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-base">Contact</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center justify-center md:justify-start gap-2">
                <span>support@homefix.in</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2">
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2">
                <span>Bangalore, India</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
          &copy; 2026 HomeFix. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
