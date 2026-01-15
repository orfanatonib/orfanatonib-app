import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@/store/slices";
import App from "./App";
import { initSentry } from "./utils/sentry";
import { initGlobalErrorHandling } from "./utils/globalErrorHandler";

initSentry();
initGlobalErrorHandling();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

