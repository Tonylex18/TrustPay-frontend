import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import Registration from './pages/registration';
import LandingPage from './pages/landing-page';
import Dashboard from './pages/dashboard';
import UserProfilePage from './pages/user-profile';
import TransactionsPage from "./pages/transaction";
import MoneyTransfer from "./pages/monthly-transfer";
import DepositPage from "./pages/deposit";
import BillsPage from "./pages/bills";
import BusinessPage from "./pages/business";
import CommercialBankingPage from "./pages/commercial-banking";
import InvestWealthManagementPage from "./pages/investWealthManagement";
import AboutTrustPayPage from "./pages/about-trustpay";
import LoginPage from "./pages/login";
import AdminApprovalsPage from "./pages/admin-approvals";
import AdminKycReview from "./pages/admin-kyc";
import AdminUsersPage from "./pages/admin-users";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import KycPage from "./pages/kyc";

const Routes: React.FC = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          {/* Define your routes here */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/landing-page" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/money-transfer" element={<MoneyTransfer />} />
        <Route path="/deposit" element={<DepositPage />} />
        <Route path="/bills" element={<BillsPage />} />
        <Route path="/business" element={<BusinessPage />} />
        <Route path="/commercial-banking" element={<CommercialBankingPage />} />
        <Route path="/investWealthManagement" element={<InvestWealthManagementPage />} />
        <Route path="/about-trustpay" element={<AboutTrustPayPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminApprovalsPage />} />
        <Route path="/admin/kyc-review" element={<AdminKycReview />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/user-profile" element={<UserProfilePage />} />
        <Route path="/kyc" element={<KycPage />} />
        <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
