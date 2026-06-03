import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import type { UserRole } from "../types/auth";

export function Layout() {
  const navigate = useNavigate();
  const role = localStorage.getItem("user_role") as UserRole | null;
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-2 transition ${
      isActive
        ? "bg-sky-700 text-white shadow-sm shadow-sky-900/20"
        : "text-slate-600 hover:bg-sky-50 hover:text-sky-900"
    }`;

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    navigate("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/92 shadow-sm shadow-slate-200/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link className="flex items-center gap-3 text-base font-semibold text-slate-950" to="/">
            <span className="medical-mark flex h-10 w-10 items-center justify-center rounded-md bg-sky-700 text-white shadow-sm shadow-sky-900/20" aria-hidden="true">
            </span>
            <span>
              <span className="block leading-5">MedCat</span>
              <span className="block text-xs font-medium text-slate-500">
                {role === "DOCTOR" ? "Рабочее место врача" : "Медицинский кабинет"}
              </span>
            </span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-2 text-sm font-medium">
            {role === "PATIENT" && (
              <>
                <NavLink className={navLinkClass} to="/patient" end>
                  Главная
                </NavLink>
                <NavLink className={navLinkClass} to="/patient/medical-card">
                  Моя медкарта
                </NavLink>
                <NavLink className={navLinkClass} to="/patient/book">
                  Записаться к врачу
                </NavLink>
                <NavLink className={navLinkClass} to="/patient/appointments">
                  Мои записи
                </NavLink>
                <NavLink className={navLinkClass} to="/patient/profile">
                  Мои данные
                </NavLink>
              </>
            )}
            {role === "DOCTOR" && (
              <>
                <NavLink className={navLinkClass} to="/doctor" end>
                  Главная
                </NavLink>
                <NavLink className={navLinkClass} to="/doctor/patients">
                  Мои пациенты
                </NavLink>
                <NavLink className={navLinkClass} to="/doctor/schedule">
                  Расписание
                </NavLink>
              </>
            )}
            <button className="rounded-md px-3 py-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950" onClick={handleLogout}>
              Выйти
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
