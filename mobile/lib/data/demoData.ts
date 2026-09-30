import type { AppProfile, NotificationRow, ScholarshipRow } from './types';

const addDays = (n: number, from = new Date()) => {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function demoScholarships(now = new Date()): ScholarshipRow[] {
  return [
    {
      id: 'sch-pms-1',
      title: 'Post-Matric Scholarship Scheme for ST Students',
      provider: 'Ministry of Tribal Affairs, Govt of India',
      category: 'Government',
      description: 'Financial assistance for Scheduled Tribe students studying at Post-Matriculation stage to complete higher education.',
      education_level: ['UG', 'PG', 'Diploma'],
      state: null,
      amount: 50000,
      application_url: 'https://scholarships.gov.in',
      deadline: addDays(45, now),
      status: 'published',
      income_limit: 250000,
      minimum_percentage: 50,
      tribal_requirement: true,
      gender_requirement: null,
      disability_requirement: null,
      required_documents: ['ST Community Certificate', 'Income Certificate', 'Academic Marksheet', 'Aadhaar Card', 'Bank Passbook'],
      benefits: 'Complete tuition fee waiver & monthly maintenance allowance',
      is_demo: false
    },
    {
      id: 'sch-nmf-2',
      title: 'National Merit Fellowship for ST Students',
      provider: 'National Science & Tribal Research Foundation',
      category: 'Private',
      description: 'Merit fellowship for postgraduate Scheduled Tribe students pursuing higher education in Karnataka.',
      education_level: ['PG'],
      state: ['Karnataka'],
      amount: 75000,
      application_url: 'https://fellowship.tribal.gov.in',
      deadline: addDays(6, now),
      status: 'published',
      income_limit: null,
      minimum_percentage: 75,
      tribal_requirement: true,
      gender_requirement: null,
      disability_requirement: null,
      required_documents: ['ST Certificate', 'PG Degree Certificate', 'Academic Marksheet'],
      benefits: 'Monthly fellowship of ₹31,000 + annual contingency grant',
      is_demo: false
    },
    {
      id: 'sch-gstem-3',
      title: 'Girls in STEM Tribal Grant',
      provider: 'National Tribal Development Foundation',
      category: 'NGO',
      description: 'Special merit scholarship for Tribal ST female students pursuing technical degrees in Computer Science and STEM.',
      education_level: ['UG'],
      state: null,
      amount: 30000,
      application_url: 'https://scholarships.gov.in',
      deadline: addDays(60, now),
      status: 'published',
      income_limit: 500000,
      minimum_percentage: 60,
      tribal_requirement: true,
      gender_requirement: 'Female',
      disability_requirement: null,
      required_documents: ['ST Certificate', 'Marks Card', 'Income Proof'],
      benefits: 'Financial grant of ₹30,000 per academic year plus laptop support',
      is_demo: false
    },
    {
      id: 'sch-tata-4',
      title: 'Tata Trusts Tribal Education Grant',
      provider: 'Tata Trusts',
      category: 'Private',
      description: 'Tata Trusts provides financial support to Scheduled Tribe students for tuition, books and hostel expenses at recognised institutions.',
      education_level: ['UG', 'PG', 'Diploma'],
      state: null,
      amount: 60000,
      application_url: 'https://www.tatatrusts.org',
      deadline: addDays(55, now),
      status: 'published',
      income_limit: 400000,
      minimum_percentage: 60,
      tribal_requirement: true,
      gender_requirement: null,
      disability_requirement: null,
      required_documents: ['ST Certificate', 'Income Certificate', 'Admission Letter', 'Bank Passbook', 'Photo ID'],
      benefits: 'Up to ₹60,000/year covering tuition, books and hostel expenses',
      is_demo: false
    },
    {
      id: 'sch-st-5',
      title: 'Chief Minister ST Higher Education Merit Grant',
      provider: 'State Department of Tribal Welfare',
      category: 'State Govt',
      description: 'State merit incentive for Scheduled Tribe students pursuing Diploma, Under-Graduate, or Post-Graduate degrees.',
      education_level: ['Diploma', 'UG', 'PG'],
      state: ['Karnataka', 'Odisha', 'Jharkhand', 'Madhya Pradesh', 'Maharashtra', 'Assam'],
      amount: 45000,
      application_url: 'https://scholarships.gov.in',
      deadline: addDays(25, now),
      status: 'published',
      income_limit: 300000,
      minimum_percentage: 65,
      tribal_requirement: true,
      gender_requirement: null,
      disability_requirement: null,
      required_documents: ['Domicile Certificate', 'ST Certificate', 'College Bonafide', 'Mark Sheet'],
      benefits: '₹45,000 direct benefit transfer (DBT) to bank account',
      is_demo: false
    },
    {
      id: 'sch-st-6',
      title: 'National Overseas Scholarship for ST Candidates',
      provider: 'Ministry of Tribal Affairs',
      category: 'Government',
      description: 'Financial assistance for selected ST students to pursue Master Level courses and Ph.D. abroad.',
      education_level: ['PG', 'PhD'],
      state: null,
      amount: 1500000,
      application_url: 'https://overseas.tribal.gov.in',
      deadline: addDays(75, now),
      status: 'published',
      income_limit: 600000,
      minimum_percentage: 55,
      tribal_requirement: true,
      gender_requirement: null,
      disability_requirement: null,
      required_documents: ['ST Certificate', 'Offer Letter from Foreign University', 'Income Tax Return', 'Passport'],
      benefits: 'Full tuition fees, annual maintenance allowance ($15,400 USD), equipment allowance & air travel tickets',
      is_demo: false
    }
  ];
}

export const demoProfile = (): AppProfile => ({
  id: 'user-st-1', role: 'student', consent_at: new Date().toISOString(), full_name: 'Ananya Birsa Munda',
  dob: '2004-07-11', gender: 'Female', state: 'Karnataka', district: 'Bengaluru Urban', education_level: 'UG',
  course: 'B.Tech Computer Science', institution: 'National Institute of Technology', percentage: 84, cgpa: 8.7, annual_income: 180000,
  is_st: true, tribe_name: 'Santhal', disability: false, first_gen: true,
});

export const demoNotifications = (): NotificationRow[] => [
  { id: 'n-1', title: 'Welcome to Unified Scholar Portal', body: 'Discover verified scholarships, check your eligibility automatically, and submit applications directly online.', read_at: null, created_at: new Date().toISOString() },
  { id: 'n-2', title: 'Application Period Open', body: 'The Post-Matric Scholarship Scheme for ST Students is accepting applications. Apply now in your portal.', read_at: null, created_at: new Date().toISOString() }
];


