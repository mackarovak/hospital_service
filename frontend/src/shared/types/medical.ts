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
  doctor_id?: string;
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

export type DoctorProfile = {
  id: string;
  full_name: string;
  specialization: string | null;
  office_number?: string | null;
};

export type DoctorPatientListItem = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  card_number: string;
};

export type DoctorPatientsResponse = {
  doctor: DoctorProfile;
  items: DoctorPatientListItem[];
  page: number;
  limit: number;
  total: number;
};

export type DoctorMedicalCardPatient = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  allergies: string | null;
  chronic_conditions: string | null;
};

export type DoctorMedicalCardResponse = {
  current_doctor: DoctorProfile;
  patient: DoctorMedicalCardPatient;
  medical_card: MedicalCard;
  records: MedicalRecord[];
};

export type Specialization = {
  id: string;
  name: string;
};

export type DoctorPublic = {
  id: string;
  full_name: string;
  office_number: string | null;
  specialization_name: string;
};

export type FreeSlot = {
  id: string;
  starts_at: string;
  ends_at: string;
};

export type Appointment = {
  id: string;
  starts_at: string;
  ends_at: string;
  doctor: {
    id: string;
    full_name: string;
    office_number: string | null;
    specialization_name: string;
  };
};

export type DoctorSlot = {
  id: string;
  starts_at: string;
  ends_at: string;
  patient: { id: string; full_name: string } | null;
};
