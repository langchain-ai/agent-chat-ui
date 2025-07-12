import FlightOptionsWidget from "./flightOptions.widget";
import FlightStatusWidget from "./flightStatus.wdiget";
import SearchCriteriaWidget from "./searchCriteria.widget";
import LoungeWidget from "./lounge.widget";
import weatherWidget from "./weather.widget";

export const componentMap = {
  SearchCriteriaWidget, // Add mapping for SearchCriteria type
  FlightOptionsWidget,
  FlightStatusWidget, /// simple widget needs to send from server
  LoungeWidget, ///  simple widget needs to send from server
  weatherWidget, ///  simple widget needs to send from server
} as const;

export type ComponentType = keyof typeof componentMap;
