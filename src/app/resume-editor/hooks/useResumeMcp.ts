"use client";

import { useEffect, useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";

import { isWebMcpSupported, registerTools, WebMcpStatus } from "@/lib/webmcp";
import { Resume } from "@/types/resume";
import { createResumeTools, ResumeMcpContext } from "../webmcp/resume-tools";

interface UseResumeMcpResult {
  status: WebMcpStatus;
  toolCount: number;
}

/**
 * Exposes the resume editor to AI agents through WebMCP.
 *
 * Tools are registered once per mount and torn down by aborting the controller,
 * which is the only way the spec offers to unregister. The form methods and the
 * document context are read through refs so a tool always sees the current form
 * and the current language without the registration having to be redone on every
 * keystroke or language switch.
 */
export const useResumeMcp = (
  formMethods: UseFormReturn<Resume>,
  context: ResumeMcpContext,
): UseResumeMcpResult => {
  const [status, setStatus] = useState<WebMcpStatus>("checking");
  const [toolCount, setToolCount] = useState(0);

  const formRef = useRef(formMethods);
  useEffect(() => {
    formRef.current = formMethods;
  }, [formMethods]);

  const contextRef = useRef(context);
  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  useEffect(() => {
    if (!isWebMcpSupported()) {
      setStatus("unsupported");

      return;
    }

    const controller = new AbortController();
    const tools = createResumeTools(
      () => formRef.current,
      () => contextRef.current,
    );

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
