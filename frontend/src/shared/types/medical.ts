export type PatientProfile = {
  id: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  address: string | null;
  blood_type: string | null;
  allergies: string | null;
  chronic_conditions: string | null;
};

export type MedicalCard = {
  id: string;
  card_number: string;
  status: "ACTIVE" | "ARCHIVED";
};

export type MedicalRecord = {
  id: string;
  record_date: string;
  doctor_full_name: string;
  complaints: string | null;
  examination_result: string | null;
  diagnosis_text: string | null;
  treatment_text: string | null;
};

export type PatientMedicalCardResponse = {
  patient: PatientProfile;
  medical_card: MedicalCard;
  records: MedicalRecord[];
};
