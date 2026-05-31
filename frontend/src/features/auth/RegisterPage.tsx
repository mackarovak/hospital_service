import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getSpecializations,
  registerDoctor,
  registerPatient,
} from "../../shared/api/client";
import type { Specialization } from "../../shared/types/medical";
import { Button } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";
import { Input } from "../../shared/ui/Input";

type Role = "PATIENT" | "DOCTOR";

export function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("PATIENT");
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    login: "",
    password: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    specialization_id: "",
    office_number: "",
  });

  useEffect(() => {
    getSpecializations().then(({ data }) => setSpecializations(data));
  }, []);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const common = {
        login: form.login,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        middle_name: form.middle_name || undefined,
      };

      const { data } =
        role === "PATIENT"
          ? await registerPatient(common)
          : await registerDoctor({
              ...common,
              specialization_id: form.specialization_id,
              office_number: form.office_number || undefined,
            });

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_role", data.user.role);
      navigate(data.user.role === "DOCTOR" ? "/doctor" : "/patient");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? "Не удалось зарегистрироваться. Проверьте данные.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-2xl overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-7 py-6">
          <p className="text-sm font-medium text-sky-700">MedCat</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Регистрация</h1>
          <p className="mt-1 text-sm text-slate-500">Создайте профиль пациента или врача.</p>
        </div>

        <div className="mx-7 mt-6 grid gap-2 rounded-md border border-slate-200 bg-white p-1 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setRole("PATIENT")}
            className={`rounded px-4 py-2.5 text-sm font-semibold transition ${
              role === "PATIENT"
                ? "bg-sky-700 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            Пациент
          </button>
          <button
            type="button"
            onClick={() => setRole("DOCTOR")}
            className={`rounded px-4 py-2.5 text-sm font-semibold transition ${
              role === "DOCTOR"
                ? "bg-sky-700 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            Врач
          </button>
        </div>

        <form className="grid gap-4 px-7 py-6 sm:grid-cols-2" onSubmit={handleSubmit}>
          <Input
            label="Логин"
            name="login"
            value={form.login}
            onChange={(e) => handleChange("login", e.target.value)}
          />
          <Input
            label="Пароль"
            name="password"
            type="password"
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
          />
          <Input
            label="Фамилия"
            name="last_name"
            value={form.last_name}
            onChange={(e) => handleChange("last_name", e.target.value)}
          />
          <Input
            label="Имя"
            name="first_name"
            value={form.first_name}
            onChange={(e) => handleChange("first_name", e.target.value)}
          />
          <Input
            label="Отчество (необязательно)"
            name="middle_name"
            value={form.middle_name}
            onChange={(e) => handleChange("middle_name", e.target.value)}
          />

          {role === "DOCTOR" && (
            <>
              <label className="block text-sm font-medium text-slate-700">
                <span>Специальность</span>
                <select
                  name="specialization_id"
                  value={form.specialization_id}
                  onChange={(e) => handleChange("specialization_id", e.target.value)}
                  required
                  className="mt-1 min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="">— выберите —</option>
                  {specializations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                label="Номер кабинета (необязательно)"
                name="office_number"
                value={form.office_number}
                onChange={(e) => handleChange("office_number", e.target.value)}
              />
            </>
          )}

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
              {error}
            </p>
          )}

          <Button className="w-full sm:col-span-2" type="submit">
            Зарегистрироваться
          </Button>
        </form>

        <p className="border-t border-slate-200 px-7 py-5 text-center text-sm text-slate-500">
          Уже есть аккаунт?{" "}
          <Link to="/login" className="text-sky-700 hover:underline">
            Войти
          </Link>
        </p>
      </Card>
    </main>
  );
}
