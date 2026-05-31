import http from "k6/http";

import { BASE_URL, PATIENT_LOGIN, authHeaders, checkStatus, login, think } from "./lib/medcat.js";

export const options = {
  stages: [
    { duration: "1m", target: 10 },
    { duration: "1m", target: 25 },
    { duration: "1m", target: 50 },
    { duration: "1m", target: 75 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.10"],
    http_req_duration: ["p(95)<2000"],
  },
};

export default function () {
  checkStatus(http.get(`${BASE_URL}/api/v1/health`), "health");
  checkStatus(http.get(`${BASE_URL}/api/v1/specializations`), "specializations");

  const token = login(PATIENT_LOGIN);
  if (token) {
    const headers = authHeaders(token);
    checkStatus(http.get(`${BASE_URL}/api/v1/me`, headers), "me");
    checkStatus(http.get(`${BASE_URL}/api/v1/patient/medical-card`, headers), "patient medical card");
  }

  think(0.1, 0.5);
}

