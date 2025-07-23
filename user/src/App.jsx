import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Layout Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import RegistrationGuide from './pages/RegistrationGuide';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import UserDashboard from './pages/user/Dashboard';
import PropertyRegistration from './pages/user/PropertyRegistration';
import PropertyDetails from './pages/user/PropertyDetails';
import ApplicationDetails from './pages/user/ApplicationDetails';
import Properties from './pages/user/Properties';

import Payments from './pages/user/Payments';
import PropertyPayment from './pages/user/PropertyPayment';
import CBEBirrPayment from './components/payment/CBEBirrPayment';
import TeleBirrPayment from './components/payment/TeleBirrPayment';
import PaymentSuccess from './components/payment/PaymentSuccess';
import PaymentSimulation from './components/payment/PaymentSimulation';
import Profile from './pages/user/Profile';
import Notifications from './pages/user/Notifications';
import DisputeSubmission from './pages/user/DisputeSubmission';
import MyDisputes from './pages/user/MyDisputes';
import DisputeDetails from './pages/user/DisputeDetails';
import NotFound from './pages/NotFound';


function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Home />
              </main>
              <Footer />
            </div>
          }
        />
        <Route
          path="/login"
          element={
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Login />
              </main>
              <Footer />
            </div>
          }
        />
        <Route
          path="/register"
          element={
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Register />
              </main>
              <Footer />
            </div>
          }
        />

        <Route
          path="/about"
          element={
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
          element={
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
          element={
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Contact />
              </main>
              <Footer />
            </div>
          }
        />
        <Route
          path="/registration-guide"
          element={
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <RegistrationGuide />
              </main>
              <Footer />
            </div>
          }
        />

        {/* User protected routes */}
        <Route element={<ProtectedRoute allowedRoles={['user']} />}>
          <Route
            path="/dashboard/user"
            element={
              <DashboardLayout>
                <UserDashboard />
              </DashboardLayout>
            }
          />
          <Route
            path="/property/register"
            element={
              <DashboardLayout>
                <PropertyRegistration />
              </DashboardLayout>
            }
          />
          <Route
            path="/property/:id"
            element={
              <DashboardLayout>
                <PropertyDetails />
              </DashboardLayout>
            }
          />
          <Route
            path="/application/:id"
            element={
              <DashboardLayout>
                <ApplicationDetails />
              </DashboardLayout>
            }
          />
          <Route
            path="/properties"
            element={
              <DashboardLayout>
                <Properties />
              </DashboardLayout>
            }
          />

          <Route
            path="/payments"
            element={
              <DashboardLayout>
                <Payments />
              </DashboardLayout>
            }
          />
          <Route
            path="/property/:id/payment"
            element={
              <DashboardLayout>
                <PropertyPayment />
              </DashboardLayout>
            }
          />

          {/* Payment Interface Routes */}
          <Route
            path="/payment/cbe-birr/:transactionId"
            element={<CBEBirrPayment />}
          />
          <Route
            path="/payment/telebirr/:transactionId"
            element={<TeleBirrPayment />}
          />
          <Route
            path="/payment/success/:transactionId"
            element={<PaymentSuccess />}
          />
          <Route
            path="/payment-simulation/:paymentMethod"
            element={<PaymentSimulation />}
          />

          <Route
            path="/notifications"
            element={
              <DashboardLayout>
                <Notifications />
              </DashboardLayout>
            }
          />
          <Route
            path="/disputes"
            element={
              <DashboardLayout>
                <MyDisputes />
              </DashboardLayout>
            }
          />
          <Route
            path="/disputes/submit"
            element={
              <DashboardLayout>
                <DisputeSubmission />
              </DashboardLayout>
            }
          />
          <Route
            path="/disputes/:id"
            element={
              <DashboardLayout>
                <DisputeDetails />
              </DashboardLayout>
            }
          />
        </Route>





        {/* Common protected routes */}
        <Route element={<ProtectedRoute allowedRoles={['user']} />}>
          <Route
            path="/profile"
            element={
              <DashboardLayout>
                <Profile />
              </DashboardLayout>
            }
          />
        </Route>

        {/* 404 route */}
        <Route
          path="*"
          element={
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <NotFound />
              </main>
              <Footer />
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
