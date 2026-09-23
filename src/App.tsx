import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { AppShell, ProtectedRoute } from '@/components/ProtectedRoute';
import { Spinner } from '@/components/ui/Feedback';
import { LoginPage } from '@/pages/Login';
import { SignupPage } from '@/pages/Signup';
import { OnboardingPage } from '@/pages/Onboarding';
import { HomePage } from '@/pages/Home';
import { RecipeDetailPage } from '@/pages/RecipeDetail';
import { GeneratePage } from '@/pages/Generate';
import { ChatPage } from '@/pages/Chat';
import { HistoryPage } from '@/pages/History';
import { ProfilePage } from '@/pages/Profile';

function RootRedirect() {
  const { session, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/login" replace />;
  return <Navigate to="/home" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route element={<AppShell />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/recipe/:recipeId" element={<RecipeDetailPage />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
