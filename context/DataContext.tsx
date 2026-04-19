
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TenantProfile, Property, User, Unit, Task, TenantApplication, StaffProfile, FineRule, OffboardingRecord, GeospatialData, CommissionRule, DataContextType, LandlordApplication, DeductionRule, Bill, BillItem, Invoice, Vendor, Message, CommunicationTemplate, Workflow, CommunicationAutomationRule, AuditLogEntry, EscalationRule, ExternalTransaction, Overpayment, SystemSettings, PreventiveTask, IncomeSource, Fund, Investment, WithdrawalRequest, RenovationInvestor, RFTransaction, RenovationProjectBill, Notification, Quotation, Role, RolePermissions, ScheduledReport, TaxRecord, MarketplaceListing, Lead, FundiJob, MarketingBannerTemplate } from '../types';
import { GEOSPATIAL_DATA as INITIAL_GEOSPATIAL_DATA } from '../constants';
import { websiteApi } from '../utils/websiteApi';
import { supabase, getSupabaseSession, bustSessionCache } from '../utils/supabaseClient';

const DataContext = createContext<DataContextType | undefined>(undefined);
const isSupabaseEnabled = !!supabase;

// ── Batch-settled signal ─────────────────────────────────────────────────────
// Individual queryFns are disabled (enabled: false) until the batch RPC has
// settled. This prevents 38+ fallback queries from firing simultaneously on
// mount. Once the batch resolves or rejects, _setBatchSettled() notifies all
// waiting hooks via React state so they re-render with enabled: true.
// By that time the batch has already populated the cache via setQueryData, so
// the individual queryFns never actually run — React Query sees fresh cache.
let _globalBatchSettled = false;
const _batchSettledListeners = new Set<() => void>();

function _setBatchSettled() {
  if (_globalBatchSettled) return;
  _globalBatchSettled = true;
  _batchSettledListeners.forEach(fn => fn());
  _batchSettledListeners.clear();
}

function useBatchSettled(): boolean {
  const [settled, setSettled] = useState(_globalBatchSettled);
  useEffect(() => {
    if (_globalBatchSettled) { setSettled(true); return; }
    const notify = () => setSettled(true);
    _batchSettledListeners.add(notify);
    return () => { _batchSettledListeners.delete(notify); };
  }, []);
  return settled;
}

function useSupabaseBackedState<T>(
  emptyValue: T,
  key: string,
  options?: { skipPersist?: boolean }
): [T, React.Dispatch<React.SetStateAction<T>>, { loading: boolean; error: string | null }] {
  const [value, setValue] = useState<T>(emptyValue);
  const queryClient = useQueryClient();
  const batchSettled = useBatchSettled();

  // enabled: batchSettled — individual queries are disabled until the batch RPC
  // has had a chance to populate the cache. If the batch succeeds (the common
  // path) these queryFns never run. If the batch fails they run as fallback.
  //
  // staleTime: Infinity means once data is in cache (from batch or a prior
  // individual fetch), this queryFn is never called again on that session.
  const {
    data: fetchedValue,
    isLoading,
    error,
  } = useQuery<T>({
    queryKey: ['app_state', key],
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    enabled: batchSettled,
    queryFn: async () => {
      const session = await getSupabaseSession();
      if (!session) throw new Error('SESSION_EXPIRED');
      console.log('[Supabase] app_state individual load (batch miss)', { key });
      const { data, error } = await supabase
        .schema('app')
        .from('app_state')
        .select('value')
        .eq('key', key)
        .maybeSingle();
      if (error) throw error;
      return (data?.value ?? emptyValue) as T;
    },
  });

  useEffect(() => {
    if (fetchedValue !== undefined) {
      setValue(fetchedValue);
    }
  }, [fetchedValue]);

  const upsertMutation = useMutation({
    mutationFn: async (next: T) => {
      if (options?.skipPersist) return next;
      // Guard: verify session before writing. Without this, an expired JWT
      // causes the upsert to silently fail (RLS rejects it), leaving auth
      // users created but their app_state profile records never written.
      const session = await getSupabaseSession();
      if (!session) {
        throw new Error('SESSION_EXPIRED: Please log in again to save changes.');
      }
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

  return [value, persistAndSetValue, { loading: isLoading, error: (error as any)?.message ?? null }];
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Current User
    const [currentUser, setCurrentUser] = useState<User | StaffProfile | TenantProfile | null>(null);

    // Core Data (start empty; Supabase becomes source of truth)
    const [tenants, _rawSetTenants, tenantsStatus] = useSupabaseBackedState<TenantProfile[]>([], 'tm_tenants_v11');
    // Wrapped setter: persists to the app_state blob (via _rawSetTenants) AND
    // dual-writes to public.tenants (via app.upsert_tenants_bulk) so that
    // backend RPCs like check_phone_unique and record_c2b_payment's tenant
    // resolver have a normalized source of truth. See migration 0029.
    const setTenants: React.Dispatch<React.SetStateAction<TenantProfile[]>> = React.useCallback((updater) => {
      _rawSetTenants(prev => {
        const next = typeof updater === 'function' ? (updater as (p: TenantProfile[]) => TenantProfile[])(prev) : updater;
        if (Array.isArray(next)) {
          (async () => {
            try {
              const { error } = await supabase.schema('app').rpc('upsert_tenants_bulk', { p_tenants: next as unknown as object });
              if (error) console.warn('[tenants] upsert_tenants_bulk failed:', error.message);
            } catch (e) {
              console.warn('[tenants] upsert_tenants_bulk error:', (e as Error)?.message);
            }
          })();
        }
        return next;
      });
    }, [_rawSetTenants]);
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
    // skipPersist: listings are auto-derived from properties on every load.
    // Persisting them causes statement timeouts on large datasets.
    const [marketplaceListings, setMarketplaceListings, marketplaceStatus] = useSupabaseBackedState<MarketplaceListing[]>([], 'tm_listings_v11', { skipPersist: true });
    const [leads, setLeads, leadsStatus] = useSupabaseBackedState<Lead[]>([], 'tm_leads_v11');
    const [fundiJobs, setFundiJobs, fundiJobsStatus] = useSupabaseBackedState<FundiJob[]>([], 'tm_fundi_jobs_v11');
    const [marketingBanners, setMarketingBanners] = useSupabaseBackedState<MarketingBannerTemplate[]>([], 'tm_marketing_banners_v11');

    // ── DB Staff Profiles ────────────────────────────────────────────────────
    // Direct fetch from app.staff_profiles — ensures staff created via the
    // admin_create_auth_user RPC (or directly in DB) always appear in the UI,
    // even if tm_staff_v11 hasn't been synced yet.
    const [dbStaffProfiles, setDbStaffProfiles] = useState<StaffProfile[]>([]);

    const queryClient = useQueryClient();

    // ── Master batch loader ─────────────────────────────────────────────────
    // Single RPC replaces 38+ individual Supabase queries on startup.
    // Results are distributed to individual query caches via setQueryData,
    // which triggers re-renders in every useSupabaseBackedState hook.
    // On settle (success OR error), _setBatchSettled() enables individual
    // queries so they run as fallbacks only if the batch failed.
    const { data: allAppState, isLoading: batchLoading, isSuccess: batchSuccess, isError: batchError } =
      useQuery<Record<string, unknown>>({
        queryKey: ['all_app_state'],
        staleTime: 5 * 60 * 1000,
        retry: 2,
        queryFn: async () => {
          const session = await getSupabaseSession();
          if (!session) throw new Error('SESSION_EXPIRED');
          console.log('[Supabase] batch load all app_state');
          const { data, error } = await supabase
            .schema('app')
            .rpc('load_all_app_state');
          if (error) throw error;
          return (data as Record<string, unknown>) ?? {};
        },
      });

    // Distribute batch results + signal individual queries they can run as fallback
    useEffect(() => {
      if (batchSuccess && allAppState) {
        Object.entries(allAppState).forEach(([k, v]) => {
          if (v !== null && v !== undefined) {
            queryClient.setQueryData(['app_state', k], v);
          }
        });
      }
      // Signal after distributing — so individual queries see fresh cache and skip queryFn
      if (batchSuccess || batchError) {
        _setBatchSettled();
      }
    }, [batchSuccess, batchError, allAppState, queryClient]);

    // ── Fetch app.staff_profiles (normalised table) ──────────────────────────
    // Runs once on mount (session-guarded). Catches staff registered via the
    // admin_create_auth_user RPC who may not yet be in tm_staff_v11.
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const session = await getSupabaseSession();
                if (!session) return;
                const { data, error } = await supabase
                    .schema('app')
                    .from('staff_profiles')
                    .select('id,name,role,email,phone,branch,status');
                if (error) throw error;
                if (!alive) return;
                const mapped: StaffProfile[] = (data ?? []).map((row: any) => ({
                    id: row.id,
                    name: row.name || '',
                    role: row.role || 'Staff',
                    email: row.email || '',
                    phone: row.phone || '',
                    branch: row.branch || 'Headquarters',
                    status: row.status || 'Active',
                    payrollInfo: { baseSalary: 0, nextPaymentDate: '' },
                    leaveBalance: { annual: 0 },
                } as StaffProfile));
                setDbStaffProfiles(mapped);
            } catch (e) {
                console.warn('[DataContext] Failed to load app.staff_profiles:', e);
            }
        })();
        return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Fetch public.tenants (normalised table) ──────────────────────────────
    // Merges rows from the normalized public.tenants table into the app_state
    // tenants array on first load. public.tenants wins on conflict so that
    // authoritative server-side fields (phone_canonical, status, activation_date)
    // override any stale blob values. Uses _rawSetTenants to avoid triggering
    // the dual-write during a server→client hydration pass.
    const tenantsHydratedRef = React.useRef(false);
    useEffect(() => {
      if (!batchSuccess || tenantsHydratedRef.current) return;
      tenantsHydratedRef.current = true;
      let alive = true;
      (async () => {
        try {
          const session = await getSupabaseSession();
          if (!session) return;
          const { data, error } = await supabase.schema('app').rpc('load_tenants');
          if (error) { console.warn('[tenants] load_tenants failed:', error.message); return; }
          if (!alive) return;
          const rows = Array.isArray(data) ? (data as TenantProfile[]) : [];
          if (rows.length === 0) return;
          _rawSetTenants(prev => {
            const byId = new Map<string, TenantProfile>(prev.map(t => [t.id, t]));
            for (const t of rows) {
              const existing = byId.get(t.id);
              byId.set(t.id, existing ? { ...existing, ...t } : t);
            }
            return Array.from(byId.values());
          });
        } catch (e) {
          console.warn('[tenants] hydrate error:', (e as Error)?.message);
        }
      })();
      return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [batchSuccess]);

    // ── Merged staff: app_state + normalised table, deduped by email ─────────
    // Used as the single source of truth for all staff-related UI.
    // Prefers records with real auth UUIDs over generated IDs.
    const isAuthUUID = (id: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const mergedStaff = React.useMemo(() => {
        const byEmail = new Map<string, StaffProfile>();
        for (const s of [...staff, ...dbStaffProfiles]) {
            const key = (s.email || '').toLowerCase().trim();
            if (!key) { byEmail.set(s.id, s); continue; }
            const existing = byEmail.get(key);
            if (!existing) {
                byEmail.set(key, s);
            } else if (isAuthUUID(s.id) && !isAuthUUID(existing.id)) {
                // Prefer the auth-UUID record but keep richer app_state fields
                byEmail.set(key, { ...s, ...existing, id: s.id });
            }
        }
        return Array.from(byEmail.values());
    }, [staff, dbStaffProfiles]);

    // Gate on batch OR core individual queries (individual queries run as fallback
    // when batch RPC is unavailable — they each report their own loading state)
    const isDataLoading = batchLoading || tenantsStatus.loading || propertiesStatus.loading || staffStatus.loading || rolesStatus.loading;

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
        const { data: authSub } = supabase.auth.onAuthStateChange((event, _session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                // Bust session cache so next getSupabaseSession() returns the new token.
                bustSessionCache();
                // Re-fetch all cached data after login or token refresh so stale
                // empty-state from an expired session is replaced with real data.
                console.log('[Supabase] auth event:', event, '— invalidating all queries');
                queryClient.invalidateQueries();
            } else if (event === 'SIGNED_OUT') {
                // Bust session cache and clear all queries on logout.
                bustSessionCache();
                // Reset batch-settled so next login goes through the batch-first path again.
                _globalBatchSettled = false;
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
        setTenants(prev => prev.filter(t => t.id !== id));
        (async () => {
            // Remove from the normalized table so RPCs/dup-checks stop seeing it.
            const { error: delErr } = await supabase.schema('app').rpc('delete_tenant', { p_id: id });
            if (delErr) console.warn('[Supabase] delete_tenant RPC error:', delErr.message);
            if (isAuthUUID(id)) {
                const { error } = await supabase.schema('app').rpc('admin_delete_auth_user', { p_user_id: id });
                if (error) console.warn('[Supabase] admin_delete_auth_user (tenant) error:', error.message);
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
        setLandlords(prev => prev.filter(u => u.id !== id));
        (async () => {
            if (isAuthUUID(id)) {
                const { error } = await supabase.schema('app').rpc('admin_delete_auth_user', { p_user_id: id });
                if (error) console.warn('[Supabase] admin_delete_auth_user (landlord) error:', error.message);
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
    const addStaff = (s: StaffProfile) => {
        setStaff(prev => [s, ...prev]);
        // Mirror into dbStaffProfiles so mergedStaff reflects the new entry immediately,
        // without waiting for the next mount-time fetch from app.staff_profiles.
        setDbStaffProfiles(prev => {
            const key = (s.email || '').toLowerCase().trim();
            if (key && prev.some(p => (p.email || '').toLowerCase().trim() === key)) return prev;
            return [s, ...prev];
        });
    };
    const updateStaff = (id: string, d: Partial<StaffProfile>) => setStaff(prev => prev.map(s => s.id === id ? {...s, ...d} : s));
    const deleteStaff = (id: string) => {
        setStaff(prev => prev.filter(s => s.id !== id));
        // Also remove from the normalised-table mirror so mergedStaff updates immediately
        setDbStaffProfiles(prev => prev.filter(s => s.id !== id));
        (async () => {
            if (isAuthUUID(id)) {
                // Deletes auth.users row → cascades to staff_profiles, user_roles, profiles
                const { error } = await supabase.schema('app').rpc('admin_delete_auth_user', { p_user_id: id });
                if (error) console.warn('[Supabase] admin_delete_auth_user (staff) error:', error.message);
            } else {
                // Legacy generated-ID staff: remove from normalised table only
                const { error } = await supabase.schema('app').from('staff_profiles').delete().eq('id', id);
                if (error) console.warn('[Supabase] staff_profiles delete error:', error.message);
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
    const deleteVendor = (id: string) => {
        setVendors(prev => prev.filter(v => v.id !== id));
        (async () => {
            if (isAuthUUID(id)) {
                const { error } = await supabase.schema('app').rpc('admin_delete_auth_user', { p_user_id: id });
                if (error) console.warn('[Supabase] admin_delete_auth_user (vendor) error:', error.message);
            }
        })();
    };
    const addAuditLog = (log: AuditLogEntry) => setAuditLogs(prev => [log, ...prev]);
    const updateExternalTransaction = (id: string, d: Partial<ExternalTransaction>) => setExternalTransactions(prev => prev.map(t => t.id === id ? {...t, ...d} : t));
    const addOverpayment = (o: Overpayment) => setOverpayments(prev => [o, ...prev]);
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
    const deleteRenovationInvestor = (id: string) => {
        setRenovationInvestors(prev => prev.filter(i => i.id !== id));
        (async () => {
            if (isAuthUUID(id)) {
                const { error } = await supabase.schema('app').rpc('admin_delete_auth_user', { p_user_id: id });
                if (error) console.warn('[Supabase] admin_delete_auth_user (investor) error:', error.message);
            }
        })();
    };
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
        const mappedStaff = mergedStaff.map(s => ({ ...s, role: s.role } as unknown as User));
        // Landlords are already User[]
        return [...landlords, ...mappedTenants, ...mappedStaff];
    }, [tenants, landlords, mergedStaff]);

    const updateUser = (id: string, data: Partial<User>) => {
        // Determine which list the user belongs to
        const isTenant = tenants.some(t => t.id === id);
        const isStaff = mergedStaff.some(s => s.id === id);
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
            staff: mergedStaff, fines, offboardingRecords, geospatialData, commissionRules, deductionRules,
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
            addMessage, addNotification, addVendor, updateVendor, deleteVendor, addAuditLog, updateExternalTransaction, addOverpayment, updateOverpayment, moveTenantPayment,
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
