import React from 'react';
import { Consultation, Gender, ConsultationMethod, CertificationStatus } from '../types';

interface StepProps {
  data: Consultation;
  onChange: (field: keyof Consultation, value: any) => void;
  errors: Record<string, string>;
}

// Reusable Input Wrapper
const Field = ({ label, error, required, children }: { label: string, error?: string, required?: boolean, children: React.ReactNode }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

const inputClass = "w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm py-2 px-3 border";

export const Step1BasicInfo: React.FC<StepProps> = ({ data, onChange, errors }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <div className="w-1 h-6 bg-teal-500 mr-3 rounded-full"></div>
        <h2 className="text-lg font-bold text-gray-800">基本情報</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="受付日" required error={errors.receptionDate}>
          <input 
            type="date" 
            className={inputClass}
            value={data.receptionDate}
            onChange={(e) => onChange('receptionDate', e.target.value)}
          />
        </Field>

        <Field label="本人電話番号">
          <input 
            type="tel" 
            inputMode="numeric"
            className={inputClass}
            value={data.phone || ''}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="090-1234-5678"
          />
        </Field>

        <Field label="名前" required error={errors.name}>
          <input 
            type="text" 
            className={inputClass}
            value={data.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="山田 太郎"
          />
        </Field>

        <Field label="フリガナ" required error={errors.furigana}>
          <input 
            type="text" 
            className={inputClass}
            value={data.furigana}
            onChange={(e) => onChange('furigana', e.target.value)}
            placeholder="ヤマダ タロウ"
          />
        </Field>

        <Field label="性別" required>
          <div className="flex gap-4 mt-2">
            {Object.values(Gender).map((g) => (
              <label key={g} className="inline-flex items-center">
                <input 
                  type="radio" 
                  className="text-teal-600 focus:ring-teal-500"
                  name="gender"
                  value={g}
                  checked={data.gender === g}
                  onChange={(e) => onChange('gender', e.target.value)}
                />
                <span className="ml-2 text-sm text-gray-700">{g}</span>
              </label>
            ))}
          </div>
        </Field>

        <Field label="生年月日 (和暦変換用)" required error={errors.birthDate}>
          <input 
            type="date" 
            className={inputClass}
            value={data.birthDate}
            onChange={(e) => onChange('birthDate', e.target.value)}
          />
        </Field>
      </div>

      <Field label="住所">
        <input 
          type="text" 
          className={inputClass}
          value={data.address || ''}
          onChange={(e) => onChange('address', e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <Field label="被保険者番号">
          <input 
            type="text" 
            inputMode="numeric"
            className={inputClass}
            value={data.insuredNumber || ''}
            onChange={(e) => onChange('insuredNumber', e.target.value)}
          />
        </Field>
         <Field label="保険者">
          <input 
            type="text" 
            className={inputClass}
            value={data.insurer || ''}
            onChange={(e) => onChange('insurer', e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
};

export const Step2Details: React.FC<StepProps> = ({ data, onChange, errors }) => {
  const copyApplicant = () => {
    onChange('consultantName', data.name);
    onChange('consultantPhone', data.phone);
    onChange('relationship', '本人');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6 justify-between">
        <div className="flex items-center">
          <div className="w-1 h-6 bg-teal-500 mr-3 rounded-full"></div>
          <h2 className="text-lg font-bold text-gray-800">相談詳細</h2>
        </div>
        <button 
          type="button"
          onClick={copyApplicant}
          className="text-xs text-teal-600 hover:underline bg-teal-50 px-2 py-1 rounded"
        >
          本人情報をコピー
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="相談者名" required error={errors.consultantName}>
          <input 
            type="text" 
            className={inputClass}
            value={data.consultantName}
            onChange={(e) => onChange('consultantName', e.target.value)}
          />
        </Field>

        <Field label="相談手段" required>
          <select 
            className={inputClass}
            value={data.method}
            onChange={(e) => onChange('method', e.target.value)}
          >
            {Object.values(ConsultationMethod).map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </Field>

        <Field label="相談者電話番号">
          <input 
            type="tel" 
            className={inputClass}
            value={data.consultantPhone || ''}
            onChange={(e) => onChange('consultantPhone', e.target.value)}
          />
        </Field>

        <Field label="続柄・関係">
          <input 
            type="text" 
            className={inputClass}
            value={data.relationship || ''}
            onChange={(e) => onChange('relationship', e.target.value)}
          />
        </Field>
      </div>

      <Field label="相談経緯">
        <textarea 
          rows={3}
          className={inputClass}
          value={data.background || ''}
          onChange={(e) => onChange('background', e.target.value)}
        />
      </Field>

      <Field label="相談内容" required error={errors.content}>
        <textarea 
          rows={5}
          className={`${inputClass} border-teal-200 bg-teal-50/30`}
          value={data.content}
          onChange={(e) => onChange('content', e.target.value)}
          placeholder="具体的な相談内容を記入してください"
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <Field label="利用状況">
          <input 
            type="text" 
            className={inputClass}
            value={data.currentUsage || ''}
            onChange={(e) => onChange('currentUsage', e.target.value)}
          />
        </Field>
         <Field label="認定状況">
          <select 
            className={inputClass}
            value={data.certificationStatus || CertificationStatus.NOT_APPLIED}
            onChange={(e) => onChange('certificationStatus', e.target.value)}
          >
             {Object.values(CertificationStatus).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>

       <Field label="困難な理由">
        <textarea 
          rows={2}
          className={inputClass}
          value={data.difficultyReason || ''}
          onChange={(e) => onChange('difficultyReason', e.target.value)}
        />
      </Field>
    </div>
  );
};

export const Step3Action: React.FC<StepProps> = ({ data, onChange, errors }) => {
  return (
    <div className="space-y-6">
       <div className="flex items-center mb-6">
        <div className="w-1 h-6 bg-teal-500 mr-3 rounded-full"></div>
        <h2 className="text-lg font-bold text-gray-800">対応記録・予定</h2>
      </div>

      <Field label="対応" required error={errors.response}>
        <textarea 
          rows={4}
          className={inputClass}
          value={data.response}
          onChange={(e) => onChange('response', e.target.value)}
        />
      </Field>

      <div className="p-4 bg-teal-50 rounded-lg border border-teal-100 mb-4">
        <h3 className="text-sm font-semibold text-teal-800 mb-3 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          次回予定 (カレンダー連携)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="初回訪問日時">
            <input 
              type="datetime-local" 
              className={inputClass}
              value={data.firstVisitDate || ''}
              onChange={(e) => onChange('firstVisitDate', e.target.value)}
            />
          </Field>
          <Field label="訪問場所">
            <input 
              type="text" 
              className={inputClass}
              value={data.visitLocation || ''}
              onChange={(e) => onChange('visitLocation', e.target.value)}
              placeholder="例: 利用者宅"
            />
          </Field>
        </div>
      </div>

      <Field label="特記事項">
        <textarea 
          rows={2}
          className={inputClass}
          value={data.specialNotes || ''}
          onChange={(e) => onChange('specialNotes', e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="相談受付者" required error={errors.staffName}>
          <input 
            type="text" 
            className={inputClass}
            value={data.staffName}
            onChange={(e) => onChange('staffName', e.target.value)}
          />
        </Field>
        <Field label="担当ケアマネ">
          <input 
            type="text" 
            className={inputClass}
            value={data.careManager || ''}
            onChange={(e) => onChange('careManager', e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
};