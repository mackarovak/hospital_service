from django.contrib.admin import ModelAdmin, register

from medical.models import (
    AppointmentSlot,
    Doctor,
    MedicalCard,
    MedicalRecord,
    Patient,
    Specialization,
    User,
)

@register(AppointmentSlot)
class AppointmentSlotAdmin(ModelAdmin):
    pass


@register(Doctor)
class DoctorAdmin(ModelAdmin):
    pass


@register(MedicalCard)
class MedicalCardAdmin(ModelAdmin):
    pass


@register(MedicalRecord)
class MedicalRecordAdmin(ModelAdmin):
    pass


@register(Patient)
class PatientAdmin(ModelAdmin):
    pass


@register(Specialization)
class SpecializationAdmin(ModelAdmin):
    pass


@register(User)
class UserAdmin(ModelAdmin):
    pass