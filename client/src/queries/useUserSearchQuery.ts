import { useQuery } from "@tanstack/react-query";
import { searchUsers } from "../services/users";

export function useUserSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ["users", "search", q],
    queryFn: () => searchUsers(q),
    enabled: q.length > 0,
    staleTime: 30_000,
  });
}
