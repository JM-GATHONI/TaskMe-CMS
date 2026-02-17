
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import QuickStats from './components/QuickStats';
import QuickSearch from './components/registration/QuickSearch';
import { DataProvider, useData } from './context/DataContext';
import Auth from './components/Auth';
import Icon from './components/Icon'; 
import { User, StaffProfile, TenantProfile } from './types'; 

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

// Operations
import OperationsOverview from './components/operations/OperationsOverview';
import FieldAgents from './components/field-ops/FieldAgents';
import Affiliates from './components/field-ops/Affiliates';
import Caretakers from './components/field-ops/Caretakers';
import FieldProperties from './components/field-ops/Properties'; 

// Maintenance
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

// Communication
import CommunicationOverview from './components/operations/communication/CommunicationOverview';
import Messages from './components/operations/communication/Messages';
import Templates from './components/operations/communication/Templates';
import CommunicationAutomation from './components/operations/communication/Automation';

// Leases
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
import Roles from './components/settings/RolesAndPermissions';
import Permissions from './components/settings/Permissions';
import Widgets from './components/settings/Widgets';
import RatesAndRules from './components/settings/RatesAndRules';
import Constants from './components/settings/Constants';
import SettingsAuditTrail from './components/settings/AuditTrail';

const AccessDenied: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-[80vh] text-center animate-fade-in">
        <div className="bg-red-50 p-6 rounded-full mb-4">
             <Icon name="shield" className="w-16 h-16 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-500 max-w-md mb-6">
            You do not have permission to view this module. Please contact your system administrator if you believe this is an error.
        </p>
        <button 
            onClick={() => window.location.hash = '#/dashboard'}
            className="px-6 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors"
        >
            Return to Dashboard
        </button>
    </div>
);

const AppContent: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [currentPath, setCurrentPath] = useState(window.location.hash || '#/dashboard');
  
  const { currentUser, setCurrentUser, roles } = useData();

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash || '#/dashboard');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMainClick = () => {
    if (window.innerWidth < 1024 && isSidebarOpen) {
        setIsSidebarOpen(false);
    }
  };

  // --- ACCESS CONTROL LAYER ---

  // Check if current path is public
  const isPublicRoute = currentPath.startsWith('#/user-app-portal/referral-landing');

  if (!currentUser && !isPublicRoute) {
      return <Auth onLogin={(u) => {
          setCurrentUser(u as User | StaffProfile | TenantProfile);
          
          // Role-based Redirect Logic
          const role = u.role;
          let redirectPath = '#/dashboard';

          if (role === 'Tenant') redirectPath = '#/user-app-portal/tenant-portal';
          else if (role === 'Landlord') redirectPath = '#/user-app-portal/landlords-portal';
          else if (role === 'Field Agent') redirectPath = '#/user-app-portal/agent-portal';
          else if (role === 'Caretaker') redirectPath = '#/user-app-portal/caretaker-portal';
          else if (role === 'Investor') redirectPath = '#/user-app-portal/investors-portal';
          else if (role === 'Affiliate') redirectPath = '#/user-app-portal/affiliate-portal';
          else if (role === 'Contractor') redirectPath = '#/user-app-portal/contractor-portal';

          window.location.hash = redirectPath;
          setCurrentPath(redirectPath);
      }} />;
  }

  // If public route, render standalone view (no sidebar/header/auth required)
  if (isPublicRoute) {
      return (
          <div className="app-layout bg-white font-sans text-gray-900">
             <ReferralLanding />
          </div>
      );
  }

  if (currentUser && currentUser.status !== 'Active') {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
              <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-sm">
                  <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                      <Icon name="close" className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Account Suspended</h2>
                  <p className="text-gray-500 mb-6">Your account is currently inactive. Please contact support.</p>
                  <button onClick={() => setCurrentUser(null)} className="px-6 py-2 bg-gray-800 text-white font-bold rounded-lg hover:bg-black">Logout</button>
              </div>
          </div>
      );
  }

  // Get current role definition to check live permissions
  const currentRoleDef = roles.find(r => r.name === currentUser!.role);
  const isSuperAdmin = currentUser!.role === 'Super Admin';

  const checkAccess = (requiredModulePath: string): boolean => {
      if (isSuperAdmin) return true;
      if (!currentRoleDef) return false; 
      // Allow access to Refer And Grow for all roles that have access to User App Portal features
      if (requiredModulePath === 'User App Portal/Refer And Grow') {
          return currentRoleDef.accessibleSubmodules.some(p => p.startsWith('User App Portal'));
      }
      return currentRoleDef.accessibleSubmodules.includes(requiredModulePath);
  };

  const renderContent = () => {
    const path = currentPath;

    // Public Routes (Bypass checks if accessed while logged in too)
    if (path === '#/user-app-portal/referral-landing') return <ReferralLanding />;

    // Dashboard
    if (path === '#/' || path === '#/dashboard') {
        // Fallback for role-based home if they manually navigate to root
        const role = currentUser!.role;
        if (role === 'Tenant') return <TenantPortal />;
        if (role === 'Landlord') return <LandlordsPortal />;
        if (role === 'Field Agent') return <AgentPortal />;
        if (role === 'Caretaker') return <CaretakerPortal />;
        if (role === 'Investor') return <InvestorsPortal />;
        if (role === 'Affiliate') return <AffiliatePortal />;
        if (role === 'Contractor') return <ContractorPortal />;

        return checkAccess('Dashboard/Dashboard') ? <Dashboard /> : <AccessDenied />;
    }
    if (path.startsWith('#/dashboard/stats')) return checkAccess('Dashboard/Quick Stats') ? <QuickStats /> : <AccessDenied />;
    if (path.startsWith('#/dashboard/search')) return checkAccess('Dashboard/Quick Search') ? <QuickSearch /> : <AccessDenied />;

    // Registration
    if (path.startsWith('#/registration')) {
        if (path === '#/registration/overview' && !checkAccess('Registration/Overview')) return <AccessDenied />;
        if (path === '#/registration/users' && !checkAccess('Registration/Users')) return <AccessDenied />;
        if (path === '#/registration/payment-setup' && !checkAccess('Registration/Payment Setup')) return <AccessDenied />;
        if (path === '#/registration/commissions' && !checkAccess('Registration/Commissions')) return <AccessDenied />;
        if (path === '#/registration/geospatial-mapping' && !checkAccess('Registration/Geospatial Mapping')) return <AccessDenied />;
        if (path === '#/registration/properties' && !checkAccess('Registration/Properties')) return <AccessDenied />;

        switch (path) {
            case '#/registration/overview': return <RegistrationOverview />;
            case '#/registration/users': return <Users />;
            case '#/registration/payment-setup': return <PaymentSetup />;
            case '#/registration/commissions': return <Commissions />;
            case '#/registration/geospatial-mapping': return <GeospatialMapping />;
            case '#/registration/properties': return <Properties />;
            default: return checkAccess('Registration/Overview') ? <RegistrationOverview /> : <AccessDenied />;
        }
    }

    // Tenants
    if (path.startsWith('#/tenants')) {
        if (path.startsWith('#/tenants/active-tenants') && !checkAccess('Tenants/Active Tenants')) return <AccessDenied />;
        if (path === '#/tenants/overview' && !checkAccess('Tenants/Overview')) return <AccessDenied />;
        if (path === '#/tenants/applications' && !checkAccess('Tenants/Applications')) return <AccessDenied />;
        if (path === '#/tenants/fines-penalties' && !checkAccess('Tenants/Fines & Penalties')) return <AccessDenied />;
        if (path === '#/tenants/tenant-insights' && !checkAccess('Tenants/Tenant Insights')) return <AccessDenied />;
        if (path === '#/tenants/offboarding' && !checkAccess('Tenants/Offboarding')) return <AccessDenied />;

        if (path.startsWith('#/tenants/active-tenants')) return <ActiveTenants />;
        switch (path) {
            case '#/tenants/overview': return <TenantsOverview />;
            case '#/tenants/applications': return <Applications />;
            case '#/tenants/fines-penalties': return <FinesAndPenalties />;
            case '#/tenants/tenant-insights': return <TenantInsights />;
            case '#/tenants/offboarding': return <Offboarding />;
            default: return checkAccess('Tenants/Overview') ? <TenantsOverview /> : <AccessDenied />;
        }
    }

    // Landlords
    if (path.startsWith('#/landlords')) {
        if (path === '#/landlords/overview' && !checkAccess('Landlords/Overview')) return <AccessDenied />;
        if (path === '#/landlords/applications' && !checkAccess('Landlords/Applications')) return <AccessDenied />;
        if (path.startsWith('#/landlords/active-landlords') && !checkAccess('Landlords/Active Landlords')) return <AccessDenied />;
        if (path === '#/landlords/deductions' && !checkAccess('Landlords/Deductions')) return <AccessDenied />;
        if (path === '#/landlords/offboarding' && !checkAccess('Landlords/Offboarding')) return <AccessDenied />;

        if (path.startsWith('#/landlords/active-landlords')) return <ActiveLandlords />;
        switch (path) {
            case '#/landlords/overview': return <LandlordsOverview />;
            case '#/landlords/applications': return <LandlordApplications />;
            case '#/landlords/active-landlords': return <ActiveLandlords />;
            case '#/landlords/deductions': return <Deductions />;
            case '#/landlords/offboarding': return <LandlordOffboarding />;
            default: return checkAccess('Landlords/Overview') ? <LandlordsOverview /> : <AccessDenied />;
        }
    }

    // Operations
    if (path.startsWith('#/operations')) {
        
        // Maintenance
        if (path.startsWith('#/operations/maintenance')) {
             if (!checkAccess('Operations/Maintenance')) return <AccessDenied />;

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

        // Communications
        if (path.startsWith('#/operations/communications')) {
             if (!checkAccess('Operations/Communications')) return <AccessDenied />;
             if (path === '#/operations/communications') return <CommunicationOverview />;
             if (path === '#/operations/communications/inbound') return <Messages folderFilter="Inbox" />;
             if (path === '#/operations/communications/outbound') return <Messages folderFilter="Sent" />;
             if (path === '#/operations/communications/templates') return <Templates />;
             if (path === '#/operations/communications/automation') return <CommunicationAutomation />;
             return <CommunicationOverview />;
        }

        // Leases
        if (path.startsWith('#/operations/leases')) {
            if (!checkAccess('Operations/Leases')) return <AccessDenied />;
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

        // General Ops
        if (path === '#/operations/field-agents' && !checkAccess('Operations/Field Agents')) return <AccessDenied />;
        if (path === '#/operations/affiliates' && !checkAccess('Operations/Affiliates')) return <AccessDenied />;
        if (path === '#/operations/caretakers' && !checkAccess('Operations/Caretakers')) return <AccessDenied />;
        if (path === '#/operations/properties' && !checkAccess('Operations/Properties')) return <AccessDenied />;
        if (path === '#/operations/board' && !checkAccess('Operations/Task Management')) return <AccessDenied />;
        
        switch (path) {
            case '#/operations/overview': return checkAccess('Operations/Task Management') ? <OperationsOverview /> : <AccessDenied />;
            case '#/operations/field-agents': return <FieldAgents />;
            case '#/operations/affiliates': return <Affiliates />;
            case '#/operations/caretakers': return <Caretakers />;
            case '#/operations/properties': return <FieldProperties />;
            case '#/operations/task-management': return <OperationsOverview />;
            case '#/operations/board': return <TaskManagement />;
            case '#/operations/workflows': return <Workflows />;
            case '#/operations/automation': return <Automation />;
            case '#/operations/escalation-rules': return <EscalationRules />;
            case '#/operations/audit-trail': return <AuditTrail />;
            case '#/operations/reporting': return <OperationsReporting />;
            default: return checkAccess('Operations/Field Agents') ? <FieldAgents /> : <AccessDenied />;
        }
    }

    // Payments
    if (path.startsWith('#/payments')) {
        if (path === '#/payments/overview' && !checkAccess('Payments/Overview')) return <AccessDenied />;
        if (path === '#/payments/inbound' && !checkAccess('Payments/Inbound')) return <AccessDenied />;
        if (path === '#/payments/outbound' && !checkAccess('Payments/Outbound')) return <AccessDenied />;
        if (path === '#/payments/invoices' && !checkAccess('Payments/Invoices')) return <AccessDenied />;
        if (path === '#/payments/reconciliation' && !checkAccess('Payments/Reconciliation')) return <AccessDenied />;
        if (path === '#/payments/landlord-payouts' && !checkAccess('Payments/Landlord Payouts')) return <AccessDenied />;
        if (path === '#/payments/overpayments' && !checkAccess('Payments/Overpayments')) return <AccessDenied />;
        if (path === '#/payments/payment-processing' && !checkAccess('Payments/Payment Processing')) return <AccessDenied />;

        switch (path) {
            case '#/payments/overview': return <PaymentsOverview />;
            case '#/payments/inbound': return <Inbound />;
            case '#/payments/outbound': return <Outbound />;
            case '#/payments/invoices': return <Invoices />;
            case '#/payments/reconciliation': return <PaymentReconciliation />;
            case '#/payments/landlord-payouts': return <LandlordPayouts />;
            case '#/payments/overpayments': return <Overpayments />;
            case '#/payments/payment-processing': return <PaymentProcessing />;
            default: return checkAccess('Payments/Overview') ? <PaymentsOverview /> : <AccessDenied />;
        }
    }

    // HR & Payroll
    if (path.startsWith('#/hr-payroll')) {
        if (path === '#/hr-payroll/staff-management' && !checkAccess('HR & Payroll/Staff Management')) return <AccessDenied />;
        if (path === '#/hr-payroll/payroll-processing' && !checkAccess('HR & Payroll/Payroll Processing')) return <AccessDenied />;
        if (path === '#/hr-payroll/commissions' && !checkAccess('HR & Payroll/Commissions')) return <AccessDenied />;
        if (path === '#/hr-payroll/leave-attendance' && !checkAccess('HR & Payroll/Leave & Attendance')) return <AccessDenied />;
        if (path === '#/hr-payroll/performance' && !checkAccess('HR & Payroll/Performance')) return <AccessDenied />;
        if (path === '#/hr-payroll/reporting' && !checkAccess('HR & Payroll/Reporting')) return <AccessDenied />;

        switch (path) {
            case '#/hr-payroll/staff-management': return <StaffManagement />;
            case '#/hr-payroll/payroll-processing': return <PayrollProcessing />;
            case '#/hr-payroll/commissions': return <HRCommissions />;
            case '#/hr-payroll/leave-attendance': return <LeaveAttendance />;
            case '#/hr-payroll/performance': return <Performance />;
            case '#/hr-payroll/reporting': return <HRReporting />;
            default: return checkAccess('HR & Payroll/Staff Management') ? <StaffManagement /> : <AccessDenied />;
        }
    }

    // Accounting
    if (path.startsWith('#/accounting')) {
        if (path === '#/accounting/overview' && !checkAccess('Accounting/Overview')) return <AccessDenied />;
        if (path === '#/accounting/income' && !checkAccess('Accounting/Income')) return <AccessDenied />;
        if (path === '#/accounting/expenses' && !checkAccess('Accounting/Expenses')) return <AccessDenied />;
        if (path === '#/accounting/financial-statements' && !checkAccess('Accounting/Financial Statements')) return <AccessDenied />;
        if (path === '#/accounting/tax-compliance' && !checkAccess('Accounting/Tax Compliance')) return <AccessDenied />;
        if (path === '#/accounting/reconciliation' && !checkAccess('Accounting/Reconciliation')) return <AccessDenied />;
        if (path === '#/accounting/reporting' && !checkAccess('Accounting/Reporting')) return <AccessDenied />;

        switch (path) {
            case '#/accounting/overview': return <AccountingOverview />;
            case '#/accounting/income': return <Income />;
            case '#/accounting/expenses': return <Expenses />;
            case '#/accounting/financial-statements': return <FinancialStatements />;
            case '#/accounting/tax-compliance': return <TaxCompliance />;
            case '#/accounting/reconciliation': return <AccountingReconciliation />;
            case '#/accounting/reporting': return <AccountingReporting />;
            default: return checkAccess('Accounting/Overview') ? <AccountingOverview /> : <AccessDenied />;
        }
    }

    // Analytics & Reports
    if (path.startsWith('#/reports-analytics')) {
        if (path.startsWith('#/reports-analytics/analytics') && !checkAccess('Reports & Analytics/Analytics')) return <AccessDenied />;
        if (path.startsWith('#/reports-analytics/reports') && !checkAccess('Reports & Analytics/Reports')) return <AccessDenied />;

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
    if (path.startsWith('#/reports')) return checkAccess('Reports & Analytics/Reports') ? <ReportsOverview /> : <AccessDenied />;
    if (path.startsWith('#/analytics')) return checkAccess('Reports & Analytics/Analytics') ? <AnalyticsOverview /> : <AccessDenied />;

    // User App Portal
    if (path.startsWith('#/user-app-portal')) {
        // Access checks are implicitly handled by the Sidebar/Navigation visibility for roles
        // and the role-based redirect on login. 
        // Additional explicit checks here:
        if (path === '#/user-app-portal/tenant-portal' && !checkAccess('User App Portal/Tenant Portal')) return <AccessDenied />;
        if (path === '#/user-app-portal/agent-portal' && !checkAccess('User App Portal/Agent Portal')) return <AccessDenied />;
        if (path === '#/user-app-portal/refer-and-grow' && !checkAccess('User App Portal/Refer And Grow')) return <AccessDenied />;

        // Handle Landlords Portal with sub-routes
        if (path.startsWith('#/user-app-portal/landlords-portal')) {
            if (!checkAccess('User App Portal/Landlords Portal')) return <AccessDenied />;
            return <LandlordsPortal />;
        }

        if (path === '#/user-app-portal/affiliate-portal' && !checkAccess('User App Portal/Affiliate Portal')) return <AccessDenied />;
        if (path === '#/user-app-portal/investors-portal' && !checkAccess('User App Portal/Investors Portal')) return <AccessDenied />;
        if (path === '#/user-app-portal/caretaker-portal' && !checkAccess('User App Portal/Caretaker Portal')) return <AccessDenied />;
        if (path === '#/user-app-portal/contractor-portal' && !checkAccess('User App Portal/Contractor Portal')) return <AccessDenied />;
        
        switch (path) {
            case '#/user-app-portal/tenant-portal': return <TenantPortal />;
            case '#/user-app-portal/agent-portal': return <AgentPortal />;
            // landlords-portal handled above
            case '#/user-app-portal/affiliate-portal': return <AffiliatePortal />;
            case '#/user-app-portal/investors-portal': return <InvestorsPortal />;
            case '#/user-app-portal/caretaker-portal': return <CaretakerPortal />;
            case '#/user-app-portal/contractor-portal': return <ContractorPortal />;
            case '#/user-app-portal/referral-landing': return <ReferralLanding />; // Should be caught by public check, but as fallback
            case '#/user-app-portal/refer-and-grow': return <ReferAndGrow />;
            default: return <TenantPortal />;
        }
    }

    // Marketplace
    if (path.startsWith('#/marketplace')) {
        if (path === '#/marketplace/listings' && !checkAccess('Marketplace/Listings')) return <AccessDenied />;
        if (path === '#/marketplace/leads' && !checkAccess('Marketplace/Leads')) return <AccessDenied />;
        if (path === '#/marketplace/affiliates' && !checkAccess('Marketplace/Affiliates')) return <AccessDenied />;
        if (path === '#/marketplace/developer-portal' && !checkAccess('Marketplace/Developer Portal')) return <AccessDenied />;
        if (path === '#/marketplace/referral-program' && !checkAccess('Marketplace/Referral Program')) return <AccessDenied />;
        if (path === '#/marketplace/reporting' && !checkAccess('Marketplace/Reporting')) return <AccessDenied />;
        
        switch (path) {
            case '#/marketplace/listings': return <Listings />;
            case '#/marketplace/leads': return <Leads />;
            case '#/marketplace/affiliates': return <MarketplaceAffiliates />;
            case '#/marketplace/developer-portal': return <DeveloperPortal />;
            case '#/marketplace/referral-program': return <ReferralProgram />;
            case '#/marketplace/reporting': return <MarketplaceReporting />;
            default: return checkAccess('Marketplace/Listings') ? <Listings /> : <AccessDenied />;
        }
    }

    // R-Reits
    if (path.startsWith('#/r-reits')) {
         if (path === '#/r-reits/overview' && !checkAccess('R-Reits/Overview')) return <AccessDenied />;
         if (path === '#/r-reits/investment-plans' && !checkAccess('R-Reits/Investment Plans')) return <AccessDenied />;
         if (path === '#/r-reits/project-accounting' && !checkAccess('R-Reits/Project Accounting')) return <AccessDenied />;
         if (path === '#/r-reits/investor-dashboard' && !checkAccess('R-Reits/Investor Dashboard')) return <AccessDenied />;
         if (path === '#/r-reits/rf-payments' && !checkAccess('R-Reits/RF Payments')) return <AccessDenied />;
         if (path === '#/r-reits/portfolio-performance' && !checkAccess('R-Reits/Portfolio Performance')) return <AccessDenied />;
         if (path === '#/r-reits/referrals' && !checkAccess('R-Reits/Referrals')) return <AccessDenied />;
         if (path === '#/r-reits/compliance-kyc' && !checkAccess('R-Reits/Compliance & KYC')) return <AccessDenied />;

        switch (path) {
            case '#/r-reits/overview': return <RReitsOverview />;
            case '#/r-reits/investment-plans': return <InvestmentPlans />;
            case '#/r-reits/project-accounting': return <RenovationAccounting />;
            case '#/r-reits/investor-dashboard': return <InvestorDashboard />;
            case '#/r-reits/rf-payments': return <RFPayments />;
            case '#/r-reits/portfolio-performance': return <PortfolioPerformance />;
            case '#/r-reits/referrals': return <Referrals />;
            case '#/r-reits/compliance-kyc': return <ComplianceAndKYC />;
            default: return checkAccess('R-Reits/Overview') ? <RReitsOverview /> : <AccessDenied />;
        }
    }

    // Settings
    if (path.startsWith('#/settings')) {
        if (path === '#/settings/profile' && !checkAccess('Settings/Profile')) return <AccessDenied />;
        if (path === '#/settings/roles' && !checkAccess('Settings/Roles')) return <AccessDenied />;
        if (path === '#/settings/permissions' && !checkAccess('Settings/Permissions')) return <AccessDenied />;
        if (path === '#/settings/widgets' && !checkAccess('Settings/Widgets')) return <AccessDenied />;
        if (path === '#/settings/rates-rules' && !checkAccess('Settings/Rates & Rules')) return <AccessDenied />;
        if (path === '#/settings/constants' && !checkAccess('Settings/Constants')) return <AccessDenied />;
        if (path === '#/settings/audit-trail' && !checkAccess('Settings/Audit Trail')) return <AccessDenied />;

        switch (path) {
            case '#/settings/profile': return <Profile />;
            case '#/settings/roles': return <Roles />;
            case '#/settings/permissions': return <Permissions />;
            case '#/settings/widgets': return <Widgets />;
            case '#/settings/rates-rules': return <RatesAndRules />;
            case '#/settings/constants': return <Constants />;
            case '#/settings/audit-trail': return <SettingsAuditTrail />;
            default: return checkAccess('Settings/Profile') ? <Profile /> : <AccessDenied />;
        }
    }

    return <Dashboard />;
  };

  return (
      <div className="app-layout bg-gray-100 font-sans text-gray-900" data-sidebar-open={isSidebarOpen ? "true" : "false"}>
        <Header 
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            isSidebarOpen={isSidebarOpen} 
            onLogout={() => setCurrentUser(null)}
        />
        <Sidebar 
            activeRoute={currentPath} 
            isOpen={isSidebarOpen} 
            closeSidebarMobile={() => {
                if (window.innerWidth < 1024) {
                    setIsSidebarOpen(false);
                }
            }} 
        />
        
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-black/50 z-30 lg:hidden glass-backdrop" 
                onClick={() => setIsSidebarOpen(false)}
            />
        )}

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
