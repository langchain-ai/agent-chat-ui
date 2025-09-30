import { Progress, Stack } from "@chakra-ui/react";

export default function BlokProgress() {
  return (
    <Stack spacing="10">
      <Progress value={80} />
      <Progress
        variant="ai"
        value={80}
      />
      <Progress isIndeterminate />
      <Progress
        variant="ai"
        isIndeterminate
      />
    </Stack>
  );
}
