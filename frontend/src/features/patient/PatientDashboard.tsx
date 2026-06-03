import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../../shared/api/client";
import type { PatientMedicalCardResponse } from "../../shared/types/medical";
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
  const filledFields = [
    p.date_of_birth,
    p.gender,
    p.phone,
    p.address,
    p.blood_type,
    p.allergies,
    p.chronic_conditions,
  ].filter(Boolean).length;

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <p className="text-sm font-medium text-sky-700">Кабинет пациента</p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">{fullName}</h1>
              <p className="mt-1 text-sm text-slate-500">Медкарта {card.card_number}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/patient/book">
                <Button>Записаться к врачу</Button>
              </Link>
              <Link to="/patient/profile">
                <Button variant="secondary">Заполнить данные</Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="grid gap-0 divide-y divide-slate-200 p-0 md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="p-5">
            <p className="text-xs font-medium uppercase text-slate-400">Статус медкарты</p>
            <p className="mt-2 text-lg font-semibold text-emerald-700">
              {card.status === "ACTIVE" ? "Активна" : "Архив"}
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs font-medium uppercase text-slate-400">Заполненность профиля</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{filledFields}/7</p>
          </div>
          <div className="p-5">
            <p className="text-xs font-medium uppercase text-slate-400">Записей в карте</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{data.records.length}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-950">Основные данные</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Дата рождения" value={p.date_of_birth} />
          <Field label="Пол" value={p.gender} />
          <Field label="Телефон" value={p.phone} />
          <Field label="Адрес" value={p.address} />
          <Field label="Группа крови" value={p.blood_type} />
          <Field label="Аллергии" value={p.allergies} />
          <Field label="Хронические заболевания" value={p.chronic_conditions} />
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-slate-950">Медицинская карта</h2>
          <p className="mt-2 text-sm text-slate-600">
            Просматривайте записи врачей, назначения и историю обращений.
          </p>
          <Link className="mt-4 inline-flex" to="/patient/medical-card">
            <Button variant="secondary">Открыть медкарту</Button>
          </Link>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-slate-950">Ближайшие записи</h2>
          <p className="mt-2 text-sm text-slate-600">
            Управляйте записями и отменяйте приемы, если планы изменились.
          </p>
          <Link className="mt-4 inline-flex" to="/patient/appointments">
            <Button variant="secondary">Мои записи</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
