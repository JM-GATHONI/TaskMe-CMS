import { supabase } from '../lib/supabase';
import type {
  TenantProfile, Property, User, Unit, Task, TenantApplication, StaffProfile,
  FineRule, OffboardingRecord, LandlordApplication, DeductionRule, Bill,
  Invoice, Vendor, Message, CommunicationTemplate, Workflow,
  CommunicationAutomationRule, AuditLogEntry, EscalationRule, ExternalTransaction,
  Overpayment, PreventiveTask, IncomeSource, Fund, Investment, WithdrawalRequest,
  RenovationInvestor, RFTransaction, RenovationProjectBill, Notification, Quotation,
  Role, ScheduledReport, TaxRecord, MarketplaceListing, Lead, FundiJob
} from '../types';

// ============================================
// AUTHENTICATION SERVICE
// ============================================

export const authService = {
  async signUp(email: string, password: string, metadata: { name: string; phone: string; id_number: string; role: string }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    return { data, error };
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  },

  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    return { data, error };
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// ============================================
// PROFILES SERVICE
// ============================================

export const profilesService = {
  async getAll() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return data as User[];
  },

  async getById(id: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) throw error;
    return data as User;
  },

  async create(profile: Partial<User>) {
    const { data, error } = await supabase.from('profiles').insert(profile).select().single();
    if (error) throw error;
    return data as User;
  },

  async update(id: string, updates: Partial<User>) {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as User;
  },

  async delete(id: string) {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
  },

  subscribe(callback: (payload: any) => void) {
    return supabase.channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, callback)
      .subscribe();
  }
};

// ============================================
// PROPERTIES SERVICE
// ============================================

export const propertiesService = {
  async getAll() {
    const { data, error } = await supabase.from('properties').select('*, units(*)');
    if (error) throw error;
    return data as Property[];
  },

  async getById(id: string) {
    const { data, error } = await supabase.from('properties').select('*, units(*)').eq('id', id).single();
    if (error) throw error;
    return data as Property;
  },

  async create(property: Partial<Property>) {
    const { data, error } = await supabase.from('properties').insert(property).select().single();
    if (error) throw error;
    return data as Property;
  },

  async update(id: string, updates: Partial<Property>) {
    const { data, error } = await supabase.from('properties').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Property;
  },

  async delete(id: string) {
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) throw error;
  },

  async addUnit(propertyId: string, unit: Partial<Unit>) {
    const { data, error } = await supabase.from('units').insert({ ...unit, property_id: propertyId }).select().single();
    if (error) throw error;
    return data as Unit;
  },

  async updateUnit(unitId: string, updates: Partial<Unit>) {
    const { data, error } = await supabase.from('units').update(updates).eq('id', unitId).select().single();
    if (error) throw error;
    return data as Unit;
  },

  subscribe(callback: (payload: any) => void) {
    return supabase.channel('properties-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, callback)
      .subscribe();
  }
};

// ============================================
// TENANTS SERVICE
// ============================================

export const tenantsService = {
  async getAll() {
    const { data, error } = await supabase.from('tenants').select('*');
    if (error) throw error;
    return data as TenantProfile[];
  },

  async getById(id: string) {
    const { data, error } = await supabase.from('tenants').select('*').eq('id', id).single();
    if (error) throw error;
    return data as TenantProfile;
  },

  async create(tenant: Partial<TenantProfile>) {
    const { data, error } = await supabase.from('tenants').insert(tenant).select().single();
    if (error) throw error;
    return data as TenantProfile;
  },

  async update(id: string, updates: Partial<TenantProfile>) {
    const { data, error } = await supabase.from('tenants').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as TenantProfile;
  },

  async delete(id: string) {
    const { error } = await supabase.from('tenants').delete().eq('id', id);
    if (error) throw error;
  },

  subscribe(callback: (payload: any) => void) {
    return supabase.channel('tenants-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tenants' }, callback)
      .subscribe();
  }
};

// ============================================
// STAFF SERVICE
// ============================================

export const staffService = {
  async getAll() {
    const { data, error } = await supabase.from('staff_profiles').select('*');
    if (error) throw error;
    return data as StaffProfile[];
  },

  async create(staff: Partial<StaffProfile>) {
    const { data, error } = await supabase.from('staff_profiles').insert(staff).select().single();
    if (error) throw error;
    return data as StaffProfile;
  },

  async update(id: string, updates: Partial<StaffProfile>) {
    const { data, error } = await supabase.from('staff_profiles').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as StaffProfile;
  },

  async delete(id: string) {
    const { error } = await supabase.from('staff_profiles').delete().eq('id', id);
    if (error) throw error;
  },

  subscribe(callback: (payload: any) => void) {
    return supabase.channel('staff-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_profiles' }, callback)
      .subscribe();
  }
};

// ============================================
// LANDLORDS SERVICE
// ============================================

export const landlordsService = {
  async getAll() {
    const { data, error } = await supabase.from('landlords').select('*');
    if (error) throw error;
    return data as User[];
  },

  async create(landlord: Partial<User>) {
    const { data, error } = await supabase.from('landlords').insert(landlord).select().single();
    if (error) throw error;
    return data as User;
  },

  async update(id: string, updates: Partial<User>) {
    const { data, error } = await supabase.from('landlords').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as User;
  },

  async delete(id: string) {
    const { error } = await supabase.from('landlords').delete().eq('id', id);
    if (error) throw error;
  }
};

// ============================================
// TASKS SERVICE
// ============================================

export const tasksService = {
  async getAll() {
    const { data, error } = await supabase.from('tasks').select('*');
    if (error) throw error;
    return data as Task[];
  },

  async create(task: Partial<Task>) {
    const { data, error } = await supabase.from('tasks').insert(task).select().single();
    if (error) throw error;
    return data as Task;
  },

  async update(id: string, updates: Partial<Task>) {
    const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Task;
  },

  subscribe(callback: (payload: any) => void) {
    return supabase.channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, callback)
      .subscribe();
  }
};

// ============================================
// APPLICATIONS SERVICE
// ============================================

export const applicationsService = {
  async getAll() {
    const { data, error } = await supabase.from('tenant_applications').select('*');
    if (error) throw error;
    return data as TenantApplication[];
  },

  async create(application: Partial<TenantApplication>) {
    const { data, error } = await supabase.from('tenant_applications').insert(application).select().single();
    if (error) throw error;
    return data as TenantApplication;
  },

  async update(id: string, updates: Partial<TenantApplication>) {
    const { data, error } = await supabase.from('tenant_applications').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as TenantApplication;
  },

  async delete(id: string) {
    const { error } = await supabase.from('tenant_applications').delete().eq('id', id);
    if (error) throw error;
  }
};

// ============================================
// LANDLORD APPLICATIONS SERVICE
// ============================================

export const landlordApplicationsService = {
  async getAll() {
    const { data, error } = await supabase.from('landlord_applications').select('*');
    if (error) throw error;
    return data as LandlordApplication[];
  },

  async create(application: Partial<LandlordApplication>) {
    const { data, error } = await supabase.from('landlord_applications').insert(application).select().single();
    if (error) throw error;
    return data as LandlordApplication;
  },

  async update(id: string, updates: Partial<LandlordApplication>) {
    const { data, error } = await supabase.from('landlord_applications').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as LandlordApplication;
  },

  async delete(id: string) {
    const { error } = await supabase.from('landlord_applications').delete().eq('id', id);
    if (error) throw error;
  }
};

// ============================================
// BILLS SERVICE
// ============================================

export const billsService = {
  async getAll() {
    const { data, error } = await supabase.from('bills').select('*');
    if (error) throw error;
    return data as Bill[];
  },

  async create(bill: Partial<Bill>) {
    const { data, error } = await supabase.from('bills').insert(bill).select().single();
    if (error) throw error;
    return data as Bill;
  },

  async update(id: string, updates: Partial<Bill>) {
    const { data, error } = await supabase.from('bills').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Bill;
  },

  async delete(id: string) {
    const { error } = await supabase.from('bills').delete().eq('id', id);
    if (error) throw error;
  }
};

// ============================================
// INVOICES SERVICE
// ============================================

export const invoicesService = {
  async getAll() {
    const { data, error } = await supabase.from('invoices').select('*');
    if (error) throw error;
    return data as Invoice[];
  },

  async create(invoice: Partial<Invoice>) {
    const { data, error } = await supabase.from('invoices').insert(invoice).select().single();
    if (error) throw error;
    return data as Invoice;
  },

  async update(id: string, updates: Partial<Invoice>) {
    const { data, error } = await supabase.from('invoices').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Invoice;
  }
};

// ============================================
// VENDORS SERVICE
// ============================================

export const vendorsService = {
  async getAll() {
    const { data, error } = await supabase.from('vendors').select('*');
    if (error) throw error;
    return data as Vendor[];
  },

  async create(vendor: Partial<Vendor>) {
    const { data, error } = await supabase.from('vendors').insert(vendor).select().single();
    if (error) throw error;
    return data as Vendor;
  },

  async update(id: string, updates: Partial<Vendor>) {
    const { data, error } = await supabase.from('vendors').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Vendor;
  },

  async delete(id: string) {
    const { error } = await supabase.from('vendors').delete().eq('id', id);
    if (error) throw error;
  }
};

// ============================================
// MESSAGES SERVICE
// ============================================

export const messagesService = {
  async getAll() {
    const { data, error } = await supabase.from('messages').select('*');
    if (error) throw error;
    return data as Message[];
  },

  async create(message: Partial<Message>) {
    const { data, error } = await supabase.from('messages').insert(message).select().single();
    if (error) throw error;
    return data as Message;
  },

  subscribe(callback: (payload: any) => void) {
    return supabase.channel('messages-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, callback)
      .subscribe();
  }
};

// ============================================
// NOTIFICATIONS SERVICE
// ============================================

export const notificationsService = {
  async getAll() {
    const { data, error } = await supabase.from('notifications').select('*');
    if (error) throw error;
    return data as Notification[];
  },

  async create(notification: Partial<Notification>) {
    const { data, error } = await supabase.from('notifications').insert(notification).select().single();
    if (error) throw error;
    return data as Notification;
  },

  async markAsRead(id: string) {
    const { data, error } = await supabase.from('notifications').update({ read: true }).eq('id', id).select().single();
    if (error) throw error;
    return data as Notification;
  },

  subscribe(callback: (payload: any) => void) {
    return supabase.channel('notifications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, callback)
      .subscribe();
  }
};

// ============================================
// TEMPLATES SERVICE
// ============================================

export const templatesService = {
  async getAll() {
    const { data, error } = await supabase.from('communication_templates').select('*');
    if (error) throw error;
    return data as CommunicationTemplate[];
  },

  async create(template: Partial<CommunicationTemplate>) {
    const { data, error } = await supabase.from('communication_templates').insert(template).select().single();
    if (error) throw error;
    return data as CommunicationTemplate;
  },

  async update(id: string, updates: Partial<CommunicationTemplate>) {
    const { data, error } = await supabase.from('communication_templates').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as CommunicationTemplate;
  },

  async delete(id: string) {
    const { error } = await supabase.from('communication_templates').delete().eq('id', id);
    if (error) throw error;
  }
};

// ============================================
// WORKFLOWS SERVICE
// ============================================

export const workflowsService = {
  async getAll() {
    const { data, error } = await supabase.from('workflows').select('*');
    if (error) throw error;
    return data as Workflow[];
  },

  async create(workflow: Partial<Workflow>) {
    const { data, error } = await supabase.from('workflows').insert(workflow).select().single();
    if (error) throw error;
    return data as Workflow;
  },

  async update(id: string, updates: Partial<Workflow>) {
    const { data, error } = await supabase.from('workflows').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Workflow;
  }
};

// ============================================
// AUTOMATION RULES SERVICE
// ============================================

export const automationRulesService = {
  async getAll() {
    const { data, error } = await supabase.from('automation_rules').select('*');
    if (error) throw error;
    return data as CommunicationAutomationRule[];
  },

  async create(rule: Partial<CommunicationAutomationRule>) {
    const { data, error } = await supabase.from('automation_rules').insert(rule).select().single();
    if (error) throw error;
    return data as CommunicationAutomationRule;
  },

  async update(id: string, updates: Partial<CommunicationAutomationRule>) {
    const { data, error } = await supabase.from('automation_rules').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as CommunicationAutomationRule;
  }
};

// ============================================
// ESCALATION RULES SERVICE
// ============================================

export const escalationRulesService = {
  async getAll() {
    const { data, error } = await supabase.from('escalation_rules').select('*');
    if (error) throw error;
    return data as EscalationRule[];
  },

  async create(rule: Partial<EscalationRule>) {
    const { data, error } = await supabase.from('escalation_rules').insert(rule).select().single();
    if (error) throw error;
    return data as EscalationRule;
  },

  async update(id: string, updates: Partial<EscalationRule>) {
    const { data, error } = await supabase.from('escalation_rules').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as EscalationRule;
  }
};

// ============================================
// AUDIT LOGS SERVICE
// ============================================

export const auditLogsService = {
  async getAll() {
    const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
    if (error) throw error;
    return data as AuditLogEntry[];
  },

  async create(log: Partial<AuditLogEntry>) {
    const { data, error } = await supabase.from('audit_logs').insert(log).select().single();
    if (error) throw error;
    return data as AuditLogEntry;
  }
};

// ============================================
// EXTERNAL TRANSACTIONS SERVICE
// ============================================

export const externalTransactionsService = {
  async getAll() {
    const { data, error } = await supabase.from('external_transactions').select('*');
    if (error) throw error;
    return data as ExternalTransaction[];
  },

  async update(id: string, updates: Partial<ExternalTransaction>) {
    const { data, error } = await supabase.from('external_transactions').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as ExternalTransaction;
  }
};

// ============================================
// OVERPAYMENTS SERVICE
// ============================================

export const overpaymentsService = {
  async getAll() {
    const { data, error } = await supabase.from('overpayments').select('*');
    if (error) throw error;
    return data as Overpayment[];
  },

  async update(id: string, updates: Partial<Overpayment>) {
    const { data, error } = await supabase.from('overpayments').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Overpayment;
  }
};

// ============================================
// PREVENTIVE TASKS SERVICE
// ============================================

export const preventiveTasksService = {
  async getAll() {
    const { data, error } = await supabase.from('preventive_tasks').select('*');
    if (error) throw error;
    return data as PreventiveTask[];
  },

  async create(task: Partial<PreventiveTask>) {
    const { data, error } = await supabase.from('preventive_tasks').insert(task).select().single();
    if (error) throw error;
    return data as PreventiveTask;
  }
};

// ============================================
// INCOME SOURCES SERVICE
// ============================================

export const incomeSourcesService = {
  async getAll() {
    const { data, error } = await supabase.from('income_sources').select('*');
    if (error) throw error;
    return data as IncomeSource[];
  },

  async create(source: Partial<IncomeSource>) {
    const { data, error } = await supabase.from('income_sources').insert(source).select().single();
    if (error) throw error;
    return data as IncomeSource;
  },

  async update(id: string, updates: Partial<IncomeSource>) {
    const { data, error } = await supabase.from('income_sources').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as IncomeSource;
  }
};

// ============================================
// FUNDS SERVICE (R-REITS)
// ============================================

export const fundsService = {
  async getAll() {
    const { data, error } = await supabase.from('funds').select('*');
    if (error) throw error;
    return data as Fund[];
  },

  async getById(id: string) {
    const { data, error } = await supabase.from('funds').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Fund;
  },

  async create(fund: Partial<Fund>) {
    const { data, error } = await supabase.from('funds').insert(fund).select().single();
    if (error) throw error;
    return data as Fund;
  },

  async update(id: string, updates: Partial<Fund>) {
    const { data, error } = await supabase.from('funds').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Fund;
  },

  async delete(id: string) {
    const { error } = await supabase.from('funds').delete().eq('id', id);
    if (error) throw error;
  },

  subscribe(callback: (payload: any) => void) {
    return supabase.channel('funds-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'funds' }, callback)
      .subscribe();
  }
};

// ============================================
// INVESTMENTS SERVICE
// ============================================

export const investmentsService = {
  async getAll() {
    const { data, error } = await supabase.from('investments').select('*');
    if (error) throw error;
    return data as Investment[];
  },

  async create(investment: Partial<Investment>) {
    const { data, error } = await supabase.from('investments').insert(investment).select().single();
    if (error) throw error;
    return data as Investment;
  },

  async update(id: string, updates: Partial<Investment>) {
    const { data, error } = await supabase.from('investments').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Investment;
  },

  subscribe(callback: (payload: any) => void) {
    return supabase.channel('investments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investments' }, callback)
      .subscribe();
  }
};

// ============================================
// WITHDRAWALS SERVICE
// ============================================

export const withdrawalsService = {
  async getAll() {
    const { data, error } = await supabase.from('withdrawal_requests').select('*');
    if (error) throw error;
    return data as WithdrawalRequest[];
  },

  async create(withdrawal: Partial<WithdrawalRequest>) {
    const { data, error } = await supabase.from('withdrawal_requests').insert(withdrawal).select().single();
    if (error) throw error;
    return data as WithdrawalRequest;
  },

  async update(id: string, updates: Partial<WithdrawalRequest>) {
    const { data, error } = await supabase.from('withdrawal_requests').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as WithdrawalRequest;
  }
};

// ============================================
// RENOVATION INVESTORS SERVICE
// ============================================

export const renovationInvestorsService = {
  async getAll() {
    const { data, error } = await supabase.from('renovation_investors').select('*');
    if (error) throw error;
    return data as RenovationInvestor[];
  },

  async create(investor: Partial<RenovationInvestor>) {
    const { data, error } = await supabase.from('renovation_investors').insert(investor).select().single();
    if (error) throw error;
    return data as RenovationInvestor;
  },

  async update(id: string, updates: Partial<RenovationInvestor>) {
    const { data, error } = await supabase.from('renovation_investors').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as RenovationInvestor;
  },

  async delete(id: string) {
    const { error } = await supabase.from('renovation_investors').delete().eq('id', id);
    if (error) throw error;
  }
};

// ============================================
// RF TRANSACTIONS SERVICE
// ============================================

export const rfTransactionsService = {
  async getAll() {
    const { data, error } = await supabase.from('rf_transactions').select('*');
    if (error) throw error;
    return data as RFTransaction[];
  },

  async create(transaction: Partial<RFTransaction>) {
    const { data, error } = await supabase.from('rf_transactions').insert(transaction).select().single();
    if (error) throw error;
    return data as RFTransaction;
  },

  async update(id: string, updates: Partial<RFTransaction>) {
    const { data, error } = await supabase.from('rf_transactions').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as RFTransaction;
  }
};

// ============================================
// MARKETPLACE LISTINGS SERVICE
// ============================================

export const marketplaceListingsService = {
  async getAll() {
    const { data, error } = await supabase.from('marketplace_listings').select('*');
    if (error) throw error;
    return data as MarketplaceListing[];
  },

  async create(listing: Partial<MarketplaceListing>) {
    const { data, error } = await supabase.from('marketplace_listings').insert(listing).select().single();
    if (error) throw error;
    return data as MarketplaceListing;
  },

  async update(id: string, updates: Partial<MarketplaceListing>) {
    const { data, error } = await supabase.from('marketplace_listings').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as MarketplaceListing;
  },

  async delete(id: string) {
    const { error } = await supabase.from('marketplace_listings').delete().eq('id', id);
    if (error) throw error;
  },

  subscribe(callback: (payload: any) => void) {
    return supabase.channel('listings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketplace_listings' }, callback)
      .subscribe();
  }
};

// ============================================
// LEADS SERVICE
// ============================================

export const leadsService = {
  async getAll() {
    const { data, error } = await supabase.from('leads').select('*');
    if (error) throw error;
    return data as Lead[];
  },

  async create(lead: Partial<Lead>) {
    const { data, error } = await supabase.from('leads').insert(lead).select().single();
    if (error) throw error;
    return data as Lead;
  },

  async update(id: string, updates: Partial<Lead>) {
    const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Lead;
  },

  async delete(id: string) {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
  }
};

// ============================================
// FUNDI JOBS SERVICE
// ============================================

export const fundiJobsService = {
  async getAll() {
    const { data, error } = await supabase.from('fundi_jobs').select('*');
    if (error) throw error;
    return data as FundiJob[];
  },

  async create(job: Partial<FundiJob>) {
    const { data, error } = await supabase.from('fundi_jobs').insert(job).select().single();
    if (error) throw error;
    return data as FundiJob;
  },

  async update(id: string, updates: Partial<FundiJob>) {
    const { data, error } = await supabase.from('fundi_jobs').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as FundiJob;
  }
};

// ============================================
// ROLES SERVICE
// ============================================

export const rolesService = {
  async getAll() {
    const { data, error } = await supabase.from('roles').select('*');
    if (error) throw error;
    return data as Role[];
  },

  async create(role: Partial<Role>) {
    const { data, error } = await supabase.from('roles').insert(role).select().single();
    if (error) throw error;
    return data as Role;
  },

  async update(id: string, updates: Partial<Role>) {
    const { data, error } = await supabase.from('roles').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Role;
  },

  async delete(id: string) {
    const { error } = await supabase.from('roles').delete().eq('id', id);
    if (error) throw error;
  }
};

// ============================================
// FINE RULES SERVICE
// ============================================

export const fineRulesService = {
  async getAll() {
    const { data, error } = await supabase.from('fine_rules').select('*');
    if (error) throw error;
    return data as FineRule[];
  },

  async create(rule: Partial<FineRule>) {
    const { data, error } = await supabase.from('fine_rules').insert(rule).select().single();
    if (error) throw error;
    return data as FineRule;
  },

  async update(id: string, updates: Partial<FineRule>) {
    const { data, error } = await supabase.from('fine_rules').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as FineRule;
  },

  async delete(id: string) {
    const { error } = await supabase.from('fine_rules').delete().eq('id', id);
    if (error) throw error;
  }
};

// ============================================
// COMMISSION RULES SERVICE
// ============================================

export const commissionRulesService = {
  async getAll() {
    const { data, error } = await supabase.from('commission_rules').select('*');
    if (error) throw error;
    return data as any[];
  },

  async create(rule: Partial<any>) {
    const { data, error } = await supabase.from('commission_rules').insert(rule).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<any>) {
    const { data, error } = await supabase.from('commission_rules').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from('commission_rules').delete().eq('id', id);
    if (error) throw error;
  }
};

// ============================================
// DEDUCTION RULES SERVICE
// ============================================

export const deductionRulesService = {
  async getAll() {
    const { data, error } = await supabase.from('deduction_rules').select('*');
    if (error) throw error;
    return data as DeductionRule[];
  },

  async create(rule: Partial<DeductionRule>) {
    const { data, error } = await supabase.from('deduction_rules').insert(rule).select().single();
    if (error) throw error;
    return data as DeductionRule;
  },

  async update(id: string, updates: Partial<DeductionRule>) {
    const { data, error } = await supabase.from('deduction_rules').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as DeductionRule;
  },

  async delete(id: string) {
    const { error } = await supabase.from('deduction_rules').delete().eq('id', id);
    if (error) throw error;
  }
};

// ============================================
// OFFBOARDING RECORDS SERVICE
// ============================================

export const offboardingRecordsService = {
  async getAll() {
    const { data, error } = await supabase.from('offboarding_records').select('*');
    if (error) throw error;
    return data as OffboardingRecord[];
  },

  async create(record: Partial<OffboardingRecord>) {
    const { data, error } = await supabase.from('offboarding_records').insert(record).select().single();
    if (error) throw error;
    return data as OffboardingRecord;
  },

  async update(id: string, updates: Partial<OffboardingRecord>) {
    const { data, error } = await supabase.from('offboarding_records').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as OffboardingRecord;
  }
};

// ============================================
// QUOTATIONS SERVICE
// ============================================

export const quotationsService = {
  async getAll() {
    const { data, error } = await supabase.from('quotations').select('*');
    if (error) throw error;
    return data as Quotation[];
  },

  async create(quotation: Partial<Quotation>) {
    const { data, error } = await supabase.from('quotations').insert(quotation).select().single();
    if (error) throw error;
    return data as Quotation;
  },

  async update(id: string, updates: Partial<Quotation>) {
    const { data, error } = await supabase.from('quotations').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Quotation;
  }
};

// ============================================
// TAX RECORDS SERVICE
// ============================================

export const taxRecordsService = {
  async getAll() {
    const { data, error } = await supabase.from('tax_records').select('*');
    if (error) throw error;
    return data as TaxRecord[];
  },

  async create(record: Partial<TaxRecord>) {
    const { data, error } = await supabase.from('tax_records').insert(record).select().single();
    if (error) throw error;
    return data as TaxRecord;
  },

  async update(id: string, updates: Partial<TaxRecord>) {
    const { data, error } = await supabase.from('tax_records').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as TaxRecord;
  }
};

// ============================================
// SCHEDULED REPORTS SERVICE
// ============================================

export const scheduledReportsService = {
  async getAll() {
    const { data, error } = await supabase.from('scheduled_reports').select('*');
    if (error) throw error;
    return data as ScheduledReport[];
  },

  async create(report: Partial<ScheduledReport>) {
    const { data, error } = await supabase.from('scheduled_reports').insert(report).select().single();
    if (error) throw error;
    return data as ScheduledReport;
  },

  async delete(id: string) {
    const { error } = await supabase.from('scheduled_reports').delete().eq('id', id);
    if (error) throw error;
  }
};

// ============================================
// STORAGE SERVICE
// ============================================

export const storageService = {
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    return data;
  },

  async getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
  },

  async listFiles(bucket: string, path?: string) {
    const { data, error } = await supabase.storage.from(bucket).list(path || '');
    if (error) throw error;
    return data;
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const db = {
  async healthCheck() {
    const { data, error } = await supabase.from('system_settings').select('count').limit(1);
    return !error;
  },

  async getSystemSettings() {
    const { data, error } = await supabase.from('system_settings').select('*').limit(1).single();
    if (error) throw error;
    return data;
  },

  async updateSystemSettings(updates: Partial<any>) {
    const { data, error } = await supabase.from('system_settings').update(updates).eq('id', 1).select().single();
    if (error) throw error;
    return data;
  }
};