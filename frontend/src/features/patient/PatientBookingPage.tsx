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

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

const urgencyTone = {
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-800",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-800",
  HIGH: "border-red-200 bg-red-50 text-red-700",
} as const;

const urgencyLabel = {
  LOW: "Планово",
  MEDIUM: "Средняя срочность",
  HIGH: "Срочно",
} as const;

const symptomExamples = [
  "Боль в груди и одышка",
  "Тошнота и болит желудок",
  "Сыпь и зуд",
  "Болит зуб и опухла десна",
];

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
    setSelectedDoctor(null);
    setSlots([]);
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
      <div className="mx-auto max-w-2xl">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-5">
            <p className="text-sm font-medium text-emerald-700">Запись подтверждена</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">
              {formatDateTime(booked.starts_at)}
            </h1>
          </div>
          <div className="space-y-4 p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase text-slate-500">Врач</p>
                <p className="mt-1 font-medium text-slate-950">{booked.doctor.full_name}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase text-slate-500">Специальность</p>
                <p className="mt-1 font-medium text-slate-950">{booked.doctor.specialization_name}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Время приема: {formatTime(booked.starts_at)} - {formatTime(booked.ends_at)}
              {booked.doctor.office_number ? `, кабинет ${booked.doctor.office_number}` : ""}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/patient/appointments">
                <Button>Мои записи</Button>
              </Link>
              <Button
                variant="secondary"
                onClick={() => {
                  setBooked(null);
                  setStep(1);
                }}
              >
                Записаться еще
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-sky-700">MedCat</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Запись к врачу</h1>
        </div>
        <div className="flex rounded-md border border-slate-200 bg-white p-1 text-sm shadow-sm">
          {[
            ["1", "Специальность"],
            ["2", "Врач"],
            ["3", "Время"],
          ].map(([number, label], index) => {
            const active = step === index + 1;
            return (
              <span
                key={number}
                className={`rounded px-3 py-1.5 font-medium ${
                  active ? "bg-sky-700 text-white" : "text-slate-500"
                }`}
              >
                {number}. {label}
              </span>
            );
          })}
        </div>
      </div>

      {step === 1 && (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Подбор по симптомам</h2>
              <p className="mt-1 text-sm text-slate-600">
                Опишите жалобы, чтобы сразу перейти к подходящей специальности.
              </p>
            </div>
            <textarea
              value={symptomText}
              onChange={(e) => setSymptomText(e.target.value)}
              rows={5}
              className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              placeholder="Например: температура, кашель и болит горло"
            />
            <div className="flex flex-wrap gap-2">
              {symptomExamples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setSymptomText(example)}
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800"
                >
                  {example}
                </button>
              ))}
            </div>
            {triageError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {triageError}
              </div>
            )}
            <Button onClick={handleTriage} disabled={triageLoading} className="w-full sm:w-auto">
              {triageLoading ? "Анализ..." : "Подобрать специальность"}
            </Button>

            {triage && (
              <div className="rounded-md border border-sky-100 bg-sky-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${urgencyTone[triage.urgency]}`}>
                    {urgencyLabel[triage.urgency]}
                  </span>
                  <span className="text-lg font-semibold text-slate-950">
                    {triage.recommended_specialization}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{triage.reason}</p>
                {triage.matched_symptoms.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {triage.matched_symptoms.map((symptom) => (
                      <span
                        key={symptom}
                        className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-600"
                      >
                        {symptom}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-3 rounded-md bg-white/80 p-3 text-xs leading-5 text-slate-600">
                  {triage.urgent_hint}
                </p>
                {triage.specialization ? (
                  <Button className="mt-4" onClick={selectRecommendedSpecialization}>
                    Выбрать {triage.specialization.name}
                  </Button>
                ) : (
                  <p className="mt-4 text-sm text-slate-600">
                    Такой специальности пока нет в расписании.
                  </p>
                )}
              </div>
            )}
          </Card>

          <Card className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Все специальности</h2>
              <p className="mt-1 text-sm text-slate-600">Можно выбрать вручную.</p>
            </div>
            {specializations.length === 0 && (
              <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                Загрузка...
              </p>
            )}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {specializations.map((spec) => (
                <button
                  key={spec.id}
                  onClick={() => selectSpecialization(spec)}
                  disabled={loading}
                  className="group flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-800 transition hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>{spec.name}</span>
                  <span className="text-slate-300 transition group-hover:text-sky-600">Выбрать</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {step === 2 && (
        <Card className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button onClick={() => setStep(1)} className="text-sm font-medium text-sky-700 hover:text-sky-900">
                Назад к специальностям
              </button>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">{selectedSpec?.name}</h2>
            </div>
            <span className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">
              {doctors.length} врачей
            </span>
          </div>
          {loading && <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">Загрузка...</p>}
          {!loading && doctors.length === 0 && (
            <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Нет врачей по этой специальности.
            </p>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {doctors.map((doc) => (
              <button
                key={doc.id}
                onClick={() => selectDoctor(doc)}
                className="flex items-center gap-4 rounded-md border border-slate-200 bg-white p-4 text-left transition hover:border-sky-300 hover:bg-sky-50"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sm font-semibold text-sky-800">
                  {getInitials(doc.full_name)}
                </span>
                <span>
                  <span className="block font-medium text-slate-950">{doc.full_name}</span>
                  {doc.office_number && (
                    <span className="mt-0.5 block text-sm text-slate-500">Кабинет {doc.office_number}</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button onClick={() => setStep(2)} className="text-sm font-medium text-sky-700 hover:text-sky-900">
                Назад к врачам
              </button>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">{selectedDoctor?.full_name}</h2>
              <p className="text-sm text-slate-500">{selectedSpec?.name}</p>
            </div>
            {selectedDoctor?.office_number && (
              <span className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">
                Кабинет {selectedDoctor.office_number}
              </span>
            )}
          </div>
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {loading && <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">Загрузка...</p>}
          {!loading && slots.length === 0 && (
            <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Нет свободных окон у этого врача.
            </p>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {slots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => handleBook(slot)}
                className="rounded-md border border-slate-200 bg-white p-4 text-left transition hover:border-sky-300 hover:bg-sky-50"
              >
                <span className="block text-sm font-medium text-slate-950">
                  {formatDateTime(slot.starts_at)}
                </span>
                <span className="mt-1 block text-sm text-slate-500">
                  {formatTime(slot.starts_at)} - {formatTime(slot.ends_at)}
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
