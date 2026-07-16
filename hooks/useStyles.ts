import { useMemo } from "react";
import { useAuthContext } from "@/context/AuthContext";

export function useStyles(createStyles: any) {
  const { theme } = useAuthContext();

  return useMemo(() => createStyles(theme), [theme]);
}
