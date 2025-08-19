# Flight Options Widget

A comprehensive flight booking widget built with Next.js, React, and shadcn/ui components. This widget provides an intuitive interface for browsing and comparing flight options with responsive design patterns optimized for both desktop and mobile experiences.

## 🏗️ Architecture Overview

The flight widget follows a modular component architecture with clear separation of concerns:

\`\`\`
├── app/
│   ├── page.tsx              # Main page with responsive layout
│   ├── layout.tsx            # Root layout with Uber Move font
│   └── globals.css           # Global styles and Tailwind configuration
├── components/
│   ├── flight-card.tsx       # Core flight card component
│   ├── flight-details-popup.tsx  # Detailed flight timeline popup
│   ├── all-flights-sheet.tsx # Bottom sheet with filters and sorting
│   └── ui/                   # shadcn/ui components
\`\`\`

## 🎨 Design System

### Typography
- **Primary Font**: Uber Move (fallback: Inter)
- **Font Weights**: Normal (400) for most text, Medium (500) for emphasis
- **Responsive Sizing**: Smaller fonts on mobile to prevent layout breaking

### Color Palette
- **Primary**: Blue tones for interactive elements
- **Accent**: Light blue for active states (`bg-blue-100`, `text-blue-700`)
- **Neutral**: Gray scale for secondary information
- **Alert**: Light red for next-day arrival indicators

### Layout Principles
- **Mobile-first**: Responsive design starting from mobile breakpoints
- **Flexbox Priority**: Used for most layouts over CSS Grid
- **Consistent Spacing**: Tailwind spacing scale (px-2, py-1, gap-4, etc.)

## 🚀 Key Features

### 1. Responsive Flight Display
- **Desktop**: Three flight cards displayed side-by-side for easy comparison
- **Mobile**: Tabbed interface to save vertical space
- **Breakpoint**: `md:` (768px) switches between layouts

### 2. Flight Card Component
The `FlightCard` component supports two display modes:

#### Standard Mode (Desktop/Tabs)
\`\`\`tsx
<FlightCard
  badge="Best"
  airline="Cathay Pacific"
  price="$2,141.24"
  // ... other props
/>
\`\`\`

#### Compact Mode (Bottom Sheet)
\`\`\`tsx
<FlightCard
  compact={true}
  // Horizontal layout with fixed widths for alignment
/>
\`\`\`

### 3. Interactive Elements

#### Flight Details Popup
- Triggered by "Flight Info" link
- Vertical timeline showing all flight segments
- Layover information with terminal details
- Next-day arrival indicators

#### Bottom Sheet with Advanced Features
- **Filters**: Price range, airlines, stops, departure times
- **Sorting**: Cheapest first (default) or fastest first
- **Sticky Header**: Controls remain accessible while scrolling
- **Real-time Updates**: Filter count and result updates

## 🔧 Technical Implementation

### State Management
\`\`\`tsx
// Filter state in bottom sheet
const [priceRange, setPriceRange] = useState([500, 3000])
const [selectedAirlines, setSelectedAirlines] = useState<string[]>([])
const [maxStops, setMaxStops] = useState(3)
const [sortBy, setSortBy] = useState<'price' | 'duration'>('price')
\`\`\`

### Responsive Layout Strategy
\`\`\`tsx
// Desktop: Grid layout
<div className="hidden md:grid md:grid-cols-3 md:gap-4">
  {/* Three flight cards */}
</div>

// Mobile: Tabs
<div className="md:hidden">
  <Tabs defaultValue="best">
    {/* Tabbed interface */}
  </Tabs>
</div>
\`\`\`

### Component Composition
The widget uses composition patterns for flexibility:

\`\`\`tsx
// Main page composes different layouts
export default function FlightWidget() {
  return (
    <div className="container mx-auto p-4">
      {/* Responsive flight display */}
      <ResponsiveFlightDisplay />
      
      {/* Show all flights trigger */}
      <ShowAllFlightsButton />
      
      {/* Bottom sheet modal */}
      <AllFlightsSheet />
    </div>
  )
}
\`\`\`

## 📱 Mobile Optimization

### Compact Flight Cards
- **Horizontal Layout**: Airline → Departure → Duration → Arrival → Price
- **Fixed Widths**: Prevents misalignment across cards
- **Truncated Text**: Long airline names don't break layout
- **Responsive Fonts**: Smaller text on mobile devices

### Touch-Friendly Interactions
- **Large Touch Targets**: Buttons and tabs sized for finger interaction
- **Bottom Sheet**: Native mobile pattern for additional options
- **Sticky Controls**: Filters and sort remain accessible while scrolling

## 🎯 UX Design Decisions

### Information Hierarchy
1. **Primary**: Flight times and price (largest, most prominent)
2. **Secondary**: Airline, duration, stops (medium emphasis)
3. **Tertiary**: Layover details, next-day indicators (smallest)

### Progressive Disclosure
- **Main View**: Top 3 flight options (Best, Cheapest, Fastest)
- **Expanded View**: All flights with advanced filtering
- **Detail View**: Complete flight timeline with segments

### Accessibility Features
- **Semantic HTML**: Proper heading structure and landmarks
- **ARIA Labels**: Screen reader support for interactive elements
- **Keyboard Navigation**: Tab-accessible controls
- **Color Contrast**: WCAG AA compliant color combinations

## 🔄 Data Flow

### Flight Data Structure
\`\`\`tsx
interface FlightData {
  badge: string           // "Best" | "Cheapest" | "Fastest"
  airline: string         // "Cathay Pacific"
  price: string          // "$2,141.24"
  duration: string       // "23h 35m"
  departure: {
    time: string         // "01:15"
    airport: string      // "New Delhi (DEL)"
  }
  arrival: {
    time: string         // "01:50"
    airport: string      // "Honolulu (HNL)"
    nextDay: boolean     // true
  }
  stops: Array<{
    city: string         // "Hong Kong"
    layover: string      // "1h 20m layover"
  }>
}
\`\`\`

### Filter Logic
\`\`\`tsx
const filteredFlights = flights.filter(flight => {
  const price = parseInt(flight.price.replace(/[$,]/g, ''))
  const matchesPrice = price >= priceRange[0] && price <= priceRange[1]
  const matchesAirline = selectedAirlines.length === 0 || 
                        selectedAirlines.includes(flight.airline)
  const matchesStops = flight.stops.length <= maxStops
  
  return matchesPrice && matchesAirline && matchesStops
})
\`\`\`

## 🛠️ Development Setup

### Dependencies
- **Next.js 14+**: App Router with server components
- **React 18+**: Hooks and modern patterns
- **Tailwind CSS v4**: Utility-first styling
- **shadcn/ui**: Component library
- **Lucide React**: Icon library

### Font Configuration
\`\`\`tsx
// layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})
\`\`\`

\`\`\`css
/* globals.css */
@theme inline {
  --font-sans: var(--font-inter);
}
\`\`\`

## 🎨 Styling Approach

### Tailwind Patterns
- **Spacing**: Consistent use of Tailwind spacing scale
- **Responsive**: Mobile-first with `md:` breakpoints
- **Semantic Classes**: `text-foreground`, `bg-background` for theme support
- **Component Variants**: Different styles for compact vs. standard modes

### Custom Styling
\`\`\`css
/* Minimal custom CSS, mostly Tailwind utilities */
.flight-card-compact {
  @apply flex items-center gap-2 p-2;
}
\`\`\`

## 🚀 Performance Considerations

### Code Splitting
- Components lazy-loaded where appropriate
- Bottom sheet only renders when opened
- Popup dialogs use React portals

### Optimization Techniques
- **Memoization**: React.memo for flight cards
- **Virtual Scrolling**: Could be added for large flight lists
- **Image Optimization**: Next.js Image component for airline logos

## 🔮 Future Enhancements

### Potential Features
- **Real-time Pricing**: Live price updates
- **Seat Selection**: Integration with airline APIs
- **Multi-city Search**: Complex itinerary support
- **Price Alerts**: Notification system
- **Booking Integration**: Direct booking flow

### Technical Improvements
- **TypeScript**: Full type safety
- **Testing**: Unit and integration tests
- **Storybook**: Component documentation
- **Performance**: Virtual scrolling for large lists

## 📊 Component Breakdown

### FlightCard (Core Component)
- **Props**: 12 configurable properties
- **Modes**: Standard and compact layouts
- **Features**: Popup integration, responsive design
- **Size**: ~150 lines of code

### AllFlightsSheet (Complex Component)
- **Features**: Filtering, sorting, sticky header
- **State**: 6 different state variables
- **Interactions**: Real-time filter updates
- **Size**: ~200 lines of code

### Responsive Layout (Smart Component)
- **Breakpoints**: Mobile/desktop switching
- **Layouts**: Tabs vs. grid display
- **Integration**: Seamless component reuse
- **Size**: ~100 lines of code

This flight widget demonstrates modern React patterns, responsive design principles, and user-centered design thinking to create a production-ready booking interface.
