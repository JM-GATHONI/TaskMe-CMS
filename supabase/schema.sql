-- TaskMe Realty - PostgreSQL Database Schema for Supabase
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM (
  'Super Admin', 'Branch Manager', 'Field Agent', 'Accountant', 
  'Caretaker', 'Landlord', 'Tenant', 'Contractor', 'Affiliate', 'Investor'
);

CREATE TYPE user_status AS ENUM ('Active', 'Inactive', 'Suspended');

CREATE TYPE unit_status AS ENUM (
  'Vacant', 'Occupied', 'Under Maintenance', 'Reserved', 'Distressed', 'Unhabitable'
);

CREATE TYPE tenant_status AS ENUM (
  'Active', 'Overdue', 'Notice', 'Vacated', 'Evicted', 'Blacklisted', 'Pending'
);

CREATE TYPE property_status AS ENUM ('Active', 'Suspended', 'Decommissioned');

CREATE TYPE task_status AS ENUM (
  'Issued', 'In Progress', 'Pending', 'Completed', 'Closed', 'Escalated', 'Received'
);

CREATE TYPE task_priority AS ENUM ('Low', 'Medium', 'High', 'Very High');

CREATE TYPE lease_status AS ENUM ('Active', 'Expiring Soon', 'Renewed', 'Terminated', 'Evicted');

CREATE TYPE lease_type AS ENUM ('Fixed', 'Open');

CREATE TYPE fund_status AS ENUM ('Active', 'Closing Soon', 'Project Completed', 'Fully Funded');

CREATE TYPE risk_profile AS ENUM ('Low', 'Medium', 'High');

CREATE TYPE payment_status AS ENUM ('Paid', 'Unpaid', 'Overdue', 'Initiated', 'Under Review');

CREATE TYPE invoice_status AS ENUM ('Due', 'Paid', 'Overdue');

CREATE TYPE transaction_type AS ENUM ('M-Pesa', 'Bank');

CREATE TYPE investment_strategy AS ENUM ('Monthly Payout', 'Compound');

CREATE TYPE withdrawal_status AS ENUM ('Pending Approval', 'Paid', 'Rejected');

CREATE TYPE listing_type AS ENUM ('Rent', 'Sale', 'AirBnB');

CREATE TYPE listing_status AS ENUM ('Published', 'Draft', 'Sold', 'Rented');

CREATE TYPE lead_status AS ENUM ('New', 'Contacted', 'Viewing', 'Negotiation', 'Closed', 'Lost');

CREATE TYPE lead_source AS ENUM ('Website', 'Walk-in', 'Referral', 'Social Media');

-- ============================================
-- CORE TABLES
-- ============================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT UNIQUE,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  id_number TEXT NOT NULL,
  kra_pin TEXT,
  role user_role NOT NULL DEFAULT 'Tenant',
  status user_status NOT NULL DEFAULT 'Active',
  branch TEXT DEFAULT 'Headquarters',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Branches
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  location TEXT,
  manager_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- Residential, Commercial, Mixed-Use
  ownership TEXT NOT NULL, -- In-house, Affiliate
  branch TEXT NOT NULL,
  status property_status NOT NULL DEFAULT 'Active',
  landlord_id UUID REFERENCES profiles(id),
  assigned_agent_id UUID REFERENCES profiles(id),
  location TEXT,
  default_monthly_rent NUMERIC,
  floors INTEGER DEFAULT 1,
  default_unit_type TEXT,
  rent_is_uniform BOOLEAN DEFAULT true,
  rent_type TEXT DEFAULT 'Inclusive', -- Inclusive, Exclusive
  deposit_required BOOLEAN DEFAULT true,
  deposit_months INTEGER DEFAULT 1,
  placement_fee BOOLEAN DEFAULT false,
  remittance_type TEXT DEFAULT 'Collection Based',
  remittance_cutoff_day INTEGER DEFAULT 5,
  nearest_landmark TEXT,
  county TEXT,
  sub_county TEXT,
  zone TEXT,
  sub_location TEXT,
  profile_picture_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Units
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  floor INTEGER DEFAULT 1,
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  status unit_status NOT NULL DEFAULT 'Vacant',
  rent NUMERIC,
  unit_type TEXT,
  amenities TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, unit_number)
);

-- Tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  id_number TEXT NOT NULL,
  kra_pin TEXT,
  status tenant_status NOT NULL DEFAULT 'Pending',
  property_id UUID REFERENCES properties(id),
  unit_id UUID REFERENCES units(id),
  rent_amount NUMERIC NOT NULL,
  rent_due_day INTEGER DEFAULT 5,
  deposit_paid NUMERIC DEFAULT 0,
  onboarding_date DATE NOT NULL,
  lease_end DATE,
  lease_type lease_type DEFAULT 'Fixed',
  avatar TEXT,
  referrer_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff Profiles
CREATE TABLE staff_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  id_number TEXT NOT NULL,
  kra_pin TEXT,
  role user_role NOT NULL,
  status user_status NOT NULL DEFAULT 'Active',
  branch TEXT NOT NULL,
  avatar TEXT,
  department TEXT,
  salary_type TEXT DEFAULT 'Monthly', -- Monthly, Target Based, Commission, Per Project
  salary_amount NUMERIC DEFAULT 0,
  commission_rate NUMERIC DEFAULT 0,
  bank_name TEXT,
  bank_account_number TEXT,
  default_payment_method TEXT DEFAULT 'Bank',
  mpesa_number TEXT,
  base_salary NUMERIC DEFAULT 0,
  next_payment_date DATE,
  leave_balance_annual INTEGER DEFAULT 21,
  assigned_property_id UUID REFERENCES properties(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Landlords
CREATE TABLE landlords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  id_number TEXT NOT NULL,
  kra_pin TEXT,
  status user_status NOT NULL DEFAULT 'Active',
  branch TEXT,
  payment_method TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  mpesa_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- APPLICATIONS
-- ============================================

-- Tenant Applications
CREATE TABLE tenant_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  id_number TEXT,
  kra_pin TEXT,
  property_id UUID REFERENCES properties(id),
  property_name TEXT,
  unit_id UUID REFERENCES units(id),
  unit TEXT,
  status TEXT NOT NULL DEFAULT 'New', -- New, Under Review, Approved, Rejected
  submitted_date DATE NOT NULL,
  source TEXT,
  rent_start_date DATE,
  rent_amount NUMERIC,
  deposit_paid NUMERIC DEFAULT 0,
  avatar TEXT,
  referrer_id UUID REFERENCES profiles(id),
  recurring_bills JSONB,
  documents JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Landlord Applications
CREATE TABLE landlord_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  id_number TEXT,
  status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Approved, Rejected
  submitted_date DATE NOT NULL,
  proposed_properties TEXT[],
  property_ids UUID[],
  notes TEXT,
  location TEXT,
  payment_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LEASES
-- ============================================

CREATE TABLE leases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  unit_id UUID NOT NULL REFERENCES units(id),
  tenant_name TEXT NOT NULL,
  property_name TEXT NOT NULL,
  unit_number TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rent NUMERIC NOT NULL,
  status lease_status NOT NULL DEFAULT 'Active',
  deposit NUMERIC,
  terms TEXT,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TASKS & MAINTENANCE
-- ============================================

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'Issued',
  priority task_priority NOT NULL DEFAULT 'Medium',
  due_date DATE,
  sla INTEGER, -- hours
  assigned_to UUID REFERENCES profiles(id),
  tenant_id UUID REFERENCES tenants(id),
  tenant_name TEXT,
  unit TEXT,
  property_id UUID REFERENCES properties(id),
  property_name TEXT,
  source TEXT, -- Internal, External, Preventive
  costs JSONB, -- { labor, materials, travel }
  comments JSONB,
  history JSONB,
  attachments TEXT[],
  completion_attachments TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors/Contractors
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  username TEXT UNIQUE,
  specialty TEXT NOT NULL,
  rating NUMERIC DEFAULT 0,
  email TEXT,
  phone TEXT,
  location TEXT,
  daily_rate NUMERIC,
  verified BOOLEAN DEFAULT false,
  completed_jobs INTEGER DEFAULT 0,
  avatar_url TEXT,
  summary TEXT,
  certifications TEXT[],
  available BOOLEAN DEFAULT true,
  portfolio_images TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotations
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  vendor_id UUID REFERENCES vendors(id),
  contractor_name TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  items JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Approved, Rejected
  notes TEXT,
  submitted_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Preventive Maintenance Tasks
CREATE TABLE preventive_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  asset TEXT NOT NULL,
  property_id UUID REFERENCES properties(id),
  frequency TEXT NOT NULL, -- Weekly, Monthly, Quarterly, Yearly
  next_due_date DATE NOT NULL,
  last_completed_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FINANCIAL TABLES
-- ============================================

-- Bills
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status payment_status NOT NULL DEFAULT 'Unpaid',
  property_id UUID REFERENCES properties(id),
  description TEXT,
  metadata JSONB,
  invoice_number TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- Inbound, Outbound
  tenant_id UUID REFERENCES tenants(id),
  tenant_name TEXT NOT NULL,
  unit TEXT,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  status invoice_status NOT NULL DEFAULT 'Due',
  items JSONB,
  email TEXT,
  phone TEXT,
  billing_address TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- External Transactions (M-Pesa, Bank)
CREATE TABLE external_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TIMESTAMPTZ NOT NULL,
  reference TEXT NOT NULL,
  transaction_code TEXT,
  amount NUMERIC NOT NULL,
  name TEXT NOT NULL,
  account TEXT NOT NULL,
  type transaction_type NOT NULL,
  matched BOOLEAN DEFAULT false,
  matched_tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant Payments (Payment History)
CREATE TABLE tenant_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL, -- Paid, Pending, Failed
  method TEXT NOT NULL,
  reference TEXT NOT NULL,
  day INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant Bills
CREATE TABLE tenant_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Paid
  description TEXT,
  meter_readings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant Fines
CREATE TABLE tenant_fines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Paid
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Overpayments
CREATE TABLE overpayments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  tenant_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  reference TEXT NOT NULL,
  date_received DATE NOT NULL,
  applied_month TEXT,
  status TEXT NOT NULL DEFAULT 'Held', -- Held, Applied
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Landlord Payouts
CREATE TABLE landlord_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landlord_id UUID NOT NULL REFERENCES landlords(id),
  period TEXT NOT NULL,
  gross NUMERIC NOT NULL,
  deductions NUMERIC DEFAULT 0,
  net_payout NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending', -- Paid, Pending
  payout_date DATE,
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- R-REITS / INVESTMENT PLATFORM
-- ============================================

-- Funds
CREATE TABLE funds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  target_apy TEXT,
  capital_raised NUMERIC DEFAULT 0,
  target_capital NUMERIC NOT NULL,
  investors INTEGER DEFAULT 0,
  status fund_status NOT NULL DEFAULT 'Active',
  risk_profile risk_profile NOT NULL DEFAULT 'Medium',
  projected_completion TEXT,
  landlord_type TEXT, -- Internal, External
  landlord_id UUID REFERENCES landlords(id),
  landlord_name TEXT,
  landlord_contact TEXT,
  property_type TEXT,
  client_interest_rate NUMERIC DEFAULT 5.0,
  project_pic TEXT,
  renovation_start_date DATE,
  renovation_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bill of Quantities
CREATE TABLE boq_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  rate NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fund Progress Updates
CREATE TABLE fund_progress_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  caption TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Renovation Investors
CREATE TABLE renovation_investors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  id_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending', -- Active, Pending, Verified, Rejected
  join_date DATE NOT NULL,
  investor_type TEXT DEFAULT 'Individual', -- Individual, Chama, Sacco, Corporate
  group_members_count INTEGER,
  residency TEXT,
  kra_pin TEXT,
  next_of_kin JSONB,
  payment_details JSONB,
  authorized_rep JSONB,
  referrer_id UUID REFERENCES profiles(id),
  referrer_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investments
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fund_id UUID NOT NULL REFERENCES funds(id),
  investor_id UUID REFERENCES renovation_investors(id),
  fund_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  strategy investment_strategy NOT NULL DEFAULT 'Monthly Payout',
  status TEXT NOT NULL DEFAULT 'Active', -- Active, Closed
  accrued_interest NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Withdrawal Requests
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID NOT NULL REFERENCES renovation_investors(id),
  investor_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  request_date DATE NOT NULL,
  type TEXT NOT NULL, -- Interest, Capital, Partial Capital
  method TEXT NOT NULL, -- M-Pesa, Bank
  status withdrawal_status NOT NULL DEFAULT 'Pending Approval',
  destination_account TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RF Transactions
CREATE TABLE rf_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fund_id UUID REFERENCES funds(id),
  date DATE NOT NULL,
  type TEXT NOT NULL, -- Investment, Loan Payback, Management Fee, Withdrawal, Interest Payout, Expense, Invoice, Referral Commission
  category TEXT NOT NULL, -- Inbound, Outbound
  amount NUMERIC NOT NULL,
  party_name TEXT NOT NULL,
  reference TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Completed', -- Completed, Pending
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Renovation Project Bills
CREATE TABLE renovation_project_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES funds(id),
  vendor TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending', -- Paid, Pending
  category TEXT NOT NULL, -- Material, Labor, Permits, Other
  invoice_number TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MARKETPLACE
-- ============================================

-- Marketplace Listings
CREATE TABLE marketplace_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id),
  property_name TEXT NOT NULL,
  unit_id UUID REFERENCES units(id),
  unit_number TEXT NOT NULL,
  type listing_type NOT NULL DEFAULT 'Rent',
  status listing_status NOT NULL DEFAULT 'Published',
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'KES',
  description TEXT,
  title TEXT NOT NULL,
  location TEXT,
  images TEXT[],
  features TEXT[],
  airbnb_config JSONB,
  sale_config JSONB,
  owner_name TEXT,
  owner_contact TEXT,
  owner_email TEXT,
  owner_rating NUMERIC,
  owner_reviews INTEGER,
  date_created TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_name TEXT NOT NULL,
  status lead_status NOT NULL DEFAULT 'New',
  assigned_agent_id UUID REFERENCES profiles(id),
  assigned_agent TEXT,
  listing_title TEXT,
  listing_id UUID REFERENCES marketplace_listings(id),
  contact TEXT,
  email TEXT,
  interest TEXT,
  date DATE,
  source lead_source,
  notes TEXT,
  referrer_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fundi Jobs
CREATE TABLE fundi_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fundi_id UUID REFERENCES vendors(id),
  fundi_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Accepted, Completed, Declined
  date DATE NOT NULL,
  amount NUMERIC,
  source TEXT, -- Website, App
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMMUNICATION
-- ============================================

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_name TEXT NOT NULL,
  recipient_contact TEXT NOT NULL,
  content TEXT NOT NULL,
  channel TEXT NOT NULL, -- SMS, Email, WhatsApp, App
  status TEXT NOT NULL DEFAULT 'Sent', -- Sent, Delivered, Read, Failed
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  priority TEXT DEFAULT 'Normal', -- Normal, High
  is_incoming BOOLEAN DEFAULT false,
  sender_id UUID REFERENCES profiles(id)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT false,
  type TEXT NOT NULL, -- Success, Warning, Alert, Info
  recipient_role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communication Templates
CREATE TABLE communication_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- SMS, Email, WhatsApp, App
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Rules
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  trigger TEXT NOT NULL,
  template_name TEXT NOT NULL,
  channels TEXT[] NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HR & PAYROLL
-- ============================================

-- Staff Deductions
CREATE TABLE staff_deductions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff_profiles(id),
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL, -- Recurring, One-Off
  category TEXT NOT NULL, -- Sacco, Chama, Fine, Lost Item, Other
  date_added DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payslips
CREATE TABLE payslips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff_profiles(id),
  month TEXT NOT NULL,
  basic NUMERIC NOT NULL,
  commissions NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  net NUMERIC NOT NULL,
  status TEXT DEFAULT 'Pending', -- Pending, Paid
  payment_date DATE,
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SETTINGS & CONFIGURATION
-- ============================================

-- Roles
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  permissions JSONB NOT NULL DEFAULT '{}',
  accessible_submodules TEXT[] DEFAULT '{}',
  widget_access TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fine Rules
CREATE TABLE fine_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  basis TEXT NOT NULL, -- Fixed Fee, Percentage
  value NUMERIC NOT NULL,
  description TEXT,
  applies_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commission Rules
CREATE TABLE commission_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trigger TEXT NOT NULL, -- Rent Collection, Tenancy Referral, Property Management Referral, Property Sale
  rate_type TEXT NOT NULL, -- %, KES
  rate_value NUMERIC NOT NULL,
  description TEXT,
  applies_to TEXT,
  deadline_day INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deduction Rules
CREATE TABLE deduction_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- Percentage, Fixed
  value NUMERIC NOT NULL,
  frequency TEXT NOT NULL, -- Monthly, Yearly, One-Off
  applicability TEXT NOT NULL, -- Global, Specific Landlord, Specific Property
  target_id UUID,
  status TEXT NOT NULL DEFAULT 'Active',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offboarding Records
CREATE TABLE offboarding_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  tenant_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  notice_date DATE NOT NULL,
  move_out_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Notice Given', -- Notice Given, Inspection Pending, Completed, Cancelled
  inspection_status TEXT DEFAULT 'Pending', -- Pending, Passed, Failed
  utility_clearance BOOLEAN DEFAULT false,
  deposit_refunded BOOLEAN DEFAULT false,
  keys_returned BOOLEAN DEFAULT false,
  final_bill_amount NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflows
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  trigger TEXT NOT NULL,
  steps JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Escalation Rules
CREATE TABLE escalation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condition TEXT NOT NULL,
  action TEXT NOT NULL,
  assigned_to UUID REFERENCES profiles(id),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  action TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  user_name TEXT,
  entity_type TEXT,
  entity_id UUID,
  details JSONB
);

-- System Settings
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT DEFAULT 'TaskMe Realty',
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Geospatial Data
CREATE TABLE geospatial_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  county TEXT NOT NULL,
  sub_county TEXT NOT NULL,
  location TEXT NOT NULL,
  zone TEXT NOT NULL,
  villages TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax Records
CREATE TABLE tax_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Due', -- Due, Paid
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled Reports
CREATE TABLE scheduled_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  frequency TEXT NOT NULL, -- Daily, Weekly, Monthly
  recipients TEXT[],
  enabled BOOLEAN DEFAULT true,
  last_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Income Sources
CREATE TABLE income_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_properties_landlord ON properties(landlord_id);
CREATE INDEX idx_properties_branch ON properties(branch);
CREATE INDEX idx_units_property ON units(property_id);
CREATE INDEX idx_units_status ON units(status);
CREATE INDEX idx_tenants_property ON tenants(property_id);
CREATE INDEX idx_tenants_unit ON tenants(unit_id);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_property ON tasks(property_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_funds_status ON funds(status);
CREATE INDEX idx_investments_fund ON investments(fund_id);
CREATE INDEX idx_investments_investor ON investments(investor_id);
CREATE INDEX idx_listings_status ON marketplace_listings(status);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE landlords ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE landlord_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE overpayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE landlord_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE renovation_investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Super admins can do everything" ON profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Super Admin')
  );

-- RLS Policies for properties
CREATE POLICY "Properties are viewable by all authenticated users" ON properties
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Properties insertable by admins" ON properties
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Super Admin', 'Branch Manager'))
  );

CREATE POLICY "Properties updatable by admins" ON properties
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Super Admin', 'Branch Manager'))
  );

-- RLS Policies for tenants
CREATE POLICY "Tenants viewable by authenticated users" ON tenants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Tenants insertable by admins" ON tenants
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Super Admin', 'Branch Manager', 'Field Agent', 'Accountant'))
  );

CREATE POLICY "Tenants updatable by admins" ON tenants
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Super Admin', 'Branch Manager', 'Field Agent', 'Accountant'))
  );

-- RLS Policies for tasks
CREATE POLICY "Tasks viewable by authenticated users" ON tasks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Tasks insertable by staff" ON tasks
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Tasks updatable by staff" ON tasks
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
  );

-- RLS Policies for funds
CREATE POLICY "Funds viewable by all" ON funds
  FOR SELECT USING (true);

CREATE POLICY "Funds manageable by admins" ON funds
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Super Admin', 'Branch Manager', 'Accountant'))
  );

-- RLS Policies for investments
CREATE POLICY "Investments viewable by owner or admin" ON investments
  FOR SELECT TO authenticated USING (
    investor_id IN (SELECT id FROM renovation_investors WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Super Admin', 'Accountant'))
  );

-- RLS Policies for notifications
CREATE POLICY "Notifications viewable by owner" ON notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Notifications updatable by owner" ON notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_profiles_updated_at BEFORE UPDATE ON staff_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_landlords_updated_at BEFORE UPDATE ON landlords FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_funds_updated_at BEFORE UPDATE ON funds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, phone, id_number, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'id_number', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'Tenant'),
    'Active'
  );
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to automatically create profile from auth
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default roles
INSERT INTO roles (name, description, is_system, permissions, accessible_submodules) VALUES
('Super Admin', 'Full system access', true, '{"all": {"create": true, "edit": true, "delete": true, "view": true, "approve": true}}', '{"*"}'),
('Branch Manager', 'Branch level management', true, '{"properties": {"create": true, "edit": true, "view": true}, "tenants": {"create": true, "edit": true, "view": true}}', '{"Dashboard", "Registration", "Tenants", "Landlords", "Operations", "Payments"}'),
('Field Agent', 'Field operations', true, '{"properties": {"view": true}, "tenants": {"create": true, "view": true}, "tasks": {"create": true, "edit": true}}', '{"Dashboard", "Operations/Field Agents", "Operations/Properties", "Operations/Maintenance"}'),
('Accountant', 'Financial operations', true, '{"payments": {"create": true, "edit": true, "view": true}, "invoices": {"create": true, "edit": true, "view": true}}', '{"Dashboard", "Payments", "Accounting", "Reports & Analytics"}'),
('Caretaker', 'Property caretaking', true, '{"tasks": {"view": true, "edit": true}, "units": {"view": true}}', '{"Dashboard", "Operations/Maintenance"}'),
('Landlord', 'Property owner access', true, '{"properties": {"view": true}, "payouts": {"view": true}}', '{"Dashboard", "User App Portal/Landlords Portal"}'),
('Tenant', 'Tenant portal access', true, '{"profile": {"edit": true, "view": true}}', '{"Dashboard", "User App Portal/Tenant Portal"}'),
('Contractor', 'Vendor/contractor access', true, '{"tasks": {"view": true, "edit": true}}', '{"Dashboard", "User App Portal/Contractor Portal"}'),
('Affiliate', 'Referral partner access', true, '{"leads": {"view": true}}', '{"Dashboard", "User App Portal/Affiliate Portal"}'),
('Investor', 'Investment platform access', true, '{"funds": {"view": true}, "investments": {"view": true}}', '{"Dashboard", "User App Portal/Investors Portal", "R-Reits"}');

-- Insert default system settings
INSERT INTO system_settings (company_name, address, phone, email) 
VALUES ('TaskMe Realty', 'Nairobi, Kenya', '+254700000000', 'info@taskme.realty');
