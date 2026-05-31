import http from "k6/http";
import { sleep } from "k6";

import { BASE_URL, checkStatus, login } from "./lib/medcat.js";

export const options = {
  stages: [
    { duration: "30s", target: 5 },
    { duration: "1m", target: 20 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<800"],
  },
};

export default function () {
  const health = http.get(`${BASE_URL}/api/v1/health`);
  checkStatus(health, "health");

  const specs = http.get(`${BASE_URL}/api/v1/specializations`);
  checkStatus(specs, "specializations");

  login("patient1");

  sleep(1);
}
