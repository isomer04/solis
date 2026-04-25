import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import MarketStatsBanner from "./components/MarketStatsBanner";
import PriceTicker from "./components/PriceTicker";
import "./App.css";

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  );
}

// App is the root layout component. All routes render inside <Outlet />.
// Suspense is placed here (wrapping only Outlet) so the shell — Navigation,
// PriceTicker, and Footer — remain visible while a lazy route chunk loads.
export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-base-200">
      {/* Fixed top stack: stats banner → price ticker → navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <MarketStatsBanner />
        <PriceTicker />
        <Navigation />
      </div>
      {/* Offset for fixed header (banner ~28px + ticker ~28px + navbar ~64px) */}
      <main className="flex-1 pt-32 pb-16">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
