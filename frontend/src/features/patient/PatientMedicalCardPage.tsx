import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../../shared/api/client";
import type { MedicalRecord, PatientMedicalCardResponse } from "../../shared/types/medical";
import { Button } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-900">{value || "—"}</p>
    </div>
  );
}

function RecordCard({ record }: { record: MedicalRecord }) {
  const date = new Date(record.record_date).toLocaleDateString("ru-RU");
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-950">{date}</span>
        <span className="text-sm text-slate-500">{record.doctor_full_name}</span>
      </div>
      <Field label="Жалобы" value={record.complaints} />
      <Field label="Осмотр" value={record.examination_result} />
      <Field label="Диагноз" value={record.diagnosis_text} />
      <Field label="Лечение / рекомендации" value={record.treatment_text} />
    </Card>
  );
}

export function PatientMedicalCardPage() {
  const [data, setData] = useState<PatientMedicalCardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<PatientMedicalCardResponse>("/patient/medical-card")
      .then((r) => setData(r.data))
      .catch(() => setError("Не удалось загрузить данные"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="py-10 text-center text-sm text-slate-500">Загрузка…</p>;
  if (error) return <p className="py-10 text-center text-sm text-red-600">{error}</p>;
  if (!data) return null;

  const { patient: p, medical_card: card, records } = data;
  const fullName =
    [p.last_name, p.first_name, p.middle_name].filter(Boolean).join(" ") || "—";
  const statusLabel = card.status === "ACTIVE" ? "Активна" : "Архив";

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-sky-700">Медицинская карта</p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-950">{fullName}</h1>
              <p className="mt-1 text-sm text-slate-500">Карта {card.card_number}</p>
            </div>
            <Link to="/patient/medical-card/print" target="_blank" rel="noreferrer">
              <Button>Скачать выписку</Button>
            </Link>
          </div>
        </div>
        <div className="p-6">
        <h2 className="text-lg font-semibold text-slate-950">Данные пациента</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="ФИО" value={fullName} />
          <Field label="Дата рождения" value={p.date_of_birth} />
          <Field label="Пол" value={p.gender} />
          <Field label="Телефон" value={p.phone} />
          <Field label="Адрес" value={p.address} />
          <Field label="Группа крови" value={p.blood_type} />
          <Field label="Аллергии" value={p.allergies} />
          <Field label="Хронические заболевания" value={p.chronic_conditions} />
        </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-950">Медицинская карта</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Номер карты" value={card.card_number} />
          <Field label="Статус" value={statusLabel} />
        </div>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-950">Записи врача</h2>
        {records.length === 0 ? (
          <p className="text-sm text-slate-500">Записей врача пока нет.</p>
        ) : (
          <div className="space-y-4">
            {records.map((rec) => (
              <RecordCard key={rec.id} record={rec} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
