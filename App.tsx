
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import QuickStats from './components/QuickStats';
import QuickSearch from './components/registration/QuickSearch';
import { DataProvider } from './context/DataContext';
import Auth from './components/Auth';

// Registration
import RegistrationOverview from './components/registration/Overview';
import Users from './components/registration/Users';
import PaymentSetup from './components/registration/PaymentSetup';
import Commissions from './components/registration/Commissions';
import GeospatialMapping from './components/registration/GeospatialMapping';
import Properties from './components/registration/Properties';

// Tenants
import TenantsOverview from './components/tenants/Overview';
import Applications from './components/tenants/Applications';
import ActiveTenants from './components/tenants/ActiveTenants';
import FinesAndPenalties from './components/tenants/FinesAndPenalties';
import TenantInsights from './components/tenants/TenantInsights';
import Offboarding from './components/tenants/Offboarding';

// Landlords
import LandlordsOverview from './components/landlords/Overview';
import LandlordApplications from './components/landlords/Applications';
import ActiveLandlords from './components/landlords/ActiveLandlords';
import Deductions from './components/landlords/Deductions';
import LandlordOffboarding from './components/landlords/Offboarding';

// Operations (Merged Field & General)
import OperationsOverview from './components/operations/OperationsOverview';
import FieldAgents from './components/field-ops/FieldAgents';
import Affiliates from './components/field-ops/Affiliates';
import Caretakers from './components/field-ops/Caretakers';
import FieldProperties from './components/field-ops/Properties'; 

// Maintenance Submodule (now under Operations)
import MaintenanceOverview from './components/field-ops/maintenance/MaintenanceOverview'; 
import WorkOrders from './components/field-ops/maintenance/WorkOrders';
import RequestIntake from './components/field-ops/maintenance/RequestIntake';
import VendorManagement from './components/field-ops/maintenance/VendorManagement';
import PreventiveMaintenance from './components/field-ops/maintenance/PreventiveMaintenance';
import CostTracking from './components/field-ops/maintenance/CostTracking';
import QualityControl from './components/field-ops/maintenance/QualityControl';
import MaintenanceReporting from './components/field-ops/maintenance/Reporting';

// Task Management & Other Ops
import TaskManagement from './components/operations/TaskManagement';
import Workflows from './components/operations/Workflows';
import Automation from './components/operations/Automation'; 
import EscalationRules from './components/operations/EscalationRules';
import AuditTrail from './components/operations/AuditTrail';
import OperationsReporting from './components/operations/Reporting';

// Communication Submodule (now under Operations)
import CommunicationOverview from './components/operations/communication/CommunicationOverview';
import Messages from './components/operations/communication/Messages';
import Templates from './components/operations/communication/Templates';
import CommunicationAutomation from './components/operations/communication/Automation';

// Leases Submodule (now under Operations)
import LeasesOverview from './components/operations/leases/LeasesOverview';
import ActiveLeases from './components/operations/leases/ActiveLeases';
import LeaseTemplates from './components/operations/leases/LeaseTemplates';
import Esignature from './components/operations/leases/Esignature';
import Renewals from './components/operations/leases/Renewals';
import Amendments from './components/operations/leases/Amendments';
import Terminations from './components/operations/leases/Terminations';
import TenantsWithoutLeases from './components/operations/leases/TenantsWithoutLeases';
import LeaseDocuments from './components/operations/leases/LeaseDocuments';
import LeasesReporting from './components/operations/leases/Reporting';


// Payments
import PaymentsOverview from './components/payments/Overview';
import Inbound from './components/payments/Inbound';
import Outbound from './components/payments/Outbound';
import Invoices from './components/payments/Invoices';
import PaymentReconciliation from './components/payments/Reconciliation';
import LandlordPayouts from './components/payments/LandlordPayouts';
import Overpayments from './components/payments/Overpayments';
import PaymentProcessing from './components/payments/PaymentProcessing';

// HR
import StaffManagement from './components/hr/StaffManagement';
import PayrollProcessing from './components/hr/PayrollProcessing';
import HRCommissions from './components/hr/Commissions';
import LeaveAttendance from './components/hr/LeaveAttendance';
import Performance from './components/hr/Performance';
import HRReporting from './components/hr/Reporting';

// Accounting
import AccountingOverview from './components/accounting/Overview';
import Income from './components/accounting/Income';
import Expenses from './components/accounting/Expenses';
import FinancialStatements from './components/accounting/FinancialStatements';
import TaxCompliance from './components/accounting/TaxCompliance';
import AccountingReconciliation from './components/accounting/Reconciliation';
import AccountingReporting from './components/accounting/Reporting';

// Analytics
import AnalyticsOverview from './components/analytics/Overview';

// Reports
import ReportsOverview from './components/reports/Overview';
import TenancyReports from './components/reports/TenancyReports';
import PropertyReports from './components/reports/PropertyReports';
import FinancialReports from './components/reports/FinancialReports';
import StaffReports from './components/reports/StaffReports';
import TaskAndOperationsReports from './components/reports/TaskAndOperationsReports';
import ReitReports from './components/reports/ReitReports';
import ComplianceAndTaxReports from './components/reports/ComplianceAndTaxReports';
import CustomReports from './components/reports/CustomReports';

// User App Portal
import TenantPortal from './components/userAppPortal/TenantPortal';
import AgentPortal from './components/userAppPortal/AgentPortal';
import LandlordsPortal from './components/userAppPortal/LandlordsPortal';
import AffiliatePortal from './components/userAppPortal/AffiliatePortal';
import InvestorsPortal from './components/userAppPortal/InvestorsPortal';
import CaretakerPortal from './components/userAppPortal/CaretakerPortal';
import ContractorPortal from './components/userAppPortal/ContractorPortal';
import ReferralLanding from './components/userAppPortal/ReferralLanding';
import ReferAndGrow from './components/userAppPortal/ReferAndGrow';

// Marketplace
import Listings from './components/marketplace/Listings';
import Leads from './components/marketplace/Leads';
import MarketplaceAffiliates from './components/marketplace/Affiliates'; 
import DeveloperPortal from './components/marketplace/DeveloperPortal';
import ReferralProgram from './components/marketplace/ReferralProgram';
import MarketplaceReporting from './components/marketplace/Reporting';

// R-Reits
import RReitsOverview from './components/r-reits/Overview';
import InvestmentPlans from './components/r-reits/InvestmentPlans';
import RenovationAccounting from './components/r-reits/RenovationAccounting';
import InvestorDashboard from './components/r-reits/InvestorDashboard';
import RFPayments from './components/r-reits/RFPayments';
import PortfolioPerformance from './components/r-reits/PortfolioPerformance';
import Referrals from './components/r-reits/Referrals';
import ComplianceAndKYC from './components/r-reits/ComplianceAndKYC';

// Settings
import Profile from './components/settings/Profile';
import RolesAndPermissions from './components/settings/RolesAndPermissions';
import Widgets from './components/settings/Widgets';
import RatesAndRules from './components/settings/RatesAndRules';
import Constants from './components/settings/Constants';
import CompanyStructure from './components/settings/CompanyStructure';
import SettingsAuditTrail from './components/settings/AuditTrail';

const AppContent: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [currentPath, setCurrentPath] = useState(window.location.hash || '#/dashboard');
  
  // Auth State
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash || '#/dashboard');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleMainClick = () => {
    if (isSidebarOpen) {
        setIsSidebarOpen(false);
    }
  };

  if (!user) {
      return <Auth onLogin={(u) => {
          setUser(u);
          // Auto-load dashboard if no specific hash is present or if it's just the root
          if (!window.location.hash || window.location.hash === '#/') {
              window.location.hash = '#/dashboard';
              setCurrentPath('#/dashboard');
          }
      }} />;
  }

  const renderContent = () => {
    const path = currentPath;

    // Dashboard
    if (path === '#/' || path === '#/dashboard') return <Dashboard />;
    if (path.startsWith('#/dashboard/stats')) return <QuickStats />;
    if (path.startsWith('#/dashboard/search')) return <QuickSearch />;

    // Registration
    if (path.startsWith('#/registration')) {
        switch (path) {
            case '#/registration/overview': return <RegistrationOverview />;
            case '#/registration/users': return <Users />;
            case '#/registration/payment-setup': return <PaymentSetup />;
            case '#/registration/commissions': return <Commissions />;
            case '#/registration/geospatial-mapping': return <GeospatialMapping />;
            case '#/registration/properties': return <Properties />;
            default: return <RegistrationOverview />;
        }
    }

    // Tenants
    if (path.startsWith('#/tenants')) {
        if (path.startsWith('#/tenants/active-tenants')) return <ActiveTenants />;
        switch (path) {
            case '#/tenants/overview': return <TenantsOverview />;
            case '#/tenants/applications': return <Applications />;
            case '#/tenants/fines-penalties': return <FinesAndPenalties />;
            case '#/tenants/tenant-insights': return <TenantInsights />;
            case '#/tenants/offboarding': return <Offboarding />;
            default: return <TenantsOverview />;
        }
    }

    // Landlords
    if (path.startsWith('#/landlords')) {
        switch (path) {
            case '#/landlords/overview': return <LandlordsOverview />;
            case '#/landlords/applications': return <LandlordApplications />;
            case '#/landlords/active-landlords': return <ActiveLandlords />;
            case '#/landlords/deductions': return <Deductions />;
            case '#/landlords/offboarding': return <LandlordOffboarding />;
            default: return <LandlordsOverview />;
        }
    }

    // Operations (Merged Field Operations & General Operations)
    if (path.startsWith('#/operations')) {
        
        // Maintenance Submodule Routing
        if (path.startsWith('#/operations/maintenance')) {
             if (path === '#/operations/maintenance') return <MaintenanceOverview />;
             if (path === '#/operations/maintenance/work-orders') return <WorkOrders />;
             if (path === '#/operations/maintenance/request-intake') return <RequestIntake />;
             if (path === '#/operations/maintenance/vendor-management') return <VendorManagement />;
             if (path === '#/operations/maintenance/preventive-maintenance') return <PreventiveMaintenance />;
             if (path === '#/operations/maintenance/cost-tracking') return <CostTracking />;
             if (path === '#/operations/maintenance/quality-control') return <QualityControl />;
             if (path === '#/operations/maintenance/reporting') return <MaintenanceReporting />;
             return <MaintenanceOverview />;
        }

        // Communications Submodule Routing
        if (path.startsWith('#/operations/communications')) {
             if (path === '#/operations/communications') return <CommunicationOverview />;
             if (path === '#/operations/communications/inbound') return <Messages folderFilter="Inbox" />;
             if (path === '#/operations/communications/outbound') return <Messages folderFilter="Sent" />;
             if (path === '#/operations/communications/templates') return <Templates />;
             if (path === '#/operations/communications/automation') return <CommunicationAutomation />;
             return <CommunicationOverview />;
        }

        // Leases Submodule Routing
        if (path.startsWith('#/operations/leases')) {
            switch (path) {
                case '#/operations/leases': return <LeasesOverview />;
                case '#/operations/leases/active-leases': return <ActiveLeases />;
                case '#/operations/leases/lease-templates': return <LeaseTemplates />;
                case '#/operations/leases/esignature': return <Esignature />;
                case '#/operations/leases/renewals': return <Renewals />;
                case '#/operations/leases/amendments': return <Amendments />;
                case '#/operations/leases/terminations': return <Terminations />;
                case '#/operations/leases/tenants-without-leases': return <TenantsWithoutLeases />;
                case '#/operations/leases/lease-documents': return <LeaseDocuments />;
                case '#/operations/leases/reporting': return <LeasesReporting />;
                default: return <LeasesOverview />;
            }
        }

        switch (path) {
            case '#/operations/overview': return <OperationsOverview />; // Default if overview clicked, although Operations usually shows list
            case '#/operations/field-agents': return <FieldAgents />;
            case '#/operations/affiliates': return <Affiliates />;
            case '#/operations/caretakers': return <Caretakers />;
            case '#/operations/properties': return <FieldProperties />;
            case '#/operations/task-management': return <OperationsOverview />; // Keep consistent with old link or redirect to specific Task Board?
            case '#/operations/board': return <TaskManagement />; // Using TaskManagement component for board
            case '#/operations/workflows': return <Workflows />;
            case '#/operations/automation': return <Automation />;
            case '#/operations/escalation-rules': return <EscalationRules />;
            case '#/operations/audit-trail': return <AuditTrail />;
            case '#/operations/reporting': return <OperationsReporting />;
            default: return <FieldAgents />; // Default to Field Agents or maybe OperationsOverview
        }
    }

    // Payments
    if (path.startsWith('#/payments')) {
        switch (path) {
            case '#/payments/overview': return <PaymentsOverview />;
            case '#/payments/inbound': return <Inbound />;
            case '#/payments/outbound': return <Outbound />;
            case '#/payments/invoices': return <Invoices />;
            case '#/payments/reconciliation': return <PaymentReconciliation />;
            case '#/payments/landlord-payouts': return <LandlordPayouts />;
            case '#/payments/overpayments': return <Overpayments />;
            case '#/payments/payment-processing': return <PaymentProcessing />;
            default: return <PaymentsOverview />;
        }
    }

    // HR & Payroll
    if (path.startsWith('#/hr-payroll')) {
        switch (path) {
            case '#/hr-payroll/staff-management': return <StaffManagement />;
            case '#/hr-payroll/payroll-processing': return <PayrollProcessing />;
            case '#/hr-payroll/commissions': return <HRCommissions />;
            case '#/hr-payroll/leave-attendance': return <LeaveAttendance />;
            case '#/hr-payroll/performance': return <Performance />;
            case '#/hr-payroll/reporting': return <HRReporting />;
            default: return <StaffManagement />;
        }
    }

    // Accounting
    if (path.startsWith('#/accounting')) {
        switch (path) {
            case '#/accounting/overview': return <AccountingOverview />;
            case '#/accounting/income': return <Income />;
            case '#/accounting/expenses': return <Expenses />;
            case '#/accounting/financial-statements': return <FinancialStatements />;
            case '#/accounting/tax-compliance': return <TaxCompliance />;
            case '#/accounting/reconciliation': return <AccountingReconciliation />;
            case '#/accounting/reporting': return <AccountingReporting />;
            default: return <AccountingOverview />;
        }
    }

    // Analytics
    if (path.startsWith('#/reports-analytics')) {
        if (path.startsWith('#/reports-analytics/analytics')) return <AnalyticsOverview />;

        if (path === '#/reports-analytics/reports') return <ReportsOverview />;
        
        if (path.startsWith('#/reports-analytics/reports/tenancy-reports')) return <TenancyReports />;
        if (path.startsWith('#/reports-analytics/reports/property-reports')) return <PropertyReports />;
        if (path.startsWith('#/reports-analytics/reports/financial-reports')) return <FinancialReports />;
        if (path.startsWith('#/reports-analytics/reports/staff-reports')) return <StaffReports />;
        if (path.startsWith('#/reports-analytics/reports/task-operations-reports')) return <TaskAndOperationsReports />;
        if (path.startsWith('#/reports-analytics/reports/r-reits-fund')) return <ReitReports />;
        if (path.startsWith('#/reports-analytics/reports/compliance-tax-reports')) return <ComplianceAndTaxReports />;
        if (path.startsWith('#/reports-analytics/reports/custom-reports')) return <CustomReports />;

        return <ReportsOverview />;
    }
    
    // Legacy support
    if (path.startsWith('#/reports')) return <ReportsOverview />;
    if (path.startsWith('#/analytics')) return <AnalyticsOverview />;

    // User App Portal
    if (path.startsWith('#/user-app-portal')) {
        switch (path) {
            case '#/user-app-portal/tenant-portal': return <TenantPortal />;
            case '#/user-app-portal/agent-portal': return <AgentPortal />;
            case '#/user-app-portal/landlords-portal': return <LandlordsPortal />;
            case '#/user-app-portal/affiliate-portal': return <AffiliatePortal />;
            case '#/user-app-portal/investors-portal': return <InvestorsPortal />;
            case '#/user-app-portal/caretaker-portal': return <CaretakerPortal />;
            case '#/user-app-portal/contractor-portal': return <ContractorPortal />;
            case '#/user-app-portal/referral-landing': return <ReferralLanding />;
            case '#/user-app-portal/refer-and-grow': return <ReferAndGrow />;
            default: return <TenantPortal />;
        }
    }

    // Marketplace
    if (path.startsWith('#/marketplace')) {
        switch (path) {
            case '#/marketplace/listings': return <Listings />;
            case '#/marketplace/leads': return <Leads />;
            case '#/marketplace/affiliates': return <MarketplaceAffiliates />;
            case '#/marketplace/developer-portal': return <DeveloperPortal />;
            case '#/marketplace/referral-program': return <ReferralProgram />;
            case '#/marketplace/reporting': return <MarketplaceReporting />;
            default: return <Listings />;
        }
    }

    // R-Reits
    if (path.startsWith('#/r-reits')) {
        switch (path) {
            case '#/r-reits/overview': return <RReitsOverview />;
            case '#/r-reits/investment-plans': return <InvestmentPlans />;
            case '#/r-reits/project-accounting': return <RenovationAccounting />;
            case '#/r-reits/investor-dashboard': return <InvestorDashboard />;
            case '#/r-reits/rf-payments': return <RFPayments />;
            case '#/r-reits/portfolio-performance': return <PortfolioPerformance />;
            case '#/r-reits/referrals': return <Referrals />;
            case '#/r-reits/compliance-kyc': return <ComplianceAndKYC />;
            default: return <RReitsOverview />;
        }
    }

    // Settings
    if (path.startsWith('#/settings')) {
        switch (path) {
            case '#/settings/profile': return <Profile />;
            case '#/settings/roles-permissions': return <RolesAndPermissions />;
            case '#/settings/widgets': return <Widgets />;
            case '#/settings/rates-rules': return <RatesAndRules />;
            case '#/settings/constants': return <Constants />;
            case '#/settings/company-structure': return <CompanyStructure />;
            case '#/settings/audit-trail': return <SettingsAuditTrail />;
            default: return <Profile />;
        }
    }

    return <Dashboard />;
  };

  return (
      <div className="app-layout bg-gray-100 font-sans text-gray-900" data-sidebar-open={isSidebarOpen ? "true" : "false"}>
        <Header 
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            isSidebarOpen={isSidebarOpen} 
            onLogout={() => setUser(null)}
        />
        <Sidebar 
            activeRoute={currentPath} 
            isOpen={isSidebarOpen} 
            closeSidebarMobile={() => setIsSidebarOpen(false)} 
        />
        <main className="app-main bg-gray-100 relative" onClick={handleMainClick}>
            {renderContent()}
        </main>
      </div>
  );
};

const App: React.FC = () => {
    return (
        <DataProvider>
            <AppContent />
        </DataProvider>
    );
}

export default App;
