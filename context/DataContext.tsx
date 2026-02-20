
import React, { createContext, useContext, useState, useEffect } from 'react';
import { TenantProfile, Property, User, Unit, Task, TenantApplication, StaffProfile, FineRule, OffboardingRecord, GeospatialData, CommissionRule, DataContextType, LandlordApplication, DeductionRule, Bill, BillItem, Invoice, Vendor, Message, CommunicationTemplate, Workflow, CommunicationAutomationRule, AuditLogEntry, EscalationRule, ExternalTransaction, Overpayment, SystemSettings, PreventiveTask, IncomeSource, Fund, Investment, WithdrawalRequest, RenovationInvestor, RFTransaction, RenovationProjectBill, Notification, Quotation, Role, RolePermissions, ScheduledReport, TaxRecord, MarketplaceListing, Lead, FundiJob } from '../types';
import { SEED_PROPERTIES, SEED_TENANTS, SEED_LANDLORDS, SEED_TASKS, SEED_INVOICES, SEED_BILLS, SEED_FINE_RULES, SEED_OFFBOARDING_RECORDS, SEED_LANDLORD_APPLICATIONS, SEED_WORKFLOWS, SEED_AUTOMATION_RULES, SEED_ESCALATION_RULES, SEED_AUDIT_LOGS, SEED_VENDORS, SEED_PREVENTIVE_TASKS, SEED_MESSAGES, SEED_TEMPLATES, SEED_INCOME_SOURCES, SEED_RENOVATION_PROJECT_BILLS, SEED_STAFF_PROFILES, SEED_TENANT_APPLICATIONS, SEED_EXTERNAL_TRANSACTIONS, SEED_NOTIFICATIONS, SEED_LEADS, SEED_FUNDI_JOBS } from '../utils/seedData';
import { MOCK_APPLICATIONS, GEOSPATIAL_DATA as INITIAL_GEOSPATIAL_DATA, MOCK_COMMISSION_RULES, MOCK_DEDUCTION_RULES, MOCK_EXTERNAL_TRANSACTIONS, MOCK_OVERPAYMENTS, INITIAL_FUNDS, MOCK_INVESTMENTS, MOCK_WITHDRAWALS, MOCK_RENOVATION_INVESTORS, MOCK_RF_TRANSACTIONS, MOCK_ROLES, MOCK_SCHEDULED_REPORTS, MOCK_TAX_RECORDS } from '../constants';
import { encryptData, decryptData } from '../utils/security';
import { websiteApi } from '../utils/websiteApi';

const DataContext = createContext<DataContextType | undefined>(undefined);

function useStickyState<T>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      if (stickyValue !== null) {
          const decrypted = decryptData(stickyValue);
          return JSON.parse(decrypted);
      }
      return defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      try {
         const stickyValue = window.localStorage.getItem(key);
         return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
      } catch (e) {
         return defaultValue;
      }
    }
  });

  useEffect(() => {
    try {
      const stringified = JSON.stringify(value);
      const encrypted = encryptData(stringified);
      window.localStorage.setItem(key, encrypted);
    } catch (error) {
      console.warn(`Error saving localStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue];
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Current User
    const [currentUser, setCurrentUser] = useState<User | StaffProfile | TenantProfile | null>(null);

    // Core Data
    const [tenants, setTenants] = useStickyState<TenantProfile[]>(SEED_TENANTS, 'tm_tenants_v11');
    const [properties, setProperties] = useStickyState<Property[]>(SEED_PROPERTIES, 'tm_properties_v11');
    const [landlords, setLandlords] = useStickyState<User[]>(SEED_LANDLORDS, 'tm_landlords_v11');
    const [tasks, setTasks] = useStickyState<Task[]>(SEED_TASKS, 'tm_tasks_v11');
    const [bills, setBills] = useStickyState<Bill[]>(SEED_BILLS, 'tm_bills_v11');
    const [invoices, setInvoices] = useStickyState<Invoice[]>(SEED_INVOICES, 'tm_invoices_v11');
    const [quotations, setQuotations] = useStickyState<Quotation[]>([], 'tm_quotations_v11'); 
    const [applications, setApplications] = useStickyState<TenantApplication[]>(SEED_TENANT_APPLICATIONS, 'tm_applications_v11');
    const [landlordApplications, setLandlordApplications] = useStickyState<LandlordApplication[]>(SEED_LANDLORD_APPLICATIONS, 'tm_landlord_applications_v11');
    const [staff, setStaff] = useStickyState<StaffProfile[]>(SEED_STAFF_PROFILES, 'tm_staff_v11');
    const [fines, setFines] = useStickyState<FineRule[]>(SEED_FINE_RULES, 'tm_fines_v11'); 
    const [offboardingRecords, setOffboardingRecords] = useStickyState<OffboardingRecord[]>(SEED_OFFBOARDING_RECORDS, 'tm_offboarding_v11');
    const [geospatialData, setGeospatialData] = useStickyState<GeospatialData>(INITIAL_GEOSPATIAL_DATA, 'tm_geospatial_v11');
    const [commissionRules, setCommissionRules] = useStickyState<CommissionRule[]>(MOCK_COMMISSION_RULES, 'tm_commissions_v11');
    const [deductionRules, setDeductionRules] = useStickyState<DeductionRule[]>(MOCK_DEDUCTION_RULES, 'tm_deductions_v11');
    const [vendors, setVendors] = useStickyState<Vendor[]>(SEED_VENDORS, 'tm_vendors_v11');
    const [messages, setMessages] = useStickyState<Message[]>(SEED_MESSAGES, 'tm_messages_v11');
    const [notifications, setNotifications] = useStickyState<Notification[]>(SEED_NOTIFICATIONS, 'tm_notifications_v11');
    const [templates, setTemplates] = useStickyState<CommunicationTemplate[]>(SEED_TEMPLATES, 'tm_templates_v11');
    const [workflows, setWorkflows] = useStickyState<Workflow[]>(SEED_WORKFLOWS, 'tm_workflows_v11');
    const [automationRules, setAutomationRules] = useStickyState<CommunicationAutomationRule[]>(SEED_AUTOMATION_RULES, 'tm_automation_rules_v11');
    const [escalationRules, setEscalationRules] = useStickyState<EscalationRule[]>(SEED_ESCALATION_RULES, 'tm_escalation_rules_v11');
    const [auditLogs, setAuditLogs] = useStickyState<AuditLogEntry[]>(SEED_AUDIT_LOGS, 'tm_audit_logs_v11');
    const [externalTransactions, setExternalTransactions] = useStickyState<ExternalTransaction[]>(SEED_EXTERNAL_TRANSACTIONS, 'tm_external_transactions_v11');
    const [overpayments, setOverpayments] = useStickyState<Overpayment[]>(MOCK_OVERPAYMENTS, 'tm_overpayments_v11');
    const [incomeSources, setIncomeSources] = useStickyState<IncomeSource[]>(SEED_INCOME_SOURCES, 'tm_income_sources_v11');
    const [preventiveTasks, setPreventiveTasks] = useStickyState<PreventiveTask[]>(SEED_PREVENTIVE_TASKS, 'tm_preventive_tasks_v11');
    const [funds, setFunds] = useStickyState<Fund[]>(INITIAL_FUNDS, 'tm_funds_v11');
    const [investments, setInvestments] = useStickyState<Investment[]>(MOCK_INVESTMENTS, 'tm_investments_v11');
    const [withdrawals, setWithdrawals] = useStickyState<WithdrawalRequest[]>(MOCK_WITHDRAWALS, 'tm_withdrawals_v11');
    const [renovationInvestors, setRenovationInvestors] = useStickyState<RenovationInvestor[]>(MOCK_RENOVATION_INVESTORS, 'tm_renovation_investors_v11');
    const [rfTransactions, setRFTransactions] = useStickyState<RFTransaction[]>(MOCK_RF_TRANSACTIONS, 'tm_rf_transactions_v11');
    const [renovationProjectBills, setRenovationProjectBills] = useStickyState<RenovationProjectBill[]>(SEED_RENOVATION_PROJECT_BILLS, 'tm_renovation_project_bills_v11');
    const [roles, setRoles] = useStickyState<Role[]>(MOCK_ROLES, 'tm_roles_v13');
    const [systemSettings, setSystemSettings] = useStickyState<SystemSettings>({
        companyName: 'TaskMe Realty',
        logo: null,
        profilePic: null
    }, 'tm_system_settings_v11');
    const [scheduledReports, setScheduledReports] = useStickyState<ScheduledReport[]>(MOCK_SCHEDULED_REPORTS, 'tm_scheduled_reports_v11');
    const [taxRecords, setTaxRecords] = useStickyState<TaxRecord[]>(MOCK_TAX_RECORDS, 'tm_tax_records_v11');
    const [marketplaceListings, setMarketplaceListings] = useStickyState<MarketplaceListing[]>([], 'tm_listings_v11');
    const [leads, setLeads] = useStickyState<Lead[]>(SEED_LEADS, 'tm_leads_v11');
    const [fundiJobs, setFundiJobs] = useStickyState<FundiJob[]>(SEED_FUNDI_JOBS, 'tm_fundi_jobs_v11');

    // --- AUTOMATION: Sync Vacancies to Marketplace ---
    useEffect(() => {
        setMarketplaceListings(currentListings => {
            const newListings = [...currentListings];
            let hasChanges = false;
            const allVacantUnits = properties.flatMap(p => 
                p.units.filter(u => u.status === 'Vacant').map(u => ({ unit: u, property: p }))
            );
            allVacantUnits.forEach(({ unit, property }) => {
                const existingListing = newListings.find(l => l.unitId === unit.id);
                if (!existingListing) {
                    const landlord = landlords.find(l => l.id === property.landlordId);
                    const newListing: MarketplaceListing = {
                        id: `auto-lst-${unit.id}-${Date.now()}`,
                        propertyId: property.id,
                        propertyName: property.name,
                        unitId: unit.id,
                        unitNumber: unit.unitNumber,
                        type: 'Rent',
                        status: 'Published',
                        price: unit.rent || property.defaultMonthlyRent || 0,
                        currency: 'KES',
                        description: `Vacant ${unit.unitType || unit.bedrooms + 'BR'} unit available in ${property.location || property.branch}.`,
                        title: `${property.name} - ${unit.unitNumber}`,
                        location: property.location || property.branch,
                        images: property.profilePictureUrl ? [property.profilePictureUrl] : [],
                        features: unit.amenities || [],
                        ownerDetails: {
                            name: landlord?.name || 'Property Manager',
                            contact: landlord?.phone || '',
                            email: landlord?.email || ''
                        },
                        dateCreated: new Date().toISOString()
                    };
                    newListings.push(newListing);
                    hasChanges = true;
                }
            });
            newListings.forEach((listing, index) => {
                if (listing.type === 'Rent') {
                    const prop = properties.find(p => p.id === listing.propertyId);
                    const unit = prop?.units.find(u => u.id === listing.unitId);
                    if (unit && unit.status !== 'Vacant' && listing.status === 'Published') {
                        newListings[index] = { ...listing, status: 'Rented' };
                        hasChanges = true;
                    }
                }
            });
            return hasChanges ? newListings : currentListings;
        });
    }, [properties, landlords]);

    // ... (Keep existing update functions) ...
    const addTenant = (t: TenantProfile) => setTenants(prev => [t, ...prev]);
    const updateTenant = (id: string, d: Partial<TenantProfile>) => setTenants(prev => prev.map(t => t.id === id ? { ...t, ...d } : t));
    const deleteTenant = (id: string) => setTenants(prev => prev.filter(t => t.id !== id));
    const addProperty = (p: Property) => setProperties(prev => [p, ...prev]);
    const updateProperty = (id: string, d: Partial<Property>) => setProperties(prev => prev.map(p => p.id === id ? { ...p, ...d } : p));
    const deleteProperty = (id: string) => setProperties(prev => prev.filter(p => p.id !== id));
    const addUnitToProperty = (propId: string, unit: Unit) => setProperties(prev => prev.map(p => p.id === propId ? { ...p, units: [...p.units, unit] } : p));
    const addLandlord = (u: User) => setLandlords(prev => [u, ...prev]);
    const updateLandlord = (id: string, d: Partial<User>) => setLandlords(prev => prev.map(u => u.id === id ? {...u, ...d} : u));
    const deleteLandlord = (id: string) => setLandlords(prev => prev.filter(u => u.id !== id));
    const addTask = (t: Task) => setTasks(prev => [t, ...prev]);
    const updateTask = (id: string, d: Partial<Task>) => setTasks(prev => prev.map(t => t.id === id ? {...t, ...d} : t));
    const addQuotation = (q: Quotation) => setQuotations(prev => [q, ...prev]);
    const updateQuotation = (id: string, d: Partial<Quotation>) => setQuotations(prev => prev.map(q => q.id === id ? {...q, ...d} : q));
    const addApplication = (a: TenantApplication) => setApplications(prev => [a, ...prev]);
    const updateApplication = (id: string, d: Partial<TenantApplication>) => setApplications(prev => prev.map(a => a.id === id ? {...a, ...d} : a));
    const deleteApplication = (id: string) => setApplications(prev => prev.filter(a => a.id !== id));
    const addLandlordApplication = (a: LandlordApplication) => setLandlordApplications(prev => [a, ...prev]);
    const updateLandlordApplication = (id: string, d: Partial<LandlordApplication>) => setLandlordApplications(prev => prev.map(a => a.id === id ? {...a, ...d} : a));
    const deleteLandlordApplication = (id: string) => setLandlordApplications(prev => prev.filter(a => a.id !== id));
    const addStaff = (s: StaffProfile) => setStaff(prev => [s, ...prev]);
    const updateStaff = (id: string, d: Partial<StaffProfile>) => setStaff(prev => prev.map(s => s.id === id ? {...s, ...d} : s));
    const deleteStaff = (id: string) => setStaff(prev => prev.filter(s => s.id !== id));
    const addFine = (f: FineRule) => setFines(prev => [f, ...prev]);
    const updateFine = (id: string, d: Partial<FineRule>) => setFines(prev => prev.map(f => f.id === id ? {...f, ...d} : f));
    const deleteFine = (id: string) => setFines(prev => prev.filter(f => f.id !== id));
    const addOffboardingRecord = (r: OffboardingRecord) => setOffboardingRecords(prev => [r, ...prev]);
    const updateOffboardingRecord = (id: string, d: Partial<OffboardingRecord>) => setOffboardingRecords(prev => prev.map(r => r.id === id ? {...r, ...d} : r));
    const addGeospatialNode = (level: any, parentPath: any, name: any) => {
        setGeospatialData(prev => {
            const newData = JSON.parse(JSON.stringify(prev));
            if (level === 'County') {
                if (!newData[name]) newData[name] = {};
            } else if (level === 'SubCounty') {
                const [c] = parentPath;
                if (newData[c]) newData[c][name] = {};
            } else if (level === 'Location') {
                const [c, s] = parentPath;
                if (newData[c]?.[s]) newData[c][s][name] = {};
            } else if (level === 'Zone') {
                const [c, s, l] = parentPath;
                if (newData[c]?.[s]?.[l]) newData[c][s][l][name] = [];
            } else if (level === 'Village') {
                const [c, s, l, z] = parentPath;
                if (newData[c]?.[s]?.[l]?.[z]) {
                    if (!newData[c][s][l][z].includes(name)) newData[c][s][l][z].push(name);
                }
            }
            return newData;
        });
    }; 
    const addCommissionRule = (r: CommissionRule) => setCommissionRules(prev => [r, ...prev]);
    const updateCommissionRule = (id: string, d: Partial<CommissionRule>) => setCommissionRules(prev => prev.map(r => r.id === id ? {...r, ...d} : r));
    const deleteCommissionRule = (id: string) => setCommissionRules(prev => prev.filter(r => r.id !== id));
    const addDeductionRule = (r: DeductionRule) => setDeductionRules(prev => [r, ...prev]);
    const updateDeductionRule = (id: string, d: Partial<DeductionRule>) => setDeductionRules(prev => prev.map(r => r.id === id ? {...r, ...d} : r));
    const deleteDeductionRule = (id: string) => setDeductionRules(prev => prev.filter(r => r.id !== id));
    const addBill = (b: Bill) => setBills(prev => [b, ...prev]);
    const updateBill = (id: string, d: Partial<Bill>) => setBills(prev => prev.map(b => b.id === id ? {...b, ...d} : b));
    const deleteBill = (id: string) => setBills(prev => prev.filter(b => b.id !== id));
    const addTenantBill = (tid: string, b: BillItem) => setTenants(prev => prev.map(t => t.id === tid ? {...t, outstandingBills: [...t.outstandingBills, b]} : t));
    const addInvoice = (i: Invoice) => setInvoices(prev => [i, ...prev]);
    const updateInvoice = (id: string, d: Partial<Invoice>) => setInvoices(prev => prev.map(i => i.id === id ? {...i, ...d} : i));
    const addMessage = (m: Message) => setMessages(prev => [m, ...prev]);
    const addNotification = (n: Notification) => setNotifications(prev => [n, ...prev]);
    const addVendor = (v: Vendor) => setVendors(prev => [v, ...prev]);
    const updateVendor = (id: string, d: Partial<Vendor>) => setVendors(prev => prev.map(v => v.id === id ? {...v, ...d} : v));
    const deleteVendor = (id: string) => setVendors(prev => prev.filter(v => v.id !== id));
    const addAuditLog = (log: AuditLogEntry) => setAuditLogs(prev => [log, ...prev]);
    const updateExternalTransaction = (id: string, d: Partial<ExternalTransaction>) => setExternalTransactions(prev => prev.map(t => t.id === id ? {...t, ...d} : t));
    const updateOverpayment = (id: string, d: Partial<Overpayment>) => setOverpayments(prev => prev.map(o => o.id === id ? {...o, ...d} : o));
    const moveTenantPayment = (f: string, t: string, r: string) => {
        setTenants(prev => {
            const newTenants = [...prev];
            const fromIdx = newTenants.findIndex(tenant => tenant.id === f);
            const toIdx = newTenants.findIndex(tenant => tenant.id === t);
            if (fromIdx === -1 || toIdx === -1) return prev;
            const fromTenant = { ...newTenants[fromIdx] };
            const paymentIdx = fromTenant.paymentHistory.findIndex(p => p.reference === r);
            if (paymentIdx === -1) return prev;
            const [payment] = fromTenant.paymentHistory.splice(paymentIdx, 1);
            newTenants[fromIdx] = fromTenant;
            const toTenant = { ...newTenants[toIdx] };
            toTenant.paymentHistory = [payment, ...toTenant.paymentHistory];
            newTenants[toIdx] = toTenant;
            return newTenants;
        });
    }; 
    const addWorkflow = (w: Workflow) => setWorkflows(prev => [w, ...prev]);
    const updateWorkflow = (id: string, d: Partial<Workflow>) => setWorkflows(prev => prev.map(w => w.id === id ? { ...w, ...d } : w));
    const addAutomationRule = (r: CommunicationAutomationRule) => setAutomationRules(prev => [r, ...prev]);
    const updateAutomationRule = (id: string, d: Partial<CommunicationAutomationRule>) => setAutomationRules(prev => prev.map(r => r.id === id ? {...r, ...d} : r));
    const addEscalationRule = (r: EscalationRule) => setEscalationRules(prev => [r, ...prev]);
    const updateEscalationRule = (id: string, d: Partial<EscalationRule>) => setEscalationRules(prev => prev.map(r => r.id === id ? { ...r, ...d} : r));
    const updateSystemSettings = (settings: Partial<SystemSettings>) => setSystemSettings(prev => ({ ...prev, ...settings }));
    const addPreventiveTask = (t: PreventiveTask) => setPreventiveTasks(prev => [t, ...prev]);
    const addTemplate = (t: CommunicationTemplate) => setTemplates(prev => [t, ...prev]);
    const updateTemplate = (id: string, d: Partial<CommunicationTemplate>) => setTemplates(prev => prev.map(t => t.id === id ? {...t, ...d} : t));
    const deleteTemplate = (id: string) => setTemplates(prev => prev.filter(t => t.id !== id));
    const addIncomeSource = (s: IncomeSource) => setIncomeSources(prev => [s, ...prev]);
    const updateIncomeSource = (id: string, d: Partial<IncomeSource>) => setIncomeSources(prev => prev.map(s => s.id === id ? {...s, ...d} : s));
    const addFund = (f: Fund) => setFunds(prev => [f, ...prev]);
    const updateFund = (id: string, d: Partial<Fund>) => setFunds(prev => prev.map(f => f.id === id ? { ...f, ...d } : f));
    const deleteFund = (id: string) => setFunds(prev => prev.filter(f => f.id !== id));
    const addInvestment = (inv: Investment) => setInvestments(prev => [inv, ...prev]);
    const updateInvestment = (id: string, d: Partial<Investment>) => setInvestments(prev => prev.map(i => i.id === id ? { ...i, ...d } : i));
    const addWithdrawal = (req: WithdrawalRequest) => setWithdrawals(prev => [req, ...prev]);
    const updateWithdrawal = (id: string, d: Partial<WithdrawalRequest>) => setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, ...d } : w));
    const addRenovationInvestor = (inv: RenovationInvestor) => setRenovationInvestors(prev => [inv, ...prev]);
    const updateRenovationInvestor = (id: string, d: Partial<RenovationInvestor>) => setRenovationInvestors(prev => prev.map(i => i.id === id ? { ...i, ...d } : i));
    const deleteRenovationInvestor = (id: string) => setRenovationInvestors(prev => prev.filter(i => i.id !== id));
    const addRFTransaction = (tx: RFTransaction) => setRFTransactions(prev => [tx, ...prev]);
    const updateRFTransaction = (id: string, d: Partial<RFTransaction>) => setRFTransactions(prev => prev.map(t => t.id === id ? { ...t, ...d } : t));
    const addRenovationProjectBill = (bill: RenovationProjectBill) => setRenovationProjectBills(prev => [bill, ...prev]);
    const updateRenovationProjectBill = (id: string, d: Partial<RenovationProjectBill>) => setRenovationProjectBills(prev => prev.map(b => b.id === id ? { ...b, ...d } : b));
    const addRole = (r: Role) => setRoles(prev => [...prev, r]);
    const updateRole = (id: string, d: Partial<Role>) => setRoles(prev => prev.map(r => r.id === id ? {...r, ...d} : r));
    const deleteRole = (id: string) => setRoles(prev => prev.filter(r => r.id !== id));
    const addScheduledReport = (r: ScheduledReport) => setScheduledReports(prev => [r, ...prev]);
    const deleteScheduledReport = (id: string) => setScheduledReports(prev => prev.filter(r => r.id !== id));
    const addTaxRecord = (r: TaxRecord) => setTaxRecords(prev => [r, ...prev]);
    const updateTaxRecord = (id: string, d: Partial<TaxRecord>) => setTaxRecords(prev => prev.map(r => r.id === id ? {...r, ...d} : r));
    const getOccupancyRate = () => {
        const totalUnits = properties.reduce((acc, p) => acc + p.units.length, 0);
        const occupiedUnits = properties.reduce((acc, p) => acc + p.units.filter(u => u.status === 'Occupied').length, 0);
        return totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
    };
    const getTotalRevenue = () => {
        return tenants.reduce((acc, t) => acc + (t.rentAmount || 0), 0);
    };

    const checkPermission = (module: string, action: string): boolean => {
        if (!currentUser) return false;
        if (currentUser.role === 'Super Admin') return true; 

        const roleDef = roles.find(r => r.name === currentUser.role);
        if (!roleDef) return false;

        const hasAccess = roleDef.accessibleSubmodules.some(path => 
            path === module || path.startsWith(`${module}/`)
        );
        
        if (!hasAccess) return false;

        const baseModule = module.split('/')[0];
        const modulePerms = roleDef.permissions[baseModule];
        
        if (modulePerms && (modulePerms as any)[action] !== undefined) {
             return (modulePerms as any)[action] === true;
        }

        return true;
    };

    // Marketplace CRUD
    const addMarketplaceListing = (listing: MarketplaceListing) => setMarketplaceListings(prev => [listing, ...prev]);
    const updateMarketplaceListing = (id: string, d: Partial<MarketplaceListing>) => setMarketplaceListings(prev => prev.map(l => l.id === id ? { ...l, ...d } : l));
    const deleteMarketplaceListing = (id: string) => setMarketplaceListings(prev => prev.filter(l => l.id !== id));
    
    const markUnitOccupied = (propertyId: string, unitId: string) => {
        setProperties(prev => prev.map(p => {
            if (p.id === propertyId) {
                return {
                    ...p,
                    units: p.units.map(u => u.id === unitId ? { ...u, status: 'Occupied' as const } : u)
                };
            }
            return p;
        }));
        setMarketplaceListings(prev => {
            const listing = prev.find(l => l.propertyId === propertyId && l.unitId === unitId);
            if (listing) {
                const endStatus = listing.type === 'Sale' ? 'Sold' : 'Rented';
                return prev.map(l => l.id === listing.id ? { ...l, status: endStatus } : l);
            }
            return prev;
        });
    };

    // --- LEADS CRUD & Sync ---
    const addLead = (lead: Lead) => setLeads(prev => [lead, ...prev]);
    const updateLead = (id: string, d: Partial<Lead>) => setLeads(prev => prev.map(l => l.id === id ? { ...l, ...d } : l));
    const deleteLead = (id: string) => setLeads(prev => prev.filter(l => l.id !== id));

    const syncWebsiteLeads = async () => {
        try {
            const newLeads = await websiteApi.fetchLeads();
            setLeads(prev => {
                // simple dedup based on ID if we had real IDs, here we just append but in prod check dups
                const existingIds = new Set(prev.map(l => l.id));
                const filteredNew = newLeads.filter(l => !existingIds.has(l.id));
                return [...filteredNew, ...prev];
            });
        } catch (e) {
            console.error("Failed to sync leads", e);
        }
    };

    // --- Fundi Jobs ---
    const addFundiJob = (job: FundiJob) => setFundiJobs(prev => [job, ...prev]);
    const updateFundiJob = (id: string, d: Partial<FundiJob>) => setFundiJobs(prev => prev.map(j => j.id === id ? { ...j, ...d } : j));
    
    const syncFundiJobs = async () => {
        try {
             const newJobs = await websiteApi.fetchFundiJobs();
             setFundiJobs(prev => {
                 const existingIds = new Set(prev.map(j => j.id));
                 const filteredNew = newJobs.filter(j => !existingIds.has(j.id));
                 return [...filteredNew, ...prev];
             });
        } catch (e) {
            console.error("Failed to sync fundi jobs", e);
        }
    };

    // --- Unified User Management ---
    const users = React.useMemo(() => {
        // Map all to User type for unified access
        const mappedTenants = tenants.map(t => ({ ...t, role: 'Tenant' } as unknown as User));
        const mappedStaff = staff.map(s => ({ ...s, role: s.role } as unknown as User));
        // Landlords are already User[]
        return [...landlords, ...mappedTenants, ...mappedStaff];
    }, [tenants, landlords, staff]);

    const updateUser = (id: string, data: Partial<User>) => {
        // Determine which list the user belongs to
        const isTenant = tenants.some(t => t.id === id);
        const isStaff = staff.some(s => s.id === id);
        const isLandlord = landlords.some(l => l.id === id);

        if (isTenant) {
            updateTenant(id, data as Partial<TenantProfile>);
        } else if (isStaff) {
            updateStaff(id, data as Partial<StaffProfile>);
        } else if (isLandlord) {
            updateLandlord(id, data);
        }
    };

    return (
        <DataContext.Provider value={{
            tenants, properties, landlords, tasks, quotations, applications, landlordApplications,
            staff, fines, offboardingRecords, geospatialData, commissionRules, deductionRules,
            bills, invoices, vendors, messages, notifications, templates, workflows, automationRules, auditLogs, escalationRules,
            externalTransactions, overpayments, systemSettings, preventiveTasks, incomeSources,
            funds, investments, withdrawals, renovationInvestors, rfTransactions, renovationProjectBills,
            roles, scheduledReports, taxRecords, marketplaceListings, leads, fundiJobs,
            users, updateUser,
            currentUser,
            setCurrentUser,
            addTenant, updateTenant, deleteTenant, addProperty, updateProperty, deleteProperty,
            addUnitToProperty, addTask, updateTask, addQuotation, updateQuotation, addApplication, updateApplication, deleteApplication,
            addLandlordApplication, updateLandlordApplication, deleteLandlordApplication, addLandlord, updateLandlord, deleteLandlord,
            addStaff, updateStaff, deleteStaff, addFine, updateFine, deleteFine, addOffboardingRecord,
            updateOffboardingRecord, addGeospatialNode, addCommissionRule, updateCommissionRule,
            deleteCommissionRule, addDeductionRule, updateDeductionRule, deleteDeductionRule,
            addBill, updateBill, deleteBill, addTenantBill, addInvoice, updateInvoice,
            addMessage, addNotification, addVendor, updateVendor, deleteVendor, addAuditLog, updateExternalTransaction, updateOverpayment, moveTenantPayment,
            addWorkflow, updateWorkflow, addAutomationRule, updateAutomationRule, addEscalationRule, updateEscalationRule,
            updateSystemSettings, addPreventiveTask, addTemplate, updateTemplate, deleteTemplate, addIncomeSource, updateIncomeSource,
            addFund, updateFund, addInvestment, updateInvestment, addWithdrawal, updateWithdrawal,
            addRenovationInvestor, updateRenovationInvestor, deleteRenovationInvestor, addRFTransaction, updateRFTransaction,
            addRenovationProjectBill, updateRenovationProjectBill,
            addRole, updateRole, deleteRole,
            addScheduledReport, deleteScheduledReport,
            addTaxRecord, updateTaxRecord,
            getOccupancyRate, getTotalRevenue,
            deleteFund,
            checkPermission,
            addMarketplaceListing, updateMarketplaceListing, deleteMarketplaceListing, markUnitOccupied,
            addLead, updateLead, deleteLead, syncWebsiteLeads,
            addFundiJob, updateFundiJob, syncFundiJobs
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) throw new Error('useData must be used within a DataProvider');
    return context;
};
