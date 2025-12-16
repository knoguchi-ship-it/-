import { Consultation, Gender, ConsultationMethod, CertificationStatus } from '../types';

const STORAGE_KEY = 'consultation_app_data';

// --- GAS Type Definitions ---
declare global {
  interface Window {
    google?: {
      script: {
        run: {
          withSuccessHandler: (callback: (response: any) => void) => {
            withFailureHandler: (callback: (error: Error) => void) => {
              [key: string]: (data?: any) => void;
            };
          };
        };
      };
    };
  }
}

// Helper: Check if running in GAS environment
const isGasEnvironment = () => {
  return typeof window !== 'undefined' && window.google && window.google.script;
};

// Helper: Promisify GAS calls
const runGas = async (functionName: string, ...args: any[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!isGasEnvironment()) {
      reject(new Error('GAS environment not detected'));
      return;
    }
    window.google!.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      [functionName](...args);
  });
};

// --- Mock Logic (Development Fallback) ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateMockData = (): Consultation[] => {
  const data: Consultation[] = [];
  for (let i = 0; i < 5; i++) {
    data.push({
      id: `mock-${i}`,
      receptionDate: new Date().toISOString().split('T')[0],
      name: `山田 太郎 ${i+1}`,
      furigana: `ヤマダ タロウ ${i+1}`,
      gender: Gender.MALE,
      birthDate: '1950-01-01',
      address: '東京都新宿区...',
      phone: '090-1234-5678',
      consultantName: `山田 花子 ${i+1}`,
      method: ConsultationMethod.PHONE,
      relationship: '妻',
      content: '最近物忘れが激しくなってきたため相談したい。',
      response: 'まずは地域包括支援センターへの来所をご案内しました。',
      staffName: '鈴木 一郎',
      certificationStatus: CertificationStatus.NOT_APPLIED
    });
  }
  return data;
};

const initStorage = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(generateMockData()));
  }
};

// --- Public API ---

export const fetchConsultations = async (year: number, month: number): Promise<Consultation[]> => {
  // Production: Call GAS Backend
  if (isGasEnvironment()) {
    try {
      return await runGas('getConsultations', year, month);
    } catch (e) {
      console.error("GAS fetch failed", e);
      throw e;
    }
  }

  // Development: Use Mock
  await delay(800); 
  initStorage();
  const allData: Consultation[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  return allData.filter(item => {
    const date = new Date(item.receptionDate);
    return date.getFullYear() === year && (date.getMonth() + 1) === month;
  });
};

export const saveConsultation = async (data: Consultation): Promise<{ success: boolean; id: string; pdfUrl?: string }> => {
  // Production: Call GAS Backend
  if (isGasEnvironment()) {
    try {
      const result = await runGas('saveConsultation', data);
      if (!result.success) throw new Error(result.message);
      return result;
    } catch (e) {
      console.error("GAS save failed", e);
      throw e;
    }
  }

  // Development: Use Mock
  await delay(2000);
  const allData: Consultation[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const newRecord = { ...data };
  
  if (!newRecord.id) {
    newRecord.id = `id-${Date.now()}`;
  } else {
    const idx = allData.findIndex(d => d.id === newRecord.id);
    if (idx !== -1) allData.splice(idx, 1);
  }

  if (newRecord.firstVisitDate && !newRecord.calendarEventId) {
    newRecord.calendarEventId = `cal-${Date.now()}`;
  }

  allData.unshift(newRecord);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
  return { success: true, id: newRecord.id, pdfUrl: `https://example.com/mock-pdf-${newRecord.id}.pdf` };
};

export const generatePdf = async (id: string): Promise<string> => {
  // In GAS version, PDF generation is done within 'saveConsultation', 
  // so this function is technically redundant for GAS flow but kept for compatibility.
  if (isGasEnvironment()) {
    return ''; // URL is returned in saveConsultation
  }
  await delay(1500); 
  return `https://example.com/mock-pdf-${id}.pdf`;
};

// UI Helper
export const convertToJapaneseEra = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  if (year > 2019) return `令和${year - 2018}年${date.getMonth() + 1}月${date.getDate()}日`;
  if (year > 1989) return `平成${year - 1988}年${date.getMonth() + 1}月${date.getDate()}日`;
  return `${year}年${date.getMonth() + 1}月${date.getDate()}日`;
};