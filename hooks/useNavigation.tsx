import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { MessageSquare, Users, LifeBuoy } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export const useNavigation = () => {
  const pathName = usePathname();

  const requestsCount = useQuery(api.requests.count);

  const paths = useMemo(
    () => [
      {
        name: "Conversations",
        href: "/conversations",
        icon: <MessageSquare />,
        active: pathName.startsWith("/conversations"),
      },
      {
        name: "Friends",
        href: "/friends",
        icon: <Users />,
        active: pathName == "/friends",
        count: requestsCount,
      },
      {
        name: "Support",
        href: "/support",
        icon: <LifeBuoy />,
        active: pathName.startsWith("/support"),
      },
    ],
    [pathName, requestsCount]
  );

  return paths;
};
