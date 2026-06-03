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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-md overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-7 py-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-sky-700 text-base font-bold text-white">
              M
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
        <p className="border-t border-slate-200 px-7 py-5 text-center text-sm text-slate-500">
          Нет аккаунта?{" "}
          <Link to="/register" className="text-sky-700 hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </Card>
    </main>
  );
}
