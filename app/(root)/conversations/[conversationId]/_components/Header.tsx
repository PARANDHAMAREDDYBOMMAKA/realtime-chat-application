import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@radix-ui/react-avatar";
import { CircleArrowLeft, Settings, Video, Phone } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Id } from "@/convex/_generated/dataModel";
import MessageSearchDialog from "./MessageSearchDialog";

type Props = {
  imageUrl?: string;
  name: string;
  conversationId: Id<"conversations">;
  options?: {
    label: string;
    destructive: boolean;
    onClick: () => void;
  }[];
  onVideoCall?: () => void;
  onAudioCall?: () => void;
};

const Header = ({ imageUrl, name, conversationId, options, onVideoCall, onAudioCall }: Props) => {
  return (
    <Card className="w-full flex-row rounded-lg items-center p-2 justify-between">
      <div className="flex items-center gap-3">
        <Link href="/conversations" className="block lg:hidden">
          <CircleArrowLeft />
        </Link>
        <Avatar className="h-10 w-10 rounded-full ring-2 ring-border/20 transition-all hover:ring-primary/30">
          <AvatarImage src={imageUrl} className="rounded-full object-cover" />
          <AvatarFallback className="rounded-full">{name.substring(0, 1)}</AvatarFallback>
        </Avatar>
        <h2 className="font-semibold text-lg">{name}</h2>
      </div>

      <div className="flex items-center gap-2">
        {/* Search Button */}
        <MessageSearchDialog conversationId={conversationId} />

        {/* Video Call Button */}
        {onVideoCall && (
          <Button
            onClick={onVideoCall}
            size="icon"
            variant="ghost"
            className="hover:bg-primary/10 hover:text-primary"
            title="Start video call"
          >
            <Video className="h-5 w-5" />
          </Button>
        )}

        {/* Audio Call Button */}
        {onAudioCall && (
          <Button
            onClick={onAudioCall}
            size="icon"
            variant="ghost"
            className="hover:bg-primary/10 hover:text-primary"
            title="Start audio call"
          >
            <Phone className="h-5 w-5" />
          </Button>
        )}

        {/* Settings Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="secondary">
              <Settings />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {options && options.length > 0 ? (
              options.map((option, id) => (
                <DropdownMenuItem
                  key={id}
                  onClick={option.onClick}
                  className={cn("font-semibold", {
                    "text-destructive": option.destructive,
                  })}
                >
                  {option.label}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled className="text-muted-foreground">
                No settings available
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
};

export default Header;
