import axios from "axios";

import type { LoginResponse } from "../types/auth";
import type { Appointment, DoctorPublic, DoctorSlot, FreeSlot, Specialization } from "../types/medical";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Специальности (публичные)
export const getSpecializations = () => api.get<Specialization[]>("/specializations");

export const getDoctorsBySpecialization = (specializationId: string) =>
  api.get<DoctorPublic[]>(`/specializations/${specializationId}/doctors`);

// Регистрация
export type RegisterPatientPayload = {
  login: string;
  password: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
};

export type RegisterDoctorPayload = {
  login: string;
  password: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  specialization_id: string;
  office_number?: string;
};

export const registerPatient = (data: RegisterPatientPayload) =>
  api.post<LoginResponse>("/auth/register/patient", data);

export const registerDoctor = (data: RegisterDoctorPayload) =>
  api.post<LoginResponse>("/auth/register/doctor", data);

// Пациент — запись к врачу
export const getDoctorFreeSlots = (doctorId: string) =>
  api.get<FreeSlot[]>(`/patient/doctors/${doctorId}/slots`);

export const bookSlot = (slotId: string) =>
  api.post<Appointment>(`/patient/slots/${slotId}/book`);

export const cancelBooking = (slotId: string) =>
  api.delete(`/patient/slots/${slotId}/book`);

export const getMyAppointments = () => api.get<Appointment[]>("/patient/appointments");

// Врач — управление слотами
export const getDoctorSlots = (params?: { from?: string; to?: string }) =>
  api.get<DoctorSlot[]>("/doctor/slots", { params });

export const createSlot = (data: { starts_at: string; ends_at: string }) =>
  api.post<DoctorSlot>("/doctor/slots", data);

export const deleteSlot = (slotId: string) => api.delete(`/doctor/slots/${slotId}`);
