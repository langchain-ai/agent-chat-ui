import SearchCriteriaWidget from "./searchCriteria.widget";

export const componentMap = {
  SearchCriteriaWidget,
  // weather: WeatherComponent,
} as const;

export type ComponentType = keyof typeof componentMap;
