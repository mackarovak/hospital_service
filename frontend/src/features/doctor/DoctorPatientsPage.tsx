import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../../shared/api/client";
import type { DoctorPatientsResponse } from "../../shared/types/medical";
import { Button } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";
import { Input } from "../../shared/ui/Input";

const PAGE_LIMIT = 10;

export function DoctorPatientsPage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<DoctorPatientsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    api
      .get<DoctorPatientsResponse>("/doctor/patients", {
        params: { query: query.trim() || undefined, page, limit: PAGE_LIMIT },
        signal: controller.signal,
      })
      .then((response) => setData(response.data))
      .catch((err: unknown) => {
        if ((err as { code?: string }).code !== "ERR_CANCELED") {
          setError("Не удалось загрузить пациентов");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [page, query]);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.limit));
  }, [data]);

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-950">Мои пациенты</h1>
            <p className="mt-1 text-sm text-slate-500">Всего пациентов: {data?.total ?? 0}</p>
          </div>
          <div className="w-full md:max-w-sm">
            <Input
              label="Поиск"
              name="query"
              placeholder="ФИО или номер карты"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
            />
          </div>
        </div>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">ФИО</th>
                <th className="px-5 py-3 font-medium">Дата рождения</th>
                <th className="px-5 py-3 font-medium">Номер карты</th>
                <th className="px-5 py-3 font-medium text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td className="px-5 py-8 text-center text-slate-500" colSpan={4}>
                    Загрузка…
                  </td>
                </tr>
              )}
              {!loading && data?.items.length === 0 && (
                <tr>
                  <td className="px-5 py-8 text-center text-slate-500" colSpan={4}>
                    Пациенты не найдены
                  </td>
                </tr>
              )}
              {!loading &&
                data?.items.map((patient) => (
                  <tr key={patient.id}>
                    <td className="px-5 py-4 font-medium text-slate-950">{patient.full_name || "—"}</td>
                    <td className="px-5 py-4 text-slate-600">{patient.date_of_birth || "—"}</td>
                    <td className="px-5 py-4 text-slate-600">{patient.card_number}</td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        className="inline-flex h-9 items-center justify-center rounded-md bg-sky-700 px-3 text-sm font-medium text-white transition hover:bg-sky-800"
                        to={`/doctor/patients/${patient.id}/medical-card`}
                      >
                        Открыть медкарту
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="secondary" disabled={page <= 1 || loading} onClick={() => setPage((prev) => prev - 1)}>
          Назад
        </Button>
        <span className="text-sm text-slate-500">
          Страница {page} из {totalPages}
        </span>
        <Button
          variant="secondary"
          disabled={page >= totalPages || loading}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Вперёд
        </Button>
      </div>
    </div>
  );
}
