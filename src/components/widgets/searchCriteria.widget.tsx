import { useStreamContext } from "@/providers/Stream";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/common/ui/button";
import { Input } from "@/components/common/ui/input";
import { Label } from "@/components/common/ui/label";
import { Switch } from "@/components/ui/switch";
import { submitInterruptResponse } from "./util";

function SearchCriteriaWidget({ interrupt }: { interrupt: Record<string, any> }) {
  const thread = useStreamContext();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isAdult, setIsAdult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const responseData = {
      firstName,
      lastName,
      isAdult,
    };

    try {
      await submitInterruptResponse(thread,"response", responseData);
    } catch (error) {
      // Optional: already handled inside the utility
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
        <h3 className="font-medium text-gray-900">Search Criteria</h3>
      </div>
      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isAdult"
              checked={isAdult}
              onCheckedChange={setIsAdult}
            />
            <Label htmlFor="isAdult">Adult</Label>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default SearchCriteriaWidget;
