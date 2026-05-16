import { type FormEvent, useEffect, useState } from "react";

import { api } from "../../shared/api/client";
import type { PatientMedicalCardResponse, PatientProfile } from "../../shared/types/medical";
import { Button } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";
import { Input } from "../../shared/ui/Input";

type FormState = {
  first_name: string;
  last_name: string;
  middle_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  address: string;
  blood_type: string;
  allergies: string;
  chronic_conditions: string;
};

const EMPTY_FORM: FormState = {
  first_name: "",
  last_name: "",
  middle_name: "",
  date_of_birth: "",
  gender: "",
  phone: "",
  address: "",
  blood_type: "",
  allergies: "",
  chronic_conditions: "",
};

function patientToForm(p: PatientProfile): FormState {
  return {
    first_name: p.first_name ?? "",
    last_name: p.last_name ?? "",
    middle_name: p.middle_name ?? "",
    date_of_birth: p.date_of_birth ?? "",
    gender: p.gender ?? "",
    phone: p.phone ?? "",
    address: p.address ?? "",
    blood_type: p.blood_type ?? "",
    allergies: p.allergies ?? "",
    chronic_conditions: p.chronic_conditions ?? "",
  };
}

const selectClass =
  "mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100";

const textareaClass =
  "mt-1 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100 min-h-[80px]";

export function PatientProfileForm() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get<PatientMedicalCardResponse>("/patient/medical-card")
      .then((r) => setForm(patientToForm(r.data.patient)))
      .catch(() => setFetchError("Не удалось загрузить данные"))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setSuccess("");
    setSubmitting(true);

    try {
      await api.patch<{ patient: PatientProfile }>("/patient/profile", form);
      setSuccess("Данные сохранены");
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { errors?: Record<string, string> } } })
        ?.response?.data;
      if (data?.errors) {
        setErrors(data.errors);
      } else {
        setErrors({ _global: "Не удалось сохранить данные" });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="py-10 text-center text-sm text-slate-500">Загрузка…</p>;
  if (fetchError) return <p className="py-10 text-center text-sm text-red-600">{fetchError}</p>;

  return (
    <Card>
      <h1 className="text-xl font-semibold text-slate-950">Личные данные</h1>
      <form className="mt-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Input
              label="Фамилия"
              name="last_name"
              value={form.last_name}
              onChange={(e) => handleChange("last_name", e.target.value)}
            />
            {errors.last_name && (
              <p className="mt-1 text-xs text-red-600">{errors.last_name}</p>
            )}
          </div>
          <div>
            <Input
              label="Имя"
              name="first_name"
              value={form.first_name}
              onChange={(e) => handleChange("first_name", e.target.value)}
            />
            {errors.first_name && (
              <p className="mt-1 text-xs text-red-600">{errors.first_name}</p>
            )}
          </div>
          <div>
            <Input
              label="Отчество"
              name="middle_name"
              value={form.middle_name}
              onChange={(e) => handleChange("middle_name", e.target.value)}
            />
            {errors.middle_name && (
              <p className="mt-1 text-xs text-red-600">{errors.middle_name}</p>
            )}
          </div>
          <div>
            <Input
              label="Дата рождения"
              name="date_of_birth"
              type="date"
              value={form.date_of_birth}
              onChange={(e) => handleChange("date_of_birth", e.target.value)}
            />
            {errors.date_of_birth && (
              <p className="mt-1 text-xs text-red-600">{errors.date_of_birth}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              <span>Пол</span>
              <select
                name="gender"
                value={form.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
                className={selectClass}
              >
                <option value="">— не указан —</option>
                <option value="MALE">Мужской</option>
                <option value="FEMALE">Женский</option>
                <option value="OTHER">Другой</option>
              </select>
            </label>
            {errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender}</p>}
          </div>
          <div>
            <Input
              label="Телефон"
              name="phone"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
          </div>
          <div className="md:col-span-2">
            <Input
              label="Адрес"
              name="address"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
            />
            {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              <span>Группа крови</span>
              <select
                name="blood_type"
                value={form.blood_type}
                onChange={(e) => handleChange("blood_type", e.target.value)}
                className={selectClass}
              >
                <option value="">— не указана —</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                <option value="UNKNOWN">Не определена</option>
              </select>
            </label>
            {errors.blood_type && (
              <p className="mt-1 text-xs text-red-600">{errors.blood_type}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              <span>Аллергии</span>
              <textarea
                name="allergies"
                value={form.allergies}
                onChange={(e) => handleChange("allergies", e.target.value)}
                className={textareaClass}
              />
            </label>
            {errors.allergies && (
              <p className="mt-1 text-xs text-red-600">{errors.allergies}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              <span>Хронические заболевания</span>
              <textarea
                name="chronic_conditions"
                value={form.chronic_conditions}
                onChange={(e) => handleChange("chronic_conditions", e.target.value)}
                className={textareaClass}
              />
            </label>
            {errors.chronic_conditions && (
              <p className="mt-1 text-xs text-red-600">{errors.chronic_conditions}</p>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {errors._global && <p className="text-sm text-red-600">{errors._global}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Сохранение…" : "Сохранить"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
