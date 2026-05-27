import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { createSlot, deleteSlot, getDoctorSlots } from "../../shared/api/client";
import type { DoctorSlot } from "../../shared/types/medical";
import { Button } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function DoctorSchedulePage() {
  const [slots, setSlots] = useState<DoctorSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    getDoctorSlots()
      .then(({ data }) => setSlots(data))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    try {
      const { data } = await createSlot({ starts_at: startsAt, ends_at: endsAt });
      setSlots((prev) => [...prev, data].sort((a, b) => a.starts_at.localeCompare(b.starts_at)));
      setStartsAt("");
      setEndsAt("");
    } catch {
      setFormError("Не удалось создать окно. Проверьте время.");
    }
  }

  async function handleDelete(slotId: string) {
    await deleteSlot(slotId);
    setSlots((prev) => prev.filter((s) => s.id !== slotId));
  }

  const freeSlots = slots.filter((s) => s.patient === null);
  const bookedSlots = slots.filter((s) => s.patient !== null);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-slate-950">Расписание</h1>

      <Card>
        <h2 className="font-medium text-slate-900">Добавить окно приёма</h2>
        <form className="mt-3 space-y-3" onSubmit={handleCreate}>
          <label className="block text-sm font-medium text-slate-700">
            Начало
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
              className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Конец
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              required
              className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            />
          </label>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <Button type="submit">Добавить окно</Button>
        </form>
      </Card>

      {loading && <p className="text-slate-500">Загрузка...</p>}

      {!loading && (
        <>
          <section className="space-y-2">
            <h2 className="font-medium text-slate-900">
              Свободные окна ({freeSlots.length})
            </h2>
            {freeSlots.length === 0 && (
              <p className="text-sm text-slate-500">Нет свободных окон.</p>
            )}
            {freeSlots.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-3"
              >
                <p className="text-sm text-slate-900">
                  {formatDateTime(slot.starts_at)} — {formatTime(slot.ends_at)}
                </p>
                <Button
                  variant="secondary"
                  onClick={() => handleDelete(slot.id)}
                  className="ml-4 shrink-0"
                >
                  Удалить
                </Button>
              </div>
            ))}
          </section>

          <section className="space-y-2">
            <h2 className="font-medium text-slate-900">
              Занятые окна ({bookedSlots.length})
            </h2>
            {bookedSlots.length === 0 && (
              <p className="text-sm text-slate-500">Нет занятых окон.</p>
            )}
            {bookedSlots.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm text-slate-900">
                    {formatDateTime(slot.starts_at)} — {formatTime(slot.ends_at)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Пациент: {slot.patient?.full_name}
                  </p>
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
