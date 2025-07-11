import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layout Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
// import Home from './pages/Home'; // Removed
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
// import Login from './pages/auth/Login'; // Removed
import AdminLogin from './pages/auth/AdminLogin';
import LandOfficerLogin from './pages/auth/LandOfficerLogin';
import LandOfficerHome from './pages/landOfficer/LandOfficerHome'; // Corrected import path
// import Register from './pages/auth/Register'; // Removed
// import UserDashboard from './pages/user/Dashboard'; // Removed
// import PropertyRegistration from './pages/user/PropertyRegistration'; // Removed
// import PropertyDetails from './pages/user/PropertyDetails'; // Removed
// import ApplicationDetails from './pages/user/ApplicationDetails'; // Removed
// import Properties from './pages/user/Properties'; // Removed

// import Payments from './pages/user/Payments'; // Removed
// import PropertyPayment from './pages/user/PropertyPayment'; // Removed
// import Profile from './pages/user/Profile'; // Removed
// import Notifications from './pages/user/Notifications'; // Removed
import LandOfficerDashboard from './pages/landOfficer/Dashboard';
import PropertyDetailVerification from './pages/landOfficer/PropertyDetailVerification';
import AdminDashboard from './pages/admin/Dashboard';
import NotFound from './pages/NotFound';

// Admin Pages
import AdminUsers from './pages/admin/Users';
import AdminUserForm from './pages/admin/UserForm';
import AdminLandOfficers from './pages/admin/LandOfficers';
import AdminProperties from './pages/admin/Properties';
import AdminReports from './pages/admin/Reports';
import AdminSettings from './pages/admin/Settings';
import AdminPayments from './pages/admin/Payments';

// Land Officer Pages
import PropertyVerification from './pages/landOfficer/PropertyVerification';
import DocumentValidation from './pages/landOfficer/DocumentValidation';
import PaymentVerification from './pages/landOfficer/PaymentVerification';
import Reports from './pages/landOfficer/Reports';
import LandOfficerProfile from './pages/landOfficer/Profile';


function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/"
          element={ 
            <div className="flex flex-col min-h-screen">
              <main className="flex-grow">
                <LandOfficerHome />
              </main>
            </div>
          }
        />
        {/* <Route path="/" element={<Navigate to="/landofficer/login" replace />} /> //  Old redirect removed, new homepage is '/' */}
        {/* <Route
          path="/login"
          element={ // Removed
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Login />
              </main>
              <Footer />
            </div>
          }
        /> */}
        {/* <Route
          path="/register"
          element={ // Removed
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Register />
              </main>
              <Footer />
            </div>
          }
        /> */}
        <Route
          path="/admin-login"
          element={ // Kept Admin Login
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <AdminLogin />
              </main>
              <Footer />
            </div>
          }
        />
        <Route
          path="/login/land-officer"
          element={ // Kept Land Officer Login
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <LandOfficerLogin />
              </main>
              <Footer />
            </div>
          }
        />
        <Route
          path="/about"
          element={ // Kept About
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <About />
              </main>
              <Footer />
            </div>
          }
        />
        <Route
          path="/services"
          element={ // Kept Services
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Services />
              </main>
              <Footer />
            </div>
          }
        />
        <Route
          path="/contact"
          element={ // Kept Contact
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Contact />
              </main>
              <Footer />
            </div>
          }
        />

        {/* User protected routes - REMOVED */}
        {/* <Route element={<ProtectedRoute allowedRoles={['user']} />}> ... </Route> */}

        {/* Land Officer protected routes */}
        <Route element={<ProtectedRoute allowedRoles={['landOfficer']} />}>
          <Route
            path="/landofficer/dashboard"
            element={
              <DashboardLayout>
                <LandOfficerDashboard />
              </DashboardLayout>
            }
          />
          <Route
            path="/landofficer/property-verification"
            element={
              <DashboardLayout>
                <PropertyVerification />
              </DashboardLayout>
            }
          />
          <Route
            path="/landofficer/property-detail-verification/:id"
            element={
              <DashboardLayout>
                <PropertyDetailVerification />
              </DashboardLayout>
            }
          />
          <Route
            path="/landofficer/document-validation"
            element={
              <DashboardLayout>
                <DocumentValidation />
              </DashboardLayout>
            }
          />
          <Route
            path="/landofficer/payment-verification"
            element={
              <DashboardLayout>
                <PaymentVerification />
              </DashboardLayout>
            }
          />
          <Route
            path="/landofficer/reports"
            element={
              <DashboardLayout>
                <Reports />
              </DashboardLayout>
            }
          />
          <Route
            path="/landofficer/profile"
            element={
              <DashboardLayout>
                <LandOfficerProfile />
              </DashboardLayout>
            }
          />
        </Route>

        {/* Admin protected routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route
            path="/admin/dashboard"
            element={
              <DashboardLayout>
                <AdminDashboard />
              </DashboardLayout>
            }
          />
          <Route
            path="/admin/users"
            element={
              <DashboardLayout>
                <AdminUsers />
              </DashboardLayout>
            }
          />
          <Route
            path="/admin/users/new"
            element={
              <DashboardLayout>
                <AdminUserForm />
              </DashboardLayout>
            }
          />
          <Route
            path="/admin/users/edit/:id"
            element={
              <DashboardLayout>
                <AdminUserForm />
              </DashboardLayout>
            }
          />
          <Route
            path="/admin/land-officers"
            element={
              <DashboardLayout>
                <AdminLandOfficers />
              </DashboardLayout>
            }
          />
          <Route
            path="/admin/properties"
            element={
              <DashboardLayout>
                <AdminProperties />
              </DashboardLayout>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <DashboardLayout>
                <AdminPayments />
              </DashboardLayout>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <DashboardLayout>
                <AdminReports />
              </DashboardLayout>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <DashboardLayout>
                <AdminSettings />
              </DashboardLayout>
            }
          />
        </Route>

        {/* Not Found Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
