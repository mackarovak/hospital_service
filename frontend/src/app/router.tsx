import { createBrowserRouter, Navigate } from "react-router-dom";

import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage } from "../features/auth/LoginPage";
import { DoctorDashboard } from "../features/doctor/DoctorDashboard";
import { DoctorMedicalCardPage } from "../features/doctor/DoctorMedicalCardPage";
import { DoctorPatientsPage } from "../features/doctor/DoctorPatientsPage";
import { MedicalRecordForm } from "../features/doctor/MedicalRecordForm";
import { PatientDashboard } from "../features/patient/PatientDashboard";
import { PatientMedicalCardPage } from "../features/patient/PatientMedicalCardPage";
import { PatientProfileForm } from "../features/patient/PatientProfileForm";
import { Layout } from "../shared/ui/Layout";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/patient" replace />,
      },
      {
        path: "patient",
        element: (
          <ProtectedRoute allowedRoles={["PATIENT"]}>
            <PatientDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "patient/profile",
        element: (
          <ProtectedRoute allowedRoles={["PATIENT"]}>
            <PatientProfileForm />
          </ProtectedRoute>
        ),
      },
      {
        path: "patient/medical-card",
        element: (
          <ProtectedRoute allowedRoles={["PATIENT"]}>
            <PatientMedicalCardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "doctor",
        element: (
          <ProtectedRoute allowedRoles={["DOCTOR"]}>
            <DoctorDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "doctor/patients",
        element: (
          <ProtectedRoute allowedRoles={["DOCTOR"]}>
            <DoctorPatientsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "doctor/patients/:patientId/medical-card",
        element: (
          <ProtectedRoute allowedRoles={["DOCTOR"]}>
            <DoctorMedicalCardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "doctor/medical-records/:recordId",
        element: (
          <ProtectedRoute allowedRoles={["DOCTOR"]}>
            <MedicalRecordForm />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
