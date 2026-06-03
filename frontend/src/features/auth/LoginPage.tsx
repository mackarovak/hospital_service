import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../../shared/api/client";
import type { LoginResponse } from "../../shared/types/auth";
import { Button } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";
import { Input } from "../../shared/ui/Input";

export function LoginPage() {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const { data } = await api.post<LoginResponse>("/auth/login", {
        login,
        password,
      });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_role", data.user.role);
      navigate(data.user.role === "DOCTOR" ? "/doctor" : "/patient");
    } catch {
      setError("Не удалось войти");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <Card className="grid w-full max-w-5xl overflow-hidden p-0 lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="hidden border-r border-slate-100 bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-8 py-9 lg:block">
          <div className="flex items-center gap-3">
            <span className="medical-mark flex h-12 w-12 items-center justify-center rounded-md bg-sky-700 text-white shadow-sm shadow-sky-900/20" aria-hidden="true" />
            <div>
              <p className="text-lg font-semibold leading-5 text-slate-950">MedCat</p>
              <p className="text-xs font-medium uppercase tracking-wide text-sky-700">medical service</p>
            </div>
          </div>
          <div className="mt-8 rounded-lg border border-sky-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Электронная медкарта</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">Прием и история лечения</p>
              </div>
              <span className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">ACTIVE</span>
            </div>
            <div className="mt-6 h-12 rounded-md border border-sky-100 bg-sky-50 px-4 py-3">
              <div className="h-2 w-3/4 rounded-full bg-sky-200" />
              <div className="mt-2 h-2 w-1/2 rounded-full bg-slate-200" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <p className="text-slate-400">ID</p>
                <p className="mt-1 font-semibold text-slate-700">MC-0001</p>
              </div>
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <p className="text-slate-400">Role</p>
                <p className="mt-1 font-semibold text-slate-700">Doctor</p>
              </div>
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <p className="text-slate-400">Status</p>
                <p className="mt-1 font-semibold text-emerald-700">OK</p>
              </div>
            </div>
          </div>
          <div className="mt-5 rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-950">Демо-доступ</p>
            <p className="mt-2">patient1 / password</p>
            <p>doctor1 / password</p>
          </div>
        </aside>
        <section className="bg-white">
        <div className="border-b border-slate-100 px-7 py-6">
          <div className="flex items-center gap-3">
            <span className="medical-mark flex h-11 w-11 items-center justify-center rounded-md bg-sky-700 text-white shadow-sm shadow-sky-900/20" aria-hidden="true">
            </span>
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">MedCat</h1>
              <p className="text-sm text-slate-500">Вход в медицинский кабинет</p>
            </div>
          </div>
        </div>
        <form className="space-y-4 px-7 py-6" onSubmit={handleSubmit}>
          <Input label="Логин" name="login" value={login} onChange={(event) => setLogin(event.target.value)} />
          <Input
            label="Пароль"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <Button className="w-full" type="submit">
            Войти
          </Button>
        </form>
        <p className="border-t border-slate-100 px-7 py-5 text-center text-sm text-slate-500">
          Нет аккаунта?{" "}
          <Link to="/register" className="font-semibold text-sky-700 hover:underline">
            Зарегистрироваться
          </Link>
        </p>
        </section>
      </Card>
    </main>
  );
}
