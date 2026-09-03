import * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/shared/utils";

type FieldControlProps = {
  id?: string;
  required?: boolean;
  disabled?: boolean;
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  "aria-describedby"?: string;
};

type FieldProps = Omit<React.ComponentProps<"div">, "children"> & {
  id: string;
  label: React.ReactNode;
  children: React.ReactElement<FieldControlProps>;
  description?: React.ReactNode;
  error?: string | string[] | null;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
};

function firstError(error: FieldProps["error"]): string | undefined {
  return Array.isArray(error) ? error[0] : error ?? undefined;
}

function joinIds(...ids: Array<string | undefined>): string | undefined {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

export function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-xs leading-5 text-muted-foreground", className)} {...props} />;
}

export function FieldError({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-sm leading-5 text-status-danger-foreground", className)}
      role="alert"
      {...props}
    />
  );
}

export function Field({
  id,
  label,
  children,
  description,
  error,
  required = false,
  optional = false,
  disabled = false,
  className,
  ...props
}: FieldProps) {
  const errorMessage = firstError(error);
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = errorMessage ? `${id}-error` : undefined;
  const childProps = children.props;
  const control = React.cloneElement(children, {
    id,
    required: required || childProps.required,
    disabled: disabled || childProps.disabled,
    "aria-invalid": errorMessage ? true : childProps["aria-invalid"],
    "aria-describedby": joinIds(
      childProps["aria-describedby"],
      descriptionId,
      errorId,
    ),
  });

  return (
    <div className={cn("space-y-2", className)} {...props}>
      <Label htmlFor={id} className="flex items-baseline gap-1.5">
        <span>{label}</span>
        {required ? (
          <span className="text-status-danger-foreground" aria-hidden="true">*</span>
        ) : optional ? (
          <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
        ) : null}
      </Label>
      {control}
      {description ? (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      ) : null}
      {errorMessage ? <FieldError id={errorId}>{errorMessage}</FieldError> : null}
    </div>
  );
}
