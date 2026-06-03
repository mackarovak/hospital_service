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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-sky-700">Расписание</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Приемные окна</h1>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
            Свободно: {freeSlots.length}
          </span>
          <span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
            Занято: {bookedSlots.length}
          </span>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-950">Добавить окно приема</h2>
          <p className="mt-1 text-sm text-slate-600">Укажите начало и конец свободного времени.</p>
        </div>
        <form className="grid gap-4 p-6 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleCreate}>
          <label className="block text-sm font-medium text-slate-700">
            Начало
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
              className="mt-1 min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Конец
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              required
              className="mt-1 min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <div className="flex items-end">
            <Button className="w-full" type="submit">Добавить</Button>
          </div>
          {formError && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-3">
              {formError}
            </p>
          )}
        </form>
      </Card>

      {loading && <p className="text-slate-500">Загрузка...</p>}

      {!loading && (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-950">Свободные окна</h2>
            {freeSlots.length === 0 && (
              <p className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">Нет свободных окон.</p>
            )}
            {freeSlots.map((slot) => (
              <div
                key={slot.id}
                className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-950">{formatDateTime(slot.starts_at)}</p>
                  <p className="text-sm text-slate-500">{formatTime(slot.starts_at)} - {formatTime(slot.ends_at)}</p>
                </div>
                <Button
                  variant="danger"
                  onClick={() => handleDelete(slot.id)}
                  className="shrink-0"
                >
                  Удалить
                </Button>
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-950">Занятые окна</h2>
            {bookedSlots.length === 0 && (
              <p className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">Нет занятых окон.</p>
            )}
            {bookedSlots.map((slot) => (
              <div
                key={slot.id}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-950">{formatDateTime(slot.starts_at)}</p>
                  <p className="text-sm text-slate-500">{formatTime(slot.starts_at)} - {formatTime(slot.ends_at)}</p>
                  <p className="mt-1 text-xs font-medium text-sky-700">
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
