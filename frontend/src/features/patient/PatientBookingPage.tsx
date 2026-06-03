import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  analyzePatientSymptoms,
  bookSlot,
  getDoctorFreeSlots,
  getDoctorsBySpecialization,
  getSpecializations,
} from "../../shared/api/client";
import type {
  Appointment,
  DoctorPublic,
  FreeSlot,
  Specialization,
  TriageRecommendation,
} from "../../shared/types/medical";
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
  const [symptomText, setSymptomText] = useState("");
  const [triage, setTriage] = useState<TriageRecommendation | null>(null);
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageError, setTriageError] = useState("");
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

  async function handleTriage() {
    const comment = symptomText.trim();
    if (!comment) {
      setTriageError("Опишите симптомы.");
      return;
    }

    setTriageError("");
    setTriage(null);
    setTriageLoading(true);
    try {
      const { data } = await analyzePatientSymptoms({ comment });
      setTriage(data);
    } catch {
      setTriageError("Не удалось подобрать специальность. Попробуйте снова.");
    } finally {
      setTriageLoading(false);
    }
  }

  async function selectRecommendedSpecialization() {
    if (!triage?.specialization) return;
    await selectSpecialization(triage.specialization);
  }

  const urgencyLabel = {
    LOW: "Планово",
    MEDIUM: "Средняя срочность",
    HIGH: "Срочно",
  } as const;

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
        <div className="space-y-4">
          <Card className="space-y-3">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Подбор по симптомам</h2>
              <p className="mt-1 text-sm text-slate-600">
                Напишите, что беспокоит, и система предложит специальность.
              </p>
            </div>
            <textarea
              value={symptomText}
              onChange={(e) => setSymptomText(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              placeholder="Например: температура, кашель и болит горло"
            />
            {triageError && <p className="text-sm text-red-600">{triageError}</p>}
            <Button onClick={handleTriage} disabled={triageLoading}>
              {triageLoading ? "Анализ..." : "Подобрать специальность"}
            </Button>

            {triage && (
              <div className="rounded-md border border-sky-100 bg-sky-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-white px-2 py-1 text-xs font-medium text-sky-800">
                    {urgencyLabel[triage.urgency]}
                  </span>
                  <span className="text-sm font-semibold text-slate-950">
                    {triage.recommended_specialization}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{triage.reason}</p>
                {triage.matched_symptoms.length > 0 && (
                  <p className="mt-1 text-xs text-slate-500">
                    Совпадения: {triage.matched_symptoms.join(", ")}
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-500">{triage.urgent_hint}</p>
                {triage.specialization ? (
                  <Button className="mt-3" onClick={selectRecommendedSpecialization}>
                    Выбрать {triage.specialization.name}
                  </Button>
                ) : (
                  <p className="mt-3 text-sm text-slate-600">
                    Такой специальности пока нет в расписании.
                  </p>
                )}
              </div>
            )}
          </Card>

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
