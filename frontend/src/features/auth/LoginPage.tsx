import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-slate-950">MedCat</h1>
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <Input label="Логин" name="login" value={login} onChange={(event) => setLogin(event.target.value)} />
          <Input
            label="Пароль"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" type="submit">
            Войти
          </Button>
        </form>
      </Card>
    </main>
  );
}
