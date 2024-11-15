"use client";

import { FC } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { Typography } from "@/components/ui/typography";

import { LabeledInputField } from "./labeled-input-field";

const Information: FC = () => {
  const { control } = useFormContext();

  return (
    <>
      <Typography variant="h4">Information</Typography>
      <div className="mb-8 mt-4 grid grid-cols-2 gap-4">
        <Controller
          name="wantedJob"
          control={control}
          render={({ field }) => (
            <LabeledInputField
              label="Job title"
              placeholder="e.g. Senior Frontend Engineer"
              {...field}
            />
          )}
        />
        <Controller
          name="name"
          control={control}
          render={({ field }) => <LabeledInputField label="Name" {...field} />}
        />
        <Controller
          name="email"
          control={control}
          render={({ field }) => <LabeledInputField label="Email" {...field} />}
        />
        <Controller
          name="phone"
          control={control}
          render={({ field }) => <LabeledInputField label="Phone" {...field} />}
        />
        <Controller
          name="city"
          control={control}
          render={({ field }) => <LabeledInputField label="City" {...field} />}
        />
      </div>
    </>
  );
};

export default Information;
