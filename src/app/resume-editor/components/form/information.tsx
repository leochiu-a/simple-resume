"use client";

import { FC } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { LabeledInputField } from "./labeled-input-field";
import { Section, SectionTitle, SectionBody } from "./section";

const Information: FC = () => {
  const { control } = useFormContext();

  return (
    <Section>
      <SectionTitle>Information</SectionTitle>
      <SectionBody className="grid grid-cols-2 gap-4 space-y-0">
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
      </SectionBody>
    </Section>
  );
};

export default Information;
