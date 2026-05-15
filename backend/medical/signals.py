from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender="medical.Patient")
def create_medical_card_for_patient(sender, instance, created, **kwargs):
    if not created:
        return
    from medical.models import MedicalCard
    MedicalCard.objects.create(
        patient=instance,
        card_number=f"MC-{instance.id.hex[:8].upper()}",
    )
