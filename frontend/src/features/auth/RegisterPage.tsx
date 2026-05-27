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
    } catch {
      setError("Не удалось зарегистрироваться. Проверьте данные.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-slate-950">Регистрация</h1>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setRole("PATIENT")}
            className={`flex-1 rounded-md border py-2 text-sm font-medium transition ${
              role === "PATIENT"
                ? "border-sky-700 bg-sky-700 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Пациент
          </button>
          <button
            type="button"
            onClick={() => setRole("DOCTOR")}
            className={`flex-1 rounded-md border py-2 text-sm font-medium transition ${
              role === "DOCTOR"
                ? "border-sky-700 bg-sky-700 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Врач
          </button>
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
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
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
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

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button className="w-full" type="submit">
            Зарегистрироваться
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Уже есть аккаунт?{" "}
          <Link to="/login" className="text-sky-700 hover:underline">
            Войти
          </Link>
        </p>
      </Card>
    </main>
  );
}
