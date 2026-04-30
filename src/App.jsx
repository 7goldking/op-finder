import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { I18nProvider } from '@/lib/i18n';
import AutoTranslator from '@/components/AutoTranslator';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import Layout from '@/components/Layout';
import PageTransition from '@/components/PageTransition';
import { useTheme } from '@/hooks/useTheme';

// Eager: above-the-fold landing
import Landing from '@/pages/Landing';

// Lazy: everything else (split per route)
const Home = lazy(() => import('@/pages/Home'));
const Catalog = lazy(() => import('@/pages/Catalog'));
const EventDetail = lazy(() => import('@/pages/EventDetail'));
const Apply = lazy(() => import('@/pages/Apply'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Profile = lazy(() => import('@/pages/Profile'));
const Portfolio = lazy(() => import('@/pages/Portfolio'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const AIChat = lazy(() => import('@/pages/AIChat'));
const OrgDashboard = lazy(() => import('@/pages/OrgDashboard'));
const CreateEvent = lazy(() => import('@/pages/CreateEvent'));
const OrgApplications = lazy(() => import('@/pages/OrgApplications'));
const Mentors = lazy(() => import('@/pages/Mentors'));
const MentorDetail = lazy(() => import('@/pages/MentorDetail'));
const MentorEdit = lazy(() => import('@/pages/MentorEdit'));
const Blog = lazy(() => import('@/pages/Blog'));
const ArticleDetail = lazy(() => import('@/pages/ArticleDetail'));
const ArticleEdit = lazy(() => import('@/pages/ArticleEdit'));
const Chat = lazy(() => import('@/pages/Chat'));
const Teams = lazy(() => import('@/pages/Teams'));
const Achievements = lazy(() => import('@/pages/Achievements'));
const PeopleSearch = lazy(() => import('@/pages/PeopleSearch'));
const FriendRequests = lazy(() => import('@/pages/FriendRequests'));
const ActivityFeed = lazy(() => import('@/pages/ActivityFeed'));
const Login = lazy(() => import('@/pages/Login'));
const OrgBrandPage = lazy(() => import('@/pages/OrgBrandPage'));
const OrgEmbed = lazy(() => import('@/pages/OrgEmbed'));

const RouteLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin" />
  </div>
);

const AuthenticatedApp = () => {
  useTheme();
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <RouteLoader />;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/embed/org/:slug" element={<OrgEmbed />} />
        <Route path="/" element={<Landing />} />
        <Route element={<Layout />}>
          <Route path="/o/:slug" element={<PageTransition><OrgBrandPage /></PageTransition>} />
          <Route path="/home" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/catalog" element={<PageTransition><Catalog /></PageTransition>} />
          <Route path="/event/:id" element={<PageTransition><EventDetail /></PageTransition>} />
          <Route path="/event/:id/apply" element={<PageTransition><Apply /></PageTransition>} />
          <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
          <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
          <Route path="/portfolio" element={<PageTransition><Portfolio /></PageTransition>} />
          <Route path="/assistant" element={<PageTransition><AIChat /></PageTransition>} />
          <Route path="/org" element={<PageTransition><OrgDashboard /></PageTransition>} />
          <Route path="/org/event/new" element={<PageTransition><CreateEvent /></PageTransition>} />
          <Route path="/org/event/:id/edit" element={<PageTransition><CreateEvent /></PageTransition>} />
          <Route path="/org/event/:eventId/applications" element={<PageTransition><OrgApplications /></PageTransition>} />
          <Route path="/mentors" element={<PageTransition><Mentors /></PageTransition>} />
          <Route path="/mentors/new" element={<PageTransition><MentorEdit /></PageTransition>} />
          <Route path="/mentors/:id" element={<PageTransition><MentorDetail /></PageTransition>} />
          <Route path="/mentors/:id/edit" element={<PageTransition><MentorEdit /></PageTransition>} />
          <Route path="/blog" element={<PageTransition><Blog /></PageTransition>} />
          <Route path="/blog/new" element={<PageTransition><ArticleEdit /></PageTransition>} />
          <Route path="/blog/:id" element={<PageTransition><ArticleDetail /></PageTransition>} />
          <Route path="/blog/:id/edit" element={<PageTransition><ArticleEdit /></PageTransition>} />
          <Route path="/chat" element={<PageTransition><Chat /></PageTransition>} />
          <Route path="/teams" element={<PageTransition><Teams /></PageTransition>} />
          <Route path="/achievements" element={<PageTransition><Achievements /></PageTransition>} />
          <Route path="/search" element={<PageTransition><PeopleSearch /></PageTransition>} />
          <Route path="/friend-requests" element={<PageTransition><FriendRequests /></PageTransition>} />
          <Route path="/activity" element={<PageTransition><ActivityFeed /></PageTransition>} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};


function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <AutoTranslator />
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
          <SonnerToaster position="bottom-right" />
        </QueryClientProvider>
      </I18nProvider>
    </AuthProvider>
  )
}

export default App
