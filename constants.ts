
import { 
    NavItem, QuickStat, TenantProfile, Property, User, Task, Workflow, 
    CommunicationAutomationRule, EscalationRule, AuditLogEntry, StaffProfile, 
    Payslip, Message, CommunicationTemplate, Bill, TaxRecord, LeaseTemplate, 
    RoleAwareKpis, OccupancyMetric, StaffLeaderboardEntry, PropertyInsight, 
    ReitMetric, ScheduledReport, Listing, Lead, Affiliate, DeveloperProject, 
    ReitReferralDashboardData, KycRecord, Role, RolePermissions, WidgetConfig, RateRule, 
    SystemConstant, CompanyStructureNode, LandlordStatement, TenantApplication, 
    GeospatialData, CommissionRule, DeductionRule, ExternalTransaction, 
    Overpayment, Vendor, PreventiveTask, WithdrawalRequest, Distribution, 
    InvestorProfile, OperationsKpi, IncomeSource, TaskStatus, TaskPriority,
    BoQItem, Fund, Investment, RenovationInvestor, RFTransaction, RenovationProjectBill
} from './types';

export const NAVIGATION_ITEMS: NavItem[] = [
  { name: 'Dashboard', icon: 'dashboard', subModules: ['Dashboard', 'Quick Stats', 'Quick Search'] },
  { name: 'Registration', icon: 'register', subModules: ['Overview', 'Users', 'Payment Setup', 'Commissions', 'Geospatial Mapping', 'Properties'] },
  { name: 'Landlords', icon: 'landlords', subModules: ['Overview', 'Applications', 'Active Landlords', 'Deductions', 'Offboarding'] },
  { name: 'Tenants', icon: 'tenants', subModules: ['Overview', 'Applications', 'Active Tenants', 'Fines & Penalties', 'Tenant Insights', 'Offboarding'] },
  { name: 'Operations', icon: 'operations', subModules: ['Field Agents', 'Affiliates', 'Caretakers', 'Properties', 'Maintenance', 'Task Management', 'Communications', 'Leases'] },
  { name: 'Payments', icon: 'payments', subModules: ['Overview', 'Inbound', 'Outbound', 'Invoices', 'Reconciliation', 'Landlord Payouts', 'Overpayments', 'Payment Processing'] },
  { name: 'Marketplace', icon: 'marketplace', subModules: ['Listings', 'Leads', 'Affiliates', 'MyFundiHub', 'Referral Program', 'Marketing Banners', 'Reporting'] },
  { name: 'R-Reits', icon: 'reits', subModules: ['Overview', 'Investment Plans', 'Project Accounting', 'Investor Dashboard', 'RF Payments', 'Portfolio Performance', 'Referrals', 'Compliance & KYC'] },
  { name: 'HR & Payroll', icon: 'hr', subModules: ['Staff Management', 'Payroll Processing', 'Commissions', 'Leave & Attendance', 'Performance', 'Reporting'] },
  { name: 'Accounting', icon: 'accounting', subModules: ['Overview', 'Income', 'Expenses', 'Financial Statements', 'Tax Compliance', 'Reconciliation', 'Reporting'] },
  { name: 'Reports & Analytics', icon: 'analytics', subModules: ['Reports', 'Analytics'] },
  { name: 'User App Portal', icon: 'user-app', subModules: ['Tenant Portal', 'Agent Portal', 'Landlords Portal', 'Affiliate Portal', 'Investors Portal', 'Caretaker Portal', 'Contractor Portal', 'Referral Landing', 'Invest & Earn', 'My Profile'] },
  { name: 'Settings', icon: 'settings', subModules: ['Profile', 'Roles', 'Permissions', 'Widgets', 'Rates & Rules', 'Constants', 'Audit Trail'] },
];

export const WIDGET_REGISTRY: Record<string, { id: string; name: string }[]> = {
    'Dashboard': [
        { id: 'dash_welcome', name: 'Welcome Banner' },
        { id: 'dash_search', name: 'Search & Filter Bar' },
        { id: 'dash_house_alerts', name: 'House Status Alerts' },
        { id: 'dash_key_stats', name: 'Key Statistics Cards' },
        { id: 'dash_quick_stats', name: 'Quick Stats Grid' },
        { id: 'dash_financial_chart', name: 'Financial Health Chart' },
        { id: 'dash_recent_activity', name: 'Recent Activities' },
        { id: 'dash_upcoming_payments', name: 'Upcoming Payments' },
        { id: 'dash_my_tasks', name: 'My Tasks' }
    ],
    'Registration': [
        { id: 'reg_user_stats', name: 'User Statistics' },
        { id: 'reg_quick_actions', name: 'Quick Actions' }
    ],
    'Tenants': [
        { id: 'ten_kpi', name: 'Tenant KPI Cards' },
        { id: 'ten_status_dist', name: 'Status Distribution Chart' },
        { id: 'ten_lease_struct', name: 'Lease Structure Chart' },
        { id: 'ten_expiring', name: 'Expiring Leases List' },
        { id: 'ten_financials', name: 'Financial Health Shortcut' }
    ],
    'Landlords': [
        { id: 'land_kpi', name: 'KPI Cards' },
        { id: 'land_collection', name: 'Collection Performance Chart' },
        { id: 'land_alerts', name: 'Insight Alerts' },
        { id: 'land_quick_actions', name: 'Quick Actions' }
    ],
    'Operations': [
        { id: 'ops_kpi', name: 'Pending Tasks & Efficiency' },
        { id: 'ops_nav', name: 'Module Navigation Cards' }
    ],
    'Payments': [
        { id: 'pay_kpi', name: 'Collection & Expenses KPIs' },
        { id: 'pay_income_chart', name: 'Income vs Expense Chart' },
        { id: 'pay_methods_chart', name: 'Payment Methods Doughnut' },
        { id: 'pay_recent', name: 'Recent Transactions Table' }
    ],
    'Reports': [
        { id: 'rep_modules', name: 'Report Modules Grid' },
        { id: 'rep_health', name: 'System Health Status' },
        { id: 'rep_insights', name: 'Quick Insights Cards' }
    ]
};

export const QUICK_STATS_DATA: QuickStat[] = [
    { title: "Total Tenants", thisMonth: "1,240", icon: "tenants", color: "blue" },
    { title: "Occupancy Rate", thisMonth: "94%", icon: "vacant-house", color: "green" },
    { title: "Revenue (MTD)", thisMonth: "KES 4.2M", icon: "revenue", color: "green" },
    { title: "Pending Tasks", thisMonth: "12", icon: "operations", color: "red" }
];

export const CASH_FLOW_CHART_DATA = { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], datasets: [{ label: 'Income', data: [65, 59, 80, 81, 56, 55], borderColor: '#10b981' }, { label: 'Expenses', data: [28, 48, 40, 19, 86, 27], borderColor: '#ef4444' }] };
export const TENANT_GROWTH_CHART_DATA = { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], datasets: [{ label: 'New Tenants', data: [12, 19, 3, 5, 2, 3], backgroundColor: '#3b82f6' }] };
export const AGENT_PERFORMANCE_CHART_DATA = { labels: ['Agent A', 'Agent B', 'Agent C'], datasets: [{ label: 'Leases Signed', data: [12, 19, 3], backgroundColor: '#8b5cf6' }] };
export const LEASE_VACANCY_CHART_DATA = { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], datasets: [{ label: 'Occupancy', data: [90, 92, 93, 91, 94, 95], borderColor: '#10b981' }] };
export const MAINTENANCE_PERFORMANCE_CHART_DATA = { labels: ['Plumbing', 'Electrical', 'Structural'], datasets: [{ label: 'Requests', data: [12, 19, 3], backgroundColor: '#f59e0b' }] };
export const PAYMENT_DISTRIBUTION_CHART_DATA = { labels: ['M-Pesa', 'Bank', 'Cash'], datasets: [{ data: [65, 30, 5], backgroundColor: ['#10b981', '#3b82f6', '#9ca3af'] }] };
export const INCOME_EXPENSE_CHART_DATA = { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], datasets: [{ label: 'Income', data: [65, 59, 80, 81, 56, 55], borderColor: '#10b981' }, { label: 'Expense', data: [28, 48, 40, 19, 86, 27], borderColor: '#ef4444' }] };
export const REIT_BALANCE_GROWTH_DATA = { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], datasets: [{ label: 'Fund Value (KES)', data: [1000000, 1200000, 1500000, 1800000, 2100000, 24500000], borderColor: '#8b5cf6' }] };
export const MOCK_PROFITABILITY_BY_PRODUCT_DATA = { labels: ['Product A', 'Product B'], datasets: [{ label: 'Profit', data: [30000, 50000], backgroundColor: '#10b981' }] };

export const MOCK_USERS: User[] = [
    { id: 'user1', name: 'Admin Alice', role: 'Super Admin', email: 'alice@taskme.re', phone: '0700000001', idNumber: '12345678', status: 'Active', branch: 'Headquarters' },
    { id: 'user2', name: 'Manager Mike', role: 'Branch Manager', email: 'mike@taskme.re', phone: '0700000002', idNumber: '87654321', status: 'Active', branch: 'Kericho Branch' },
    { id: 'user3', name: 'Agent Jane', role: 'Field Agent', email: 'jane@taskme.re', phone: '0700000003', idNumber: '11223344', status: 'Active', branch: 'Kisii Branch' }
];

export const MOCK_PROPERTIES: Property[] = []; 
export const MOCK_TENANTS: TenantProfile[] = []; 
export const MOCK_TASKS: Task[] = []; 
export const MOCK_APPLICATIONS: TenantApplication[] = []; 

// --- UPDATED GEOSPATIAL DATA (KENYAN CONTEXT) ---
export const GEOSPATIAL_DATA: GeospatialData = {
    'Nairobi': { 
        'Westlands': { 
            'Parklands': { 
                'Zone A': ['Highridge', '3rd Parklands'],
                'Zone B': ['Kitsuru', 'Spring Valley'] 
            },
            'Kangemi': {
                'Olympic': ['Village A', 'Village B'],
                'Mountain View': ['Estate 1', 'Estate 2']
            }
        },
        'Kasarani': {
            'Roysambu': {
                'Zimmerman': ['Base', 'Kamiti'],
                'Githurai 44': ['Mokorino', 'Police Post']
            }
        },
        'Kibra': {
            'Woodley': {
                'Jamhuri': ['Estate Phase 1', 'Estate Phase 2'],
                'Kenyatta Golf Course': ['Ngummo']
            }
        }
    },
    'Kisii': { 
        'Kitutu Chache South': { 
            'Township': { 
                'Mwembe': ['Mwembe Tayari', 'Jogoo'],
                'CBD': ['Capital', 'Hospital Rd']
            },
            'Nyanchwa': {
                'Nyanchwa Estate': ['Section A', 'Section B'],
                'Daraja Mbili': ['Market Area']
            }
        },
        'Nyaribari Chache': {
            'Central': {
                'Kisii Town': ['Main Stage', 'Stadium']
            }
        }
    },
    'Kericho': { 
        'Ainamoi': { 
            'Township': { 
                'CBD': ['Temple Road', 'Uhuru Gardens'],
                'Majengo': ['Area 1', 'Area 2']
            },
            'Kipchimchim': {
                'Kipchimchim': ['Market', 'School']
            }
        } 
    },
    'Mombasa': {
        'Nyali': {
            'Nyali': {
                'Beach Road': ['Links Rd', 'Moyne Dr'],
                'Kongowea': ['Karama', 'Uwanja wa Ndege']
            }
        },
        'Likoni': {
            'Likoni': {
                'Shelly Beach': ['Timbwani'],
                'Mtongwe': ['Ferry']
            }
        }
    },
    'Nakuru': {
        'Nakuru Town East': {
            'CBD': {
                'Bondeni': ['Section 58', 'Kaptembwa'],
                'Milimani': ['State House Rd']
            }
        },
        'Naivasha': {
            'Viwandani': {
                'Town': ['Area 1'],
                'Industrial': ['Plant']
            }
        }
    },
    'Kiambu': {
        'Thika': {
            'Township': {
                'Section 9': ['A', 'B'],
                'Makongeni': ['Phase 1']
            }
        },
        'Ruiru': {
            'Biashara': {
                'Kimbo': ['Matangi'],
                'Githurai 45': ['Progress']
            }
        }
    }
};

export const MOCK_COMMISSION_RULES: CommissionRule[] = [
    { id: 'rule1', trigger: 'Rent Collection', rateType: '%', rateValue: 5, description: 'Standard agent commission', appliesTo: 'Agent' },
    { id: 'rule2', trigger: 'Tenancy Referral', rateType: 'KES', rateValue: 200, description: 'One-off bonus for referring a tenant', appliesTo: 'Tenant, Agent, Affiliate' },
    { id: 'rule3', trigger: 'Property Management Referral', rateType: '%', rateValue: 10, description: '10% of Management Fee for duration of contract', appliesTo: 'Landlord, Staff, Agent, Affiliate' }
];
export const MOCK_DEDUCTION_RULES: DeductionRule[] = [
    { id: 'ded1', name: 'Management Commission', type: 'Percentage', value: 10, frequency: 'Monthly', applicability: 'Global', status: 'Active' },
    { id: 'ded2', name: 'Garbage Collection', type: 'Fixed', value: 500, frequency: 'Monthly', applicability: 'Specific Property', targetId: 'prop1', status: 'Active' }
];
export const MOCK_EXTERNAL_TRANSACTIONS: ExternalTransaction[] = [];
export const MOCK_OVERPAYMENTS: Overpayment[] = [
    { id: 'op1', tenantName: 'John Doe', unit: 'A-101', amount: 5000, reference: 'REF123', dateReceived: '2025-11-01', appliedMonth: 'December 2025', status: 'Held' }
];

export const MOCK_WITHDRAWALS: WithdrawalRequest[] = [
    { id: 'wr-1', investorName: 'Current User', amount: 2500, requestDate: '2025-11-15', type: 'Interest', method: 'M-Pesa', status: 'Paid' },
    { id: 'wr-2', investorName: 'Current User', amount: 5000, requestDate: '2025-10-01', type: 'Interest', method: 'Bank', status: 'Paid' }
];

export const MOCK_INVESTOR_PROFILE: InvestorProfile = {
    id: 'inv-001',
    name: 'Alex Investor',
    totalInvested: 400000,
    balance: 5000,
    totalReturns: 32500,
    nextPayout: { amount: 3500, date: '15th Dec 2025' },
    transactions: [
        { id: 'tx1', date: '2025-11-15', type: 'Interest Payout', amount: 3500, status: 'Completed', category: 'Inbound', partyName: 'Fund I', reference: 'INT-NOV' },
        { id: 'tx2', date: '2025-11-01', type: 'Deposit', amount: 50000, status: 'Completed', category: 'Inbound', partyName: 'Alex', reference: 'DEP-002' }
    ]
};

export const INITIAL_FUNDS: Fund[] = [
    {
        id: 'fund-1',
        name: 'Urban Renewal Fund I',
        description: 'Financing the modern renovation of 20 residential units in Nairobi West to increase rental yield.',
        targetApy: '30%',
        capitalRaised: 12500000,
        targetCapital: 20000000,
        investors: 45,
        status: 'Active',
        riskProfile: 'Medium',
        projectedCompletion: 'Dec 2026',
        landlordType: 'Internal',
        landlordName: 'Peter Owner',
        propertyType: 'Residential',
        clientInterestRate: 5.0,
        projectPic: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Modern Villa/Apartment
        boq: [
            { id: 'bq1', description: 'Paint Work', unit: 'SqM', quantity: 500, rate: 450, amount: 225000 },
            { id: 'bq2', description: 'Tiling', unit: 'SqM', quantity: 200, rate: 1200, amount: 240000 }
        ],
        progressUpdates: [
             { id: 'pu-1', date: '2025-10-15', imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80', caption: 'Site clearing and initial prep' },
             { id: 'pu-2', date: '2025-11-01', imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80', caption: 'Foundation reinforcement complete' }
        ]
    },
    {
        id: 'fund-2',
        name: 'Riverside Expansion',
        description: 'Adding a new wing to the Riverside commercial complex, increasing retail space by 40%.',
        targetApy: '30%',
        capitalRaised: 45000000,
        targetCapital: 50000000,
        investors: 120,
        status: 'Closing Soon',
        riskProfile: 'Low',
        projectedCompletion: 'Jun 2026',
        landlordType: 'External',
        landlordName: 'Riverside Holdings',
        propertyType: 'Commercial',
        clientInterestRate: 5.0,
        projectPic: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Commercial Building
        boq: []
    },
    {
        id: 'fund-3',
        name: 'Sunset Plaza Facelift',
        description: 'Complete exterior and interior renovation of the iconic Sunset Plaza to attract premium tenants.',
        targetApy: '30%',
        capitalRaised: 5000000,
        targetCapital: 15000000,
        investors: 25,
        status: 'Active',
        riskProfile: 'Medium',
        projectedCompletion: 'Aug 2026',
        landlordType: 'Internal',
        landlordName: 'Sunset Group',
        propertyType: 'Commercial',
        clientInterestRate: 5.0,
        projectPic: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Modern Plaza Interior/Exterior
        boq: []
    },
    {
        id: 'fund-4',
        name: 'Green Heights Commercial',
        description: 'Conversion of mixed-use block into high-end office suites with modern amenities.',
        targetApy: '30%',
        capitalRaised: 8000000,
        targetCapital: 30000000,
        investors: 60,
        status: 'Active',
        riskProfile: 'High',
        projectedCompletion: 'Feb 2027',
        landlordType: 'External',
        landlordName: 'Green Heights Ltd',
        propertyType: 'Commercial',
        clientInterestRate: 5.0,
        projectPic: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Modern Office Building
        boq: []
    },
    {
        id: 'fund-5',
        name: 'Lakeside Villas Renovation',
        description: 'Restoration of 5 luxury lakefront villas for high-yield holiday rentals.',
        targetApy: '30%',
        capitalRaised: 2000000,
        targetCapital: 25000000,
        investors: 10,
        status: 'Active',
        riskProfile: 'Medium',
        projectedCompletion: 'Nov 2026',
        landlordType: 'External',
        landlordName: 'Lakeview Resorts',
        propertyType: 'Residential',
        clientInterestRate: 5.0,
        projectPic: 'https://images.unsplash.com/photo-1613490493576-2f5037657918?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Luxury Villa
        boq: []
    },
    {
        id: 'fund-closed-1',
        name: 'Highland Mall Expansion',
        description: 'Successful addition of 3rd floor retail space.',
        targetApy: '28%',
        capitalRaised: 60000000,
        targetCapital: 60000000,
        investors: 150,
        status: 'Project Completed',
        riskProfile: 'Low',
        projectedCompletion: 'Jan 2025',
        landlordType: 'Internal',
        landlordName: 'Highland Properties',
        propertyType: 'Commercial',
        clientInterestRate: 5.0,
        projectPic: 'https://images.unsplash.com/photo-1519567241046-7f570eee3c9e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Completed Mall
        boq: []
    }
];

export const MOCK_INVESTMENTS: Investment[] = [
    { id: 'inv1', fundId: 'fund-1', fundName: 'Urban Renewal Fund I', amount: 150000, date: '2025-01-15', strategy: 'Monthly Payout', status: 'Active', accruedInterest: 12000 },
    { id: 'inv2', fundId: 'fund-2', fundName: 'Riverside Expansion', amount: 50000, date: '2025-06-01', strategy: 'Compound', status: 'Active', accruedInterest: 1500 }
];

export const MOCK_RENOVATION_INVESTORS: RenovationInvestor[] = [
    { 
        id: 'inv-001', name: 'Alex Investor', email: 'alex@invest.com', phone: '0700111222', idNumber: '12345678', 
        status: 'Active', joinDate: '2024-01-01', nextOfKin: { name: 'Jane', phone: '0700', relationship: 'Spouse' }, 
        paymentDetails: {}, investorType: 'Individual' 
    },
    { 
        id: 'inv-002', name: 'Sunrise Chama', email: 'admin@sunrise.com', phone: '0700222333', idNumber: 'REG-123', 
        status: 'Active', joinDate: '2024-03-15', nextOfKin: { name: 'Chairperson', phone: '0700', relationship: 'Admin' }, 
        paymentDetails: {}, investorType: 'Chama', groupMembersCount: 15 
    },
];

export const MOCK_RF_TRANSACTIONS: RFTransaction[] = [
    { id: 'tx-1', date: '2025-11-01', type: 'Investment', category: 'Inbound', amount: 150000, partyName: 'Alex Investor', reference: 'INV-001', status: 'Completed' },
    { id: 'tx-2', date: '2025-11-05', type: 'Expense', category: 'Outbound', amount: 45000, partyName: 'Crown Paints', reference: 'EXP-001', status: 'Completed' },
];

export const MOCK_DISTRIBUTIONS: Distribution[] = [
    { id: 'dist-1', date: '2025-11-15', amount: 3500, investorName: 'Alex Investor', method: 'M-Pesa', status: 'Paid' }
];

export const MOCK_LISTINGS: Listing[] = [
    { id: 'lst1', title: 'Modern 2BR Apartment', price: 'KES 45,000', status: 'Available', type: 'For Rent', location: 'Kilimani', agent: { name: 'Jane' }, purpose: 'Rent' },
    { id: 'lst2', title: 'Prime 0.5 Acre Plot', price: 'KES 8.5M', status: 'Available', type: 'For Sale', location: 'Karen', agent: { name: 'Mike' }, purpose: 'Sale' },
    { id: 'lst3', title: 'Studio Near Campus', price: 'KES 12,000', status: 'Rented', type: 'For Rent', location: 'Juja', agent: { name: 'Jane' }, purpose: 'Rent' }
];

export const MOCK_LEADS: Lead[] = [
    { id: 'lead1', tenantName: 'Sarah Connor', status: 'New', assignedAgent: 'Jane', listingTitle: 'Modern 2BR Apartment' },
    { id: 'lead2', tenantName: 'John Wick', status: 'Contacted', assignedAgent: 'Mike', listingTitle: 'Prime 0.5 Acre Plot' }
];

export const MOCK_AFFILIATE_PROFILE: Affiliate = {
    id: 'aff1',
    name: 'Sarah Linker', 
    referralCode: 'SARAH2025',
    stats: { leadsReferred: 45, leasesSigned: 12, totalEarned: 36000 },
    referrals: [
        { date: '2025-11-01', tenantName: 'Tom Riddle', status: 'Signed', commission: 3000 },
        { date: '2025-11-05', tenantName: 'Bellatrix', status: 'Pending', commission: 0 }
    ]
};

export const MOCK_DEVELOPER_PROJECTS: DeveloperProject[] = [
    { id: 'dev1', name: 'Golden Heights', unitsSold: 45, totalUnits: 120 },
    { id: 'dev2', name: 'Silver Springs', unitsSold: 12, totalUnits: 50 }
];

export const MOCK_REFERRAL_DATA: ReitReferralDashboardData = {
    stats: { count: 12, activeBalance: 4500000, commission: 112500 },
    referrals: [
        { name: 'John Doe', activeBalance: 150000, monthlyCommission: 375 },
        { name: 'Jane Smith', activeBalance: 500000, monthlyCommission: 1250 }
    ]
};

export const MOCK_KYC_RECORDS: KycRecord[] = [
    { id: 'kyc1', investorName: 'John Doe', idNumber: '12345678', phone: '0711223344', joinDate: '2025-01-01', status: 'Verified' },
    { id: 'kyc2', investorName: 'Michael Scott', idNumber: '87654321', phone: '0722334455', joinDate: '2025-11-10', status: 'Pending' },
    { id: 'kyc3', investorName: 'Jim Halpert', idNumber: '11223344', phone: '0733445566', joinDate: '2025-10-05', status: 'Rejected' }
];

const createMockPermissions = (isAdmin: boolean): RolePermissions => {
    const modules = ['Properties', 'Tenants', 'Landlords', 'Financials', 'Maintenance', 'Reports', 'Settings', 'Users'];
    const perms: RolePermissions = {};
    modules.forEach(m => {
        perms[m] = {
            create: isAdmin,
            edit: isAdmin,
            delete: isAdmin,
            view: true,
            approve: isAdmin,
            import: isAdmin,
            activate: isAdmin,
            deactivate: isAdmin,
            publish: isAdmin,
            pay: isAdmin,
            resolve: isAdmin,
            cancel: isAdmin
        };
    });
    return perms;
};

// All submodules list for admin
const ALL_SUBMODULES = [
    'Dashboard', 'Dashboard/Dashboard', 'Dashboard/Quick Stats', 'Dashboard/Quick Search', 'Dashboard/Welcome Banner', 'Dashboard/Search & Filter Bar', 'Dashboard/House Status Alerts', 'Dashboard/Key Statistics Cards', 'Dashboard/Quick Stats Grid', 'Dashboard/Financial Health Chart', 'Dashboard/Recent Activities', 'Dashboard/Upcoming Payments', 'Dashboard/My Tasks',
    'Registration', 'Registration/Overview', 'Registration/Users', 'Registration/Payment Setup', 'Registration/Commissions', 'Registration/Geospatial Mapping', 'Registration/Properties',
    'Landlords', 'Landlords/Overview', 'Landlords/Applications', 'Landlords/Active Landlords', 'Landlords/Deductions', 'Landlords/Offboarding',
    'Tenants', 'Tenants/Overview', 'Tenants/Applications', 'Tenants/Active Tenants', 'Tenants/Fines & Penalties', 'Tenants/Tenant Insights', 'Tenants/Offboarding',
    'Operations', 'Operations/Field Agents', 'Operations/Affiliates', 'Operations/Caretakers', 'Operations/Properties', 'Operations/Maintenance', 'Operations/Task Management', 'Operations/Communications', 'Operations/Leases',
    'Payments', 'Payments/Overview', 'Payments/Inbound', 'Payments/Outbound', 'Payments/Invoices', 'Payments/Reconciliation', 'Payments/Landlord Payouts', 'Payments/Overpayments', 'Payments/Payment Processing',
    'Marketplace', 'Marketplace/Listings', 'Marketplace/Leads', 'Marketplace/Affiliates', 'Marketplace/MyFundiHub', 'Marketplace/Referral Program', 'Marketplace/Marketing Banners', 'Marketplace/Reporting',
    'R-Reits', 'R-Reits/Overview', 'R-Reits/Investment Plans', 'R-Reits/Project Accounting', 'R-Reits/Investor Dashboard', 'R-Reits/RF Payments', 'R-Reits/Portfolio Performance', 'R-Reits/Referrals', 'R-Reits/Compliance & KYC',
    'HR & Payroll', 'HR & Payroll/Staff Management', 'HR & Payroll/Payroll Processing', 'HR & Payroll/Commissions', 'HR & Payroll/Leave & Attendance', 'HR & Payroll/Performance', 'HR & Payroll/Reporting',
    'Accounting', 'Accounting/Overview', 'Accounting/Income', 'Accounting/Expenses', 'Accounting/Financial Statements', 'Accounting/Tax Compliance', 'Accounting/Reconciliation', 'Accounting/Reporting',
    'Reports & Analytics', 'Reports & Analytics/Reports', 'Reports & Analytics/Analytics',
    'User App Portal', 'User App Portal/Tenant Portal', 'User App Portal/Agent Portal', 'User App Portal/Landlords Portal', 'User App Portal/Affiliate Portal', 'User App Portal/Investors Portal', 'User App Portal/Caretaker Portal', 'User App Portal/Contractor Portal', 'User App Portal/Referral Landing', 'User App Portal/Refer And Grow', 'User App Portal/My Profile',
    'Settings', 'Settings/Profile', 'Settings/Roles', 'Settings/Permissions', 'Settings/Widgets', 'Settings/Rates & Rules', 'Settings/Constants', 'Settings/Audit Trail'
];

export const MOCK_ROLES: Role[] = [
    { 
        id: 'role1', 
        name: 'Super Admin', 
        description: 'Full system access', 
        isSystem: true, 
        permissions: createMockPermissions(true),
        accessibleSubmodules: ALL_SUBMODULES,
        widgetAccess: [
            'dash_welcome', 'dash_search', 'dash_house_alerts', 'dash_key_stats', 
            'dash_quick_stats', 'dash_financial_chart', 'dash_recent_activity', 
            'dash_upcoming_payments', 'dash_my_tasks'
        ]
    },
    { 
        id: 'role2', 
        name: 'Branch Manager', 
        description: 'Manage properties and tenants for a branch', 
        isSystem: true, 
        permissions: createMockPermissions(true),
        accessibleSubmodules: ALL_SUBMODULES,
        widgetAccess: []
    },
    { 
        id: 'role3', 
        name: 'Accountant', 
        description: 'Financials only', 
        isSystem: true, 
        permissions: createMockPermissions(false),
        accessibleSubmodules: [
             'Dashboard', 'Dashboard/Quick Stats',
             'Payments', 'Payments/Overview', 'Payments/Inbound', 'Payments/Outbound',
             'Accounting', 'Accounting/Overview', 'Accounting/Income', 'Accounting/Expenses',
             'Reports & Analytics', 'Reports & Analytics/Reports'
        ],
        widgetAccess: []
    },
    {
        id: 'role-asst-admin',
        name: 'Assistant Admin',
        description: 'Support for Super Admin',
        isSystem: true,
        permissions: createMockPermissions(true),
        accessibleSubmodules: ALL_SUBMODULES,
        widgetAccess: []
    },
    {
        id: 'role-finance-mgr',
        name: 'Finance Manager',
        description: 'Oversees all financial operations',
        isSystem: true,
        permissions: createMockPermissions(true),
        accessibleSubmodules: ALL_SUBMODULES,
        widgetAccess: []
    },
    {
        id: 'role-office-admin',
        name: 'Office Admin',
        description: 'General office management',
        isSystem: true,
        permissions: createMockPermissions(false),
        accessibleSubmodules: ALL_SUBMODULES,
        widgetAccess: []
    },
    {
        id: 'role-customer-care',
        name: 'Customer Care',
        description: 'Support and communications',
        isSystem: true,
        permissions: createMockPermissions(false),
        accessibleSubmodules: ['Dashboard', 'Operations/Communications', 'Tenants/Overview', 'Tenants/Applications'],
        widgetAccess: []
    },
    { 
        id: 'role-tenant', 
        name: 'Tenant', 
        description: 'User App Portal Access', 
        isSystem: false, 
        permissions: createMockPermissions(false),
        accessibleSubmodules: ['User App Portal/Tenant Portal', 'User App Portal/Refer And Grow', 'User App Portal/My Profile'],
        widgetAccess: []
    },
    { 
        id: 'role-landlord', 
        name: 'Landlord', 
        description: 'User App Portal Access', 
        isSystem: false, 
        permissions: createMockPermissions(false),
        accessibleSubmodules: ['User App Portal/Landlords Portal', 'User App Portal/Refer And Grow', 'User App Portal/My Profile'],
        widgetAccess: []
    },
    { 
        id: 'role-agent', 
        name: 'Field Agent', 
        description: 'User App Portal Access', 
        isSystem: false, 
        permissions: createMockPermissions(false),
        accessibleSubmodules: ['User App Portal/Agent Portal', 'User App Portal/Refer And Grow', 'User App Portal/My Profile'],
        widgetAccess: []
    },
    { 
        id: 'role-caretaker', 
        name: 'Caretaker', 
        description: 'User App Portal Access', 
        isSystem: false, 
        permissions: createMockPermissions(false),
        accessibleSubmodules: ['User App Portal/Caretaker Portal', 'User App Portal/Refer And Grow', 'User App Portal/My Profile'],
        widgetAccess: []
    },
    { 
        id: 'role-investor', 
        name: 'Investor', 
        description: 'User App Portal Access', 
        isSystem: false, 
        permissions: createMockPermissions(false),
        accessibleSubmodules: ['User App Portal/Investors Portal', 'User App Portal/Refer And Grow', 'User App Portal/My Profile'],
        widgetAccess: []
    },
    { 
        id: 'role-affiliate', 
        name: 'Affiliate', 
        description: 'User App Portal Access', 
        isSystem: false, 
        permissions: createMockPermissions(false),
        accessibleSubmodules: ['User App Portal/Affiliate Portal', 'User App Portal/Refer And Grow', 'User App Portal/My Profile'],
        widgetAccess: []
    },
    { 
        id: 'role-contractor', 
        name: 'Contractor', 
        description: 'User App Portal Access', 
        isSystem: false, 
        permissions: createMockPermissions(false),
        accessibleSubmodules: ['User App Portal/Contractor Portal', 'User App Portal/Refer And Grow', 'User App Portal/My Profile'],
        widgetAccess: []
    }
];

export const MOCK_WIDGETS: WidgetConfig[] = [
    { id: 'wid1', name: 'Occupancy Chart', enabled: true },
    { id: 'wid2', name: 'Revenue Graph', enabled: true },
    { id: 'wid3', name: 'Recent Activity', enabled: false }
];

export const MOCK_RATES_AND_RULES: RateRule[] = [
    { id: 'rate1', name: 'Management Commission', value: 8, unit: '%' },
    { id: 'rate2', name: 'Placement Fee', value: 100, unit: '% of 1st Month' },
    { id: 'rate3', name: 'Late Fee', value: 500, unit: 'KES' }
];

export const MOCK_SYSTEM_CONSTANTS: SystemConstant[] = [
    { id: 'const1', category: 'Payment Methods', value: 'M-Pesa, Bank, Cash' },
    { id: 'const2', category: 'Property Types', value: 'Residential, Commercial' }
];

export const MOCK_COMPANY_STRUCTURE: CompanyStructureNode = {
    name: 'Headquarters',
    type: 'HQ'
};

export const MOCK_LANDLORD_PAYOUTS: LandlordStatement[] = [
    { id: 'payout1', period: 'Oct 2025', gross: 450000, deductions: 35000, netPayout: 415000, status: 'Paid' },
    { id: 'payout2', period: 'Nov 2025', gross: 480000, deductions: 38000, netPayout: 442000, status: 'Pending' }
];

export const MOCK_ROLE_KPIS: Record<string, RoleAwareKpis> = {
    'CEO': {
        welcomeMessage: 'Executive Overview',
        summaryCards: [
            { text: 'Total Revenue', value: 'KES 12.5M', icon: '💰' },
            { text: 'Portfolio Value', value: 'KES 450M', icon: '🏢' },
            { text: 'Net Profit Margin', value: '24%', icon: '📈' },
            { text: 'Active Projects', value: '3', icon: '🔨' }
        ]
    },
    'Landlord': {
        welcomeMessage: 'Your Portfolio Performance',
        summaryCards: [
            { text: 'Occupancy Rate', value: '94%', icon: '🏠' },
            { text: 'Rent Collected', value: 'KES 850k', icon: '💵' },
            { text: 'Pending Maintenance', value: '2', icon: '🔧' },
            { text: 'Next Payout', value: 'KES 780k', icon: '📅' }
        ]
    },
    'Agent': {
        welcomeMessage: 'Sales & Leasing Dashboard',
        summaryCards: [
            { text: 'New Leads', value: '15', icon: '👥' },
            { text: 'Leases Signed', value: '4', icon: '✍️' },
            { text: 'Commissions', value: 'KES 45k', icon: '🎉' },
            { text: 'Pending Tasks', value: '8', icon: '📋' }
        ]
    }
];

export const MOCK_STAFF_LEADERBOARD: StaffLeaderboardEntry[] = [
    { rank: 1, name: 'Jane Doe', metricName: 'Leases Signed', metricValue: '12' },
    { rank: 2, name: 'John Smith', metricName: 'Leases Signed', metricValue: '9' },
    { rank: 3, name: 'Emily Davis', metricName: 'Leases Signed', metricValue: '7' }
];

export const MOCK_PROPERTY_INSIGHTS: PropertyInsight[] = [
    { id: 'p1', name: 'Riverside Apts', occupancy: 98 },
    { id: 'p2', name: 'Green Valley', occupancy: 85 },
    { id: 'p3', name: 'Sunset Plaza', occupancy: 100 }
];

export const MOCK_REIT_METRICS: ReitMetric[] = [
    { title: 'Total AUM', value: 'KES 125M', change: '+5%' },
    { title: 'Active Investors', value: '340', change: '+12' },
    { title: 'Avg. ROI', value: '14.2%', change: '+0.5%' },
    { title: 'Payouts (YTD)', value: 'KES 12.4M', change: '' }
];

export const MOCK_SCHEDULED_REPORTS: ScheduledReport[] = [
    { id: 'rep1', name: 'Monthly Financials', frequency: 'Monthly' },
    { id: 'rep2', name: 'Weekly Occupancy', frequency: 'Weekly' }
];

export const MOCK_LEASE_TEMPLATES: LeaseTemplate[] = [
    { id: 'lt1', name: 'Standard Residential', type: 'Residential', content: '...' },
    { id: 'lt2', name: 'Commercial Shop', type: 'Commercial', content: '...' }
];

export const MOCK_TAX_RECORDS: TaxRecord[] = [
    { id: 'tax1', type: 'VAT', description: 'October VAT Return', amount: 45000, date: '2025-11-20', status: 'Due' },
    { id: 'tax2', type: 'WHT', description: 'Consultant WHT', amount: 12000, date: '2025-11-15', status: 'Paid' }
];

export const MOCK_PNL_STATEMENT = {
    revenue: { title: 'Total Revenue', value: 4500000 },
    cogs: { title: 'Cost of Sales', value: 1200000 },
    grossProfit: { title: 'Gross Profit', value: 3300000 },
    expenses: { title: 'Operating Expenses', value: 850000 },
    netProfit: { title: 'Net Profit', value: 2450000 }
};

export const MOCK_BALANCE_SHEET = {
    assets: { cash: 1500000, depositsHeld: 2400000, total: 3900000 },
    liabilities: { payoutsDue: 850000, unearnedFees: 150000, total: 1000000 }
};

export const MOCK_CASH_FLOW = {
    operating: 2100000,
    investing: -500000,
    financing: -200000,
    netChange: 1400000
};

export const MOCK_PREDICTIVE_ALERTS = [
    { icon: '📉', text: 'Vacancy risk increasing in Kisii Branch due to seasonal trends.' },
    { icon: '⚠️', text: '3 High-value leases expiring in next 60 days.' },
    { icon: '💡', text: 'Maintenance costs for Block A exceeding average by 15%.' }
];

export const MOCK_JOURNAL_ENTRIES = [
    { id: 'je1', date: '2025-11-01', account: 'Revenue', description: 'Rent Collection - Nov', debit: 0, credit: 450000 },
    { id: 'je2', date: '2025-11-01', account: 'Cash (Bank)', description: 'Rent Collection - Nov', debit: 450000, credit: 0 },
    { id: 'je3', date: '2025-11-05', account: 'Project Expense', description: 'Material Purchase', debit: 150000, credit: 0 },
    { id: 'je4', date: '2025-11-05', account: 'Cash (M-Pesa)', description: 'Material Purchase', debit: 0, credit: 150000 }
];

export const MOCK_PERFORMANCE_REVIEWS = [
    { staffId: 'staff1', quarter: 'Q3 2025', rating: 4.5, comments: 'Excellent leadership.' },
    { staffId: 'staff3', quarter: 'Q3 2025', rating: 4.2, comments: 'Exceeded sales targets.' }
];

export const MOCK_AUTOMATION_RULES: CommunicationAutomationRule[] = [
    { id: 'auto1', name: 'Rent Reminder', trigger: '3 Days Before Due', templateName: 'Rent Reminder', channels: ['SMS', 'Email'], enabled: true },
    { id: 'auto2', name: 'Payment Receipt', trigger: 'Payment Recorded', templateName: 'Receipt', channels: ['SMS'], enabled: true }
];

export const MOCK_OPERATIONS_REPORTING_KPIS: OperationsKpi[] = [
    { title: 'Avg Resolution Time', value: 2.4, unit: 'Days' },
    { title: 'SLA Breach Rate', value: 4.2, unit: '%' },
    { title: 'Task Completion', value: 92, unit: '%' },
    { title: 'Resource Utilization', value: 85, unit: '%' }
];

export const MOCK_REVENUE_STREAMS = [
    { name: 'Management Fees', value: 65, color: '#3b82f6' },
    { name: 'Placement Fees', value: 20, color: '#10b981' },
    { name: 'Other', value: 15, color: '#f59e0b' }
];

export const MOCK_WATERFALL_CHART_DATA = {
    labels: ['Gross Revenue', 'Direct Costs', 'OpEx', 'Tax', 'Net Profit'],
    datasets: [{
        label: 'Amount (KES)',
        data: [4.5, -1.2, -0.8, -0.5, 2.0],
        backgroundColor: ['#10b981', '#ef4444', '#ef4444', '#ef4444', '#3b82f6']
    }]
};

export const PAYMENT_METHODS_CHART_DATA = { 
    labels: ['M-Pesa', 'Bank Transfer', 'Cash'], 
    datasets: [{ 
        label: 'Transactions',
        data: [1200, 450, 50], 
        backgroundColor: ['#10b981', '#3b82f6', '#9ca3af'] 
    }] 
};

export const MOCK_STAFF_PROFILES: StaffProfile[] = [
    { 
        id: 'staff1', name: 'Jane Smith', role: 'Field Agent', email: 'jane@taskme.re', phone: '0700000001', branch: 'Kericho Branch', status: 'Active', avatar: 'JS',
        department: 'Rental Management',
        salaryConfig: { type: 'Target Based', amount: 60000 },
        bankDetails: { bankName: 'KCB', accountNumber: '1122334455', kraPin: 'A00112233Z', defaultMethod: 'Bank' },
        payrollInfo: { baseSalary: 60000, nextPaymentDate: '2025-11-30' }, 
        leaveBalance: { annual: 12 }, 
        commissions: [{ date: '2025-10-15', amount: 5000, source: 'Lease Signing' }],
    },
    { 
        id: 'staff2', name: 'Mike Ross', role: 'Branch Manager', email: 'mike@taskme.re', phone: '0700000002', branch: 'Kisii Branch', status: 'Active', avatar: 'MR',
        department: 'Management',
        salaryConfig: { type: 'Monthly', amount: 85000 },
        bankDetails: { bankName: 'Equity', accountNumber: '5566778899', kraPin: 'A99887766Y', defaultMethod: 'Bank' },
        payrollInfo: { baseSalary: 85000, nextPaymentDate: '2025-11-30' }, 
        leaveBalance: { annual: 15 }, 
        commissions: [],
    }
];

export const MOCK_PAYSLIPS: Payslip[] = [
    { id: 'pay1', staffId: 'staff1', month: 'October 2025', basic: 45000, deductions: 5000, net: 40000 },
    { id: 'pay2', staffId: 'staff2', month: 'October 2025', basic: 85000, deductions: 12000, net: 73000 }
];

export const MOCK_PROFIT_MARGINS = {
    labels: ['Product A', 'Product B', 'Product C'],
    datasets: [
        { label: 'Margin %', data: [25, 30, 15], backgroundColor: '#3b82f6' }
    ]
};

export const MOCK_WORK_ORDERS: any[] = [
    { id: 'wo1', costs: { labor: 1500, materials: 500, travel: 200 } },
    { id: 'wo2', costs: { labor: 3000, materials: 5000, travel: 500 } }
];

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
    { id: 'log1', timestamp: '2025-11-01 10:00', action: 'User Login', user: 'Admin' },
    { id: 'log2', timestamp: '2025-11-01 10:15', action: 'Payment Recorded', user: 'System' }
];
