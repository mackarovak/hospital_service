import { useEffect, useState } from "react";

import { api } from "../../shared/api/client";
import type { PatientMedicalCardResponse } from "../../shared/types/medical";
import { Card } from "../../shared/ui/Card";

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-900">{value || "—"}</p>
    </div>
  );
}

export function PatientDashboard() {
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

  const { patient: p, medical_card: card } = data;
  const fullName =
    [p.last_name, p.first_name, p.middle_name].filter(Boolean).join(" ") || "—";

  return (
    <Card>
      <h1 className="text-xl font-semibold text-slate-950">Кабинет пациента</h1>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="ФИО" value={fullName} />
        <Field label="Номер медкарты" value={card.card_number} />
        <Field label="Дата рождения" value={p.date_of_birth} />
        <Field label="Группа крови" value={p.blood_type} />
        <Field label="Аллергии" value={p.allergies} />
        <Field label="Хронические заболевания" value={p.chronic_conditions} />
      </div>
    </Card>
  );
}
