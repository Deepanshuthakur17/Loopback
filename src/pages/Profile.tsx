import { useEffect, useRef, useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Loader2, Save, Mail, Calendar, Shield, Camera, X, Crown, ShieldCheck, UserCheck, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const schema = Yup.object({
  display_name: Yup.string().trim().min(2, "Min 2 characters").max(60, "Max 60 characters").required("Display name is required"),
});

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

function ImageAdjuster({ 
  imageSrc, 
  onConfirm, 
  onCancel 
}: { 
  imageSrc: string; 
  onConfirm: (blob: Blob) => void; 
  onCancel: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setOffset({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleSave = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      const size = 400;
      canvas.width = size;
      canvas.height = size;
      
      const aspect = img.width / img.height;
      let drawWidth, drawHeight;
      
      if (aspect > 1) {
        drawHeight = size * zoom;
        drawWidth = drawHeight * aspect;
      } else {
        drawWidth = size * zoom;
        drawHeight = drawWidth / aspect;
      }

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, size, size);
      
      // Calculate drawing position based on offset
      // This is a simplified version of the math
      const x = (size - drawWidth) / 2 + (offset.x * (size / 300));
      const y = (size - drawHeight) / 2 + (offset.y * (size / 300));
      
      ctx.drawImage(img, x, y, drawWidth, drawHeight);
      canvas.toBlob((blob) => {
        if (blob) onConfirm(blob);
      }, "image/jpeg", 0.9);
    };
  };

  return (
    <div className="space-y-6">
      <div 
        ref={containerRef}
        className="relative size-[300px] mx-auto rounded-xl border-2 border-dashed border-primary/20 overflow-hidden cursor-move bg-muted/30"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        <img 
          src={imageSrc} 
          alt="To crop" 
          draggable={false}
          className="absolute max-w-none transition-transform duration-75 select-none"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            top: '50%',
            left: '50%',
            marginTop: '-50%',
            marginLeft: '-50%',
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
        />
        <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
           <div className="size-full border border-white/50 rounded-full" />
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground px-1">
          <span>Zoom</span>
          <span>{Math.round(zoom * 100)}%</span>
        </div>
        <Slider 
          value={[zoom]} 
          min={1} 
          max={3} 
          step={0.1} 
          onValueChange={([v]) => setZoom(v)} 
        />
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>Save and Upload</Button>
      </DialogFooter>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const { roles, isAdmin, canModerate: isModerator } = useRole();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("id,display_name,avatar_url,created_at")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        setProfile(data ?? null);
        setLoading(false);
      });
  }, [user]);

  if (!user) return null;
  const initials = (profile?.display_name ?? user.email ?? "U").slice(0, 2).toUpperCase();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (file.size > MAX_AVATAR_BYTES) return toast.error("Image must be under 2MB");

    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadCroppedImage = async (blob: Blob) => {
    setCropSrc(null);
    setUploading(true);
    try {
      const path = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("avatars").upload(path, blob, { upsert: true, cacheControl: "3600", contentType: "image/jpeg" });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl;
      const { error: updErr } = await supabase
        .from("profiles").update({ avatar_url: url }).eq("id", user.id);
      if (updErr) throw updErr;
      setProfile((p) => (p ? { ...p, avatar_url: url } : p));
      toast.success("Avatar updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    setUploading(true);
    try {
      const { error } = await supabase
        .from("profiles").update({ avatar_url: null }).eq("id", user.id);
      if (error) throw error;
      setProfile((p) => (p ? { ...p, avatar_url: null } : p));
      toast.success("Avatar removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl animate-fade-in">
      <Dialog open={!!cropSrc} onOpenChange={(o) => !o && setCropSrc(null)}>
        <DialogContent className="max-w-md shadow-floating">
          <DialogHeader>
            <DialogTitle>Adjust your photo</DialogTitle>
            <DialogDescription>
              Drag to position and use the slider to zoom.
            </DialogDescription>
          </DialogHeader>
          {cropSrc && (
            <ImageAdjuster 
              imageSrc={cropSrc} 
              onConfirm={uploadCroppedImage}
              onCancel={() => setCropSrc(null)} 
            />
          )}
        </DialogContent>
      </Dialog>

      <div>
        <h1 className="font-serif-display text-4xl md:text-5xl tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account details and display name.</p>
      </div>

      <div className="flex items-center gap-4 p-5 rounded-xl border border-border bg-card">
        <div className="relative">
          <Avatar className="size-16">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="Avatar" />}
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Change avatar"
            className="absolute -bottom-1 -right-1 size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-soft hover:opacity-90 transition-base disabled:opacity-60"
          >
            {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{profile?.display_name ?? "—"}</p>
          <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5">
            <Mail className="size-3.5" /> {user.email}
          </p>
          <p className="text-xs text-muted-foreground mt-1">PNG or JPG, max 2MB.</p>
        </div>
        {profile?.avatar_url && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" disabled={uploading}>
                <X className="size-4 mr-1" /> Remove
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="shadow-floating animate-scale-in">
              <AlertDialogHeader>
                <AlertDialogTitle>Remove profile picture?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete your current profile image. You can always upload a new one later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={removeAvatar}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {uploading ? "Removing..." : "Remove"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <InfoRow icon={Calendar} label="Member since"
          value={profile ? new Date(profile.created_at).toLocaleDateString() : "—"} />
        <InfoRow icon={Shield} label="Role"
          value={
            <div className="flex items-center gap-2">
              {isAdmin && <Crown className="size-4 text-amber-500" />}
              {isModerator && !isAdmin && <ShieldCheck className="size-4 text-blue-500" />}
              {roles.includes('member') && !isModerator && !isAdmin && <UserCheck className="size-4 text-green-500" />}
              {roles.includes('user') && !roles.includes('member') && !isModerator && !isAdmin && <User className="size-4 text-indigo-500" />}
              <span className="capitalize">
                {isAdmin ? "Admin" : roles.length ? roles[0] : "User"}
              </span>
            </div>
          } 
        />
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading profile…</div>
      ) : (
        <Formik
          initialValues={{ display_name: profile?.display_name ?? "" }}
          validationSchema={schema}
          enableReinitialize
          onSubmit={async (values, { setSubmitting }) => {
            const { error } = await supabase
              .from("profiles")
              .update({ display_name: values.display_name.trim() })
              .eq("id", user.id);
            setSubmitting(false);
            if (error) return toast.error(error.message);
            setProfile((p) => (p ? { ...p, display_name: values.display_name.trim() } : p));
            toast.success("Profile updated");
          }}
        >
          {({ isSubmitting, errors, touched }) => (
            <Form className="space-y-4 p-5 rounded-xl border border-border bg-card">
              <div className="space-y-2">
                <label htmlFor="display_name" className="text-sm font-medium">Display name</label>
                <Field
                  id="display_name"
                  name="display_name"
                  className={cn(
                    "w-full px-3 py-2.5 rounded-lg border bg-background text-sm transition-base",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                    errors.display_name && touched.display_name ? "border-destructive" : "border-input"
                  )}
                />
                {errors.display_name && touched.display_name && (
                  <p className="text-xs text-destructive">{errors.display_name}</p>
                )}
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="size-4 mr-2 animate-spin" /> Saving…</> : <><Save className="size-4 mr-2" /> Save changes</>}
              </Button>
            </Form>
          )}
        </Formik>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Icon className="size-3.5" /> {label}</p>
      <div className="text-sm font-medium mt-1">{value}</div>
    </div>
  );
}
