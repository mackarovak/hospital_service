from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("medical", "0002_user_abstract_base_user_patient_choices"),
    ]

    operations = [
        # Copy existing bcrypt hashes from password_hash into AbstractBaseUser's password field
        migrations.RunSQL(
            sql="UPDATE users SET password = password_hash",
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.RemoveField(
            model_name="user",
            name="password_hash",
        ),
    ]
