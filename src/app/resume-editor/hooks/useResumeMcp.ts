"use client";

import { useEffect, useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";

import { isWebMcpSupported, registerTools, WebMcpStatus } from "@/lib/webmcp";
import { Resume } from "@/types/resume";
import { createResumeTools } from "../webmcp/resume-tools";

interface UseResumeMcpResult {
  status: WebMcpStatus;
  toolCount: number;
}

/**
 * Exposes the resume editor to AI agents through WebMCP.
 *
 * Tools are registered once per mount and torn down by aborting the controller,
 * which is the only way the spec offers to unregister. The form methods are read
 * through a ref so a tool always writes to the current form without the
 * registration having to be redone on every keystroke.
 */
export const useResumeMcp = (formMethods: UseFormReturn<Resume>): UseResumeMcpResult => {
  const [status, setStatus] = useState<WebMcpStatus>("checking");
  const [toolCount, setToolCount] = useState(0);

  const formRef = useRef(formMethods);
  useEffect(() => {
    formRef.current = formMethods;
  }, [formMethods]);

  useEffect(() => {
    if (!isWebMcpSupported()) {
      setStatus("unsupported");

      return;
    }

    const controller = new AbortController();
    const tools = createResumeTools(() => formRef.current);

    registerTools(tools, controller.signal)
      .then(() => {
        if (controller.signal.aborted) return;
        setToolCount(tools.length);
        setStatus("ready");
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setStatus("error");
      });

    return () => controller.abort();
  }, []);

  return { status, toolCount };
};
