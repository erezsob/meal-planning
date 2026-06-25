import { createFileRoute } from "@tanstack/react-router";
import { PlanWizard } from "../components/plan/PlanWizard";

export const Route = createFileRoute("/plan")({ component: PlanWizard });
