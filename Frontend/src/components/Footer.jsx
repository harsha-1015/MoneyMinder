import React from 'react';

function Footer() {
  return (
    <footer className="bg-blue-900 text-white text-center py-4 mt-10">
      <div className="max-w-7xl mx-auto px-4">
        <p className="text-sm">
          © {new Date().getFullYear()} Money-Minder. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
