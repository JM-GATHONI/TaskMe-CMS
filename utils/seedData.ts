
import { 
    TenantProfile, Property, User, Unit, Task, TaskStatus, TaskPriority, Invoice, Bill, FineRule, OffboardingRecord,
    LandlordApplication, Workflow, CommunicationAutomationRule, EscalationRule, AuditLogEntry, Vendor, 
    PreventiveTask, Message, CommunicationTemplate, IncomeSource, RenovationProjectBill, StaffProfile, TenantApplication,
    ExternalTransaction, UnitType, Notification
} from '../types';
import { GEOSPATIAL_DATA } from '../constants';

// --- HELPERS ---
const id = () => Math.random().toString(36).substr(2, 9);

// Get a date relative to today's real date
const getRelativeDate = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
};

// Date constants for data consistency
const NOW = new Date();
const CURRENT_MONTH = NOW.getMonth();
const CURRENT_YEAR = NOW.getFullYear();
const CURRENT_MONTH_STR = NOW.toLocaleString('default', { month: 'long' });

const START_OF_CURRENT_MONTH = new Date(CURRENT_YEAR, CURRENT_MONTH, 1).toISOString().split('T')[0];
const START_OF_LAST_MONTH = new Date(CURRENT_YEAR, CURRENT_MONTH - 1, 1).toISOString().split('T')[0];
const FIVE_DAYS_AGO = getRelativeDate(-5);

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

// --- 2. STAFF ---
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
        payrollInfo: { baseSalary: 150000, nextPaymentDate: getRelativeDate(25) },
        leaveBalance: { annual: 30 },
        commissions: [],
        deductions: [],
        attendanceRecord: {}
    },
    // --- JOB OSINDI (Embedded Super Admin) ---
    {
        id: 'staff-jobosindi',
        name: 'JOB OSINDI',
        username: 'JOBOSINDI',
        role: 'Super Admin',
        email: 'job.osindi@taskme.re',
        phone: '0700000000',
        branch: 'Headquarters',
        status: 'Active',
        avatar: 'JO',
        department: 'Management',
        salaryConfig: { type: 'Monthly', amount: 0 },
        bankDetails: { bankName: '', accountNumber: '', kraPin: '', defaultMethod: 'Bank' },
        payrollInfo: { baseSalary: 0, nextPaymentDate: '' },
        leaveBalance: { annual: 0 },
        commissions: [],
        deductions: [],
        attendanceRecord: {},
        passwordHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92' // Hash of 123456
    },
    { 
        id: 'staff1', name: 'Admin Alice', role: 'Super Admin', email: 'alice@taskme.re', phone: '0700111222', branch: 'Headquarters', status: 'Active', avatar: 'AA',
        department: 'Administration',
        salaryConfig: { type: 'Monthly', amount: 80000 },
        bankDetails: { bankName: 'KCB', accountNumber: '1234567890', kraPin: 'A123456789Z', defaultMethod: 'Bank' },
        payrollInfo: { baseSalary: 80000, nextPaymentDate: getRelativeDate(25) }, leaveBalance: { annual: 15 }, commissions: [],
        deductions: [], attendanceRecord: {}
    },
    { 
        id: 'staff2', name: 'Manager Mike', role: 'Branch Manager', email: 'mike@taskme.re', phone: '0700111333', branch: 'Kericho Branch', status: 'Active', avatar: 'MM',
        department: 'Management',
        salaryConfig: { type: 'Monthly', amount: 60000 },
        bankDetails: { bankName: 'Equity', accountNumber: '0987654321', kraPin: 'A987654321Y', defaultMethod: 'Bank' },
        payrollInfo: { baseSalary: 60000, nextPaymentDate: getRelativeDate(25) }, leaveBalance: { annual: 10 }, commissions: [],
        deductions: [], attendanceRecord: {}
    },
    { 
        id: 'staff3', name: 'Agent Ann', role: 'Field Agent', email: 'ann@taskme.re', phone: '0700111444', branch: 'Kericho Branch', status: 'Active', avatar: 'AA',
        department: 'Rental Management',
        salaryConfig: { type: 'Target Based', amount: 60000 }, 
        bankDetails: { bankName: 'Co-op', accountNumber: '1122334455', kraPin: 'A112233445X', defaultMethod: 'Bank' },
        payrollInfo: { baseSalary: 60000, nextPaymentDate: getRelativeDate(25) }, leaveBalance: { annual: 5 }, commissions: [{date: getRelativeDate(-5), amount: 5000, source: 'New Tenant'}],
        deductions: [], attendanceRecord: {}
    },
    { 
        id: 'staff8', name: 'Agent Brian', role: 'Field Agent', email: 'brian@taskme.re', phone: '0700111999', branch: 'Kisii Branch', status: 'Active', avatar: 'AB',
        department: 'Rental Management',
        salaryConfig: { type: 'Target Based', amount: 55000 }, 
        bankDetails: { bankName: 'Equity', accountNumber: '2233445566', kraPin: 'A223344556Y', defaultMethod: 'Bank' },
        payrollInfo: { baseSalary: 55000, nextPaymentDate: getRelativeDate(25) }, leaveBalance: { annual: 12 }, commissions: [],
        deductions: [], attendanceRecord: {}
    },
    { 
        id: 'staff9', name: 'Agent Chloe', role: 'Field Agent', email: 'chloe@taskme.re', phone: '0700111000', branch: 'Headquarters', status: 'Active', avatar: 'AC',
        department: 'Rental Management',
        salaryConfig: { type: 'Target Based', amount: 58000 }, 
        bankDetails: { bankName: 'KCB', accountNumber: '3344556677', kraPin: 'A334455667Z', defaultMethod: 'Bank' },
        payrollInfo: { baseSalary: 58000, nextPaymentDate: getRelativeDate(25) }, leaveBalance: { annual: 8 }, commissions: [{date: getRelativeDate(-2), amount: 3000, source: 'Lease Renewal'}],
        deductions: [], attendanceRecord: {}
    },
    { 
        id: 'staff4', name: 'Caretaker Charles', role: 'Caretaker', email: 'charles@taskme.re', phone: '0700111555', branch: 'Kisii Branch', status: 'Active', avatar: 'CC',
        department: 'Maintenance',
        salaryConfig: { type: 'Monthly', amount: 25000 },
        bankDetails: { bankName: '', accountNumber: '', kraPin: 'A001122334W', mpesaNumber: '0700111555', defaultMethod: 'M-Pesa' },
        payrollInfo: { baseSalary: 25000, nextPaymentDate: getRelativeDate(25) }, leaveBalance: { annual: 12 }, commissions: [],
        deductions: [], attendanceRecord: {}
    },
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
                bedrooms: f === 0 ? 0 : f >= 3 ? 2 : 1, 
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

// Using Kenyan location data from GEOSPATIAL_DATA
export const SEED_PROPERTIES: Property[] = [
    {
        id: 'prop1', name: 'Riverside Apartments', type: 'Residential', rentType: 'Exclusive', ownership: 'In-house', branch: 'Kericho Branch', status: 'Active',
        landlordId: 'landlord1', assignedAgentId: 'staff3', location: 'Township', 
        county: 'Kericho', subCounty: 'Ainamoi', zone: 'CBD',
        defaultMonthlyRent: 15000, floors: 4,
        units: generateUnits(4, 6, 15000, 'A'), assets: [], defaultUnitType: 'One Bedroom'
    },
    {
        id: 'prop2', name: 'Green Valley Estate', type: 'Residential', rentType: 'Inclusive', ownership: 'Affiliate', branch: 'Kisii Branch', status: 'Active',
        landlordId: 'landlord2', assignedAgentId: 'staff8', location: 'Milimani',
        county: 'Kisii', subCounty: 'Nyaribari Chache', zone: 'Central', 
        defaultMonthlyRent: 22000, floors: 2,
        units: generateUnits(2, 8, 22000, 'GV'), assets: [], defaultUnitType: 'Two Bedrooms'
    },
    {
        id: 'prop3', name: 'Sunset Plaza', type: 'Commercial', rentType: 'Exclusive', ownership: 'In-house', branch: 'Kericho Branch', status: 'Active',
        landlordId: 'landlord1', assignedAgentId: 'staff3', location: 'CBD', 
        county: 'Kericho', subCounty: 'Ainamoi', zone: 'Township',
        defaultMonthlyRent: 40000, floors: 3,
        units: generateUnits(3, 4, 40000, 'OFF'), assets: [], defaultUnitType: 'Office'
    },
    {
        id: 'prop4', name: 'Highland Mall', type: 'Commercial', rentType: 'Exclusive', ownership: 'In-house', branch: 'Headquarters', status: 'Active',
        landlordId: 'landlord3', assignedAgentId: 'staff9', location: 'Westlands', 
        county: 'Nairobi', subCounty: 'Westlands', zone: 'Parklands',
        defaultMonthlyRent: 60000, floors: 2,
        units: generateUnits(2, 5, 60000, 'SH'), assets: [], defaultUnitType: 'Shop'
    }
];

// --- 4. TENANTS & TASKS (Progressive Data Logic) ---
export const SEED_TENANTS: TenantProfile[] = [];
export const SEED_TASKS: Task[] = [];
export const SEED_INVOICES: Invoice[] = [];
export const SEED_BILLS: Bill[] = [];

SEED_PROPERTIES.forEach(prop => {
    // Find assigned agent name for tasks
    const agent = SEED_STAFF_PROFILES.find(s => s.id === prop.assignedAgentId);
    const agentName = agent ? agent.name : 'Unassigned';

    prop.units.forEach((unit, index) => {
        // High occupancy
        if (Math.random() > 0.15) {
            const tenantName = getRandomName();
            const tenantId = `t-${id()}`;
            const rentAmount = unit.rent || prop.defaultMonthlyRent || 20000;
            let status: any = 'Active';
            let joinDate = getRelativeDate(-Math.floor(Math.random() * 200)); 
            
            // Scenario 1: New Tenant (Joined this month)
            if (index % 10 === 0) { 
                joinDate = START_OF_CURRENT_MONTH;
            }

            // Scenario 2: Arrears (Paid up to last month only)
            const isOverdueScenario = index % 5 === 0;

            const paymentHistory = [];
            
            // Historical Payments (Last 3 Months)
            for (let i = 3; i >= 1; i--) {
                 const d = new Date(CURRENT_YEAR, CURRENT_MONTH - i, 5);
                 const dateStr = d.toISOString().split('T')[0];
                 
                 paymentHistory.push({
                    date: dateStr,
                    amount: `KES ${rentAmount.toLocaleString()}`,
                    status: 'Paid',
                    method: Math.random() > 0.5 ? 'M-Pesa' : 'Bank',
                    reference: `REF-${Math.floor(Math.random()*100000)}`
                });
            }

            // Current Month Logic
            if (isOverdueScenario) {
                if (NOW.getDate() > 5) {
                    status = 'Overdue';
                }
            } else {
                paymentHistory.push({
                    date: `${START_OF_CURRENT_MONTH.slice(0,7)}-05`, // 5th of current month
                    amount: `KES ${rentAmount.toLocaleString()}`,
                    status: 'Paid',
                    method: 'M-Pesa',
                    reference: `REF-CURR-${Math.floor(Math.random()*100000)}`
                });
            }

            if (joinDate === START_OF_CURRENT_MONTH) {
                 status = 'Active';
                 paymentHistory.push({
                    date: joinDate,
                    amount: `KES ${(rentAmount * 2).toLocaleString()}`, // Rent + Deposit
                    status: 'Paid',
                    method: 'Bank',
                    reference: `DEP-RENT-${Math.floor(Math.random()*1000)}`
                 });
            }

            const outstandingBills = [];
            if (status === 'Overdue') {
                 outstandingBills.push({
                     id: `bill-${id()}`,
                     type: 'Rent Arrears',
                     amount: rentAmount,
                     date: `${START_OF_CURRENT_MONTH.slice(0,7)}-05`, 
                     status: 'Pending',
                     description: `Rent for ${CURRENT_MONTH_STR} ${CURRENT_YEAR}`
                 });
            }

            unit.status = 'Occupied';

            SEED_TENANTS.push({
                id: tenantId,
                name: tenantName,
                avatar: tenantName.split(' ').map(n => n[0]).join(''),
                propertyId: prop.id,
                propertyName: prop.name,
                unitId: unit.id,
                unit: unit.unitNumber,
                leaseType: 'Fixed',
                leaseEnd: getRelativeDate(365),
                onboardingDate: joinDate,
                rentAmount: rentAmount,
                rentDueDate: 5,
                depositPaid: rentAmount,
                status: status,
                email: `${tenantName.toLowerCase().replace(' ', '.')}@email.com`,
                phone: getRandomPhone(),
                paymentHistory: paymentHistory,
                outstandingBills: outstandingBills,
                outstandingFines: status === 'Overdue' ? [{ id: `fine-${id()}`, type: 'Late Rent', amount: 500, date: getRelativeDate(-1), status: 'Pending' }] : [],
                maintenanceRequests: [],
                notes: [],
                notices: [],
                requests: [], 
                idNumber: Math.floor(Math.random() * 30000000 + 10000000).toString(),
                dateRegistered: joinDate,
                houseStatus: []
            });

            // --- TASK GENERATION ---
            // Create a mix of tasks for dashboard population
            // Some assigned to the property agent, some unassigned
            if (Math.random() > 0.6) { // 40% of tenants have a task history
                
                const taskTypes = ['Leaking Tap', 'Broken Socket', 'Door Lock Issue', 'Paint Touchup', 'Rent Collection Follow-up'];
                const taskStatusOptions = [TaskStatus.Issued, TaskStatus.InProgress, TaskStatus.Pending, TaskStatus.Completed, TaskStatus.Closed];
                const taskPriorityOptions = [TaskPriority.Low, TaskPriority.Medium, TaskPriority.High, TaskPriority.VeryHigh];

                const randomStatus = taskStatusOptions[Math.floor(Math.random() * taskStatusOptions.length)];
                
                // Set due dates based on status
                let dueDate = getRelativeDate(3);
                if (randomStatus === TaskStatus.Completed || randomStatus === TaskStatus.Closed) {
                     dueDate = getRelativeDate(-Math.floor(Math.random() * 10)); // Completed in past
                } else if (randomStatus === TaskStatus.Pending) {
                     dueDate = getRelativeDate(-1); // Overdue pending review
                }

                SEED_TASKS.push({
                    id: `task-${id()}`,
                    title: taskTypes[Math.floor(Math.random() * taskTypes.length)],
                    description: `Reported by tenant. Please check ${unit.unitNumber}.`,
                    status: randomStatus,
                    priority: taskPriorityOptions[Math.floor(Math.random() * taskPriorityOptions.length)],
                    dueDate: dueDate,
                    sla: 48,
                    assignedTo: Math.random() > 0.3 ? agentName : 'Unassigned', // Most tasks assigned to agent
                    tenant: { name: tenantName, unit: unit.unitNumber },
                    property: prop.name,
                    comments: [],
                    history: [{ id: `h-${id()}`, timestamp: getRelativeDate(-5), event: 'Task Created' }],
                    attachments: [],
                    source: 'Internal',
                    costs: { labor: 0, materials: 0, travel: 0 }
                });
            }
        }
    });
});

// --- 5. BILLS (Payables) ---
// Add real bills for current period
SEED_BILLS.push({
    id: `bill-clean-1`,
    vendor: 'Spotless Cleaners',
    category: 'Cleaning',
    amount: 15000,
    invoiceDate: getRelativeDate(-5),
    dueDate: getRelativeDate(2),
    status: 'Unpaid',
    propertyId: 'prop1'
});

// --- 6. OTHER ---
export const SEED_FINE_RULES: FineRule[] = [
    { id: 'fr1', type: 'Late Rent', basis: 'Fixed Fee', value: 100, description: 'Daily penalty after 5th', appliesTo: 'Tenant' },
];

export const SEED_OFFBOARDING_RECORDS: OffboardingRecord[] = [];
export const SEED_VENDORS: Vendor[] = [
    { id: 'v1', name: 'FixIt All Ltd', specialty: 'General Repairs', rating: 4.5 }
];
export const SEED_WORKFLOWS: Workflow[] = [];
export const SEED_AUTOMATION_RULES: CommunicationAutomationRule[] = [
    { id: 'auto1', name: 'Rent Reminder', trigger: '3 Days Before Due', templateName: 'Rent Reminder', channels: ['SMS'], enabled: true }
];
export const SEED_ESCALATION_RULES: EscalationRule[] = [];
export const SEED_AUDIT_LOGS: AuditLogEntry[] = [];
export const SEED_LANDLORD_APPLICATIONS: LandlordApplication[] = [];
export const SEED_PREVENTIVE_TASKS: PreventiveTask[] = [];
export const SEED_MESSAGES: Message[] = [];
export const SEED_NOTIFICATIONS: Notification[] = [];
export const SEED_TEMPLATES: CommunicationTemplate[] = [];
export const SEED_INCOME_SOURCES: IncomeSource[] = [];
export const SEED_RENOVATION_PROJECT_BILLS: RenovationProjectBill[] = [];
export const SEED_TENANT_APPLICATIONS: TenantApplication[] = [];
export const SEED_EXTERNAL_TRANSACTIONS: ExternalTransaction[] = [];