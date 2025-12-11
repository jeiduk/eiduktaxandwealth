import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        navigate('/dashboard');
      } else {
        navigate('/auth');
      }
    }
  }, [user, loading, navigate]);

  // Show loading while checking auth
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <p className="text-eiduk-gold font-display text-sm tracking-[0.3em] uppercase mb-4">
          Eiduk Tax & Wealth
        </p>
        <div className="w-8 h-8 border-2 border-eiduk-navy border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
};

export default Index;
