"use client";

import * as React from "react";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/common/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/common/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { getCodes, getNames } from "country-list";

type CountrySelection = {
  isoCode: string;
  callingCode: string; // with + prefix
  name: string;
};

export interface CountryCodeComboboxProps {
  valueIsoCode?: string;
  onSelect?: (selection: CountrySelection) => void;
  className?: string;
  disabled?: boolean;
}

// Calling code map (subset is acceptable but we include common ones)
const COUNTRY_DIAL: { [code: string]: string } = {
  IN: "+91",
  US: "+1",
  AE: "+971",
  GB: "+44",
  SG: "+65",
  AU: "+61",
  CA: "+1",
  DE: "+49",
  FR: "+33",
  IT: "+39",
  ES: "+34",
  NL: "+31",
  SE: "+46",
  NO: "+47",
  DK: "+45",
  JP: "+81",
  KR: "+82",
  CN: "+86",
  HK: "+852",
  TH: "+66",
  ID: "+62",
  MY: "+60",
  PH: "+63",
  NZ: "+64",
  ZA: "+27",
  BR: "+55",
  MX: "+52",
  RU: "+7",
};

export function CountryCodeCombobox({
  valueIsoCode,
  onSelect,
  className,
  disabled = false,
}: CountryCodeComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [triggerWidth, setTriggerWidth] = React.useState<number>(0);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [autoIso, setAutoIso] = React.useState<string>("IN");

  React.useEffect(() => {
    const updateWidth = () => {
      if (triggerRef.current) setTriggerWidth(triggerRef.current.offsetWidth);
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Auto-detect country from browser locale when no controlled value provided
  React.useEffect(() => {
    if (valueIsoCode) return; // respect controlled value
    try {
      const primary = navigator.languages?.[0] || navigator.language;
      const match = primary?.match(/-([A-Z]{2})/i);
      let iso = match ? match[1].toUpperCase() : "";
      if (!iso) {
        const loc = Intl.DateTimeFormat().resolvedOptions().locale;
        const m2 = loc?.match(/-([A-Z]{2})/i);
        iso = m2 ? m2[1].toUpperCase() : "";
      }
      if (iso && COUNTRY_DIAL[iso]) {
        setAutoIso(iso);
      }
    } catch {
      // ignore failures and keep default
    }
  }, [valueIsoCode]);

  const names = getNames();
  const codes = getCodes();
  const countries = React.useMemo(() => {
    return codes.map((code, idx) => ({
      isoCode: code,
      name: names[idx],
      callingCode: COUNTRY_DIAL[code] || "+1",
      label: `${code} ${COUNTRY_DIAL[code] || "+1"}`,
    }));
  }, [codes, names]);

  const filtered = React.useMemo(() => {
    if (!query) return countries;
    const q = query.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.isoCode.toLowerCase().includes(q) ||
        c.callingCode.replace("+", "").startsWith(q.replace("+", "")) ||
        c.callingCode.includes(q),
    );
  }, [countries, query]);

  const effectiveIso = valueIsoCode ?? autoIso;
  const selected = countries.find((c) => c.isoCode === effectiveIso);

  return (
    <Popover
      open={!disabled && open}
      onOpenChange={(o) => !disabled && setOpen(o)}
    >
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between focus:border-black focus:ring-black",
            disabled && "pointer-events-none opacity-60",
            className,
          )}
        >
          <span className="truncate">
            {selected ? selected.label : "Select"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="max-h-[300px] w-[var(--trigger-w)] p-0"
        style={{ width: triggerWidth > 0 ? `${triggerWidth}px` : undefined }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search name, code or +91"
            className="h-9"
            value={query}
            onValueChange={setQuery}
            disabled={disabled}
          />
          <CommandList>
            <CommandEmpty>No countries found.</CommandEmpty>
            <CommandGroup>
              {filtered.slice(0, 50).map((c) => (
                <CommandItem
                  key={c.isoCode}
                  value={c.isoCode}
                  onSelect={(currentValue) => {
                    if (disabled) return;
                    onSelect?.({
                      isoCode: currentValue,
                      callingCode: c.callingCode,
                      name: c.name,
                    });
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {c.isoCode} {c.callingCode}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      effectiveIso === c.isoCode ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default CountryCodeCombobox;
