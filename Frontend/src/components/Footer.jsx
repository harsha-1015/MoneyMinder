import React from 'react';
import { Heart, Github, Twitter, Linkedin, Mail } from 'lucide-react';

function Footer() {
  return (
    <>
      {/* Google Fonts Import */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      
      <footer className="bg-[#1E3A8A] text-white relative overflow-hidden mt-20">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#10B981] to-transparent opacity-30"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-[#10B981] opacity-10"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-[#10B981] opacity-10"></div>

        <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Logo and description */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#1E3A8A] to-[#10B981] rounded-xl flex items-center justify-center shadow-lg">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold" style={{fontFamily: 'Poppins, sans-serif'}}>Money‑Minder</h2>
              </div>
              <p className="text-[#E5E7EB] text-sm" style={{fontFamily: 'Inter, sans-serif'}}>
                Your personal finance companion helping you track, analyze, and optimize your money.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{fontFamily: 'Poppins, sans-serif'}}>Quick Links</h3>
              <ul className="space-y-3" style={{fontFamily: 'Inter, sans-serif'}}>
                {['Home', 'Analysis', 'Contact', 'Account'].map((item) => (
                  <li key={item}>
                    <a 
                      href={`#${item.toLowerCase()}`} 
                      className="text-[#E5E7EB] hover:text-[#10B981] text-sm transition-colors duration-300 flex items-center"
                    >
                      <span className="w-1 h-1 bg-[#10B981] rounded-full mr-2"></span>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{fontFamily: 'Poppins, sans-serif'}}>Resources</h3>
              <ul className="space-y-3" style={{fontFamily: 'Inter, sans-serif'}}>
                {['Blog', 'Guides', 'FAQs', 'Support'].map((item) => (
                  <li key={item}>
                    <a 
                      href={`#${item.toLowerCase()}`} 
                      className="text-[#E5E7EB] hover:text-[#10B981] text-sm transition-colors duration-300 flex items-center"
                    >
                      <span className="w-1 h-1 bg-[#10B981] rounded-full mr-2"></span>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact & Social */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{fontFamily: 'Poppins, sans-serif'}}>Connect With Us</h3>
              <div className="space-y-3" style={{fontFamily: 'Inter, sans-serif'}}>
                <a href="mailto:hello@moneyminder.com" className="flex items-center text-[#E5E7EB] hover:text-[#10B981] text-sm transition-colors duration-300">
                  <Mail className="w-4 h-4 mr-2" />
                  hello@moneyminder.com
                </a>
                <div className="flex space-x-4 pt-2">
                  {[
                    { icon: Github, url: '#' },
                    { icon: Twitter, url: '#' },
                    { icon: Linkedin, url: '#' }
                  ].map((social, index) => (
                    <a 
                      key={index} 
                      href={social.url} 
                      className="w-8 h-8 bg-[#1E40AF] hover:bg-[#10B981] rounded-full flex items-center justify-center transition-all duration-300 hover:rotate-6 hover:scale-110"
                    >
                      <social.icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#1E40AF] my-8"></div>

          {/* Copyright and legal */}
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-[#9CA3AF] text-xs" style={{fontFamily: 'Inter, sans-serif'}}>
              © {new Date().getFullYear()} Money-Minder. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-[#9CA3AF] hover:text-[#10B981] text-xs transition-colors duration-300">Privacy Policy</a>
              <a href="#" className="text-[#9CA3AF] hover:text-[#10B981] text-xs transition-colors duration-300">Terms of Service</a>
              <a href="#" className="text-[#9CA3AF] hover:text-[#10B981] text-xs transition-colors duration-300">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Footer;