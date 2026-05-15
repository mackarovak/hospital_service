import { Card } from "../../shared/ui/Card";
import { Input } from "../../shared/ui/Input";

export function DoctorPatientsPage() {
  return (
    <Card>
      <h1 className="text-xl font-semibold text-slate-950">Пациенты</h1>
      <div className="mt-5 max-w-sm">
        <Input label="Поиск" name="query" placeholder="ФИО или номер карты" />
      </div>
    </Card>
  );
}
