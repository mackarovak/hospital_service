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
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link className="text-base font-semibold text-slate-950" to="/">
            MedCat
          </Link>
          <nav className="flex items-center gap-4 text-sm text-slate-600">
            {role === "PATIENT" && (
              <>
                <Link className="hover:text-slate-950" to="/patient">
                  Главная
                </Link>
                <Link className="hover:text-slate-950" to="/patient/medical-card">
                  Моя медкарта
                </Link>
                <Link className="hover:text-slate-950" to="/patient/book">
                  Записаться к врачу
                </Link>
                <Link className="hover:text-slate-950" to="/patient/appointments">
                  Мои записи
                </Link>
                <Link className="hover:text-slate-950" to="/patient/profile">
                  Мои данные
                </Link>
              </>
            )}
            {role === "DOCTOR" && (
              <>
                <Link className="hover:text-slate-950" to="/doctor">
                  Главная
                </Link>
                <Link className="hover:text-slate-950" to="/doctor/patients">
                  Мои пациенты
                </Link>
                <Link className="hover:text-slate-950" to="/doctor/schedule">
                  Расписание
                </Link>
              </>
            )}
            <button className="hover:text-slate-950" onClick={handleLogout}>
              Выйти
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
