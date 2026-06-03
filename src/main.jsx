import { StrictMode } from "react"

import { createRoot } from "react-dom/client"

import { Toaster } from "react-hot-toast"

import "./index.css"

import App from "./App.jsx"

createRoot(
  document.getElementById("root")
).render(

  <StrictMode>

    <App />

    <Toaster

      position="top-right"

      toastOptions={{

        style: {

          background: "#0f172a",

          color: "#ffffff",

          border:
            "1px solid rgba(255,255,255,0.08)",

          borderRadius: "18px",

          padding: "16px",

          backdropFilter:
            "blur(20px)",

          boxShadow:
            "0px 10px 40px rgba(0,0,0,0.4)",

          fontSize: "14px",
        },

        success: {

          iconTheme: {

            primary: "#ef4444",

            secondary: "#ffffff",
          },
        },

        error: {

          iconTheme: {

            primary: "#ff4d4d",

            secondary: "#ffffff",
          },
        },
      }}
    />

  </StrictMode>
)