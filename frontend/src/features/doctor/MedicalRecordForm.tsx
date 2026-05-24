import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import type { MedicalRecord } from "../../shared/types/medical";
import { Button } from "../../shared/ui/Button";

export type MedicalRecordFormValues = {
  complaints: string;
  examination_result: string;
  diagnosis_text: string;
  treatment_text: string;
};

type MedicalRecordFormProps = {
  initialRecord?: MedicalRecord | null;
  submitting?: boolean;
  error?: string;
  onCancel?: () => void;
  onSubmit?: (values: MedicalRecordFormValues) => Promise<void> | void;
};

const EMPTY_FORM: MedicalRecordFormValues = {
  complaints: "",
  examination_result: "",
  diagnosis_text: "",
  treatment_text: "",
};

const textareaClass =
  "mt-1 min-h-24 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100";

function recordToForm(record?: MedicalRecord | null): MedicalRecordFormValues {
  if (!record) return EMPTY_FORM;

  return {
    complaints: record.complaints ?? "",
    examination_result: record.examination_result ?? "",
    diagnosis_text: record.diagnosis_text ?? "",
    treatment_text: record.treatment_text ?? "",
  };
}

export function MedicalRecordForm({
  initialRecord = null,
  submitting = false,
  error = "",
  onCancel,
  onSubmit,
}: MedicalRecordFormProps) {
  const [form, setForm] = useState<MedicalRecordFormValues>(recordToForm(initialRecord));

  useEffect(() => {
    setForm(recordToForm(initialRecord));
  }, [initialRecord]);

  function handleChange(field: keyof MedicalRecordFormValues, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit?.(form);
    if (!initialRecord) {
      setForm(EMPTY_FORM);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-slate-700">
        <span>Жалобы</span>
        <textarea
          className={textareaClass}
          value={form.complaints}
          onChange={(event) => handleChange("complaints", event.target.value)}
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        <span>Результат осмотра</span>
        <textarea
          className={textareaClass}
          value={form.examination_result}
          onChange={(event) => handleChange("examination_result", event.target.value)}
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        <span>Диагноз</span>
        <textarea
          className={textareaClass}
          value={form.diagnosis_text}
          onChange={(event) => handleChange("diagnosis_text", event.target.value)}
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        <span>Лечение / рекомендации</span>
        <textarea
          className={textareaClass}
          value={form.treatment_text}
          onChange={(event) => handleChange("treatment_text", event.target.value)}
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Сохранение…" : initialRecord ? "Сохранить запись" : "Добавить запись"}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Отмена
          </Button>
        )}
      </div>
    </form>
  );
}
