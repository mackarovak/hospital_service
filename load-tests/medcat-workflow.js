import http from "k6/http";
import { group } from "k6";

import {
  BASE_URL,
  DOCTOR_LOGIN,
  PATIENT_LOGIN,
  authHeaders,
  checkStatus,
  login,
  think,
} from "./lib/medcat.js";

export const options = {
  scenarios: {
    patient_journey: {
      executor: "constant-vus",
      exec: "patientJourney",
      vus: Number(__ENV.PATIENT_VUS || 8),
      duration: __ENV.DURATION || "3m",
    },
    doctor_journey: {
      executor: "constant-vus",
      exec: "doctorJourney",
      vus: Number(__ENV.DOCTOR_VUS || 4),
      duration: __ENV.DURATION || "3m",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.08"],
    http_req_duration: ["p(95)<1200"],
  },
};

export function patientJourney() {
  const token = login(PATIENT_LOGIN);
  if (!token) return;

  const headers = authHeaders(token);

  group("patient journey", () => {
    checkStatus(http.get(`${BASE_URL}/api/v1/patient/medical-card`, headers), "patient medical card");

    const specs = http.get(`${BASE_URL}/api/v1/specializations`);
    checkStatus(specs, "specializations");
    const specialization = specs.status === 200 ? specs.json()[0] : null;

    if (specialization) {
      const doctors = http.get(`${BASE_URL}/api/v1/specializations/${specialization.id}/doctors`, headers);
      checkStatus(doctors, "specialization doctors");
      const doctor = doctors.status === 200 ? doctors.json()[0] : null;

      if (doctor) {
        checkStatus(
          http.get(`${BASE_URL}/api/v1/patient/doctors/${doctor.id}/slots`, headers),
          "doctor free slots",
        );
      }
    }

    checkStatus(http.get(`${BASE_URL}/api/v1/patient/appointments`, headers), "patient appointments");
  });

  think(0.5, 1.5);
}

export function doctorJourney() {
  const token = login(DOCTOR_LOGIN);
  if (!token) return;

  const headers = authHeaders(token);

  group("doctor journey", () => {
    const patients = http.get(`${BASE_URL}/api/v1/doctor/patients?limit=10`, headers);
    checkStatus(patients, "doctor patients");

    const patient = patients.status === 200 ? patients.json("items.0") : null;
    if (patient) {
      checkStatus(
        http.get(`${BASE_URL}/api/v1/doctor/patients/${patient.id}/medical-card`, headers),
        "doctor patient medical card",
      );
    }

    checkStatus(http.get(`${BASE_URL}/api/v1/doctor/slots`, headers), "doctor slots");
  });

  think(0.5, 1.5);
}

