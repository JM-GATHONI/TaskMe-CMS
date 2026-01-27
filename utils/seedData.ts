

import { 
    TenantProfile, Property, User, Unit, Task, TaskStatus, TaskPriority, Invoice, Bill, FineRule, OffboardingRecord,
    LandlordApplication, Workflow, CommunicationAutomationRule, EscalationRule, AuditLogEntry, Vendor, 
    PreventiveTask, Message, CommunicationTemplate, IncomeSource, RenovationProjectBill, StaffProfile, TenantApplication,
    ExternalTransaction, UnitType, Notification
} from '../types';

// --- HELPERS ---
const id = () => Math.random().toString(36).substr(2, 9);
const getDate = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
};

const FIRST_NAMES = ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack', 'Kevin', 'Laura', 'Mike', 'Nina', 'Oscar', 'Paul', 'Quincy', 'Rachel', 'Steve', 'Tom', 'Ursula', 'Victor', 'Wendy', 'Xavier', 'Yvonne', 'Zach'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson'];

const getRandomName = () => `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
const getRandomPhone = () => `07${Math.floor(Math.random() * 90000000 + 10000000)}`;

// --- 1. LANDLORDS ---
export const SEED_LANDLORDS: User[] = [
    { id: 'landlord1', name: 'Peter Owner', idNumber: '12345678', phone: '0711000001', email: 'peter@owner.com', role: 'Landlord', status: 'Active', branch: 'Headquarters' },
    { id: 'landlord2', name: 'Sarah Holdings', idNumber: '87654321', phone: '0722000002', email: 'sarah@holdings.com', role: 'Landlord', status: 'Active', branch: 'Kisii Branch' },
    { id: 'landlord3', name: 'Mega Properties Ltd', idNumber: '11223344', phone: '0733000003', email: 'info@mega.com', role: 'Landlord', status: 'Active', branch: 'Kericho Branch' },
    { id: 'landlord4', name: 'James Investor', idNumber: '99887766', phone: '0744000004', email: 'james@invest.com', role: 'Landlord', status: 'Active', branch: 'Headquarters' },
    { id: 'landlord5', name: 'City Ventures', idNumber: '55443322', phone: '0755000005', email: 'contact@cityventures.co.ke', role: 'Landlord', status: 'Active', branch: 'Kisii Branch' },
];

// --- 2. STAFF (Expanded for Field Ops Demo) ---
export const SEED_STAFF_PROFILES: StaffProfile[] = [
    // --- SUPER ADMIN (REQUESTED) ---
    {
        id: 'staff-ritch',
        name: 'JOSEPH RITCH',
        role: 'Super Admin',
        email: 'ritch.jr@taskme.re', 
        phone: '0724620403',
        branch: 'Headquarters',
        status: 'Active',
        avatar: 'JR',
        department: 'Management',
        salaryConfig: { type: 'Monthly', amount: 150000 },
        bankDetails: { bankName: 'KCB', accountNumber: '2645031000', kraPin: 'A0026450310Z', defaultMethod: 'Bank' },
        payrollInfo: { baseSalary: 150000, nextPaymentDate: getDate(25) },
        leaveBalance: { annual: 30 },
        commissions: [],
        deductions: [],
        attendanceRecord: {}
    },
    // -------------------------------
    { 
        id: 'staff1', name: 'Admin Alice', role: 'Super Admin', email: 'alice@taskme.re', phone: '0700111222', branch: 'Headquarters', status: 'Active', avatar: 'AA',
        department: 'Administration',
        salaryConfig: { type: 'Monthly', amount: 80000 },
        bankDetails: { bankName: 'KCB', accountNumber: '1234567890', kraPin: 'A123456789Z', defaultMethod: 'Bank' },
        payrollInfo: { baseSalary: 80000, nextPaymentDate: getDate(25) }, leaveBalance: { annual: 15 }, commissions: [],
        deductions: [], attendanceRecord: {}
    },
    { 
        id: 'staff2', name: 'Manager Mike', role: 'Branch Manager', email: 'mike@taskme.re', phone: '0700111333', branch: 'Kericho Branch', status: 'Active', avatar: 'MM',
        department: 'Management',
        salaryConfig: { type: 'Monthly', amount: 60000 },
        bankDetails: { bankName: 'Equity', accountNumber: '0987654321', kraPin: 'A987654321Y', defaultMethod: 'Bank' },
        payrollInfo: { baseSalary: 60000, nextPaymentDate: getDate(25) }, leaveBalance: { annual: 10 }, commissions: [],
        deductions: [], attendanceRecord: {}
    },
    { 
        id: 'staff3', name: 'Agent Ann', role: 'Field Agent', email: 'ann@taskme.re', phone: '0700111444', branch: 'Kericho Branch', status: 'Active', avatar: 'AA',
        department: 'Rental Management',
        salaryConfig: { type: 'Target Based', amount: 60000 }, 
        bankDetails: { bankName: 'Co-op', accountNumber: '1122334455', kraPin: 'A112233445X', defaultMethod: 'Bank' },
        payrollInfo: { baseSalary: 60000, nextPaymentDate: getDate(25) }, leaveBalance: { annual: 5 }, commissions: [{date: getDate(-5), amount: 5000, source: 'New Tenant'}],
        deductions: [], attendanceRecord: {}
    },
    { 
        id: 'staff8', name: 'Agent Brian', role: 'Field Agent', email: 'brian@taskme.re', phone: '0700111999', branch: 'Kisii Branch', status: 'Active', avatar: 'AB',
        department: 'Rental Management',
        salaryConfig: { type: 'Target Based', amount: 55000 }, 
        bankDetails: { bankName: 'Equity', accountNumber: '2233445566', kraPin: 'A223344556Y', defaultMethod: 'Bank' },
        payrollInfo: { baseSalary: 55000, nextPaymentDate: getDate(25) }, leaveBalance: { annual: 12 }, commissions: [],
        deductions: [], attendanceRecord: {}
    },
    { 
        id: 'staff9', name: 'Agent Chloe', role: 'Field Agent', email: 'chloe@taskme.re', phone: '0700111000', branch: 'Headquarters', status: 'Active', avatar: 'AC',
        department: 'Rental Management',
        salaryConfig: { type: 'Target Based', amount: 58000 }, 
        bankDetails: { bankName: 'KCB', accountNumber: '3344556677', kraPin: 'A334455667Z', defaultMethod: 'Bank' },
        payrollInfo: { baseSalary: 58000, nextPaymentDate: getDate(25) }, leaveBalance: { annual: 8 }, commissions: [{date: getDate(-2), amount: 3000, source: 'Lease Renewal'}],
        deductions: [], attendanceRecord: {}
    },
    { 
        id: 'staff10', name: 'Agent David', role: 'Field Agent', email: 'david@taskme.re', phone: '0700222111', branch: 'Kericho Branch', status: 'On Leave', avatar: 'AD',
        department: 'Rental Management',
        salaryConfig: { type: 'Target Based', amount: 55000 }, 
        bankDetails: { bankName: 'Co-op', accountNumber: '4455667788', kraPin: 'A445566778W', defaultMethod: 'Bank' },
        payrollInfo: { baseSalary: 55000, nextPaymentDate: getDate(25) }, leaveBalance: { annual: 0 }, commissions: [],
        deductions: [], attendanceRecord: {}
    },
    { 
        id: 'staff4', name: 'Caretaker Charles', role: 'Caretaker', email: 'charles@taskme.re', phone: '0700111555', branch: 'Kisii Branch', status: 'Active', avatar: 'CC',
        department: 'Maintenance',
        salaryConfig: { type: 'Monthly', amount: 25000 },
        bankDetails: { bankName: '', accountNumber: '', kraPin: 'A001122334W', mpesaNumber: '0700111555', defaultMethod: 'M-Pesa' },
        payrollInfo: { baseSalary: 25000, nextPaymentDate: getDate(25) }, leaveBalance: { annual: 12 }, commissions: [],
        deductions: [], attendanceRecord: {}
    },
    { 
        id: 'staff5', name: 'Accountant Alex', role: 'Super Admin', email: 'alex@taskme.re', phone: '0700111666', branch: 'Headquarters', status: 'Active', avatar: 'AL',
        department: 'Administration',
        salaryConfig: { type: 'Monthly', amount: 70000 },
        bankDetails: { bankName: 'KCB', accountNumber: '5566778899', kraPin: 'A556677889V', defaultMethod: 'Bank' },
        payrollInfo: { baseSalary: 70000, nextPaymentDate: getDate(25) }, leaveBalance: { annual: 18 }, commissions: [],
        deductions: [], attendanceRecord: {}
    },
    {
        id: 'staff6', name: 'Guard George', role: 'Caretaker', email: 'george@taskme.re', phone: '0700111777', branch: 'Kericho Branch', status: 'Active', avatar: 'GG',
        department: 'Security',
        salaryConfig: { type: 'Monthly', amount: 20000 },
        bankDetails: { bankName: '', accountNumber: '', kraPin: 'A998877665U', mpesaNumber: '0700111777', defaultMethod: 'M-Pesa' },
        payrollInfo: { baseSalary: 20000, nextPaymentDate: getDate(25) }, leaveBalance: { annual: 10 }, commissions: [],
        deductions: [], attendanceRecord: {}
    },
    {
        id: 'staff7', name: 'Cleaner Cindy', role: 'Caretaker', email: 'cindy@taskme.re', phone: '0700111888', branch: 'Kisii Branch', status: 'Active', avatar: 'CC',
        department: 'Cleaning',
        salaryConfig: { type: 'Per Project', amount: 1500 },
        bankDetails: { bankName: '', accountNumber: '', kraPin: 'A445566778T', mpesaNumber: '0700111888', defaultMethod: 'M-Pesa' },
        payrollInfo: { baseSalary: 0, nextPaymentDate: getDate(25) }, leaveBalance: { annual: 0 }, commissions: [],
        deductions: [], attendanceRecord: {}
    }
];

// --- 3. PROPERTIES & UNITS ---
const generateUnits = (floors: number, unitsPerFloor: number, baseRent: number, namingScheme: string = 'Block'): Unit[] => {
    const units: Unit[] = [];
    const types: UnitType[] = ['Single Room', 'Double Room', 'Bedsitter', 'One Bedroom', 'Two Bedrooms'];
    
    for (let f = 0; f < floors; f++) {
        for (let u = 1; u <= unitsPerFloor; u++) {
            const floorLabel = f === 0 ? 'G' : f;
            const unitNum = `${namingScheme}-${floorLabel}${u.toString().padStart(2, '0')}`;
            const typeIndex = Math.min(f, types.length - 1);
            
            units.push({
                id: `unit-${id()}`,
                unitNumber: unitNum,
                floor: f,
                bedrooms: f === 0 ? 0 : f >= 3 ? 2 : 1, // G=0(bedsitter), 1/2=1BR, 3+=2BR
                bathrooms: 1,
                amenities: ['Water', 'Electricity', 'WiFi Ready'],
                status: 'Vacant', 
                rent: baseRent + (f * 1000),
                unitType: types[typeIndex]
            });
        }
    }
    return units;
};

export const SEED_PROPERTIES: Property[] = [
    {
        id: 'prop1', name: 'Riverside Apartments', type: 'Residential', rentType: 'Exclusive', ownership: 'In-house', branch: 'Kericho Branch', status: 'Active',
        landlordId: 'landlord1', assignedAgentId: 'staff3', location: 'Township', defaultMonthlyRent: 15000, floors: 4,
        units: generateUnits(4, 6, 15000, 'A'), assets: [], defaultUnitType: 'One Bedroom'
    },
    {
        id: 'prop2', name: 'Green Valley Estate', type: 'Residential', rentType: 'Inclusive', ownership: 'Affiliate', branch: 'Kisii Branch', status: 'Active',
        landlordId: 'landlord2', assignedAgentId: 'staff8', location: 'Milimani', defaultMonthlyRent: 22000, floors: 2,
        units: generateUnits(2, 8, 22000, 'GV'), assets: [], defaultUnitType: 'Two Bedrooms'
    },
    {
        id: 'prop3', name: 'Sunset Plaza', type: 'Commercial', rentType: 'Exclusive', ownership: 'In-house', branch: 'Kericho Branch', status: 'Active',
        landlordId: 'landlord1', assignedAgentId: 'staff3', location: 'CBD', defaultMonthlyRent: 40000, floors: 3,
        units: generateUnits(3, 4, 40000, 'OFF'), assets: [], defaultUnitType: 'Office'
    },
    {
        id: 'prop4', name: 'Highland Mall', type: 'Commercial', rentType: 'Exclusive', ownership: 'In-house', branch: 'Headquarters', status: 'Active',
        landlordId: 'landlord3', assignedAgentId: 'staff9', location: 'Westlands', defaultMonthlyRent: 60000, floors: 2,
        units: generateUnits(2, 5, 60000, 'SH'), assets: [], defaultUnitType: 'Shop'
    },
     {
        id: 'prop5', name: 'Serenity Gardens', type: 'Mixed-Use', rentType: 'Inclusive', ownership: 'Affiliate', branch: 'Kisii Branch', status: 'Active',
        landlordId: 'landlord2', assignedAgentId: 'staff8', location: 'Nyanchwa', defaultMonthlyRent: 18000, floors: 1,
        units: generateUnits(1, 10, 18000, 'SG'), assets: [], defaultUnitType: 'Double Room'
    },
    {
        id: 'prop6', name: 'Sunny Side Heights', type: 'Residential', rentType: 'Exclusive', ownership: 'In-house', branch: 'Headquarters', status: 'Active',
        landlordId: 'landlord4', assignedAgentId: 'staff9', location: 'Kileleshwa', defaultMonthlyRent: 35000, floors: 5,
        units: generateUnits(5, 4, 35000, 'S'), assets: [], defaultUnitType: 'Two Bedrooms'
    }
];

// --- 4. TENANTS, TASKS, BILLS, INVOICES ---
export const SEED_TENANTS: TenantProfile[] = [];
export const SEED_TASKS: Task[] = [];
export const SEED_INVOICES: Invoice[] = [];
export const SEED_BILLS: Bill[] = [];

SEED_PROPERTIES.forEach(prop => {
    prop.units.forEach((unit, index) => {
        // 90% Occupancy for richer seed data
        if (Math.random() > 0.10) {
            const tenantName = getRandomName();
            const tenantId = `t-${id()}`;
            const joinDate = getDate(-Math.floor(Math.random() * 400)); 
            
            unit.status = 'Occupied';
            const rentAmount = unit.rent || prop.defaultMonthlyRent || 20000;
            
            // Status Logic
            let status: any = 'Active';
            let leaseEnd = getDate(365); // Default 1 year from now
            if (Math.random() > 0.9) { status = 'Overdue'; }
            else if (Math.random() > 0.95) { status = 'Notice'; leaseEnd = getDate(30); }

            // Payment History
            const paymentHistory = [];
            const currentMonthIso = new Date().toISOString().slice(0, 7); // YYYY-MM
            
            // Generate historical payments (Last 6 months excluding current)
            for(let i=1; i<=6; i++) {
                const payDate = getDate(-(i * 30));
                paymentHistory.push({
                    date: payDate,
                    amount: `KES ${rentAmount.toLocaleString()}`,
                    status: 'Paid',
                    method: Math.random() > 0.5 ? 'M-Pesa' : 'Bank',
                    reference: `REF-${Math.floor(Math.random()*100000)}`
                });
            }

            // Current Month Payment Logic
            // If active and NOT overdue, add a payment for this month (e.g., 5th)
            if (status !== 'Overdue') {
                paymentHistory.unshift({
                    date: `${currentMonthIso}-05`,
                    amount: `KES ${rentAmount.toLocaleString()}`,
                    status: 'Paid',
                    method: Math.random() > 0.5 ? 'M-Pesa' : 'Bank',
                    reference: `REF-CURR-${Math.floor(Math.random()*100000)}`
                });
            }

            // Outstanding Bills
            const outstandingBills = [];
             if (status === 'Overdue') {
                 // For overdue tenants, ensure NO current month payment in history is key,
                 // and add to outstanding bills.
                 outstandingBills.push({
                     id: `bill-${id()}`,
                     type: 'Rent Arrears',
                     amount: rentAmount,
                     date: getDate(5), // Due date was 5 days from whatever reference, or simply use 5th of current
                     status: 'Pending',
                     description: `Rent for ${unit.unitNumber}`
                 });
             }
             if (Math.random() > 0.8) {
                 outstandingBills.push({
                     id: `bill-${id()}`,
                     type: 'Water',
                     amount: 500,
                     date: getDate(-2),
                     status: 'Pending',
                     description: `Metered Water Bill`
                 });
             }

            // Create Tenant
            SEED_TENANTS.push({
                id: tenantId,
                name: tenantName,
                avatar: tenantName.split(' ').map(n => n[0]).join(''),
                propertyId: prop.id,
                propertyName: prop.name,
                unitId: unit.id,
                unit: unit.unitNumber,
                leaseType: 'Fixed',
                leaseEnd: leaseEnd,
                onboardingDate: joinDate,
                rentAmount: rentAmount,
                rentDueDate: 5,
                depositPaid: rentAmount,
                status: status,
                email: `${tenantName.toLowerCase().replace(' ', '.')}@email.com`,
                phone: getRandomPhone(),
                paymentHistory: paymentHistory,
                outstandingBills: outstandingBills,
                outstandingFines: status === 'Overdue' ? [{ id: `fine-${id()}`, type: 'Late Rent', amount: 500, date: getDate(-2), status: 'Pending' }] : [],
                maintenanceRequests: [],
                notes: [],
                notices: status === 'Notice' ? [{ id: `ntc-${id()}`, type: 'Vacation', origin: 'Client', dateIssued: getDate(-5), effectiveDate: leaseEnd, reason: 'Moving to another city', status: 'Active' }] : [],
                requests: [], 
                idNumber: Math.floor(Math.random() * 30000000 + 10000000).toString(),
                dateRegistered: joinDate,
                houseStatus: []
            });

            // Create Overdue Invoice
            if (status === 'Overdue') {
                SEED_INVOICES.push({
                    id: `inv-${id()}`,
                    invoiceNumber: `INV-${Math.floor(Math.random()*10000)}`,
                    category: 'Outbound',
                    tenantName: tenantName,
                    unit: unit.unitNumber,
                    amount: rentAmount,
                    dueDate: getDate(5),
                    status: 'Overdue',
                    items: [{ description: 'Rent Arrears', amount: rentAmount, quantity: 1, unitPrice: rentAmount }]
                });
            }

            // Create Tasks (Distribute among agents)
            if (Math.random() > 0.8) {
                const taskTitles = ['Leaking Tap', 'Broken Window', 'Power Outage', 'Door Lock Jammed', 'Paint Peeling'];
                const taskStatus: TaskStatus = Math.random() > 0.5 ? TaskStatus.Completed : TaskStatus.Pending;
                const isExternal = Math.random() > 0.7;
                
                // Smart Assignment based on Property Agent
                const propAgentId = prop.assignedAgentId;
                const agent = SEED_STAFF_PROFILES.find(s => s.id === propAgentId);
                const assignedTo = agent ? agent.name : 'Unassigned';

                SEED_TASKS.push({
                    id: `task-${id()}`,
                    title: taskTitles[Math.floor(Math.random() * taskTitles.length)],
                    description: 'Issue reported by tenant via portal.',
                    status: taskStatus,
                    priority: Math.random() > 0.7 ? TaskPriority.High : TaskPriority.Medium,
                    dueDate: getDate(3),
                    sla: 48,
                    assignedTo: assignedTo,
                    tenant: { name: tenantName, unit: unit.unitNumber },
                    property: prop.name,
                    comments: [],
                    history: [{ id: `h-${id()}`, timestamp: new Date().toLocaleString(), event: 'Task Created' }],
                    attachments: [],
                    source: isExternal ? 'External' : 'Internal',
                    costs: { labor: 500, materials: 200, travel: 100 }
                });
            }
        } else {
            if (Math.random() > 0.8) unit.status = 'Under Maintenance';
        }
    });
});

// Ensure explicit Cleaning Task
SEED_TASKS.push({
    id: 'task-clean-1',
    title: 'Deep Clean Common Areas',
    description: 'Monthly cleaning of corridors and lobby',
    status: TaskStatus.Completed,
    priority: TaskPriority.Medium,
    dueDate: getDate(-1),
    sla: 24,
    assignedTo: 'Spotless Cleaners',
    tenant: { name: 'N/A', unit: 'Common Area' },
    property: 'Riverside Apartments',
    comments: [],
    history: [],
    attachments: [],
    source: 'External',
    costs: { labor: 5000, materials: 2000, travel: 500 } // Total 7500
});

// --- 5. BILLS (Payables & Outbound) ---
const billCategories = ['Water', 'Electricity', 'Garbage', 'Security', 'Internet', 'Cleaning', 'Maintenance', 'Vendor', 'Deposit Refund', 'Landlord Payout'];
// Generate diverse bills to populate all Outbound cards
for(let i=0; i<30; i++) {
    const cat = billCategories[Math.floor(Math.random() * billCategories.length)];
    const vendorNames = ['Nairobi Water', 'KPLC', 'G4S Security', 'Spotless Cleaners', 'FixIt Hardware', 'Ex-Tenant Refund', 'Peter Owner Payout', 'Zuku Fiber'];
    SEED_BILLS.push({
        id: `bill-${id()}`,
        vendor: vendorNames[Math.floor(Math.random() * vendorNames.length)],
        category: cat,
        amount: Math.floor(Math.random() * 20000) + 1000,
        invoiceDate: getDate(-Math.floor(Math.random() * 60)),
        dueDate: getDate(Math.floor(Math.random() * 15)),
        status: Math.random() > 0.3 ? 'Paid' : 'Unpaid',
        propertyId: 'General'
    });
}

// Explicit Cleaning Bill
SEED_BILLS.push({
    id: 'bill-clean-1',
    vendor: 'Spotless Cleaners',
    category: 'Cleaning',
    amount: 15000,
    invoiceDate: getDate(-5),
    dueDate: getDate(2),
    status: 'Unpaid',
    propertyId: 'prop1'
});

// Explicit Vendor Bills
SEED_BILLS.push({
    id: 'bill-vendor-1',
    vendor: 'BuildRight Hardware',
    category: 'Vendor',
    amount: 45000,
    invoiceDate: getDate(-10),
    dueDate: getDate(5),
    status: 'Unpaid',
    propertyId: 'prop1'
});
SEED_BILLS.push({
    id: 'bill-vendor-2',
    vendor: 'Office Supplies Ltd',
    category: 'Vendor',
    amount: 12000,
    invoiceDate: getDate(-5),
    dueDate: getDate(2),
    status: 'Unpaid',
    propertyId: 'Headquarters'
});

// Explicit Other Payments
SEED_BILLS.push({
    id: 'bill-other-1',
    vendor: 'Zuku Fiber',
    category: 'Internet',
    amount: 5000,
    invoiceDate: getDate(-15),
    dueDate: getDate(5),
    status: 'Unpaid',
    propertyId: 'Headquarters'
});
SEED_BILLS.push({
    id: 'bill-other-2',
    vendor: 'City Council',
    category: 'Licences',
    amount: 15000,
    invoiceDate: getDate(-20),
    dueDate: getDate(10),
    status: 'Unpaid',
    propertyId: 'Headquarters'
});
SEED_BILLS.push({
    id: 'bill-other-3',
    vendor: 'Lawyer James',
    category: 'Legal',
    amount: 30000,
    invoiceDate: getDate(-5),
    dueDate: getDate(2),
    status: 'Unpaid',
    propertyId: 'General'
});

// --- 6. INBOUND INVOICES & PAYMENTS (Mocking Categories) ---
if (SEED_TENANTS.length > 0) {
    // Add a deposit payment
    SEED_TENANTS[0].paymentHistory.push({
        date: getDate(-1), amount: `KES ${SEED_TENANTS[0].rentAmount}`, status: 'Paid', method: 'M-Pesa', reference: 'DEP-001'
    });
    // Add a fine payment
    SEED_TENANTS[1].paymentHistory.push({
        date: getDate(-2), amount: 'KES 500', status: 'Paid', method: 'M-Pesa', reference: 'FINE-001'
    });
}


// --- 7. OTHER DATA ---
export const SEED_FINE_RULES: FineRule[] = [
    { id: 'fr1', type: 'Late Rent', basis: 'Fixed Fee', value: 100, description: 'Daily penalty after due date + grace', appliesTo: 'Tenant' },
    { id: 'fr2', type: 'Water Reconnection', basis: 'Fixed Fee', value: 200, description: 'Reconnection fee', appliesTo: 'Tenant' },
    { id: 'fr3', type: 'Electricity Reconnection', basis: 'Fixed Fee', value: 200, description: 'Reconnection fee', appliesTo: 'Tenant' },
    { id: 'fr4', type: 'Noise Violation', basis: 'Fixed Fee', value: 1000, description: 'Community disturbance penalty', appliesTo: 'Tenant' },
    { id: 'fr5', type: 'Forced Entry', basis: 'Fixed Fee', value: 1000, description: 'Unauthorized access / damage', appliesTo: 'Tenant' }
];

export const SEED_OFFBOARDING_RECORDS: OffboardingRecord[] = [];
// Create completed record
SEED_OFFBOARDING_RECORDS.push({
    id: 'off-1', tenantId: 'mock-t-1', tenantName: 'Ex-Tenant Tom', unit: 'A-101', 
    noticeDate: getDate(-40), moveOutDate: getDate(-10), status: 'Completed', 
    inspectionStatus: 'Passed', utilityClearance: true, depositRefunded: true, keysReturned: true, finalBillAmount: 0
});
// Create pending refund record to populate Outbound Deposit Refund Card
SEED_OFFBOARDING_RECORDS.push({
    id: 'off-2', tenantId: 't-refund-demo', tenantName: 'Sarah Moving', unit: 'B-202',
    noticeDate: getDate(-35), moveOutDate: getDate(-5), status: 'Completed',
    inspectionStatus: 'Passed', utilityClearance: true, depositRefunded: false, keysReturned: true, finalBillAmount: 25000
});

export const SEED_VENDORS: Vendor[] = [
    { id: 'v1', name: 'FixIt All Ltd', specialty: 'General Repairs', rating: 4.5 },
    { id: 'v2', name: 'Sparky Electricians', specialty: 'Electrical', rating: 4.8 },
    { id: 'v3', name: 'Flow Plumbers', specialty: 'Plumbing', rating: 4.2 }
];

export const SEED_WORKFLOWS: Workflow[] = [
    { id: 'wf1', name: 'New Tenant Onboarding', trigger: 'Lease Signed', steps: ['Verify ID', 'Collect Deposit', 'Handover Keys', 'Send Welcome Packet'] },
    { id: 'wf2', name: 'Maintenance Request', trigger: 'Ticket Created', steps: ['Assess Severity', 'Assign Vendor', 'Verify Work', 'Close Ticket'] }
];

export const SEED_AUTOMATION_RULES: CommunicationAutomationRule[] = [
    { id: 'auto1', name: 'Rent Reminder', trigger: '3 Days Before Due', templateName: 'Rent Reminder', channels: ['SMS', 'Email'], enabled: true },
    { id: 'auto2', name: 'Payment Receipt', trigger: 'Payment Recorded', templateName: 'Receipt', channels: ['SMS'], enabled: true },
    { id: 'auto3', name: 'Automated Daily Fine', trigger: 'Rent Overdue > 1 Day', templateName: 'Fine Alert', channels: ['SMS'], enabled: true }
];

export const SEED_ESCALATION_RULES: EscalationRule[] = [
    { id: 'esc1', condition: 'Task Overdue > 24h', action: 'Notify Manager', assignedTo: 'Manager Mike' },
    { id: 'esc2', condition: 'Rent Overdue > 7 Days', action: 'Issue Warning Letter', assignedTo: 'System' }
];

export const SEED_AUDIT_LOGS: AuditLogEntry[] = [
    { id: 'aud1', timestamp: getDate(0), action: 'User Login', user: 'Admin Alice' },
    { id: 'aud2', timestamp: getDate(-1), action: 'Payment Recorded', user: 'System' }
];

export const SEED_LANDLORD_APPLICATIONS: LandlordApplication[] = [
    { id: 'app-1', name: 'John Kamau', email: 'john.kamau@example.com', phone: '0712345678', idNumber: '23456789', status: 'Pending', date: new Date().toISOString().split('T')[0], proposedProperties: [], notes: 'Has 3 commercial properties in CBD.' },
    { id: 'app-2', name: 'Alice Wanjiku', email: 'alice.w@example.com', phone: '0722334455', idNumber: '34567890', status: 'Approved', date: '2025-10-15', proposedProperties: [], notes: 'Residential flats in Westlands.' },
    { id: 'app-3', name: 'Robert Ochieng', email: 'r.ochieng@example.com', phone: '0733445566', idNumber: '12345678', status: 'Rejected', date: '2025-09-20', proposedProperties: [], notes: 'Documents incomplete.' },
];

export const SEED_PREVENTIVE_TASKS: PreventiveTask[] = [
    { id: 'pt1', title: 'Generator Service', asset: 'Backup Gen - Riverside', frequency: 'Monthly', nextDueDate: getDate(15) },
    { id: 'pt2', title: 'Water Tank Cleaning', asset: 'Main Tank - Green Valley', frequency: 'Quarterly', nextDueDate: getDate(45) }
];

// --- 8. COMMUNICATIONS & NOTIFICATIONS ---
export const SEED_MESSAGES: Message[] = [
    {
        id: 'msg-seed-1',
        recipient: { name: 'Ritch', contact: '0700111222' },
        content: 'Good morning Ritch, your rent arrears have accumalated fines for three days totaling ksh 300,total rent balance is ksh 3300. Kindly pay today to avoid further fines.',
        channel: 'SMS',
        status: 'Sent',
        timestamp: getDate(0),
        priority: 'High'
    },
    {
        id: 'msg-seed-2',
        recipient: { name: 'John Doe', contact: '0700333444' },
        content: 'You have been fined ksh 1000 for forced entry, kindly pay to avoid further penalties.',
        channel: 'SMS',
        status: 'Sent',
        timestamp: getDate(-2),
        priority: 'High'
    }
];

export const SEED_NOTIFICATIONS: Notification[] = [
    { id: 'notif-1', title: 'Payment Received', message: 'Tenant Ritch paid KES 3,300 via M-Pesa.', date: getDate(0), read: false, type: 'Success', recipientRole: 'All' },
    { id: 'notif-2', title: 'Late Rent Fine', message: 'Automated fine of KES 100 applied to Unit A-105.', date: getDate(-1), read: false, type: 'Warning', recipientRole: 'All' },
    { id: 'notif-3', title: 'Task Escalated', message: 'Leaking pipe reported in B-202 is overdue.', date: getDate(-2), read: true, type: 'Alert', recipientRole: 'All' }
];

export const SEED_TEMPLATES: CommunicationTemplate[] = [
    { id: 'tpl1', name: 'Rent Reminder', type: 'SMS', content: 'Dear {name}, your rent of KES {amount} is due on {date}. Pay via M-Pesa.' },
    { id: 'tpl2', name: 'Welcome', type: 'Email', content: 'Welcome to {property}, {name}! We are glad to have you.' },
    { id: 'tpl3', name: 'Fine Alert', type: 'SMS', content: 'Good morning {name}, your arrears have accumulated fines. Balance: {balance}. Pay now to avoid penalties.' }
];
export const SEED_INCOME_SOURCES: IncomeSource[] = [];
export const SEED_RENOVATION_PROJECT_BILLS: RenovationProjectBill[] = [];

export const SEED_TENANT_APPLICATIONS: TenantApplication[] = [
    {
        id: 'app-101',
        name: 'Michael Scott',
        phone: '0700123456',
        email: 'michael.s@dunder.com',
        idNumber: '22334455',
        kraPin: 'A00223344Z',
        property: 'Riverside Apartments',
        unit: 'A-105',
        status: 'New',
        submittedDate: getDate(-2),
        source: 'Walk-in',
        rentStartDate: getDate(5),
        documents: [],
        recurringBills: { serviceCharge: 0, garbage: 0, security: 0, waterFixed: 0, other: 0 }
    },
    {
        id: 'app-102',
        name: 'Dwight Schrute',
        phone: '0700654321',
        email: 'dwight@farms.com',
        idNumber: '33445566',
        property: 'Green Valley Estate',
        unit: 'GV-002',
        status: 'Under Review',
        submittedDate: getDate(-5),
        source: 'Referral',
        rentStartDate: getDate(10),
        documents: [{name: 'ID Copy.pdf', type: 'application/pdf', url: '#'}],
        recurringBills: { serviceCharge: 2000, garbage: 500, security: 0, waterFixed: 0, other: 0 }
    },
    {
        id: 'app-103',
        name: 'Pam Beesly',
        phone: '0700987654',
        email: 'pam@art.com',
        property: 'Sunset Plaza',
        unit: 'OFF-201',
        status: 'Approved',
        submittedDate: getDate(-10),
        source: 'Website',
        rentStartDate: getDate(0),
        documents: [],
        recurringBills: { serviceCharge: 0, garbage: 0, security: 0, waterFixed: 0, other: 0 }
    }
];

// --- 7. RECONCILIATION / EXTERNAL TRANSACTIONS ---
export const SEED_EXTERNAL_TRANSACTIONS: ExternalTransaction[] = [
    {
        id: 'ext-1', date: getDate(0), reference: 'QKD829JS', transactionCode: 'QKD829JS',
        amount: 15000, name: 'John Doe', account: '0722000000', type: 'M-Pesa', matched: false
    },
    {
        id: 'ext-2', date: getDate(-1), reference: 'REF-992', transactionCode: 'REF-992',
        amount: 25000, name: 'Alice Smith', account: 'KCB-12345', type: 'Bank', matched: false
    },
    {
        id: 'ext-3', date: getDate(-2), reference: 'QKD999KK', transactionCode: 'QKD999KK',
        amount: 5000, name: 'Unknown Payer', account: '0733000000', type: 'M-Pesa', matched: false
    },
    {
        id: 'ext-4', date: getDate(-3), reference: 'FT-8832', transactionCode: 'FT-8832',
        amount: 40000, name: 'Commercial Tenant Ltd', account: 'EQ-998877', type: 'Bank', matched: false
    },
     {
        id: 'ext-5', date: getDate(0), reference: 'QKD111AA', transactionCode: 'QKD111AA',
        amount: 12000, name: 'Mary Jane', account: '0711000000', type: 'M-Pesa', matched: false
    }
];
