
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TenantProfile, Property, User, Unit, Task, TenantApplication, StaffProfile, FineRule, OffboardingRecord, GeospatialData, CommissionRule, DataContextType, LandlordApplication, DeductionRule, Bill, BillItem, Invoice, Vendor, Message, CommunicationTemplate, Workflow, CommunicationAutomationRule, AuditLogEntry, EscalationRule, ExternalTransaction, Overpayment, SystemSettings, PreventiveTask, IncomeSource, Fund, Investment, WithdrawalRequest, RenovationInvestor, RFTransaction, RenovationProjectBill, Notification, Quotation, Role, RolePermissions, ScheduledReport, TaxRecord, MarketplaceListing, Lead, FundiJob, MarketingBannerTemplate } from '../types';
import { GEOSPATIAL_DATA as INITIAL_GEOSPATIAL_DATA } from '../constants';
import { websiteApi } from '../utils/websiteApi';
import { supabase } from '../utils/supabaseClient';

const DataContext = createContext<DataContextType | undefined>(undefined);
const isSupabaseEnabled = !!supabase;

function useSupabaseBackedState<T>(
  emptyValue: T,
  key: string
): [T, React.Dispatch<React.SetStateAction<T>>, { loading: boolean; error: string | null }] {
  const [value, setValue] = useState<T>(emptyValue);
  const queryClient = useQueryClient();

  // Individual queries are DISABLED — the master batch loader in DataProvider
  // calls app.load_all_app_state() once and populates all individual caches
  // via setQueryData. This reduces 38+ round-trips to a single RPC call.
  const { data: fetchedValue } = useQuery<T>({
    queryKey: ['app_state', key],
    staleTime: Infinity,   // master batch controls freshness
    gcTime: 30 * 60 * 1000,
    enabled: false,        // never auto-fetches; populated by batch loader
    queryFn: async () => emptyValue, // never called, satisfies TS
  });

  useEffect(() => {
    if (fetchedValue !== undefined) {
      setValue(fetchedValue);
    }
  }, [fetchedValue]);

  const upsertMutation = useMutation({
    mutationFn: async (next: T) => {
      console.log('[Supabase] app_state upsert', { key });
      const { error } = await supabase
        .schema('app')
        .from('app_state')
        .upsert({ key, value: next });
      if (error) {
        console.warn(`Error persisting Supabase state for key "${key}"`, error);
        throw error;
      }
      return next;
    },
    onSuccess: (next) => {
      // Keep individual cache and master batch cache in sync after writes
      queryClient.setQueryData(['app_state', key], next);
      queryClient.setQueryData<Record<string, unknown>>(['all_app_state'], (old) => {
        if (!old) return old;
        return { ...old, [key]: next };
      });
    },
  });

  const persistAndSetValue: React.Dispatch<React.SetStateAction<T>> = (updater) => {
    setValue((prev) => {
      const next = typeof updater === 'function' ? (updater as any)(prev) : (updater as any);
      upsertMutation.mutate(next);
      return next;
    });
  };

  return [value, persistAndSetValue, { loading: false, error: null }];
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Current User
    const [currentUser, setCurrentUser] = useState<User | StaffProfile | TenantProfile | null>(null);

    // Core Data (start empty; Supabase becomes source of truth)
    const [tenants, setTenants, tenantsStatus] = useSupabaseBackedState<TenantProfile[]>([], 'tm_tenants_v11');
    const [properties, setProperties, propertiesStatus] = useSupabaseBackedState<Property[]>([], 'tm_properties_v11');
    const [landlords, setLandlords, landlordsStatus] = useSupabaseBackedState<User[]>([], 'tm_landlords_v11');
    const [tasks, setTasks, tasksStatus] = useSupabaseBackedState<Task[]>([], 'tm_tasks_v11');
    const [bills, setBills, billsStatus] = useSupabaseBackedState<Bill[]>([], 'tm_bills_v11');
    const [invoices, setInvoices, invoicesStatus] = useSupabaseBackedState<Invoice[]>([], 'tm_invoices_v11');
    const [quotations, setQuotations, quotationsStatus] = useSupabaseBackedState<Quotation[]>([], 'tm_quotations_v11'); 
    const [applications, setApplications, applicationsStatus] = useSupabaseBackedState<TenantApplication[]>([], 'tm_applications_v11');
    const [landlordApplications, setLandlordApplications, landlordApplicationsStatus] = useSupabaseBackedState<LandlordApplication[]>([], 'tm_landlord_applications_v11');
    const [staff, setStaff, staffStatus] = useSupabaseBackedState<StaffProfile[]>([], 'tm_staff_v11');
    const [fines, setFines, finesStatus] = useSupabaseBackedState<FineRule[]>([], 'tm_fines_v11'); 
    const [offboardingRecords, setOffboardingRecords, offboardingStatus] = useSupabaseBackedState<OffboardingRecord[]>([], 'tm_offboarding_v11');
    const [geospatialData, setGeospatialData, geospatialStatus] = useSupabaseBackedState<GeospatialData>(INITIAL_GEOSPATIAL_DATA, 'tm_geospatial_v11');
    const [commissionRules, setCommissionRules, commissionStatus] = useSupabaseBackedState<CommissionRule[]>([], 'tm_commissions_v11');
    const [deductionRules, setDeductionRules, deductionStatus] = useSupabaseBackedState<DeductionRule[]>([], 'tm_deductions_v11');
    const [vendors, setVendors, vendorsStatus] = useSupabaseBackedState<Vendor[]>([], 'tm_vendors_v11');
    const [messages, setMessages, messagesStatus] = useSupabaseBackedState<Message[]>([], 'tm_messages_v11');
    const [notifications, setNotifications, notificationsStatus] = useSupabaseBackedState<Notification[]>([], 'tm_notifications_v11');
    const [templates, setTemplates, templatesStatus] = useSupabaseBackedState<CommunicationTemplate[]>([], 'tm_templates_v11');
    const [workflows, setWorkflows, workflowsStatus] = useSupabaseBackedState<Workflow[]>([], 'tm_workflows_v11');
    const [automationRules, setAutomationRules, automationStatus] = useSupabaseBackedState<CommunicationAutomationRule[]>([], 'tm_automation_rules_v11');
    const [escalationRules, setEscalationRules, escalationStatus] = useSupabaseBackedState<EscalationRule[]>([], 'tm_escalation_rules_v11');
    const [auditLogs, setAuditLogs, auditLogsStatus] = useSupabaseBackedState<AuditLogEntry[]>([], 'tm_audit_logs_v11');
    const [externalTransactions, setExternalTransactions, externalTxStatus] = useSupabaseBackedState<ExternalTransaction[]>([], 'tm_external_transactions_v11');
    const [overpayments, setOverpayments, overpaymentsStatus] = useSupabaseBackedState<Overpayment[]>([], 'tm_overpayments_v11');
    const [incomeSources, setIncomeSources, incomeSourcesStatus] = useSupabaseBackedState<IncomeSource[]>([], 'tm_income_sources_v11');
    const [preventiveTasks, setPreventiveTasks, preventiveTasksStatus] = useSupabaseBackedState<PreventiveTask[]>([], 'tm_preventive_tasks_v11');
    const [funds, setFunds, fundsStatus] = useSupabaseBackedState<Fund[]>([], 'tm_funds_v11');
    const [investments, setInvestments, investmentsStatus] = useSupabaseBackedState<Investment[]>([], 'tm_investments_v11');
    const [withdrawals, setWithdrawals, withdrawalsStatus] = useSupabaseBackedState<WithdrawalRequest[]>([], 'tm_withdrawals_v11');
    const [renovationInvestors, setRenovationInvestors, renovationInvestorsStatus] = useSupabaseBackedState<RenovationInvestor[]>([], 'tm_renovation_investors_v11');
    const [rfTransactions, setRFTransactions, rfTxStatus] = useSupabaseBackedState<RFTransaction[]>([], 'tm_rf_transactions_v11');
    const [renovationProjectBills, setRenovationProjectBills, renovationBillsStatus] = useSupabaseBackedState<RenovationProjectBill[]>([], 'tm_renovation_project_bills_v11');
    const [roles, setRoles] = useState<Role[]>([]);
    const [rolesStatus, setRolesStatus] = useState<{ loading: boolean; error: string | null }>({ loading: true, error: null });
    const [systemSettings, setSystemSettings, systemSettingsStatus] = useSupabaseBackedState<SystemSettings>({
        companyName: 'TaskMe Realty',
        logo: null,
        profilePic: null
    }, 'tm_system_settings_v11');
    const [scheduledReports, setScheduledReports, scheduledReportsStatus] = useSupabaseBackedState<ScheduledReport[]>([], 'tm_scheduled_reports_v11');
    const [taxRecords, setTaxRecords, taxRecordsStatus] = useSupabaseBackedState<TaxRecord[]>([], 'tm_tax_records_v11');
    const [marketplaceListings, setMarketplaceListings, marketplaceStatus] = useSupabaseBackedState<MarketplaceListing[]>([], 'tm_listings_v11');
    const [leads, setLeads, leadsStatus] = useSupabaseBackedState<Lead[]>([], 'tm_leads_v11');
    const [fundiJobs, setFundiJobs, fundiJobsStatus] = useSupabaseBackedState<FundiJob[]>([], 'tm_fundi_jobs_v11');
    const [marketingBanners, setMarketingBanners] = useSupabaseBackedState<MarketingBannerTemplate[]>([], 'tm_marketing_banners_v11');

    const queryClient = useQueryClient();

    // ── Master batch loader ─────────────────────────────────────────────────
    // Single RPC replaces 38+ individual Supabase queries on startup.
    // Results are distributed to individual query caches via setQueryData,
    // which triggers re-renders in every useSupabaseBackedState hook.
    const { data: allAppState, isLoading: batchLoading } =
      useQuery<Record<string, unknown>>({
        queryKey: ['all_app_state'],
        staleTime: 5 * 60 * 1000,
        retry: 2,
        queryFn: async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error('SESSION_EXPIRED');
          console.log('[Supabase] batch load all app_state');
          const { data, error } = await supabase
            .schema('app')
            .rpc('load_all_app_state');
          if (error) throw error;
          return (data as Record<string, unknown>) ?? {};
        },
      });

    // Distribute batch results to every individual query cache
    useEffect(() => {
      if (allAppState) {
        Object.entries(allAppState).forEach(([k, v]) => {
          if (v !== null && v !== undefined) {
            queryClient.setQueryData(['app_state', k], v);
          }
        });
      }
    }, [allAppState, queryClient]);

    const isDataLoading = batchLoading || rolesStatus.loading;

    // ── Supabase Realtime: In-App message delivery ───────────────────────────
    // Subscribes to changes on the app_state row that stores messages.
    // When the row is updated (e.g. by another session sending a message),
    // the local messages state is refreshed automatically.
    useEffect(() => {
        const channel = supabase
            .channel('realtime-messages')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'app',
                    table: 'app_state',
                    filter: `key=eq.tm_messages_v11`,
                },
                (payload) => {
                    const incoming = payload.new?.value;
                    if (Array.isArray(incoming)) {
                        // Merge: keep local messages not yet in the incoming set
                        setMessages(prev => {
                            const existingIds = new Set(prev.map((m: any) => m.id));
                            const fresh = incoming.filter((m: any) => !existingIds.has(m.id));
                            return fresh.length > 0 ? [...fresh, ...prev] : prev;
                        });
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const {
        data: rolesData,
        isLoading: rolesLoading,
        error: rolesError,
    } = useQuery({
        queryKey: ['roles'],
        staleTime: 5 * 60 * 1000,
        queryFn: async () => {
            console.log('[Supabase] roles load');
            const { data, error } = await supabase
                .schema('app')
                .from('roles')
                .select('id,name,description,is_system,permissions,accessible_submodules,widget_access')
                .order('name', { ascending: true });
            if (error) throw error;
            return data || [];
        },
    });

    useEffect(() => {
        if (rolesData) {
            const mapped: Role[] = (rolesData as any[]).map((r: any) => ({
                id: r.id,
                name: r.name,
                description: r.description ?? '',
                isSystem: !!r.is_system,
                permissions: (r.permissions ?? {}) as RolePermissions,
                accessibleSubmodules: (r.accessible_submodules ?? []) as string[],
                widgetAccess: (r.widget_access ?? []) as string[],
            }));
            setRoles(mapped);
            setRolesStatus({ loading: false, error: null });
        }
    }, [rolesData]);

    useEffect(() => {
        if (rolesError) {
            console.warn('Failed to load roles', rolesError);
            setRoles([]);
            setRolesStatus({ loading: false, error: (rolesError as any)?.message ?? 'Failed to load roles' });
        }
    }, [rolesError]);

    useEffect(() => {
        const { data: authSub } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                // Re-fetch all cached data after login or token refresh so stale
                // empty-state from an expired session is replaced with real data.
                console.log('[Supabase] auth event:', event, '— invalidating all queries');
                queryClient.invalidateQueries();
            } else if (event === 'SIGNED_OUT') {
                // Clear all cached queries on logout so next login starts clean.
                console.log('[Supabase] SIGNED_OUT — clearing query cache');
                queryClient.clear();
                setCurrentUser(null);
            }
        });
        return () => {
            authSub?.subscription?.unsubscribe();
        };
    }, [queryClient]);

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
                    const assignedAgent = staff.find(s => s.id === property.assignedAgentId);
                    const affiliate = landlords.find(l => l.role === 'Affiliate' && l.id === property.landlordId);
                    const contactOwner = assignedAgent || affiliate || landlord;
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
                        pinLocationUrl: property.pinLocationUrl || '',
                        images: property.profilePictureUrl ? [property.profilePictureUrl] : [],
                        features: unit.amenities || [],
                        ownerDetails: {
                            name: contactOwner?.name || 'Property Manager',
                            contact: contactOwner?.phone || '',
                            email: contactOwner?.email || ''
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
                    const landlord = landlords.find(l => l.id === prop?.landlordId);
                    const assignedAgent = staff.find(s => s.id === prop?.assignedAgentId);
                    const affiliate = landlords.find(l => l.role === 'Affiliate' && l.id === prop?.landlordId);
                    const contactOwner = assignedAgent || affiliate || landlord;
                    if (unit && unit.status !== 'Vacant' && listing.status === 'Published') {
                        newListings[index] = { ...listing, status: 'Rented' };
                        hasChanges = true;
                    } else if (unit && prop) {
                        const nextOwner = {
                            name: contactOwner?.name || 'Property Manager',
                            contact: contactOwner?.phone || '',
                            email: contactOwner?.email || ''
                        };
                        const nextPin = prop.pinLocationUrl || '';
                        if (
                            listing.location !== (prop.location || prop.branch) ||
                            (listing.pinLocationUrl || '') !== nextPin ||
                            listing.ownerDetails?.name !== nextOwner.name ||
                            listing.ownerDetails?.contact !== nextOwner.contact ||
                            listing.ownerDetails?.email !== nextOwner.email
                        ) {
                            newListings[index] = {
                                ...listing,
                                location: prop.location || prop.branch,
                                pinLocationUrl: nextPin,
                                ownerDetails: { ...listing.ownerDetails, ...nextOwner },
                            };
                            hasChanges = true;
                        }
                    }
                }
            });
            return hasChanges ? newListings : currentListings;
        });
    }, [properties, landlords, staff]);

    // ... (Keep existing update functions) ...
    const addTenant = (t: TenantProfile) => setTenants(prev => [t, ...prev]);
    const updateTenant = (id: string, d: Partial<TenantProfile>) => setTenants(prev => prev.map(t => t.id === id ? { ...t, ...d } : t));
    const deleteTenant = (id: string) => {
        const prevTenants = tenants;
        setTenants(prev => prev.filter(t => t.id !== id));
        (async () => {
            console.log('[Supabase] tenant delete', { id });
            const { error } = await supabase.from('tenants').delete().eq('id', id);
            if (error) {
                console.warn('[Supabase] tenant delete error (may not exist in normalized table):', error.message);
                // Don't rollback – app_state is the source of truth and was already updated
            }
        })();
    };
    const addProperty = (p: Property) => setProperties(prev => [p, ...prev]);
    const updateProperty = (id: string, d: Partial<Property>) => setProperties(prev => prev.map(p => p.id === id ? { ...p, ...d } : p));
    const deleteProperty = (id: string) => setProperties(prev => prev.filter(p => p.id !== id));
    const addUnitToProperty = (propId: string, unit: Unit) => setProperties(prev => prev.map(p => p.id === propId ? { ...p, units: [...p.units, unit] } : p));
    const addLandlord = (u: User) => setLandlords(prev => [u, ...prev]);
    const updateLandlord = (id: string, d: Partial<User>) => setLandlords(prev => prev.map(u => u.id === id ? {...u, ...d} : u));
    const deleteLandlord = (id: string) => {
        const prevLandlords = landlords;
        setLandlords(prev => prev.filter(u => u.id !== id));
        (async () => {
            console.log('[Supabase] landlord delete', { id });
            const { error } = await supabase.from('landlords').delete().eq('id', id);
            if (error) {
                console.warn('[Supabase] landlord delete error (may not exist in normalized table):', error.message);
            }
        })();
    };
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
    const deleteStaff = (id: string) => {
        const prevStaff = staff;
        setStaff(prev => prev.filter(s => s.id !== id));
        (async () => {
            console.log('[Supabase] staff delete', { id });
            // Delete from app.staff_profiles; auth.users record is left to Supabase Admin cleanup
            const { error } = await supabase.schema('app').from('staff_profiles').delete().eq('id', id);
            if (error) {
                console.warn('[Supabase] staff delete error (may not exist in normalized table):', error.message);
            }
        })();
    };
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
    const addRole = (r: Role) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const tempId = r.id;
        setRoles(prev => [...prev, r]);
        (async () => {
            const payload: any = {
                name: r.name,
                description: r.description,
                is_system: r.isSystem,
                permissions: r.permissions,
                accessible_submodules: r.accessibleSubmodules,
                widget_access: r.widgetAccess || []
            };
            if (uuidRegex.test(tempId)) payload.id = tempId;
            console.log('[Supabase] role insert', payload);
            const { data, error } = await supabase
                .schema('app')
                .from('roles')
                .insert(payload)
                .select('*')
                .single();
            if (error || !data) {
                console.error('Failed to create role', error);
                setRoles(prev => prev.filter(x => x.id !== tempId));
                alert(error?.message ?? 'Failed to create role');
                return;
            }
            if (data.id && data.id !== tempId) {
                setRoles(prev => prev.map(role => role.id === tempId ? { ...role, id: data.id } : role));
            }
        })();
    };

    const updateRole = (id: string, d: Partial<Role>) => {
        setRoles(prev => prev.map(r => r.id === id ? { ...r, ...d } : r));
        (async () => {
            const patch: any = {};
            if (d.name !== undefined) patch.name = d.name;
            if (d.description !== undefined) patch.description = d.description;
            if (d.isSystem !== undefined) patch.is_system = d.isSystem;
            if (d.permissions !== undefined) patch.permissions = d.permissions;
            if (d.accessibleSubmodules !== undefined) patch.accessible_submodules = d.accessibleSubmodules;
            if (d.widgetAccess !== undefined) patch.widget_access = d.widgetAccess;
            console.log('[Supabase] role update', { id, patch });
            const { error } = await supabase
                .schema('app')
                .from('roles')
                .update(patch)
                .eq('id', id);
            if (error) {
                console.error('Failed to update role', error);
                alert(error.message);
                const { data } = await supabase
                    .schema('app')
                    .from('roles')
                    .select('id,name,description,is_system,permissions,accessible_submodules,widget_access')
                    .order('name', { ascending: true });
                if (data) {
                    setRoles((data as any[]).map((r: any) => ({
                        id: r.id,
                        name: r.name,
                        description: r.description ?? '',
                        isSystem: !!r.is_system,
                        permissions: (r.permissions ?? {}) as RolePermissions,
                        accessibleSubmodules: (r.accessible_submodules ?? []) as string[],
                        widgetAccess: (r.widget_access ?? []) as string[],
                    })));
                }
            }
        })();
    };

    const deleteRole = (id: string) => {
        const prevRoles = roles;
        setRoles(prev => prev.filter(r => r.id !== id));
        (async () => {
            console.log('[Supabase] role delete', { id });
            const { error } = await supabase
                .schema('app')
                .from('roles')
                .delete()
                .eq('id', id);
            if (error) {
                console.error('Failed to delete role', error);
                setRoles(prevRoles);
                alert(error.message);
            }
        })();
    };
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
            if (newLeads.length > 0) {
                setLeads(prev => {
                    const existingIds = new Set(prev.map(l => l.id));
                    const fresh = newLeads.filter(l => !existingIds.has(l.id));
                    return fresh.length > 0 ? [...fresh, ...prev] : prev;
                });
            }
        } catch (e) {
            console.error('[DataContext] syncWebsiteLeads failed:', e);
        }
    };

    // --- Fundi Jobs ---
    const addFundiJob = (job: FundiJob) => setFundiJobs(prev => [job, ...prev]);
    const updateFundiJob = (id: string, d: Partial<FundiJob>) => setFundiJobs(prev => prev.map(j => j.id === id ? { ...j, ...d } : j));
    
    const syncFundiJobs = async () => {
        try {
            // Primary source: Supabase app_state (populated by fundi-job-submit Edge Function)
            queryClient.invalidateQueries({ queryKey: ['app_state', 'tm_fundi_jobs_v11'] });

            // Secondary source: website API (if VITE_WEBSITE_API_URL is configured)
            const newJobs = await websiteApi.fetchFundiJobs();
            if (newJobs.length > 0) {
                setFundiJobs(prev => {
                    const existingIds = new Set(prev.map(j => j.id));
                    const fresh = newJobs.filter(j => !existingIds.has(j.id));
                    return fresh.length > 0 ? [...fresh, ...prev] : prev;
                });
            }
        } catch (e) {
            console.error('[DataContext] syncFundiJobs failed:', e);
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
            roles, scheduledReports, taxRecords, marketplaceListings, leads, fundiJobs, marketingBanners, setMarketingBanners,
            users, updateUser,
            isSupabaseEnabled,
            isDataLoading,
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
