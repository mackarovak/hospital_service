import { Card } from "../../shared/ui/Card";
import { Input } from "../../shared/ui/Input";

export function PatientProfileForm() {
  return (
    <Card>
      <h1 className="text-xl font-semibold text-slate-950">Личные данные</h1>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Input label="Имя" name="first_name" />
        <Input label="Фамилия" name="last_name" />
        <Input label="Телефон" name="phone" />
        <Input label="Группа крови" name="blood_type" />
      </div>
    </Card>
  );
}
