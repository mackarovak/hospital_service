import { Link } from "react-router-dom";

import { Card } from "../../shared/ui/Card";

export function PatientDashboard() {
  return (
    <Card>
      <h1 className="text-xl font-semibold text-slate-950">Кабинет пациента</h1>
      <div className="mt-4 flex gap-3 text-sm">
        <Link className="text-sky-700 hover:text-sky-900" to="/patient/medical-card">
          Открыть медкарту
        </Link>
        <Link className="text-sky-700 hover:text-sky-900" to="/patient/profile">
          Изменить профиль
        </Link>
      </div>
    </Card>
  );
}
