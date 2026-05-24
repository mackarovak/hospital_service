import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../../shared/api/client";
import type { DoctorPatientsResponse } from "../../shared/types/medical";
import { Card } from "../../shared/ui/Card";

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
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
    <Card>
      <h1 className="text-xl font-semibold text-slate-950">Кабинет врача</h1>
      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        <Field label="ФИО врача" value={data?.doctor.full_name} />
        <Field label="Специализация" value={data?.doctor.specialization} />
        <Field label="Количество пациентов" value={data?.total ?? 0} />
      </div>
      <Link className="mt-6 inline-flex text-sm font-medium text-sky-700 hover:text-sky-900" to="/doctor/patients">
        Открыть список пациентов
      </Link>
    </Card>
  );
}
