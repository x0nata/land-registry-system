import React from 'react';
import { Link } from 'react-router-dom';

const LandOfficerHomePage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white shadow-xl rounded-lg p-8 md:p-12 text-center max-w-lg">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
          Welcome, Land Officer!
        </h1>
        <p className="text-gray-600 mb-8 text-lg">
          This is the official portal for land registration and management. Please log in to access your dashboard and perform your duties.
        </p>
        <Link
          to="/login/land-officer"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Proceed to Login
        </Link>
      </div>
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Land Registration System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandOfficerHomePage;