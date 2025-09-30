import { Avatar, Wrap, WrapItem } from "@chakra-ui/react";

export default function AvatarLogo({ ...props }) {
  const { size, name, src, borderRadius } = props;
  return (
    <Wrap>
      <WrapItem>
        <Avatar
          size={size}
          name={name}
          src={src}
          borderRadius={borderRadius}
        />
      </WrapItem>
    </Wrap>
  );
}
