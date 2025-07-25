import React, { useState } from 'react';
import { Mail, Phone, User, MessageSquare, Send, MapPin, Twitter, Linkedin, Github } from 'lucide-react';
import { motion } from 'framer-motion';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Add form submission logic here
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <>
      {/* Google Fonts Import */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      
      <div className="min-h-screen bg-[#F9FAFB] relative overflow-hidden">
        {/* Animated background elements */}
        <motion.div 
          className="absolute top-20 left-10 w-40 h-40 rounded-full bg-[#10B981]/10 blur-xl"
          animate={{
            x: [0, 20, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-60 h-60 rounded-full bg-[#1E3A8A]/10 blur-xl"
          animate={{
            x: [0, -30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
        />

        <div className="max-w-7xl mx-auto px-8 py-20 relative z-10">
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-[#1E3A8A] mb-4" style={{fontFamily: 'Poppins, sans-serif'}}>
              Mention Your Queries
            </h1>
            <p className="text-lg text-[#6B7280] max-w-2xl mx-auto" style={{fontFamily: 'Inter, sans-serif'}}>
              Have questions? Our team is here to help you every step of the way.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100"
            >
              <h2 className="text-2xl font-bold text-[#1E3A8A] mb-6" style={{fontFamily: 'Poppins, sans-serif'}}>
                Send Us a Message
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <motion.div variants={itemVariants}>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 w-5 h-5 text-[#6B7280]" />
                    <input
                      type="text"
                      name="name"
                      placeholder="Your Name"
                      className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <motion.div variants={itemVariants}>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 w-5 h-5 text-[#6B7280]" />
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Phone Number"
                        className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-5 h-5 text-[#6B7280]" />
                      <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </motion.div>
                </div>

                <motion.div variants={itemVariants}>
                  <input
                    type="text"
                    name="subject"
                    placeholder="Subject"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3.5 w-5 h-5 text-[#6B7280]" />
                    <textarea
                      name="message"
                      placeholder="Your Message"
                      rows="5"
                      className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent"
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </motion.div>

                <motion.div 
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#10B981] text-white py-3.5 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all duration-300 hover:shadow-lg"
                  >
                    <Send className="w-5 h-5" />
                    <span>Send Message</span>
                  </button>
                </motion.div>
              </form>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-8"
            >
              <div className="bg-gradient-to-br from-[#1E3A8A] to-[#10B981] p-8 rounded-2xl text-white shadow-xl">
                <h2 className="text-2xl font-bold mb-6" style={{fontFamily: 'Poppins, sans-serif'}}>
                  Contact Information
                </h2>
                
                <div className="space-y-5">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-white/20 rounded-full">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium" style={{fontFamily: 'Inter, sans-serif'}}>Email</h3>
                      <p className="text-white/90">moneyminder.co@gmail.com</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/20">
                  <h3 className="font-medium mb-4" style={{fontFamily: 'Inter, sans-serif'}}>Follow Us</h3>
                  <div className="flex space-x-4">
                    {[
                      { icon: Twitter, url: '#' },
                      { icon: Linkedin, url: '#' },
                      { icon: Github, url: '#' }
                    ].map((social, index) => (
                      <motion.a
                        key={index}
                        href={social.url}
                        className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300"
                        whileHover={{ y: -3, scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <social.icon className="w-5 h-5" />
                      </motion.a>
                    ))}
                  </div>
                </div>
              </div>

              <motion.div 
                className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Contact;