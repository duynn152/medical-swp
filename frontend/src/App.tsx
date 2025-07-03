import { Routes, Route } from 'react-router-dom'
import { BlogProvider } from './contexts/BlogContext'
import { PublicBlogProvider } from './contexts/PublicBlogContext'
import Layout from './components/Layout'
import PublicLayout from './components/PublicLayout'
import PublicHomePage from './pages/PublicHomePage'
import AboutPage from './pages/AboutPage'
import ServicesPage from './pages/ServicesPage'
import AppointmentPage from './pages/AppointmentPage'
import BlogPage from './pages/BlogPage'
import BlogDetailPage from './pages/BlogDetailPage'
import HomePage from './pages/HomePage'
import UsersPage from './pages/UsersPage'
import BlogControlPage from './pages/BlogControlPage'
import BookingManagerPage from './pages/BookingManagerPage'
import BookingHistoryPage from './pages/BookingHistoryPage'
import PatientControlPage from './pages/PatientControlPage'
import PendingApprovalsPage from './pages/PendingApprovalsPage'
import LoginPage from './pages/LoginPage'
// Import patient pages
import ProfilePage from './pages/ProfilePage'
import MyAppointmentsPage from './pages/MyAppointmentsPage'
import MedicalHistoryPage from './pages/MedicalHistoryPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <Routes>
      {/* Public Routes with PublicBlogProvider */}
      <Route path="/" element={
        <PublicBlogProvider>
          <PublicLayout />
        </PublicBlogProvider>
      }>
        <Route index element={<PublicHomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="appointment" element={<AppointmentPage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="blog/:id" element={<BlogDetailPage />} />
        
        {/* Patient-specific routes */}
        <Route path="profile" element={<ProfilePage />} />
        <Route path="my-appointments" element={<MyAppointmentsPage />} />
        <Route path="medical-history" element={<MedicalHistoryPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      
      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Admin Routes with BlogProvider (authenticated) */}
      <Route path="/admin" element={
        <BlogProvider>
          <Layout />
        </BlogProvider>
      }>
        <Route index element={<HomePage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="blogs" element={<BlogControlPage />} />
        <Route path="bookings" element={<BookingManagerPage />} />
        <Route path="booking-history" element={<BookingHistoryPage />} />
        <Route path="patients" element={<PatientControlPage />} />
        <Route path="pending-approvals" element={<PendingApprovalsPage />} />
      </Route>
    </Routes>
  )
}

export default App 