import FlightOptionsWidget from "./flightOptions.widget";
import FlightStatusWidget from "./flightStatus.wdiget";
import SearchCriteriaWidget from "./searchCriteria.widget";
import LoungeWidget from "./lounge.widget";
import weatherWidget from "./weather.widget";
import ReviewWidget from "./review.widget";
import PaymentWidget from "./payment.widget";
import EnhancedPaymentWidget from "./enhanced-payment.widget";
import NonAgentFlowWidget from "./non-agent-flow.widget";

export const componentMap = {
  SearchCriteriaWidget, // Add mapping for SearchCriteria type
  FlightOptionsWidget,
  FlightStatusWidget, /// simple widget needs to send from server
  LoungeWidget, ///  simple widget needs to send from server
  weatherWidget, ///  simple widget needs to send from server
  TravelerDetailsWidget: ReviewWidget, /// Flight booking review widget
  PaymentWidget, /// Razorpay payment widget
  NonAgentFlowWidget, /// Non-agent flow payment widget with bottom sheet
} as const;

export type ComponentType = keyof typeof componentMap;
