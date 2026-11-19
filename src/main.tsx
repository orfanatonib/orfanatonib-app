import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { store } from "@/store/slices";
import { queryClient } from "@/config/queryClient";
import App from "./App";
import { initSentry } from "./utils/sentry";
import { initGlobalErrorHandling } from "./utils/globalErrorHandler";

initSentry();
initGlobalErrorHandling();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);

