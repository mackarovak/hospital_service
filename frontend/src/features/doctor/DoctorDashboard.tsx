import { Link } from "react-router-dom";

import { Card } from "../../shared/ui/Card";

export function DoctorDashboard() {
  return (
    <Card>
      <h1 className="text-xl font-semibold text-slate-950">Кабинет врача</h1>
      <Link className="mt-4 inline-flex text-sm text-sky-700 hover:text-sky-900" to="/doctor/patients">
        Открыть список пациентов
      </Link>
    </Card>
  );
}
