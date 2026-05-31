import http from "k6/http";
import { check, sleep } from "k6";

export const BASE_URL = __ENV.BASE_URL || "http://localhost:8000";
export const PATIENT_LOGIN = __ENV.PATIENT_LOGIN || "patient1";
export const DOCTOR_LOGIN = __ENV.DOCTOR_LOGIN || "doctor1";
export const PASSWORD = __ENV.PASSWORD || "password";

export function jsonHeaders(extra = {}) {
  return {
    headers: Object.assign({
      "Content-Type": "application/json",
    }, extra),
  };
}

export function authHeaders(token) {
  return jsonHeaders({ Authorization: `Bearer ${token}` });
}

export function login(loginValue, password = PASSWORD) {
  const response = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ login: loginValue, password }),
    jsonHeaders(),
  );

  check(response, {
    [`login ${loginValue} is ok`]: (res) => res.status === 200 && Boolean(res.json("access_token")),
  });

  return response.status === 200 ? response.json("access_token") : null;
}

export function checkStatus(response, name, expected = 200) {
  return check(response, {
    [`${name} status ${expected}`]: (res) => res.status === expected,
  });
}

export function think(min = 0.2, max = 1.0) {
  sleep(min + Math.random() * (max - min));
}
