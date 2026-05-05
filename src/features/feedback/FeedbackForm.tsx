import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CATEGORIES, createFeedback, updateFeedback, type Category, type FeedbackItem } from "./api";
import { supabase } from "@/integrations/supabase/client";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = Yup.object({
  title: Yup.string().trim().min(3, "Min 3 characters").max(120, "Max 120 characters").required("Title is required"),
  description: Yup.string().trim().min(5, "Min 5 characters").max(2000, "Max 2000 characters").required("Description is required"),
  category: Yup.mixed<Category>().oneOf(CATEGORIES).required(),
});

interface Props {
  userId: string;
  initialItem?: FeedbackItem;
  onSuccess?: () => void;
}

export function FeedbackForm({ userId, initialItem, onSuccess }: Props) {
  const isEditing = !!initialItem;
  return (
    <Formik
      initialValues={{
        title: initialItem?.title ?? "",
        description: initialItem?.description ?? "",
        category: (initialItem?.category ?? "Feature") as Category,
        image: null as File | null
      }}
      validationSchema={schema}
      onSubmit={async (values, { resetForm, setSubmitting }) => {
        try {
          let image_url = initialItem?.image_url ?? null;
          if (values.image) {
            const fileExt = (values.image as File).name.split(".").pop();
            const filePath = `${userId}/${crypto.randomUUID()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
              .from("feedback_images")
              .upload(filePath, values.image);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage
              .from("feedback_images")
              .getPublicUrl(filePath);
            image_url = publicUrl;
          }

          if (isEditing) {
            await updateFeedback(initialItem!.id, { ...values, image_url });
            toast.success("Feedback updated");
          } else {
            await createFeedback({ ...values, image_url }, userId);
            toast.success("Feedback posted");
          }
          resetForm();
          onSuccess?.();
        } catch (e: any) {
          console.error("Post Error:", e);
          const errorMessage = e.message || e.details || "Failed to post";
          toast.error(`Error: ${errorMessage}`);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, values, setFieldValue, errors, touched }) => (
        <Form className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="title">Title</label>
            <Field
              id="title"
              name="title"
              placeholder="What's the idea?"
              className={cn(
                "w-full px-3 py-2 rounded-lg border bg-background text-sm transition-base placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                errors.title && touched.title ? "border-destructive" : "border-input"
              )}
            />
            <ErrorMessage name="title" component="p" className="text-xs text-destructive" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="description">Description</label>
            <Field
              as="textarea"
              id="description"
              name="description"
              rows={4}
              placeholder="Add context, steps, or examples…"
              className={cn(
                "w-full px-3 py-2 rounded-lg border bg-background text-sm transition-base resize-none placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                errors.description && touched.description ? "border-destructive" : "border-input"
              )}
            />
            <ErrorMessage name="description" component="p" className="text-xs text-destructive" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <div className="flex gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFieldValue("category", c)}
                  className={cn(
                    "flex-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-base",
                    values.category === c
                      ? "border-primary bg-primary text-primary-foreground shadow-soft"
                      : "border-input bg-background text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Image (Optional)</label>
            <div className="flex flex-col gap-3">
              {values.image ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                  <img
                    src={URL.createObjectURL(values.image)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFieldValue("image", null)}
                    className="absolute top-2 right-2 size-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-base"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/50 cursor-pointer hover:bg-muted transition-base">
                  <div className="flex flex-col items-center gap-2">
                    <ImagePlus className="size-8 text-muted-foreground/60" />
                    <span className="text-xs text-muted-foreground">Click to upload image</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setFieldValue("image", file);
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <><Loader2 className="size-4 mr-2 animate-spin" /> {isEditing ? "Updating…" : "Posting…"}</>
            ) : isEditing ? "Save changes" : "Post feedback"}
          </Button>
        </Form>
      )}
    </Formik>
  );
}
