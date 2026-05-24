import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api } from "../../shared/api/client";
import type { DoctorMedicalCardResponse, MedicalRecord } from "../../shared/types/medical";
import { Button } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";
import { MedicalRecordForm, type MedicalRecordFormValues } from "./MedicalRecordForm";

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-900">{value || "—"}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ru-RU");
}

function RecordCard({
  currentDoctorId,
  onEdit,
  record,
}: {
  currentDoctorId: string;
  onEdit: (record: MedicalRecord) => void;
  record: MedicalRecord;
}) {
  const canEdit = record.doctor_id === currentDoctorId;

  return (
    <Card className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-950">{formatDate(record.record_date)}</p>
          <p className="text-sm text-slate-500">{record.doctor_full_name}</p>
        </div>
        {canEdit && (
          <Button type="button" variant="secondary" onClick={() => onEdit(record)}>
            Редактировать
          </Button>
        )}
      </div>
      <Field label="Жалобы" value={record.complaints} />
      <Field label="Осмотр" value={record.examination_result} />
      <Field label="Диагноз" value={record.diagnosis_text} />
      <Field label="Лечение / рекомендации" value={record.treatment_text} />
    </Card>
  );
}

export function DoctorMedicalCardPage() {
  const { patientId } = useParams();
  const [data, setData] = useState<DoctorMedicalCardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);

  const loadMedicalCard = useCallback(async () => {
    if (!patientId) return;

    setLoading(true);
    setFetchError("");
    try {
      const response = await api.get<DoctorMedicalCardResponse>(
        `/doctor/patients/${patientId}/medical-card`,
      );
      setData(response.data);
    } catch {
      setFetchError("Не удалось загрузить медкарту пациента");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadMedicalCard();
  }, [loadMedicalCard]);

  async function handleCreate(values: MedicalRecordFormValues) {
    if (!patientId) return;

    setSubmitting(true);
    setFormError("");
    try {
      await api.post(`/doctor/patients/${patientId}/medical-records`, values);
      await loadMedicalCard();
    } catch {
      setFormError("Не удалось добавить запись");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(values: MedicalRecordFormValues) {
    if (!editingRecord) return;

    setSubmitting(true);
    setFormError("");
    try {
      await api.patch(`/doctor/medical-records/${editingRecord.id}`, values);
      setEditingRecord(null);
      await loadMedicalCard();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      setFormError(
        status === 403 ? "Нет прав на редактирование этой записи" : "Не удалось сохранить запись",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="py-10 text-center text-sm text-slate-500">Загрузка…</p>;
  if (fetchError) return <p className="py-10 text-center text-sm text-red-600">{fetchError}</p>;
  if (!data) return null;

  const { current_doctor: currentDoctor, medical_card: card, patient, records } = data;
  const statusLabel = card.status === "ACTIVE" ? "Активна" : "Архив";

  return (
    <div className="space-y-6">
      <Link className="inline-flex text-sm font-medium text-sky-700 hover:text-sky-900" to="/doctor/patients">
        ← К списку пациентов
      </Link>

      <Card>
        <h1 className="text-xl font-semibold text-slate-950">Медкарта пациента</h1>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="ФИО пациента" value={patient.full_name} />
          <Field label="Дата рождения" value={patient.date_of_birth} />
          <Field label="Телефон" value={patient.phone} />
          <Field label="Аллергии" value={patient.allergies} />
          <Field label="Хронические заболевания" value={patient.chronic_conditions} />
          <Field label="Номер карты" value={card.card_number} />
          <Field label="Статус карты" value={statusLabel} />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-950">
          {editingRecord ? "Редактирование записи" : "Новая запись"}
        </h2>
        <div className="mt-5">
          <MedicalRecordForm
            error={formError}
            initialRecord={editingRecord}
            submitting={submitting}
            onCancel={editingRecord ? () => setEditingRecord(null) : undefined}
            onSubmit={editingRecord ? handleUpdate : handleCreate}
          />
        </div>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-950">Записи медкарты</h2>
        {records.length === 0 ? (
          <p className="text-sm text-slate-500">Записей пока нет.</p>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <RecordCard
                key={record.id}
                currentDoctorId={currentDoctor.id}
                record={record}
                onEdit={(nextRecord) => {
                  setFormError("");
                  setEditingRecord(nextRecord);
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
