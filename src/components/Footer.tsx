import React from 'react';

interface FooterProps {
  advisorName?: string | null;
}

const Footer = ({ advisorName }: FooterProps) => {
  return (
    <footer className="bg-eiduk-navy text-white py-8 mt-auto">
      <div className="container mx-auto px-4 text-center">
        {/* Company Name */}
        <h3 className="font-display text-2xl font-semibold text-eiduk-gold mb-2">
          Eiduk Tax & Wealth
        </h3>
        
        {/* Credentials */}
        <p className="text-white/80 text-sm mb-4">
          {advisorName || "John Eiduk, CPA, CFP®"}
        </p>
        
        {/* Contact Info */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm mb-6">
          <div className="flex items-center gap-2">
            <span className="text-white/60">Phone</span>
            <span className="font-semibold">847-917-8981</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/60">Email</span>
            <span className="font-semibold">john@eiduktaxandwealth.com</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/60">Website</span>
            <a 
              href="https://www.eiduktaxandwealth.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-semibold hover:text-eiduk-gold transition-colors"
            >
              www.eiduktaxandwealth.com
            </a>
          </div>
        </div>
        
        {/* Tagline */}
        <p className="text-eiduk-gold font-display italic text-lg mb-4">
          Pay Less. Keep More. Build Wealth.
        </p>
        
        {/* Copyright */}
        <p className="text-white/50 text-xs">
          © {new Date().getFullYear()} Eiduk Tax & Wealth. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
