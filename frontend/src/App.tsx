import { useEffect, useState } from 'react'
import { Layout } from './components/Layout'
import { LoginView } from './features/auth/LoginView'
import { SignupView } from './features/auth/SignUpView'

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authScreen, setAuthScreen] = useState<"login" | "signup">("login");
  const [checkingToken, setCheckingToken] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
    setCheckingToken(false);
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setAuthScreen("login");
  }

  if (checkingToken) {
    return (
      <div className='min-h-screen bg0gray-50 flex items-center justifycenter text-sm font-medium text-gray-400'>
        Initializing...
      </div>
    )
  }

  if (isAuthenticated) {
    return <Layout onLogout={handleLogout} />;
  }

  return authScreen === "login" ? (
    <LoginView 
      onAuthSuccess={handleAuthSuccess}
      onSwitchToSignup={() => setAuthScreen("signup")}
    />
  ) : (
    <SignupView 
      onAuthSuccess={handleAuthSuccess}
      onSwitchToLogin={() => setAuthScreen("login")}
    />
  );
};

export default App
