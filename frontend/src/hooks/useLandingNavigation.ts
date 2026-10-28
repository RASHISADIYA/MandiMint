import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function useLandingNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    (sectionId: string) => {
      if (location.pathname !== "/") {
        navigate("/");
        window.setTimeout(() => {
          document
            .getElementById(sectionId)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
        return;
      }

      document
        .getElementById(sectionId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [location.pathname, navigate],
  );
}
