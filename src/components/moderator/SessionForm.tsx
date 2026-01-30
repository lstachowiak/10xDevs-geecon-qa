import { useState } from "react";
import { Calendar, User, FileText, Send } from "lucide-react";
import type { CreateSessionCommand } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateTimePicker } from "@/components/ui/date-time-picker";

interface SessionFormProps {
  onSubmit: (data: CreateSessionCommand) => void;
  isSubmitting: boolean;
}

/**
 * SessionForm - Form component for creating a new session
 *
 * Provides input fields for session name, speaker, date, and description.
 * Includes client-side validation and disabled state during submission.
 */
export default function SessionForm({ onSubmit, isSubmitting }: SessionFormProps) {
  const [formData, setFormData] = useState<CreateSessionCommand>({
    name: "",
    speaker: "",
    description: "",
    sessionDate: "",
  });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /**
   * Validate form data
   */
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Session name is required";
    }

    if (!formData.speaker.trim()) {
      errors.speaker = "Speaker name is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Prepare data for submission (remove empty optional fields)
    const submitData: CreateSessionCommand = {
      name: formData.name,
      speaker: formData.speaker,
    };

    if (formData.description?.trim()) {
      submitData.description = formData.description;
    }

    if (selectedDate) {
      // Convert to ISO 8601 format
      submitData.sessionDate = selectedDate.toISOString();
    }

    onSubmit(submitData);
  };

  /**
   * Handle input changes
   */
  const handleChange = (field: keyof CreateSessionCommand, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Handle date change from DateTimePicker
   */
  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const isFormValid = formData.name.trim() !== "" && formData.speaker.trim() !== "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Details</CardTitle>
        <CardDescription>Fill in the information for the new Q&A session</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Session Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Session Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g., Introduction to Astro"
              aria-required="true"
              aria-invalid={!!validationErrors.name}
              aria-describedby={validationErrors.name ? "name-error" : undefined}
            />
            {validationErrors.name && (
              <p id="name-error" className="mt-1 text-sm text-red-600">
                {validationErrors.name}
              </p>
            )}
          </div>

          {/* Speaker */}
          <div>
            <label htmlFor="speaker" className="block text-sm font-medium mb-2">
              Speaker <span className="text-red-500">*</span>
            </label>
            <Input
              id="speaker"
              type="text"
              value={formData.speaker}
              onChange={(e) => handleChange("speaker", e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g., Jan Kowalski"
              aria-required="true"
              aria-invalid={!!validationErrors.speaker}
              aria-describedby={validationErrors.speaker ? "speaker-error" : undefined}
            />
            {validationErrors.speaker && (
              <p id="speaker-error" className="mt-1 text-sm text-red-600">
                {validationErrors.speaker}
              </p>
            )}
          </div>

          {/* Session Date */}
          <div>
            <label htmlFor="sessionDate" className="block text-sm font-medium mb-2">
              Session Date (Optional)
            </label>
            <DateTimePicker
              value={selectedDate}
              onChange={handleDateChange}
              disabled={isSubmitting}
              placeholder="Pick session date and time"
            />
            <p className="mt-1 text-sm text-gray-500">Select the date and time when the session will take place</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description (Optional)
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g., Basics of building applications with Astro"
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={!isFormValid || isSubmitting} className="w-full">
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? "Creating Session..." : "Create Session"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
