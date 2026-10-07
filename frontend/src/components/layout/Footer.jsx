import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-[#0F2747] text-slate-300 py-6 sm:py-8 border-t border-slate-800/60">
      <div className="w-full max-w-[1920px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left">
          <div className="md:col-span-1">
            <span className="text-xl font-bold text-white tracking-wide">
              HomeFix
            </span>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed max-w-xs mx-auto md:mx-0">
              Your one-stop solution for all home service needs in Bangalore.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-2 text-xs uppercase tracking-wider">Company</h4>
            <ul className="space-y-1 text-xs text-slate-400 font-medium">
              <li>
                <Link to="#" className="hover:text-[#0F766E] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-[#0F766E] transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-[#0F766E] transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-2 text-xs uppercase tracking-wider">
              Services
            </h4>
            <ul className="space-y-1 text-xs text-slate-400 font-medium">
              <li>
                <Link
                  to="/services?type=plumber"
                  className="hover:text-[#0F766E] transition-colors"
                >
                  Plumbing
                </Link>
              </li>
              <li>
                <Link
                  to="/services?type=electrician"
                  className="hover:text-[#0F766E] transition-colors"
                >
                  Electrical
                </Link>
              </li>
              <li>
                <Link
                  to="/services?type=cleaner"
                  className="hover:text-[#0F766E] transition-colors"
                >
                  Cleaning
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-2 text-xs uppercase tracking-wider">Contact</h4>
            <ul className="space-y-1 text-xs text-slate-400 font-medium">
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
        <div className="border-t border-slate-800/80 mt-6 pt-4 text-center text-xs text-slate-500 font-medium">
          &copy; 2026 HomeFix. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
