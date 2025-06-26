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
import PatientControlPage from './pages/PatientControlPage'
import LoginPage from './pages/LoginPage'

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
        <Route path="patients" element={<PatientControlPage />} />
      </Route>
    </Routes>
  )
}

export default App 