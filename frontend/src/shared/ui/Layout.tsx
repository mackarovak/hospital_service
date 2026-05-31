import { Link, Outlet, useNavigate } from "react-router-dom";

import type { UserRole } from "../types/auth";

export function Layout() {
  const navigate = useNavigate();
  const role = localStorage.getItem("user_role") as UserRole | null;

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link className="flex items-center gap-2 text-base font-semibold text-slate-950" to="/">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-sky-700 text-sm font-bold text-white">
              M
            </span>
            <span>MedCat</span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-2 text-sm text-slate-600">
            {role === "PATIENT" && (
              <>
                <Link className="rounded-md px-3 py-2 hover:bg-slate-100 hover:text-slate-950" to="/patient">
                  Главная
                </Link>
                <Link className="rounded-md px-3 py-2 hover:bg-slate-100 hover:text-slate-950" to="/patient/medical-card">
                  Моя медкарта
                </Link>
                <Link className="rounded-md px-3 py-2 hover:bg-slate-100 hover:text-slate-950" to="/patient/book">
                  Записаться к врачу
                </Link>
                <Link className="rounded-md px-3 py-2 hover:bg-slate-100 hover:text-slate-950" to="/patient/appointments">
                  Мои записи
                </Link>
                <Link className="rounded-md px-3 py-2 hover:bg-slate-100 hover:text-slate-950" to="/patient/profile">
                  Мои данные
                </Link>
              </>
            )}
            {role === "DOCTOR" && (
              <>
                <Link className="rounded-md px-3 py-2 hover:bg-slate-100 hover:text-slate-950" to="/doctor">
                  Главная
                </Link>
                <Link className="rounded-md px-3 py-2 hover:bg-slate-100 hover:text-slate-950" to="/doctor/patients">
                  Мои пациенты
                </Link>
                <Link className="rounded-md px-3 py-2 hover:bg-slate-100 hover:text-slate-950" to="/doctor/schedule">
                  Расписание
                </Link>
              </>
            )}
            <button className="rounded-md px-3 py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-950" onClick={handleLogout}>
              Выйти
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-7">
        <Outlet />
      </main>
    </div>
  );
}
