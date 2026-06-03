import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../../shared/api/client";
import type { MedicalRecord, PatientMedicalCardResponse } from "../../shared/types/medical";
import { Button } from "../../shared/ui/Button";

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-950">{value || "-"}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ru-RU");
}

function PrintRecord({ record }: { record: MedicalRecord }) {
  return (
    <section className="break-inside-avoid rounded-md border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <p className="font-semibold text-slate-950">{formatDate(record.record_date)}</p>
          <p className="text-sm text-slate-600">{record.doctor_full_name}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Жалобы" value={record.complaints} />
        <Field label="Осмотр" value={record.examination_result} />
        <Field label="Диагноз" value={record.diagnosis_text} />
        <Field label="Лечение / рекомендации" value={record.treatment_text} />
      </div>
    </section>
  );
}

export function PatientMedicalCardPrintPage() {
  const [data, setData] = useState<PatientMedicalCardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<PatientMedicalCardResponse>("/patient/medical-card")
      .then((response) => setData(response.data))
      .catch(() => setError("Не удалось загрузить выписку"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (data) {
      document.title = `MedCat выписка ${data.medical_card.card_number}`;
    }
  }, [data]);

  if (loading) return <p className="py-10 text-center text-sm text-slate-500">Загрузка...</p>;
  if (error) return <p className="py-10 text-center text-sm text-red-600">{error}</p>;
  if (!data) return null;

  const { patient, medical_card: card, records } = data;
  const fullName = [patient.last_name, patient.first_name, patient.middle_name].filter(Boolean).join(" ") || "-";
  const statusLabel = card.status === "ACTIVE" ? "Активна" : "Архив";
  const generatedAt = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link className="text-sm font-medium text-sky-700 hover:text-sky-900" to="/patient/medical-card">
            Назад к медкарте
          </Link>
          <Button onClick={() => window.print()}>Скачать / печать PDF</Button>
        </div>

        <article className="bg-white p-8 shadow-sm print:p-0 print:shadow-none">
          <header className="border-b-2 border-slate-900 pb-5">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">MedCat</p>
                <h1 className="mt-2 text-2xl font-bold text-slate-950">Выписка из медицинской карты</h1>
              </div>
              <div className="text-right text-sm text-slate-600">
                <p>Карта: {card.card_number}</p>
                <p>Сформировано: {generatedAt}</p>
              </div>
            </div>
          </header>

          <section className="mt-6">
            <h2 className="text-lg font-semibold text-slate-950">Пациент</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field label="ФИО" value={fullName} />
              <Field label="Дата рождения" value={patient.date_of_birth} />
              <Field label="Пол" value={patient.gender} />
              <Field label="Телефон" value={patient.phone} />
              <Field label="Адрес" value={patient.address} />
              <Field label="Статус карты" value={statusLabel} />
              <Field label="Группа крови" value={patient.blood_type} />
              <Field label="Аллергии" value={patient.allergies} />
              <Field label="Хронические заболевания" value={patient.chronic_conditions} />
            </div>
          </section>

          <section className="mt-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-semibold text-slate-950">Записи врача</h2>
              <span className="text-sm text-slate-500">Всего: {records.length}</span>
            </div>
            {records.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">Записей врача пока нет.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {records.map((record) => (
                  <PrintRecord key={record.id} record={record} />
                ))}
              </div>
            )}
          </section>

          <footer className="mt-10 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">
            Документ сформирован автоматически в системе MedCat. Выписка предназначена для ознакомления
            с данными медицинской карты и не заменяет консультацию врача.
          </footer>
        </article>
      </div>
    </main>
  );
}
