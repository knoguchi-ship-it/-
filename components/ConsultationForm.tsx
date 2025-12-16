import React, { useState } from 'react';
import { Consultation, initialConsultation } from '../types';
import { Step1BasicInfo, Step2Details, Step3Action } from './WizardSteps';
import { Button } from './ui/Button';
import { saveConsultation } from '../services/api';

interface ConsultationFormProps {
  onCancel: () => void;
  onSaved: () => void;
  initialData?: Consultation;
}

export const ConsultationForm: React.FC<ConsultationFormProps> = ({ onCancel, onSaved, initialData }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Consultation>(initialData || initialConsultation);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPdfConfirm, setShowPdfConfirm] = useState(false);
  const [saveResult, setSaveResult] = useState<{success: boolean, id: string, pdfUrl?: string} | null>(null);

  const handleChange = (field: keyof Consultation, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[field];
        return newErrs;
      });
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (currentStep === 1) {
      if (!formData.receptionDate) newErrors.receptionDate = '必須です';
      if (!formData.name) newErrors.name = '必須です';
      if (!formData.furigana) newErrors.furigana = '必須です';
      if (!formData.birthDate) newErrors.birthDate = '必須です';
    }
    if (currentStep === 2) {
      if (!formData.consultantName) newErrors.consultantName = '必須です';
      if (!formData.content) newErrors.content = '必須です';
    }
    if (currentStep === 3) {
      if (!formData.response) newErrors.response = '必須です';
      if (!formData.staffName) newErrors.staffName = '必須です';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      isValid = false;
    }
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSave = async () => {
    if (!validateStep(3)) return;
    
    // Check for PDF/Calendar confirmation
    if (formData.firstVisitDate && !showPdfConfirm) {
        setShowPdfConfirm(true);
        return;
    }
    performSave();
  };

  const performSave = async () => {
    setShowPdfConfirm(false);
    setIsSaving(true);
    setSaveResult(null);
    
    try {
      const result = await saveConsultation(formData);
      if (result.success) {
        setSaveResult(result);
      }
    } catch (error) {
      console.error(error);
      alert('保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseSuccess = () => {
    onSaved();
  };

  // Google Drive Viewer URL for existing PDF
  const existingPdfUrl = formData.pdfFileId 
    ? `https://drive.google.com/file/d/${formData.pdfFileId}/view` 
    : null;

  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-white md:rounded-xl shadow-lg flex flex-col overflow-hidden">
      {/* Loading Overlay */}
      {isSaving && (
        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-200 border-t-teal-600 mb-4"></div>
          <p className="text-teal-800 font-semibold text-lg">保存中です...</p>
          <p className="text-sm text-gray-500">カレンダー連携とPDF生成を行っています</p>
        </div>
      )}

      {/* Confirmation Modal (Before Save) */}
      {showPdfConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl animate-fade-in">
            <h3 className="text-lg font-bold text-gray-900 mb-2">確認</h3>
            <p className="text-gray-600 mb-4">
               初回訪問日時が設定されています。<br/>
               保存と同時にカレンダー予定を作成し、PDFを出力しますか？
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowPdfConfirm(false)}>キャンセル</Button>
              <Button variant="primary" onClick={performSave}>実行する</Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal (After Save) */}
      {saveResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl text-center animate-fade-in">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">保存しました</h3>
            <p className="text-gray-600 mb-6">
                相談記録の保存とPDFの作成が完了しました。
            </p>
            <div className="flex flex-col gap-3">
                {saveResult.pdfUrl && (
                    <a 
                        href={saveResult.pdfUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
                    >
                        <svg className="mr-2 -ml-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        作成されたPDFを開く
                    </a>
                )}
                <Button variant="secondary" onClick={handleCloseSuccess}>一覧に戻る</Button>
            </div>
          </div>
        </div>
      )}

      {/* Wizard Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-3">
             <h2 className="text-xl font-bold text-gray-800">
               {initialData?.id ? '相談記録の編集' : '新規相談登録'}
             </h2>
             {existingPdfUrl && !saveResult && (
               <a 
                 href={existingPdfUrl}
                 target="_blank"
                 rel="noreferrer"
                 className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm"
                 title="保存済みのPDFを開く"
               >
                 <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                 PDF
               </a>
             )}
           </div>
           <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
           <div 
             className="bg-teal-500 h-full transition-all duration-300 ease-out"
             style={{ width: `${(step / 3) * 100}%` }}
           ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
           <span className={step >= 1 ? 'text-teal-600 font-bold' : ''}>基本情報</span>
           <span className={step >= 2 ? 'text-teal-600 font-bold' : ''}>相談詳細</span>
           <span className={step >= 3 ? 'text-teal-600 font-bold' : ''}>対応記録</span>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
        {step === 1 && <Step1BasicInfo data={formData} onChange={handleChange} errors={errors} />}
        {step === 2 && <Step2Details data={formData} onChange={handleChange} errors={errors} />}
        {step === 3 && <Step3Action data={formData} onChange={handleChange} errors={errors} />}
      </div>

      {/* Sticky Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex justify-between items-center z-10 md:relative md:bg-transparent md:border-t-0">
        <div>
          {step > 1 && (
            <Button variant="secondary" onClick={handleBack}>
              戻る
            </Button>
          )}
        </div>
        <div>
          {step < 3 ? (
            <Button variant="primary" onClick={handleNext}>
              次へ
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSave} className="bg-teal-600 hover:bg-teal-700">
              保存して完了
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};