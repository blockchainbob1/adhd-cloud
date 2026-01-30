"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { Check, ChevronLeft, ChevronRight, Clock, User, FileText } from "lucide-react";
import { createBooking } from "@/actions/appointments";
import { getAvailableSlots } from "@/actions/availability";

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  doctorProfile: {
    specialty: string;
    qualifications: string | null;
    biography: string | null;
  } | null;
}

interface BookingWizardProps {
  doctors: Doctor[];
}

type Step = "type" | "doctor" | "datetime" | "details" | "confirm";

const CONSULTATION_TYPES = [
  {
    type: "INITIAL" as const,
    title: "Initial Consultation",
    price: "$500",
    duration: "30 minutes",
    description: "Comprehensive assessment for new patients. Includes diagnosis discussion and treatment planning.",
  },
  {
    type: "FOLLOW_UP" as const,
    title: "Follow-up Consultation",
    price: "$300",
    duration: "15 minutes",
    description: "For existing patients. Medication review, progress check, and prescription renewal.",
  },
];

export function BookingWizard({ doctors }: BookingWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>("type");
  const [consultationType, setConsultationType] = useState<"INITIAL" | "FOLLOW_UP" | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const steps: Step[] = ["type", "doctor", "datetime", "details", "confirm"];
  const currentStepIndex = steps.indexOf(step);

  const handleDateSelect = async (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(null);

    if (date && selectedDoctor && consultationType) {
      setLoadingSlots(true);
      try {
        const slots = await getAvailableSlots(selectedDoctor.id, date, consultationType);
        setAvailableSlots(slots);
      } catch (err) {
        setError("Failed to load available times");
      } finally {
        setLoadingSlots(false);
      }
    }
  };

  const handleSubmit = () => {
    if (!selectedDoctor || !consultationType || !selectedDate || !selectedTime) {
      setError("Please complete all required fields");
      return;
    }

    setError(null);

    const formData = new FormData();
    formData.set("doctorId", selectedDoctor.id);
    formData.set("consultationType", consultationType);
    formData.set("date", format(selectedDate, "yyyy-MM-dd"));
    formData.set("time", selectedTime);
    formData.set("chiefComplaint", chiefComplaint);

    startTransition(async () => {
      const result = await createBooking(undefined, formData);

      if (result.errors?._form) {
        setError(result.errors._form.join(", "));
        return;
      }

      if (result.success && result.appointmentId) {
        router.push(`/patient/appointments?booked=${result.appointmentId}`);
      }
    });
  };

  const canProceed = () => {
    switch (step) {
      case "type":
        return consultationType !== null;
      case "doctor":
        return selectedDoctor !== null;
      case "datetime":
        return selectedDate !== undefined && selectedTime !== null;
      case "details":
        return true;
      case "confirm":
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i < currentStepIndex
                    ? "bg-blue-600 text-white"
                    : i === currentStepIndex
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {i < currentStepIndex ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-full h-1 mx-2 ${
                    i < currentStepIndex ? "bg-blue-600" : "bg-gray-200"
                  }`}
                  style={{ width: "60px" }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Type</span>
          <span>Doctor</span>
          <span>Date/Time</span>
          <span>Details</span>
          <span>Confirm</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      {/* Step 1: Consultation Type */}
      {step === "type" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Select Consultation Type</h2>
          <div className="grid gap-4">
            {CONSULTATION_TYPES.map((type) => (
              <Card
                key={type.type}
                className={`cursor-pointer transition-all ${
                  consultationType === type.type
                    ? "border-blue-600 ring-2 ring-blue-600"
                    : "hover:border-gray-400"
                }`}
                onClick={() => setConsultationType(type.type)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{type.title}</CardTitle>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{type.price}</p>
                      <p className="text-sm text-gray-500">{type.duration}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{type.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Select Doctor */}
      {step === "doctor" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Select a Doctor</h2>
          {doctors.length === 0 ? (
            <p className="text-gray-500">No doctors available at this time.</p>
          ) : (
            <div className="grid gap-4">
              {doctors.map((doctor) => (
                <Card
                  key={doctor.id}
                  className={`cursor-pointer transition-all ${
                    selectedDoctor?.id === doctor.id
                      ? "border-blue-600 ring-2 ring-blue-600"
                      : "hover:border-gray-400"
                  }`}
                  onClick={() => setSelectedDoctor(doctor)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Dr. {doctor.firstName} {doctor.lastName}
                        </CardTitle>
                        <CardDescription>
                          {doctor.doctorProfile?.specialty || "ADHD Specialist"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  {doctor.doctorProfile?.biography && (
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        {doctor.doctorProfile.biography}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Date and Time */}
      {step === "datetime" && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Select Date & Time</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label className="mb-2 block">Select a Date</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) =>
                  isBefore(date, startOfDay(new Date())) ||
                  isBefore(date, addDays(new Date(), -1)) ||
                  date.getDay() === 0 // Disable Sundays by default
                }
                className="rounded-md border"
              />
            </div>
            <div>
              <Label className="mb-2 block">Available Times</Label>
              {!selectedDate ? (
                <p className="text-gray-500 text-sm">Please select a date first</p>
              ) : loadingSlots ? (
                <p className="text-gray-500 text-sm">Loading available times...</p>
              ) : availableSlots.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No available times for this date. Please select another date.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot.time}
                      variant={selectedTime === slot.time ? "default" : "outline"}
                      size="sm"
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      className={!slot.available ? "opacity-50" : ""}
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Details */}
      {step === "details" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Additional Details</h2>
          <div className="space-y-2">
            <Label htmlFor="chiefComplaint">
              What would you like to discuss? (Optional)
            </Label>
            <textarea
              id="chiefComplaint"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="Briefly describe your main concerns or reasons for the consultation..."
              className="w-full min-h-[120px] p-3 border rounded-md"
            />
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Referral Required
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              You will need to upload your referral before the appointment. You can do this after booking.
            </p>
          </div>
        </div>
      )}

      {/* Step 5: Confirm */}
      {step === "confirm" && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Confirm Your Booking</h2>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-gray-600">Consultation Type</span>
                <span className="font-medium">
                  {consultationType === "INITIAL" ? "Initial Consultation" : "Follow-up Consultation"}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-gray-600">Doctor</span>
                <span className="font-medium">
                  Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-gray-600">Date</span>
                <span className="font-medium">
                  {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-gray-600">Time</span>
                <span className="font-medium">{selectedTime}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium">
                  {consultationType === "INITIAL" ? "30 minutes" : "15 minutes"}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold text-blue-600">
                  {consultationType === "INITIAL" ? "$500" : "$300"}
                </span>
              </div>
            </CardContent>
          </Card>
          <div className="bg-amber-50 p-4 rounded-lg">
            <p className="text-sm text-amber-800">
              By confirming, you agree to our terms and conditions. Payment will be required to confirm your booking.
            </p>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={currentStepIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {step === "confirm" ? (
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Booking..." : "Confirm Booking"}
          </Button>
        ) : (
          <Button onClick={goNext} disabled={!canProceed()}>
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
