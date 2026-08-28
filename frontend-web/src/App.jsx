import { Routes, Route, Navigate } from 'react-router-dom';
import Login     from './pages/Login';
import Register  from './pages/Register';
import Dashboard from './pages/Dashboard';
import Loans     from './pages/Loans';
import Analytics from './pages/Analytics';
import AIAdvisor from './pages/AIAdvisor';
import Navbar    from './components/Navbar';

const isAuth = () => !!localStorage.getItem('token');

const Protected = ({ children }) =>
  isAuth() ? children : <Navigate to="/login" replace />;

export default function App() {
  return (
    <>
      {isAuth() && <Navbar />}
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <Protected><Dashboard /></Protected>
        } />
        <Route path="/loans" element={
          <Protected><Loans /></Protected>
        } />
        <Route path="/analytics" element={
          <Protected><Analytics /></Protected>
        } />
        <Route path="/ai-advisor" element={
          <Protected><AIAdvisor /></Protected>
        } />
      </Routes>
    </>
  );
}
