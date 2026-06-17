import { useRole } from "@/contexts/RoleContext";
import { PhysicalTesting } from "@/components/PhysicalTesting";

export function TestLibrary() {
  const { hasCoachRole } = useRole();
  return <PhysicalTesting mode={hasCoachRole ? "coach" : "individual"} />;
}

// Backwards-compatible export for callers that previously imported this helper from TestLibrary.
export { getLocalizedTestName } from "@/components/PhysicalTesting";
