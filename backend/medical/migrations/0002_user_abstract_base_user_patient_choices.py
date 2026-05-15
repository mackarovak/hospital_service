import medical.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("medical", "0001_create_mvp_lite_schema"),
    ]

    operations = [
        # AbstractBaseUser adds password and last_login fields
        migrations.AddField(
            model_name="user",
            name="password",
            field=models.CharField(default="!", max_length=128, verbose_name="password"),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="user",
            name="last_login",
            field=models.DateTimeField(blank=True, null=True, verbose_name="last login"),
        ),
        # Register custom UserManager
        migrations.AlterModelManagers(
            name="user",
            managers=[
                ("objects", medical.models.UserManager()),
            ],
        ),
        # MOD-03: add choices to gender and blood_type
        migrations.AlterField(
            model_name="patient",
            name="gender",
            field=models.CharField(
                blank=True,
                choices=[("MALE", "Мужской"), ("FEMALE", "Женский"), ("OTHER", "Другой")],
                max_length=20,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="patient",
            name="blood_type",
            field=models.CharField(
                blank=True,
                choices=[
                    ("A+", "A+"),
                    ("A-", "A-"),
                    ("B+", "B+"),
                    ("B-", "B-"),
                    ("AB+", "AB+"),
                    ("AB-", "AB-"),
                    ("O+", "O+"),
                    ("O-", "O-"),
                    ("UNKNOWN", "Не определена"),
                ],
                max_length=10,
                null=True,
            ),
        ),
    ]
