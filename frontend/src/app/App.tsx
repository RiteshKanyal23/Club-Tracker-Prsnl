import { AppRoutes } from "../routes/AppRoutes";
import { GamingExperienceGate } from "../components/gaming/GamingExperienceGate";

export function App() {
  return (
    <GamingExperienceGate>
      <AppRoutes />
    </GamingExperienceGate>
  );
}
