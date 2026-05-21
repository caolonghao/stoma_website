type FlattenedFieldErrors = {
  fieldErrors?: Record<string, string[] | undefined>;
  formErrors?: string[];
};

export function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "string" && error.length > 0) {
    return error;
  }

  if (!error || typeof error !== "object") {
    return fallback;
  }

  const flattened = error as FlattenedFieldErrors;
  const firstFieldError = flattened.fieldErrors
    ? Object.values(flattened.fieldErrors).flat().find(Boolean)
    : undefined;

  return flattened.formErrors?.[0] ?? firstFieldError ?? fallback;
}
