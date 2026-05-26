import { v4 as uuidv4 } from 'uuid';

export const sampleSchemes = [
  { id: uuidv4(), name: 'PMGSY' },
  { id: uuidv4(), name: 'MGNREGA' },
  { id: uuidv4(), name: 'Jal Jeevan Mission' },
  { id: uuidv4(), name: 'Smart City Mission' },
  { id: uuidv4(), name: 'AMRUT' },
  { id: uuidv4(), name: 'Pradhan Mantri Awas Yojana' },
  { id: uuidv4(), name: 'National Highway Development' },
  { id: uuidv4(), name: 'State Highway Improvement' },
  { id: uuidv4(), name: 'Rural Road Development' },
  { id: uuidv4(), name: 'Urban Infrastructure' }
];

export const sampleConstituencies = [
  { id: uuidv4(), name: 'Thiruvananthapuram' },
  { id: uuidv4(), name: 'Kollam' },
  { id: uuidv4(), name: 'Pathanamthitta' },
  { id: uuidv4(), name: 'Alappuzha' },
  { id: uuidv4(), name: 'Kottayam' },
  { id: uuidv4(), name: 'Idukki' },
  { id: uuidv4(), name: 'Ernakulam' },
  { id: uuidv4(), name: 'Thrissur' },
  { id: uuidv4(), name: 'Palakkad' },
  { id: uuidv4(), name: 'Malappuram' }
];

export const sampleGrants = [
  { id: uuidv4(), scheme: 'State Highway Improvement', amount: 100000000, date: '2024-01-15', goNumber: 'GO(Ms)No.01/2024' },
  { id: uuidv4(), scheme: 'PMGSY', amount: 50000000, date: '2023-04-10', goNumber: 'GO(Ms)No.02/2023' },
  { id: uuidv4(), scheme: 'Jal Jeevan Mission', amount: 150000000, date: '2024-11-20', goNumber: 'GO(Ms)No.03/2024' },
  { id: uuidv4(), scheme: 'Smart City Mission', amount: 200000000, date: '2024-05-05', goNumber: 'GO(Ms)No.04/2024' },
];

export const statusOptions = [
  { value: 'completed', label: 'Completed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'yet_to_start', label: 'Yet to Start' }
];

export const sampleContractors = [
  { id: uuidv4(), name:'M/s Kerala Infrastructure Ltd', phone:'9876543210', email:'info@keralinfra.com', address:'Kottayam', registrationNo:'KL/CON/2021/4521', category:'A' },
  { id: uuidv4(), name:'M/s Hill Country Builders', phone:'9876543211', email:'hcb@gmail.com', address:'Idukki', registrationNo:'KL/CON/2020/3312', category:'A' },
  { id: uuidv4(), name:'M/s AquaTech Solutions', phone:'9876543212', email:'aqua@tech.com', address:'Palakkad', registrationNo:'KL/CON/2022/5543', category:'B' }
];

export const sampleEngineers = [
  { id: uuidv4(), name:'Er. Arun Kumar', designation:'Junior Engineer', phone:'9845001001', email:'arun.je@pwd.gov.in', division:'Kottayam' },
  { id: uuidv4(), name:'Er. Priya Nair', designation:'Assistant Engineer', phone:'9845001002', email:'priya.ae@pwd.gov.in', division:'Kottayam' },
  { id: uuidv4(), name:'Er. Rahul Menon', designation:'Junior Engineer', phone:'9845001003', email:'rahul.je@pwd.gov.in', division:'Idukki' }
];

export const sampleProjects = [
  {
    id: uuidv4(), projectName:'Construction of Bridge over Meenachil River',
    yearOfSanction:2024, constituency:'Kottayam', scheme:'State Highway Improvement',
    goDate:'2024-02-10', goNumber:'GO(Ms)No.145/2024/PWD',
    sanctionedAmount:45000000, tenderedCost:42500000,
    contractorName:'M/s Kerala Infrastructure Ltd', workOrderDate:'2024-03-15',
    dateOfStartContract:'2024-04-01', dateOfCompletionContract:'2025-09-30',
    actualDateOfStart:'2024-04-10', actualDateOfCompletion:'',
    performanceGuaranteeDate:'2024-03-20', expiryDate:'2026-07-20',
    expenditureIncurred:28000000, deductions:1200000,
    extensionOfTime:'3 months', statusOfWork:'in_progress', progress:65,
    juniorEngineer:'Er. Arun Kumar', assistantEngineer:'Er. Priya Nair',
    ucSentDate:'2025-01-15', securityDepositReleaseDate:'', securityAmount:2125000,
    mBookNumber:'MB-KTM-2024-045', workAuditRegisterNo:'WAR/KTM/2024/012',
    latitude:9.5916, longitude:76.5222, isLocked:false, lockHash:'', notes:'Monsoon delay in Q2 2024'
  },
  {
    id: uuidv4(), projectName:'Rural Road NH-47 to Kumily via Mundakayam',
    yearOfSanction:2023, constituency:'Idukki', scheme:'PMGSY',
    goDate:'2023-05-20', goNumber:'GO(Ms)No.089/2023/PWD',
    sanctionedAmount:18500000, tenderedCost:17200000,
    contractorName:'M/s Hill Country Builders', workOrderDate:'2023-06-10',
    dateOfStartContract:'2023-07-01', dateOfCompletionContract:'2025-06-30',
    actualDateOfStart:'2023-07-15', actualDateOfCompletion:'2025-04-20',
    performanceGuaranteeDate:'2023-06-15', expiryDate:'2026-06-15',
    expenditureIncurred:18500000, deductions:800000,
    extensionOfTime:'', statusOfWork:'completed', progress:100,
    juniorEngineer:'Er. Rahul Menon', assistantEngineer:'Er. Deepa S.',
    ucSentDate:'2025-05-10', securityDepositReleaseDate:'2025-10-20', securityAmount:860000,
    mBookNumber:'MB-IDK-2023-022', workAuditRegisterNo:'WAR/IDK/2023/008',
    latitude:9.6055, longitude:77.1609, isLocked:false, lockHash:'', notes:'Completed ahead of schedule'
  }
];
