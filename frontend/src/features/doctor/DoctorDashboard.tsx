import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../../shared/api/client";
import type { DoctorPatientsResponse } from "../../shared/types/medical";
import { Button } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-900">{value || "—"}</p>
    </div>
  );
}

export function DoctorDashboard() {
  const [data, setData] = useState<DoctorPatientsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<DoctorPatientsResponse>("/doctor/patients", { params: { page: 1, limit: 1 } })
      .then((response) => setData(response.data))
      .catch(() => setError("Не удалось загрузить данные врача"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="py-10 text-center text-sm text-slate-500">Загрузка…</p>;
  if (error) return <p className="py-10 text-center text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-sky-100 bg-gradient-to-r from-white via-sky-50 to-white px-6 py-6">
          <div className="flex items-center gap-3 text-sm font-semibold text-sky-700">
            <span className="medical-mark flex h-8 w-8 items-center justify-center rounded-md bg-sky-700 text-white" aria-hidden="true" />
            <span>Кабинет врача</span>
          </div>
          <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold leading-tight text-slate-950">{data?.doctor.full_name || "—"}</h1>
              <p className="mt-2 text-sm text-slate-600">{data?.doctor.specialization || "Специализация не указана"}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/doctor/patients">
                <Button>Открыть пациентов</Button>
              </Link>
              <Link to="/doctor/schedule">
                <Button variant="secondary">Расписание</Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="grid gap-0 divide-y divide-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="p-5">
            <Field label="ФИО врача" value={data?.doctor.full_name} />
          </div>
          <div className="p-5">
            <Field label="Специализация" value={data?.doctor.specialization} />
          </div>
          <div className="p-5">
            <Field label="Количество пациентов" value={data?.total ?? 0} />
          </div>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="transition hover:border-sky-200 hover:shadow-md hover:shadow-sky-100">
          <h2 className="text-lg font-semibold text-slate-950">Пациенты</h2>
          <p className="mt-2 text-sm text-slate-600">
            Быстрый доступ к медицинским картам и истории приемов.
          </p>
          <Link className="mt-4 inline-flex" to="/doctor/patients">
            <Button variant="secondary">Перейти к списку</Button>
          </Link>
        </Card>
        <Card className="transition hover:border-sky-200 hover:shadow-md hover:shadow-sky-100">
          <h2 className="text-lg font-semibold text-slate-950">Приемные окна</h2>
          <p className="mt-2 text-sm text-slate-600">
            Добавляйте свободное время и отслеживайте занятые слоты.
          </p>
          <Link className="mt-4 inline-flex" to="/doctor/schedule">
            <Button variant="secondary">Настроить расписание</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
