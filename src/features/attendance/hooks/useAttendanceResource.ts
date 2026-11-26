import { useEffect, useState } from "react";
import { attendanceErrorMessage } from "../errors";
import type { AttendanceResourceState } from "../workspace.types";
export function useAttendanceResource<T>(loader: () => Promise<T>) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<AttendanceResourceState<T>>({
    data: null,
    loading: true,
    error: null,
  });
  useEffect(() => {
    let active = true;
    setState({ data: null, loading: true, error: null });
    void loader()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (active)
          setState({
            data: null,
            loading: false,
            error: attendanceErrorMessage(
              error,
              "Não foi possível carregar os dados. Tente novamente.",
            ),
          });
      });
    return () => {
      active = false;
    };
  }, [loader, revision]);
  return { ...state, reload: () => setRevision((value) => value + 1) };
}
