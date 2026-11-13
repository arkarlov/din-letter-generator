"use client";

import { useState } from "react";
import type { FieldErrors } from "@/lib/letter/field-errors";
import { Field } from "./Field";
import { InputField } from "./InputField";
import { Switch } from "./Switch";
import { TextareaField } from "./TextareaField";

type AddressKind = "house" | "pobox" | "free";

const KIND_LABELS = {
  house: "Street address",
  pobox: "PO box",
  free: "Free text",
} satisfies Record<AddressKind, string>;

const KINDS = {
  sender: ["house"],
  recipient: ["house", "pobox", "free"],
} satisfies Record<string, AddressKind[]>;

type Props = {
  variant: keyof typeof KINDS;
  legend: string;
  /** Prefix of the FormData names, for example `sender`. */
  name: string;
  /** Prefix of the DOM ids. The same name can appear in several forms. */
  id: string;
  errors: FieldErrors;
  onFieldChange: (field: string) => void;
};

export function AddressFields({
  variant,
  legend,
  name,
  id,
  errors,
  onFieldChange,
}: Props) {
  const [kind, setKind] = useState<AddressKind>("house");
  const [hasContactPerson, setHasContactPerson] = useState(false);

  const clearErrors = (fieldName: string) => {
    onFieldChange(fieldName);
    onFieldChange(name);
  };

  const field = (part: string) => {
    const fieldName = `${name}.${part}`;

    return {
      id: `${id}-${part.replaceAll(".", "-")}`,
      name: fieldName,
      error: errors[fieldName],
      onChange: () => clearErrors(fieldName),
    };
  };

  const salutation = field("contactPerson.salutation");

  return (
    <fieldset className="space-y-3">
      <legend className="text-base font-semibold">{legend}</legend>

      {KINDS[variant].length === 1 ? (
        <input type="hidden" name={`${name}.kind`} value={kind} />
      ) : (
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {KINDS[variant].map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={`${name}.kind`}
                value={option}
                checked={kind === option}
                onChange={() => {
                  setKind(option);
                  onFieldChange(name);
                }}
              />
              {KIND_LABELS[option]}
            </label>
          ))}
        </div>
      )}

      {errors[name] && (
        <p role="alert" className="text-xs text-red-600">
          {errors[name]}
        </p>
      )}

      {kind === "free" ? (
        <TextareaField
          {...field("text")}
          className="resize-y"
          label="Address"
          rows={5}
          placeholder={"Musterfirma GmbH\nMusterstraße 1\n12345 Musterstadt"}
          required
        />
      ) : (
        <>
          <InputField
            {...field("name")}
            label={variant === "sender" ? "Name" : "Name / Company"}
            maxLength={50}
            required={variant === "sender"}
          />
          <InputField
            {...field("addon")}
            label="Address addition"
            placeholder={
              variant === "sender" ? "c/o Erika Muster" : "Department, c/o"
            }
            maxLength={50}
          />

          {kind === "house" ? (
            <div className="grid grid-cols-[1fr_6rem] gap-3">
              <InputField
                {...field("street")}
                label="Street"
                maxLength={40}
                required
              />
              <InputField {...field("number")} label="No." maxLength={9} />
            </div>
          ) : (
            <InputField
              {...field("poBox")}
              label="PO box"
              maxLength={10}
              required
            />
          )}

          <div className="grid grid-cols-[6rem_1fr] gap-3">
            <InputField
              {...field("zip")}
              label="Postal code"
              maxLength={12}
              required
            />
            <InputField
              {...field("city")}
              label="City"
              maxLength={50}
              required
            />
          </div>
          <InputField
            {...field("country")}
            label="Country"
            placeholder="Leave empty for Germany"
            maxLength={50}
          />

          {variant === "recipient" && (
            <>
              <Switch
                checked={hasContactPerson}
                onChange={setHasContactPerson}
                label="Add a contact person"
              />
              {hasContactPerson && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Salutation" id={salutation.id}>
                      <select
                        id={salutation.id}
                        name={salutation.name}
                        defaultValue=""
                        onChange={salutation.onChange}
                        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-300"
                      >
                        <option value="">None</option>
                        <option value="frau">Frau</option>
                        <option value="herr">Herr</option>
                      </select>
                    </Field>
                    <InputField
                      {...field("contactPerson.title")}
                      label="Title"
                      placeholder="Dr."
                      maxLength={30}
                    />
                  </div>
                  <InputField
                    {...field("contactPerson.firstName")}
                    label="First name"
                    maxLength={50}
                  />
                  <InputField
                    {...field("contactPerson.lastName")}
                    label="Last name"
                    maxLength={50}
                    required
                  />
                </>
              )}
            </>
          )}
        </>
      )}
    </fieldset>
  );
}
