import { Button } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";

export function MedicalRecordForm() {
  return (
    <Card>
      <h1 className="text-xl font-semibold text-slate-950">Запись в медкарте</h1>
      <form className="mt-5 space-y-4">
        <textarea className="min-h-28 w-full rounded-md border border-slate-300 p-3 text-sm" placeholder="Жалобы" />
        <textarea className="min-h-28 w-full rounded-md border border-slate-300 p-3 text-sm" placeholder="Осмотр" />
        <Button type="submit">Сохранить</Button>
      </form>
    </Card>
  );
}
