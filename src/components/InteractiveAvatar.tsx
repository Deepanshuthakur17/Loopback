import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AvatarViewerProps {
  src: string | null;
  name: string;
  className?: string;
  fallbackClassName?: string;
}

export function InteractiveAvatar({ src, name, className, fallbackClassName }: AvatarViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const initials = (name?.[0] ?? "U").toUpperCase();

  return (
    <>
      <Avatar 
        className={cn("cursor-zoom-in transition-transform hover:scale-105 active:scale-95 select-none", className)}
        onDoubleClick={() => src && setIsOpen(true)}
        title="Double-click to view large"
      >
        <AvatarImage src={src ?? ""} alt={name} />
        <AvatarFallback className={fallbackClassName}>{initials}</AvatarFallback>
      </Avatar>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[90vw] md:max-w-lg p-0 overflow-hidden border-none bg-transparent shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>{name}'s Profile Picture</DialogTitle>
            <DialogDescription>Full size view of {name}'s profile picture.</DialogDescription>
          </DialogHeader>
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-floating animate-scale-in">
            {src ? (
              <img 
                src={src} 
                alt={name} 
                className="size-full object-cover"
              />
            ) : (
              <div className="size-full bg-gradient-brand flex items-center justify-center text-6xl font-bold text-white">
                {initials}
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <p className="text-white font-serif-display text-2xl">{name}</p>
              <p className="text-white/60 text-sm">Profile Picture</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
