import { Suspense } from "react";
import GenerateClient from "./generate-client";

export default async function GeneratePage({
  searchParams,
}: {
  searchParams: Promise<{ input?: string }>;
}) {
  const params = await searchParams;
  const initialInput = params.input ?? "";
  return (
    <Suspense>
      <GenerateClient initialInput={initialInput} />
    </Suspense>
  );
}
