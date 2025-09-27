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
import { CircleArrowLeft, Settings, Phone, Video } from "lucide-react";
import Link from "next/link";
import React from "react";
import CallModal from "./CallModal";

import { Id } from "@/convex/_generated/dataModel";

type Props = {
  imageUrl?: string;
  name: string;
  conversationId: Id<"conversations">;
  remoteUserId?: Id<"users">;
  options?: {
    label: string;
    destructive: boolean;
    onClick: () => void;
  }[];
};

const Header = ({ imageUrl, name, conversationId, remoteUserId, options }: Props) => {
  const [callOpen, setCallOpen] = React.useState(false);
  const [isVideoCall, setIsVideoCall] = React.useState(false);

  const handleVoiceCall = () => {
    setIsVideoCall(false);
    setCallOpen(true);
  };

  const handleVideoCall = () => {
    setIsVideoCall(true);
    setCallOpen(true);
  };
  return (
    <Card className="w-full flex rounded-lg items-center p-1 justify-center relative">
      <Link href="/conversations" className="absolute left-2 block lg:hidden">
        <CircleArrowLeft />
      </Link>

      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={imageUrl} />
          <AvatarFallback>{name.substring(0, 1)}</AvatarFallback>
        </Avatar>
        <h2 className="font-semibold">{name}</h2>
      </div>

      <div className="absolute right-2 flex items-center gap-2">
        <Button size="icon" variant="secondary" aria-label="Voice Call" onClick={handleVoiceCall}>
          <Phone />
        </Button>
        <Button size="icon" variant="secondary" aria-label="Video Call" onClick={handleVideoCall}>
          <Video />
        </Button>
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
      <CallModal
        open={callOpen}
        onClose={() => setCallOpen(false)}
        conversationId={conversationId}
        isCaller={true}
        remoteName={name}
        remoteUserId={remoteUserId}
        isVideoCall={isVideoCall}
      />
    </Card>
  );
};

export default Header;
