import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import * as api from '../services/api';
import type {
  TenantProfile, Property, User, Unit, Task, TenantApplication, StaffProfile,
  FineRule, OffboardingRecord, GeospatialData, CommissionRule, DataContextType,
  LandlordApplication, DeductionRule, Bill, BillItem, Invoice, Vendor, Message,
  CommunicationTemplate, Workflow, CommunicationAutomationRule, AuditLogEntry,
  EscalationRule, ExternalTransaction, Overpayment, SystemSettings, PreventiveTask,
  IncomeSource, Fund, Investment, WithdrawalRequest, RenovationInvestor, RFTransaction,
  RenovationProjectBill, Notification, Quotation, Role, ScheduledReport, TaxRecord,
  MarketplaceListing, Lead, FundiJob
} from '../types';

const SupabaseDataContext = createContext<DataContextType | undefined>(undefined);

export const SupabaseDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current User
  const [currentUser, setCurrentUser] = useState<User | StaffProfile | TenantProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Core Data
  const [tenants, setTenants] = useState<TenantProfile[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [landlords, setLandlords] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [applications, setApplications] = useState<TenantApplication[]>([]);
  const [landlordApplications, setLandlordApplications] = useState<LandlordApplication[]>([]);
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [fines, setFines] = useState<FineRule[]>([]);
  const [offboardingRecords, setOffboardingRecords] = useState<OffboardingRecord[]>([]);
  const [geospatialData, setGeospatialData] = useState<GeospatialData>({});
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([]);
  const [deductionRules, setDeductionRules] = useState<DeductionRule[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [automationRules, setAutomationRules] = useState<CommunicationAutomationRule[]>([]);
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [externalTransactions, setExternalTransactions] = useState<ExternalTransaction[]>([]);
  const [overpayments, setOverpayments] = useState<Overpayment[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [preventiveTasks, setPreventiveTasks] = useState<PreventiveTask[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [renovationInvestors, setRenovationInvestors] = useState<RenovationInvestor[]>([]);
  const [rfTransactions, setRFTransactions] = useState<RFTransaction[]>([]);
  const [renovationProjectBills, setRenovationProjectBills] = useState<RenovationProjectBill[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    companyName: 'TaskMe Realty',
    logo: null,
    profilePic: null
  });
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [taxRecords, setTaxRecords] = useState<TaxRecord[]>([]);
  const [marketplaceListings, setMarketplaceListings] = useState<MarketplaceListing[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [fundiJobs, setFundiJobs] = useState<FundiJob[]>([]);

  // ============================================
  // INITIAL DATA LOAD
  // ============================================

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [
        tenantsData, propertiesData, landlordsData, tasksData, billsData,
        invoicesData, quotationsData, applicationsData, landlordAppsData,
        staffData, finesData, offboardingData, commissionData, deductionData,
        vendorsData, messagesData, notificationsData, templatesData,
        workflowsData, automationData, escalationData, auditData,
        externalTxData, overpaymentsData, incomeData, preventiveData,
        fundsData, investmentsData, withdrawalsData, renovInvestorsData,
        rfTxData, renovBillsData, rolesData, settingsData,
        scheduledData, taxData, listingsData, leadsData, fundiJobsData
      ] = await Promise.all([
        api.tenantsService.getAll().catch(() => []),
        api.propertiesService.getAll().catch(() => []),
        api.landlordsService.getAll().catch(() => []),
        api.tasksService.getAll().catch(() => []),
        api.billsService.getAll().catch(() => []),
        api.invoicesService.getAll().catch(() => []),
        Promise.resolve([]), // quotations loaded separately
        api.applicationsService.getAll().catch(() => []),
        api.landlordApplicationsService.getAll().catch(() => []),
        api.staffService.getAll().catch(() => []),
        api.fineRulesService.getAll().catch(() => []),
        api.offboardingRecordsService.getAll().catch(() => []),
        api.commissionRulesService.getAll().catch(() => []),
        api.deductionRulesService.getAll().catch(() => []),
        api.vendorsService.getAll().catch(() => []),
        api.messagesService.getAll().catch(() => []),
        api.notificationsService.getAll().catch(() => []),
        api.templatesService.getAll().catch(() => []),
        api.workflowsService.getAll().catch(() => []),
        api.automationRulesService.getAll().catch(() => []),
        api.escalationRulesService.getAll().catch(() => []),
        api.auditLogsService.getAll().catch(() => []),
        api.externalTransactionsService.getAll().catch(() => []),
        api.overpaymentsService.getAll().catch(() => []),
        api.incomeSourcesService.getAll().catch(() => []),
        api.preventiveTasksService.getAll().catch(() => []),
        api.fundsService.getAll().catch(() => []),
        api.investmentsService.getAll().catch(() => []),
        api.withdrawalsService.getAll().catch(() => []),
        api.renovationInvestorsService.getAll().catch(() => []),
        api.rfTransactionsService.getAll().catch(() => []),
        Promise.resolve([]), // renovation project bills
        api.rolesService.getAll().catch(() => []),
        api.db.getSystemSettings().catch(() => ({ companyName: 'TaskMe Realty', logo: null, profilePic: null })),
        api.scheduledReportsService.getAll().catch(() => []),
        api.taxRecordsService.getAll().catch(() => []),
        api.marketplaceListingsService.getAll().catch(() => []),
        api.leadsService.getAll().catch(() => []),
        api.fundiJobsService.getAll().catch(() => [])
      ]);

      setTenants(tenantsData);
      setProperties(propertiesData);
      setLandlords(landlordsData);
      setTasks(tasksData);
      setBills(billsData);
      setInvoices(invoicesData);
      setApplications(applicationsData);
      setLandlordApplications(landlordAppsData);
      setStaff(staffData);
      setFines(finesData);
      setOffboardingRecords(offboardingData);
      setCommissionRules(commissionData);
      setDeductionRules(deductionData);
      setVendors(vendorsData);
      setMessages(messagesData);
      setNotifications(notificationsData);
      setTemplates(templatesData);
      setWorkflows(workflowsData);
      setAutomationRules(automationData);
      setEscalationRules(escalationData);
      setAuditLogs(auditData);
      setExternalTransactions(externalTxData);
      setOverpayments(overpaymentsData);
      setIncomeSources(incomeData);
      setPreventiveTasks(preventiveData);
      setFunds(fundsData);
      setInvestments(investmentsData);
      setWithdrawals(withdrawalsData);
      setRenovationInvestors(renovInvestorsData);
      setRFTransactions(rfTxData);
      setRoles(rolesData);
      setSystemSettings(settingsData);
      setScheduledReports(scheduledData);
      setTaxRecords(taxData);
      setMarketplaceListings(listingsData);
      setLeads(leadsData);
      setFundiJobs(fundiJobsData);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize auth state and load data
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        api.profilesService.getById(session.user.id).then(profile => {
          setCurrentUser(profile as User);
        }).catch(console.error);
      }
      loadAllData();
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await api.profilesService.getById(session.user.id).catch(() => null);
        if (profile) setCurrentUser(profile as User);
        loadAllData();
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadAllData]);

  // ============================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================

  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to real-time changes
    const tenantsSub = api.tenantsService.subscribe((payload) => {
      if (payload.eventType === 'INSERT') {
        setTenants(prev => [payload.new as TenantProfile, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setTenants(prev => prev.map(t => t.id === payload.new.id ? payload.new as TenantProfile : t));
      } else if (payload.eventType === 'DELETE') {
        setTenants(prev => prev.filter(t => t.id !== payload.old.id));
      }
    });

    const propertiesSub = api.propertiesService.subscribe((payload) => {
      if (payload.eventType === 'INSERT') {
        setProperties(prev => [payload.new as Property, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setProperties(prev => prev.map(p => p.id === payload.new.id ? payload.new as Property : p));
      } else if (payload.eventType === 'DELETE') {
        setProperties(prev => prev.filter(p => p.id !== payload.old.id));
      }
    });

    const tasksSub = api.tasksService.subscribe((payload) => {
      if (payload.eventType === 'INSERT') {
        setTasks(prev => [payload.new as Task, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new as Task : t));
      }
    });

    const fundsSub = api.fundsService.subscribe((payload) => {
      if (payload.eventType === 'INSERT') {
        setFunds(prev => [payload.new as Fund, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setFunds(prev => prev.map(f => f.id === payload.new.id ? payload.new as Fund : f));
      }
    });

    const notificationsSub = api.notificationsService.subscribe((payload) => {
      if (payload.eventType === 'INSERT') {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      }
    });

    return () => {
      tenantsSub.unsubscribe();
      propertiesSub.unsubscribe();
      tasksSub.unsubscribe();
      fundsSub.unsubscribe();
      notificationsSub.unsubscribe();
    };
  }, [currentUser]);

  // ============================================
  // CRUD OPERATIONS - TENANTS
  // ============================================

  const addTenant = async (t: TenantProfile) => {
    const newTenant = await api.tenantsService.create(t);
    setTenants(prev => [newTenant, ...prev]);
  };

  const updateTenant = async (id: string, d: Partial<TenantProfile>) => {
    const updated = await api.tenantsService.update(id, d);
    setTenants(prev => prev.map(t => t.id === id ? updated : t));
  };

  const deleteTenant = async (id: string) => {
    await api.tenantsService.delete(id);
    setTenants(prev => prev.filter(t => t.id !== id));
  };

  // ============================================
  // CRUD OPERATIONS - PROPERTIES
  // ============================================

  const addProperty = async (p: Property) => {
    const newProperty = await api.propertiesService.create(p);
    setProperties(prev => [newProperty, ...prev]);
  };

  const updateProperty = async (id: string, d: Partial<Property>) => {
    const updated = await api.propertiesService.update(id, d);
    setProperties(prev => prev.map(p => p.id === id ? updated : p));
  };

  const deleteProperty = async (id: string) => {
    await api.propertiesService.delete(id);
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  const addUnitToProperty = async (propId: string, unit: Unit) => {
    const newUnit = await api.propertiesService.addUnit(propId, unit);
    setProperties(prev => prev.map(p => 
      p.id === propId ? { ...p, units: [...p.units, newUnit] } : p
    ));
  };

  // ============================================
  // CRUD OPERATIONS - LANDLORDS
  // ============================================

  const addLandlord = async (u: User) => {
    const newLandlord = await api.landlordsService.create(u);
    setLandlords(prev => [newLandlord, ...prev]);
  };

  const updateLandlord = async (id: string, d: Partial<User>) => {
    const updated = await api.landlordsService.update(id, d);
    setLandlords(prev => prev.map(u => u.id === id ? updated : u));
  };

  const deleteLandlord = async (id: string) => {
    await api.landlordsService.delete(id);
    setLandlords(prev => prev.filter(u => u.id !== id));
  };

  // ============================================
  // CRUD OPERATIONS - TASKS
  // ============================================

  const addTask = async (t: Task) => {
    const newTask = await api.tasksService.create(t);
    setTasks(prev => [newTask, ...prev]);
  };

  const updateTask = async (id: string, d: Partial<Task>) => {
    const updated = await api.tasksService.update(id, d);
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
  };

  // ============================================
  // CRUD OPERATIONS - QUOTATIONS
  // ============================================

  const addQuotation = async (q: Quotation) => {
    const newQuotation = await api.quotationsService.create(q);
    setQuotations(prev => [newQuotation, ...prev]);
  };

  const updateQuotation = async (id: string, d: Partial<Quotation>) => {
    const updated = await api.quotationsService.update(id, d);
    setQuotations(prev => prev.map(q => q.id === id ? updated : q));
  };

  // ============================================
  // CRUD OPERATIONS - APPLICATIONS
  // ============================================

  const addApplication = async (a: TenantApplication) => {
    const newApp = await api.applicationsService.create(a);
    setApplications(prev => [newApp, ...prev]);
  };

  const updateApplication = async (id: string, d: Partial<TenantApplication>) => {
    const updated = await api.applicationsService.update(id, d);
    setApplications(prev => prev.map(a => a.id === id ? updated : a));
  };

  const deleteApplication = async (id: string) => {
    await api.applicationsService.delete(id);
    setApplications(prev => prev.filter(a => a.id !== id));
  };

  // ============================================
  // CRUD OPERATIONS - LANDLORD APPLICATIONS
  // ============================================

  const addLandlordApplication = async (a: LandlordApplication) => {
    const newApp = await api.landlordApplicationsService.create(a);
    setLandlordApplications(prev => [newApp, ...prev]);
  };

  const updateLandlordApplication = async (id: string, d: Partial<LandlordApplication>) => {
    const updated = await api.landlordApplicationsService.update(id, d);
    setLandlordApplications(prev => prev.map(a => a.id === id ? updated : a));
  };

  const deleteLandlordApplication = async (id: string) => {
    await api.landlordApplicationsService.delete(id);
    setLandlordApplications(prev => prev.filter(a => a.id !== id));
  };

  // ============================================
  // CRUD OPERATIONS - STAFF
  // ============================================

  const addStaff = async (s: StaffProfile) => {
    const newStaff = await api.staffService.create(s);
    setStaff(prev => [newStaff, ...prev]);
  };

  const updateStaff = async (id: string, d: Partial<StaffProfile>) => {
    const updated = await api.staffService.update(id, d);
    setStaff(prev => prev.map(s => s.id === id ? updated : s));
  };

  const deleteStaff = async (id: string) => {
    await api.staffService.delete(id);
    setStaff(prev => prev.filter(s => s.id !== id));
  };

  // ============================================
  // CRUD OPERATIONS - FINES
  // ============================================

  const addFine = async (f: FineRule) => {
    const newFine = await api.fineRulesService.create(f);
    setFines(prev => [newFine, ...prev]);
  };

  const updateFine = async (id: string, d: Partial<FineRule>) => {
    const updated = await api.fineRulesService.update(id, d);
    setFines(prev => prev.map(f => f.id === id ? updated : f));
  };

  const deleteFine = async (id: string) => {
    await api.fineRulesService.delete(id);
    setFines(prev => prev.filter(f => f.id !== id));
  };

  // ============================================
  // CRUD OPERATIONS - OFFBOARDING
  // ============================================

  const addOffboardingRecord = async (r: OffboardingRecord) => {
    const newRecord = await api.offboardingRecordsService.create(r);
    setOffboardingRecords(prev => [newRecord, ...prev]);
  };

  const updateOffboardingRecord = async (id: string, d: Partial<OffboardingRecord>) => {
    const updated = await api.offboardingRecordsService.update(id, d);
    setOffboardingRecords(prev => prev.map(r => r.id === id ? updated : r));
  };

  // ============================================
  // CRUD OPERATIONS - COMMISSION RULES
  // ============================================

  const addCommissionRule = async (r: CommissionRule) => {
    const newRule = await api.commissionRulesService.create(r);
    setCommissionRules(prev => [newRule, ...prev]);
  };

  const updateCommissionRule = async (id: string, d: Partial<CommissionRule>) => {
    const updated = await api.commissionRulesService.update(id, d);
    setCommissionRules(prev => prev.map(r => r.id === id ? updated : r));
  };

  const deleteCommissionRule = async (id: string) => {
    await api.commissionRulesService.delete(id);
    setCommissionRules(prev => prev.filter(r => r.id !== id));
  };

  // ============================================
  // CRUD OPERATIONS - DEDUCTION RULES
  // ============================================

  const addDeductionRule = async (r: DeductionRule) => {
    const newRule = await api.deductionRulesService.create(r);
    setDeductionRules(prev => [newRule, ...prev]);
  };

  const updateDeductionRule = async (id: string, d: Partial<DeductionRule>) => {
    const updated = await api.deductionRulesService.update(id, d);
    setDeductionRules(prev => prev.map(r => r.id === id ? updated : r));
  };

  const deleteDeductionRule = async (id: string) => {
    await api.deductionRulesService.delete(id);
    setDeductionRules(prev => prev.filter(r => r.id !== id));
  };

  // ============================================
  // CRUD OPERATIONS - BILLS
  // ============================================

  const addBill = async (b: Bill) => {
    const newBill = await api.billsService.create(b);
    setBills(prev => [newBill, ...prev]);
  };

  const updateBill = async (id: string, d: Partial<Bill>) => {
    const updated = await api.billsService.update(id, d);
    setBills(prev => prev.map(b => b.id === id ? updated : b));
  };

  const deleteBill = async (id: string) => {
    await api.billsService.delete(id);
    setBills(prev => prev.filter(b => b.id !== id));
  };

  const addTenantBill = async (tid: string, b: BillItem) => {
    // This would need a separate tenant_bills table operation
    console.log('Adding tenant bill:', tid, b);
  };

  // ============================================
  // CRUD OPERATIONS - INVOICES
  // ============================================

  const addInvoice = async (i: Invoice) => {
    const newInvoice = await api.invoicesService.create(i);
    setInvoices(prev => [newInvoice, ...prev]);
  };

  const updateInvoice = async (id: string, d: Partial<Invoice>) => {
    const updated = await api.invoicesService.update(id, d);
    setInvoices(prev => prev.map(i => i.id === id ? updated : i));
  };

  // ============================================
  // CRUD OPERATIONS - MESSAGES & NOTIFICATIONS
  // ============================================

  const addMessage = async (m: Message) => {
    const newMessage = await api.messagesService.create(m);
    setMessages(prev => [newMessage, ...prev]);
  };

  const addNotification = async (n: Notification) => {
    const newNotification = await api.notificationsService.create(n);
    setNotifications(prev => [newNotification, ...prev]);
  };

  // ============================================
  // CRUD OPERATIONS - VENDORS
  // ============================================

  const addVendor = async (v: Vendor) => {
    const newVendor = await api.vendorsService.create(v);
    setVendors(prev => [newVendor, ...prev]);
  };

  const updateVendor = async (id: string, d: Partial<Vendor>) => {
    const updated = await api.vendorsService.update(id, d);
    setVendors(prev => prev.map(v => v.id === id ? updated : v));
  };

  const deleteVendor = async (id: string) => {
    await api.vendorsService.delete(id);
    setVendors(prev => prev.filter(v => v.id !== id));
  };

  // ============================================
  // CRUD OPERATIONS - AUDIT LOGS
  // ============================================

  const addAuditLog = async (log: AuditLogEntry) => {
    const newLog = await api.auditLogsService.create(log);
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // ============================================
  // CRUD OPERATIONS - EXTERNAL TRANSACTIONS
  // ============================================

  const updateExternalTransaction = async (id: string, d: Partial<ExternalTransaction>) => {
    const updated = await api.externalTransactionsService.update(id, d);
    setExternalTransactions(prev => prev.map(t => t.id === id ? updated : t));
  };

  // ============================================
  // CRUD OPERATIONS - OVERPAYMENTS
  // ============================================

  const updateOverpayment = async (id: string, d: Partial<Overpayment>) => {
    const updated = await api.overpaymentsService.update(id, d);
    setOverpayments(prev => prev.map(o => o.id === id ? updated : o));
  };

  // ============================================
  // MOVE TENANT PAYMENT
  // ============================================

  const moveTenantPayment = async (fromId: string, toId: string, reference: string) => {
    // This would need custom logic
    console.log('Moving payment:', fromId, toId, reference);
  };

  // ============================================
  // CRUD OPERATIONS - WORKFLOWS
  // ============================================

  const addWorkflow = async (w: Workflow) => {
    const newWorkflow = await api.workflowsService.create(w);
    setWorkflows(prev => [newWorkflow, ...prev]);
  };

  const updateWorkflow = async (id: string, d: Partial<Workflow>) => {
    const updated = await api.workflowsService.update(id, d);
    setWorkflows(prev => prev.map(w => w.id === id ? updated : w));
  };

  // ============================================
  // CRUD OPERATIONS - AUTOMATION RULES
  // ============================================

  const addAutomationRule = async (r: CommunicationAutomationRule) => {
    const newRule = await api.automationRulesService.create(r);
    setAutomationRules(prev => [newRule, ...prev]);
  };

  const updateAutomationRule = async (id: string, d: Partial<CommunicationAutomationRule>) => {
    const updated = await api.automationRulesService.update(id, d);
    setAutomationRules(prev => prev.map(r => r.id === id ? updated : r));
  };

  // ============================================
  // CRUD OPERATIONS - ESCALATION RULES
  // ============================================

  const addEscalationRule = async (r: EscalationRule) => {
    const newRule = await api.escalationRulesService.create(r);
    setEscalationRules(prev => [newRule, ...prev]);
  };

  const updateEscalationRule = async (id: string, d: Partial<EscalationRule>) => {
    const updated = await api.escalationRulesService.update(id, d);
    setEscalationRules(prev => prev.map(r => r.id === id ? updated : r));
  };

  // ============================================
  // SYSTEM SETTINGS
  // ============================================

  const updateSystemSettings = async (settings: Partial<SystemSettings>) => {
    const updated = await api.db.updateSystemSettings(settings);
    setSystemSettings(updated);
  };

  // ============================================
  // CRUD OPERATIONS - PREVENTIVE TASKS
  // ============================================

  const addPreventiveTask = async (t: PreventiveTask) => {
    const newTask = await api.preventiveTasksService.create(t);
    setPreventiveTasks(prev => [newTask, ...prev]);
  };

  // ============================================
  // CRUD OPERATIONS - TEMPLATES
  // ============================================

  const addTemplate = async (t: CommunicationTemplate) => {
    const newTemplate = await api.templatesService.create(t);
    setTemplates(prev => [newTemplate, ...prev]);
  };

  const updateTemplate = async (id: string, d: Partial<CommunicationTemplate>) => {
    const updated = await api.templatesService.update(id, d);
    setTemplates(prev => prev.map(t => t.id === id ? updated : t));
  };

  const deleteTemplate = async (id: string) => {
    await api.templatesService.delete(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  // ============================================
  // CRUD OPERATIONS - INCOME SOURCES
  // ============================================

  const addIncomeSource = async (s: IncomeSource) => {
    const newSource = await api.incomeSourcesService.create(s);
    setIncomeSources(prev => [newSource, ...prev]);
  };

  const updateIncomeSource = async (id: string, d: Partial<IncomeSource>) => {
    const updated = await api.incomeSourcesService.update(id, d);
    setIncomeSources(prev => prev.map(s => s.id === id ? updated : s));
  };

  // ============================================
  // CRUD OPERATIONS - FUNDS
  // ============================================

  const addFund = async (f: Fund) => {
    const newFund = await api.fundsService.create(f);
    setFunds(prev => [newFund, ...prev]);
  };

  const updateFund = async (id: string, d: Partial<Fund>) => {
    const updated = await api.fundsService.update(id, d);
    setFunds(prev => prev.map(f => f.id === id ? updated : f));
  };

  const deleteFund = async (id: string) => {
    await api.fundsService.delete(id);
    setFunds(prev => prev.filter(f => f.id !== id));
  };

  // ============================================
  // CRUD OPERATIONS - INVESTMENTS
  // ============================================

  const addInvestment = async (inv: Investment) => {
    const newInv = await api.investmentsService.create(inv);
    setInvestments(prev => [newInv, ...prev]);
  };

  const updateInvestment = async (id: string, d: Partial<Investment>) => {
    const updated = await api.investmentsService.update(id, d);
    setInvestments(prev => prev.map(i => i.id === id ? updated : i));
  };

  // ============================================
  // CRUD OPERATIONS - WITHDRAWALS
  // ============================================

  const addWithdrawal = async (req: WithdrawalRequest) => {
    const newReq = await api.withdrawalsService.create(req);
    setWithdrawals(prev => [newReq, ...prev]);
  };

  const updateWithdrawal = async (id: string, d: Partial<WithdrawalRequest>) => {
    const updated = await api.withdrawalsService.update(id, d);
    setWithdrawals(prev => prev.map(w => w.id === id ? updated : w));
  };

  // ============================================
  // CRUD OPERATIONS - RENOVATION INVESTORS
  // ============================================

  const addRenovationInvestor = async (inv: RenovationInvestor) => {
    const newInv = await api.renovationInvestorsService.create(inv);
    setRenovationInvestors(prev => [newInv, ...prev]);
  };

  const updateRenovationInvestor = async (id: string, d: Partial<RenovationInvestor>) => {
    const updated = await api.renovationInvestorsService.update(id, d);
    setRenovationInvestors(prev => prev.map(i => i.id === id ? updated : i));
  };

  const deleteRenovationInvestor = async (id: string) => {
    await api.renovationInvestorsService.delete(id);
    setRenovationInvestors(prev => prev.filter(i => i.id !== id));
  };

  // ============================================
  // CRUD OPERATIONS - RF TRANSACTIONS
  // ============================================

  const addRFTransaction = async (tx: RFTransaction) => {
    const newTx = await api.rfTransactionsService.create(tx);
    setRFTransactions(prev => [newTx, ...prev]);
  };

  const updateRFTransaction = async (id: string, d: Partial<RFTransaction>) => {
    const updated = await api.rfTransactionsService.update(id, d);
    setRFTransactions(prev => prev.map(t => t.id === id ? updated : t));
  };

  // ============================================
  // CRUD OPERATIONS - RENOVATION PROJECT BILLS
  // ============================================

  const addRenovationProjectBill = async (bill: RenovationProjectBill) => {
    // const newBill = await api.renovationProjectBillsService.create(bill);
    // setRenovationProjectBills(prev => [newBill, ...prev]);
    console.log('Adding renovation project bill:', bill);
  };

  const updateRenovationProjectBill = async (id: string, d: Partial<RenovationProjectBill>) => {
    // const updated = await api.renovationProjectBillsService.update(id, d);
    // setRenovationProjectBills(prev => prev.map(b => b.id === id ? updated : b));
    console.log('Updating renovation project bill:', id, d);
  };

  // ============================================
  // CRUD OPERATIONS - ROLES
  // ============================================

  const addRole = async (r: Role) => {
    const newRole = await api.rolesService.create(r);
    setRoles(prev => [...prev, newRole]);
  };

  const updateRole = async (id: string, d: Partial<Role>) => {
    const updated = await api.rolesService.update(id, d);
    setRoles(prev => prev.map(r => r.id === id ? updated : r));
  };

  const deleteRole = async (id: string) => {
    await api.rolesService.delete(id);
    setRoles(prev => prev.filter(r => r.id !== id));
  };

  // ============================================
  // CRUD OPERATIONS - SCHEDULED REPORTS
  // ============================================

  const addScheduledReport = async (r: ScheduledReport) => {
    const newReport = await api.scheduledReportsService.create(r);
    setScheduledReports(prev => [newReport, ...prev]);
  };

  const deleteScheduledReport = async (id: string) => {
    await api.scheduledReportsService.delete(id);
    setScheduledReports(prev => prev.filter(r => r.id !== id));
  };

  // ============================================
  // CRUD OPERATIONS - TAX RECORDS
  // ============================================

  const addTaxRecord = async (r: TaxRecord) => {
    const newRecord = await api.taxRecordsService.create(r);
    setTaxRecords(prev => [newRecord, ...prev]);
  };

  const updateTaxRecord = async (id: string, d: Partial<TaxRecord>) => {
    const updated = await api.taxRecordsService.update(id, d);
    setTaxRecords(prev => prev.map(r => r.id === id ? updated : r));
  };

  // ============================================
  // GEOSPATIAL DATA
  // ============================================

  const addGeospatialNode = async (level: any, parentPath: any, name: any) => {
    // This would need custom logic for geospatial data
    console.log('Adding geospatial node:', level, parentPath, name);
  };

  // ============================================
  // MARKETPLACE LISTINGS
  // ============================================

  const addMarketplaceListing = async (listing: MarketplaceListing) => {
    const newListing = await api.marketplaceListingsService.create(listing);
    setMarketplaceListings(prev => [newListing, ...prev]);
  };

  const updateMarketplaceListing = async (id: string, d: Partial<MarketplaceListing>) => {
    const updated = await api.marketplaceListingsService.update(id, d);
    setMarketplaceListings(prev => prev.map(l => l.id === id ? updated : l));
  };

  const deleteMarketplaceListing = async (id: string) => {
    await api.marketplaceListingsService.delete(id);
    setMarketplaceListings(prev => prev.filter(l => l.id !== id));
  };

  const markUnitOccupied = async (propertyId: string, unitId: string) => {
    // Update unit status
    await api.propertiesService.updateUnit(unitId, { status: 'Occupied' as any });
    
    // Update local state
    setProperties(prev => prev.map(p => {
      if (p.id === propertyId) {
        return {
          ...p,
          units: p.units.map(u => u.id === unitId ? { ...u, status: 'Occupied' as const } : u)
        };
      }
      return p;
    }));
  };

  // ============================================
  // LEADS
  // ============================================

  const addLead = async (lead: Lead) => {
    const newLead = await api.leadsService.create(lead);
    setLeads(prev => [newLead, ...prev]);
  };

  const updateLead = async (id: string, d: Partial<Lead>) => {
    const updated = await api.leadsService.update(id, d);
    setLeads(prev => prev.map(l => l.id === id ? updated : l));
  };

  const deleteLead = async (id: string) => {
    await api.leadsService.delete(id);
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  const syncWebsiteLeads = async () => {
    // This would sync with external website
    console.log('Syncing website leads...');
  };

  // ============================================
  // FUNDI JOBS
  // ============================================

  const addFundiJob = async (job: FundiJob) => {
    const newJob = await api.fundiJobsService.create(job);
    setFundiJobs(prev => [newJob, ...prev]);
  };

  const updateFundiJob = async (id: string, d: Partial<FundiJob>) => {
    const updated = await api.fundiJobsService.update(id, d);
    setFundiJobs(prev => prev.map(j => j.id === id ? updated : j));
  };

  const syncFundiJobs = async () => {
    // This would sync with external website
    console.log('Syncing fundi jobs...');
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

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

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: DataContextType = {
    tenants, properties, landlords, tasks, quotations, applications, landlordApplications,
    staff, fines, offboardingRecords, geospatialData, commissionRules, deductionRules,
    bills, invoices, vendors, messages, notifications, templates, workflows, automationRules,
    auditLogs, escalationRules, externalTransactions, overpayments, systemSettings,
    preventiveTasks, incomeSources, funds, investments, withdrawals, renovationInvestors,
    rfTransactions, renovationProjectBills, roles, currentUser, scheduledReports, taxRecords,
    marketplaceListings, leads, fundiJobs,
    setCurrentUser,
    addTenant, updateTenant, deleteTenant,
    addProperty, updateProperty, deleteProperty, addUnitToProperty,
    addTask, updateTask,
    addQuotation, updateQuotation,
    addApplication, updateApplication, deleteApplication,
    addLandlordApplication, updateLandlordApplication, deleteLandlordApplication,
    addLandlord, updateLandlord, deleteLandlord,
    addStaff, updateStaff, deleteStaff,
    addFine, updateFine, deleteFine,
    addOffboardingRecord, updateOffboardingRecord,
    addGeospatialNode,
    addCommissionRule, updateCommissionRule, deleteCommissionRule,
    addDeductionRule, updateDeductionRule, deleteDeductionRule,
    addBill, updateBill, deleteBill, addTenantBill,
    addInvoice, updateInvoice,
    addMessage, addNotification,
    addVendor, updateVendor, deleteVendor,
    addAuditLog,
    updateExternalTransaction, updateOverpayment, moveTenantPayment,
    addWorkflow, updateWorkflow,
    addAutomationRule, updateAutomationRule,
    addEscalationRule, updateEscalationRule,
    updateSystemSettings,
    addPreventiveTask,
    addTemplate, updateTemplate, deleteTemplate,
    addIncomeSource, updateIncomeSource,
    addFund, updateFund, deleteFund,
    addInvestment, updateInvestment,
    addWithdrawal, updateWithdrawal,
    addRenovationInvestor, updateRenovationInvestor, deleteRenovationInvestor,
    addRFTransaction, updateRFTransaction,
    addRenovationProjectBill, updateRenovationProjectBill,
    addRole, updateRole, deleteRole,
    addScheduledReport, deleteScheduledReport,
    addTaxRecord, updateTaxRecord,
    getOccupancyRate, getTotalRevenue,
    checkPermission,
    addMarketplaceListing, updateMarketplaceListing, deleteMarketplaceListing, markUnitOccupied,
    addLead, updateLead, deleteLead, syncWebsiteLeads,
    addFundiJob, updateFundiJob, syncFundiJobs
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading TaskMe Realty...</p>
        </div>
      </div>
    );
  }

  return (
    <SupabaseDataContext.Provider value={value}>
      {children}
    </SupabaseDataContext.Provider>
  );
};

export const useSupabaseData = () => {
  const context = useContext(SupabaseDataContext);
  if (context === undefined) throw new Error('useSupabaseData must be used within a SupabaseDataProvider');
  return context;
};

// Export as useData for backward compatibility
export const useData = useSupabaseData;
