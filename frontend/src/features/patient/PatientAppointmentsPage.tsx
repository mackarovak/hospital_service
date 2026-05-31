import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { cancelBooking, getMyAppointments } from "../../shared/api/client";
import type { Appointment } from "../../shared/types/medical";
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

export function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyAppointments()
      .then(({ data }) => setAppointments(data))
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel(slotId: string) {
    await cancelBooking(slotId);
    setAppointments((prev) => prev.filter((a) => a.id !== slotId));
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-950">Мои записи</h1>
        <Link to="/patient/book">
          <Button variant="secondary">Записаться к врачу</Button>
        </Link>
      </div>

      {loading && <p className="text-slate-500">Загрузка...</p>}

      {!loading && appointments.length === 0 && (
        <Card>
          <p className="text-slate-500">У вас пока нет записей.</p>
        </Card>
      )}

      {appointments.map((apt) => (
        <Card key={apt.id}>
          <p className="font-medium text-slate-900">
            {formatDateTime(apt.starts_at)} — {formatTime(apt.ends_at)}
          </p>
          <p className="mt-1 text-sm text-slate-700">Врач: {apt.doctor.full_name}</p>
          <p className="text-sm text-slate-700">Специальность: {apt.doctor.specialization_name}</p>
          {apt.doctor.office_number && (
            <p className="text-sm text-slate-700">Кабинет: {apt.doctor.office_number}</p>
          )}
          <div className="mt-3">
            <Button variant="secondary" onClick={() => handleCancel(apt.id)}>
              Отменить запись
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
