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
  stages: [
    { duration: "30s", target: 5 },
    { duration: "2m", target: 15 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<15000"],
  },
};

export default function () {
  group("public endpoints", () => {
    checkStatus(http.get(`${BASE_URL}/api/v1/health`), "health");
    checkStatus(http.get(`${BASE_URL}/api/v1/health/db`), "database health");
    checkStatus(http.get(`${BASE_URL}/api/v1/specializations`), "specializations");
  });

  group("patient reads", () => {
    const token = login(PATIENT_LOGIN);
    if (!token) return;

    const headers = authHeaders(token);
    checkStatus(http.get(`${BASE_URL}/api/v1/me`, headers), "patient me");
    checkStatus(http.get(`${BASE_URL}/api/v1/patient/medical-card`, headers), "patient medical card");
    checkStatus(http.get(`${BASE_URL}/api/v1/patient/appointments`, headers), "patient appointments");
  });

  group("doctor reads", () => {
    const token = login(DOCTOR_LOGIN);
    if (!token) return;

    const headers = authHeaders(token);
    checkStatus(http.get(`${BASE_URL}/api/v1/me`, headers), "doctor me");
    checkStatus(http.get(`${BASE_URL}/api/v1/doctor/patients`, headers), "doctor patients");
    checkStatus(http.get(`${BASE_URL}/api/v1/doctor/slots`, headers), "doctor slots");
  });

  think();
}
