import uuid

import django.db.models.deletion
from django.db import migrations, models


def migrate_doctor_specializations(apps, schema_editor):
    Doctor = apps.get_model("medical", "Doctor")
    Specialization = apps.get_model("medical", "Specialization")

    for doctor in Doctor.objects.exclude(specialization_old__isnull=True).exclude(specialization_old=""):
        spec, _ = Specialization.objects.get_or_create(name=doctor.specialization_old)
        doctor.specialization = spec
        doctor.save(update_fields=["specialization"])


class Migration(migrations.Migration):

    dependencies = [
        ("medical", "0003_user_remove_password_hash"),
    ]

    operations = [
        migrations.CreateModel(
            name="Specialization",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=100, unique=True)),
            ],
            options={
                "db_table": "specializations",
            },
        ),
        # Rename old CharField to free up the name
        migrations.RenameField(
            model_name="doctor",
            old_name="specialization",
            new_name="specialization_old",
        ),
        # Add new FK field
        migrations.AddField(
            model_name="doctor",
            name="specialization",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="doctors",
                to="medical.specialization",
            ),
        ),
        # Migrate existing string data to FK references
        migrations.RunPython(migrate_doctor_specializations, reverse_code=migrations.RunPython.noop),
        # Drop the old CharField
        migrations.RemoveField(
            model_name="doctor",
            name="specialization_old",
        ),
        migrations.CreateModel(
            name="AppointmentSlot",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("starts_at", models.DateTimeField()),
                ("ends_at", models.DateTimeField()),
                (
                    "doctor",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="slots",
                        to="medical.doctor",
                    ),
                ),
                (
                    "patient",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="appointments",
                        to="medical.patient",
                    ),
                ),
            ],
            options={
                "db_table": "appointment_slots",
                "ordering": ["starts_at"],
            },
        ),
    ]