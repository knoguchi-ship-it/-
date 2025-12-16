export enum Gender {
  MALE = '男',
  FEMALE = '女',
  OTHER = 'その他'
}

export enum ConsultationMethod {
  PHONE = '電話',
  VISIT_OFFICE = '来所',
  VISIT_HOME = '訪問',
  OTHER = 'その他'
}

export enum CertificationStatus {
  APPLYING = '申請中',
  SUPPORT_NEEDED = '要支援',
  CARE_NEEDED = '要介護',
  INDEPENDENT = '自立',
  NOT_APPLIED = '未申請'
}

export interface Consultation {
  // Step 1: Basic Info
  id: string;
  receptionDate: string; // YYYY-MM-DD
  insuredNumber?: string;
  insurer?: string;
  name: string;
  furigana: string;
  gender: Gender;
  birthDate: string; // YYYY-MM-DD (converted to Japanese era for PDF)
  address?: string;
  phone?: string;

  // Step 2: Details
  consultantName: string;
  method: ConsultationMethod;
  consultantPhone?: string;
  relationship?: string;
  background?: string;
  content: string; // Main content
  currentUsage?: string;
  certificationStatus?: CertificationStatus;
  supportProvided?: string;
  difficultyReason?: string;

  // Step 3: Action & Result
  response: string;
  firstVisitDate?: string; // ISO DateTime
  visitLocation?: string;
  specialNotes?: string;
  staffName: string;
  careManager?: string;

  // System
  pdfCreatedAt?: string;
  pdfFileId?: string;
  calendarEventId?: string;
}

// Default empty state helper
export const initialConsultation: Consultation = {
  id: '',
  receptionDate: new Date().toISOString().split('T')[0],
  name: '',
  furigana: '',
  gender: Gender.MALE,
  birthDate: '',
  consultantName: '',
  method: ConsultationMethod.PHONE,
  content: '',
  response: '',
  staffName: ''
};