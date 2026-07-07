import { createFileRoute } from "@tanstack/react-router";
import { WeekPlanView } from "../components/week-plan";

export const Route = createFileRoute("/")({ component: WeekPlanView });
