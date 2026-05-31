import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  bookSlot,
  getDoctorFreeSlots,
  getDoctorsBySpecialization,
  getSpecializations,
} from "../../shared/api/client";
import type { Appointment, DoctorPublic, FreeSlot, Specialization } from "../../shared/types/medical";
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

export function PatientBookingPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [doctors, setDoctors] = useState<DoctorPublic[]>([]);
  const [slots, setSlots] = useState<FreeSlot[]>([]);
  const [selectedSpec, setSelectedSpec] = useState<Specialization | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorPublic | null>(null);
  const [booked, setBooked] = useState<Appointment | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSpecializations().then(({ data }) => setSpecializations(data));
  }, []);

  async function selectSpecialization(spec: Specialization) {
    setSelectedSpec(spec);
    setLoading(true);
    try {
      const { data } = await getDoctorsBySpecialization(spec.id);
      setDoctors(data);
      setStep(2);
    } finally {
      setLoading(false);
    }
  }

  async function selectDoctor(doctor: DoctorPublic) {
    setSelectedDoctor(doctor);
    setLoading(true);
    try {
      const { data } = await getDoctorFreeSlots(doctor.id);
      setSlots(data);
      setStep(3);
    } finally {
      setLoading(false);
    }
  }

  async function handleBook(slot: FreeSlot) {
    setError("");
    try {
      const { data } = await bookSlot(slot.id);
      setBooked(data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setError("Это окно уже занято. Выберите другое.");
        const { data } = await getDoctorFreeSlots(selectedDoctor!.id);
        setSlots(data);
      } else {
        setError("Не удалось записаться. Попробуйте снова.");
      }
    }
  }

  if (booked) {
    return (
      <div className="mx-auto max-w-lg">
        <Card>
          <h1 className="text-xl font-semibold text-slate-950">Запись подтверждена</h1>
          <p className="mt-3 text-slate-700">
            {formatDateTime(booked.starts_at)} — {formatTime(booked.ends_at)}
          </p>
          <p className="text-slate-700">Врач: {booked.doctor.full_name}</p>
          <p className="text-slate-700">Специальность: {booked.doctor.specialization_name}</p>
          {booked.doctor.office_number && (
            <p className="text-slate-700">Кабинет: {booked.doctor.office_number}</p>
          )}
          <div className="mt-4 flex gap-3">
            <Link to="/patient/appointments">
              <Button>Мои записи</Button>
            </Link>
            <Button variant="secondary" onClick={() => { setBooked(null); setStep(1); }}>
              Записаться ещё
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-slate-950">Запись к врачу</h1>

      <div className="flex gap-2 text-sm text-slate-500">
        <span className={step === 1 ? "font-semibold text-sky-700" : ""}>1. Специальность</span>
        <span>→</span>
        <span className={step === 2 ? "font-semibold text-sky-700" : ""}>2. Врач</span>
        <span>→</span>
        <span className={step === 3 ? "font-semibold text-sky-700" : ""}>3. Время</span>
      </div>

      {step === 1 && (
        <div className="space-y-2">
          {specializations.length === 0 && (
            <p className="text-slate-500">Загрузка...</p>
          )}
          {specializations.map((spec) => (
            <button
              key={spec.id}
              onClick={() => selectSpecialization(spec)}
              disabled={loading}
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-800 transition hover:border-sky-400 hover:bg-sky-50"
            >
              {spec.name}
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-2">
          <button
            onClick={() => setStep(1)}
            className="text-sm text-sky-700 hover:underline"
          >
            ← {selectedSpec?.name}
          </button>
          {loading && <p className="text-slate-500">Загрузка...</p>}
          {!loading && doctors.length === 0 && (
            <p className="text-slate-500">Нет врачей по этой специальности.</p>
          )}
          {doctors.map((doc) => (
            <button
              key={doc.id}
              onClick={() => selectDoctor(doc)}
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-sky-400 hover:bg-sky-50"
            >
              <p className="text-sm font-medium text-slate-900">{doc.full_name}</p>
              {doc.office_number && (
                <p className="text-xs text-slate-500">Кабинет {doc.office_number}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-2">
          <button
            onClick={() => setStep(2)}
            className="text-sm text-sky-700 hover:underline"
          >
            ← {selectedDoctor?.full_name}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {loading && <p className="text-slate-500">Загрузка...</p>}
          {!loading && slots.length === 0 && (
            <p className="text-slate-500">Нет свободных окон у этого врача.</p>
          )}
          {slots.map((slot) => (
            <button
              key={slot.id}
              onClick={() => handleBook(slot)}
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-sky-400 hover:bg-sky-50"
            >
              <p className="text-sm font-medium text-slate-900">
                {formatDateTime(slot.starts_at)} — {formatTime(slot.ends_at)}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
