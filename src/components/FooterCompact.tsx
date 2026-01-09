import React from 'react';

const FooterCompact = () => {
  return (
    <footer className="bg-eiduk-navy text-white py-4 mt-auto print:fixed print:bottom-0 print:left-0 print:right-0">
      <div className="container mx-auto px-4 text-center">
        <p className="font-display text-lg font-semibold text-eiduk-gold mb-1">
          Eiduk Tax & Wealth
        </p>
        <p className="text-white/80 text-xs mb-2">
          847-917-8981 | john@eiduktaxandwealth.com | eiduktaxandwealth.com
        </p>
        <p className="text-eiduk-gold font-display italic text-sm">
          Pay Less. Keep More. Build Wealth.
        </p>
      </div>
    </footer>
  );
};

export default FooterCompact;
