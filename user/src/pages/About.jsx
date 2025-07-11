import React from 'react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="bg-primary text-white rounded-lg p-8 mb-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">About Land Registry</h1>
          <p className="text-xl">
            Transforming property registration through innovation, transparency, and efficiency.
          </p>
        </div>
      </div>

      {/* Mission and Vision */}
      <div className="max-w-4xl mx-auto mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-primary mb-4">Our Mission</h2>
            <p className="text-gray-700 mb-4">
              To provide a secure, efficient, and transparent property registration system that 
              ensures legal certainty of land ownership, facilitates economic development, and 
              promotes public trust in land administration.
            </p>
            <p className="text-gray-700">
              We strive to make property registration accessible to all citizens through 
              innovative technology and streamlined processes.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-primary mb-4">Our Vision</h2>
            <p className="text-gray-700 mb-4">
              To be the leading digital platform for property registration, setting the standard 
              for excellence in land administration through innovation, integrity, and service.
            </p>
            <p className="text-gray-700">
              We envision a future where property rights are secure, transactions are seamless, 
              and land information is accessible to all stakeholders.
            </p>
          </div>
        </div>
      </div>

      {/* Our Story */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Our Story</h2>
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-gray-700 mb-4">
            Land Registry was established in 2023 with a clear purpose: to transform the traditional 
            property registration system into a modern, digital platform that serves the needs of 
            all citizens.
          </p>
          <p className="text-gray-700 mb-4">
            For decades, property registration was a cumbersome process involving multiple visits 
            to government offices, lengthy paperwork, and significant delays. Recognizing these 
            challenges, our team of experts in land administration, technology, and public service 
            came together to create a solution.
          </p>
          <p className="text-gray-700 mb-4">
            We began by digitizing existing land records and developing a secure online platform 
            that allows property owners to register their land, track their applications, and 
            access their documents from anywhere. Our system has significantly reduced processing 
            times, minimized errors, and improved transparency in land administration.
          </p>
          <p className="text-gray-700">
            Today, Land Registry serves thousands of property owners, real estate professionals, 
            and government officials, contributing to economic development and secure property 
            rights for all.
          </p>
        </div>
      </div>

      {/* Core Values */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Our Core Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 bg-primary-lighter rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Integrity</h3>
            <p className="text-gray-700">
              We uphold the highest standards of honesty, ethics, and professionalism in all our actions.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 bg-primary-lighter rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Innovation</h3>
            <p className="text-gray-700">
              We continuously seek new and better ways to serve our users and improve land administration.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 bg-primary-lighter rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Inclusivity</h3>
            <p className="text-gray-700">
              We ensure our services are accessible to all citizens, regardless of location or background.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary text-white rounded-lg p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Join Us in Transforming Land Administration</h2>
        <p className="text-xl mb-6 max-w-2xl mx-auto">
          Whether you're registering your property or seeking information about land ownership, 
          we're here to help you navigate the process with ease.
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

export default About;
