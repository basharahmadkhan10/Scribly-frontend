import { lazy, Suspense, useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Layout from "./components/Layout";
import Preloader from "./components/Preloader";
import ErrorBoundary from "./components/ErrorBoundary";

const pages = {
  Home: lazy(() => import("./pages/Home")),
  Login: lazy(() => import("./pages/Login")),
  Signup: lazy(() => import("./pages/Signup")),
  Notes: lazy(() => import("./pages/Notes")),
  NotFound: lazy(() => import("./pages/NotFound")),
  PublicNotes: lazy(() => import("./pages/PublicNotesPage")),
};

function App() {
  const location = useLocation();
  const [showPreloader, setShowPreloader] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowPreloader(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const { Home, Login, Signup, Notes, NotFound, PublicNotes } = pages;

  return (
    <ErrorBoundary>
      {showPreloader ? (
        <Preloader />
      ) : (
        <Suspense fallback={<Preloader minimal />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route
                path="/"
                element={
                  <Layout type="default">
                    <Home />
                  </Layout>
                }
              />
              <Route
                path="/login"
                element={
                  <Layout type="auth">
                    <Login />
                  </Layout>
                }
              />
              <Route
                path="/signup"
                element={
                  <Layout type="auth">
                    <Signup />
                  </Layout>
                }
              />
              <Route
                path="/notes"
                element={
                  <Layout type="protected">
                    <Notes />
                  </Layout>
                }
              />
              <Route
                path="/publicnotes"
                element={
                  <Layout type="protected">
                    <PublicNotes />
                  </Layout>
                }
              />
              <Route
                path="*"
                element={
                  <Layout type="default">
                    <NotFound />
                  </Layout>
                }
              />
            </Routes>
          </AnimatePresence>
        </Suspense>
      )}
    </ErrorBoundary>
  );
}

export default App;
