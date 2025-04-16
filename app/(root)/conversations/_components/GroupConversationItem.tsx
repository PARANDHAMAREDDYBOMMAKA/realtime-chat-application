import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import React from "react";

type Props = {
  id: Id<"conversations">;
  name: string;
  lstMsgSender?: string;
  lstMsgContent?: string;
};

const GroupConversationItem = ({
  id,
  name,
  lstMsgContent,
  lstMsgSender,
}: Props) => {
  return (
    <Link href={`/conversations/${id}`} className="w-full">
      <Card className="p-2 flex flex-row items-center gap-4 truncate">
        <div className="flex felx-row items-center gap-4 truncate">
          <Avatar>
            <AvatarFallback>
              {name.charAt(0).toLocaleUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col truncate">
            <h4 className="truncate">{name}</h4>
            {lstMsgSender && lstMsgContent ? (
              <span className="text-sm text-muted-foreground flex truncate overflow-ellipsis">
                <p className="font-semibold">
                  {lstMsgSender}
                  {":"}&nbsp;
                </p>
                <p className="truncate overflow-ellipsis ">{lstMsgContent}</p>
              </span>
            ) : (
              <p className="text-sm text-muted-foreground truncate">
                Start the conversation!
              </p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default GroupConversationItem;
