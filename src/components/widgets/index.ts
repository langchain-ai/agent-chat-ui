import FlightOptionsWidget from "./flightOptions.widget";
import FlightStatusWidget from "./flightStatus.wdiget";
import SearchCriteriaWidget from "./searchCriteria.widget";
import LoungeWidget from "./lounge.widget";
import weatherWidget from "./weather.widget";
import ReviewWidget from "./review.widget";
import PaymentWidget from "./payment.widget";
import NonAgentFlowWidget from "./non-agent-flow.widget";
import SeatPreferenceWidget from "./seatPreference.widget";
import SeatSelectionWidget from "./seatSelection.widget";
import SeatPaymentWidget from "./seatPayment.widget";
import SeatCombinedWidget from "./seatCombined.widget";

export const componentMap = {
  SearchCriteriaWidget, // Add mapping for SearchCriteria type
  FlightOptionsWidget,
  FlightStatusWidget, /// simple widget needs to send from server
  LoungeWidget, ///  simple widget needs to send from server
  weatherWidget, ///  simple widget needs to send from server
  TravelerDetailsWidget: ReviewWidget, /// Flight booking review widget
  PaymentWidget, /// Razorpay payment widget
  NonAgentFlowWidget, /// Non-agent flow payment widget with bottom sheet
  SeatPreferenceWidget, /// Seat preference selection widget
  SeatSelectionWidget, /// Visual seat map selection widget
  SeatPaymentWidget, /// Seat payment confirmation widget
  SeatCombinedWidget, /// Combined seat selection widget with all options
} as const;

export type ComponentType = keyof typeof componentMap;
